import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { user } from '$lib/stores/auth';
import { get } from 'svelte/store';
import { getStorageItem, setStorageItem, removeStorageItem } from '$lib/utils/storage';
import type { Notification } from '$lib/types';

// Re-export the type for backward compatibility
export type { Notification } from '$lib/types';

// Database notification type
export interface DatabaseNotification {
  id: string;
  type: string;
  title: string;
  title_en?: string;
  title_ar?: string;
  message: string;
  message_en?: string;
  message_ar?: string;
  image_url?: string;
  action_url?: string;
  priority: string;
  created_at: string;
  expires_at?: string;
  recipients?: Array<{
    id: string;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    clicked_at?: string;
    status: string;
  }>;
}

// Customer notifications store
export const customerNotifications = writable<Notification[]>([]);

// Admin notifications store
export const adminNotifications = writable<Notification[]>([]);

// Notification count store
export const unreadNotificationCount = writable<number>(0);

// Convert database notification to frontend notification format
function mapDatabaseNotification(dbNotification: DatabaseNotification, userLanguage: string = 'en'): Notification {
  const recipient = dbNotification.recipients?.[0];
  const isRead = !!recipient?.read_at;
  
  return {
    id: parseInt(dbNotification.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number for compatibility
    databaseId: dbNotification.id, // Keep the original UUID for database operations
    recipientId: recipient?.id, // Store recipient record ID for marking as read
    type: dbNotification.type as Notification['type'],
    title: userLanguage === 'ar' ? (dbNotification.title_ar || dbNotification.title) : (dbNotification.title_en || dbNotification.title),
    message: userLanguage === 'ar' ? (dbNotification.message_ar || dbNotification.message) : (dbNotification.message_en || dbNotification.message),
    timestamp: dbNotification.created_at,
    isRead,
    priority: dbNotification.priority as Notification['priority'],
    imageUrl: dbNotification.image_url,
    actionUrl: dbNotification.action_url,
    expiresAt: dbNotification.expires_at
  };
}

// Load notifications from Supabase for current customer (only show unread and not hidden)
export async function loadCustomerNotifications(language: string = 'en') {
  try {
    const currentUser = get(user);
    if (!currentUser || currentUser.type !== 'customer') {
      // Fallback to localStorage if no user
      loadNotificationsFromStorage();
      return;
    }

    const customerUser = currentUser as any; // Type assertion to access customer properties

    // Find customer record by customer_code or mobile
    const { data: customer } = await supabase
      .from('customers')
      .select('customer_code')
      .or(`customer_code.eq.${customerUser.mobile},mobile.eq.${customerUser.mobile}`)
      .single();

    if (!customer) {
      console.warn('Customer not found for notifications');
      loadNotificationsFromStorage();
      return;
    }

    // Fetch notifications for this customer using customer_code
    // Only show notifications that are NOT marked as read (hidden from UI)
    const { data: notificationsData, error } = await supabase
      .from('notification_recipients')
      .select(`
        *,
        notification:notifications(*)
      `)
      .eq('customer_code', customer.customer_code) // Use customer_code instead of customer_id
      .is('read_at', null) // Only show unread (not hidden) notifications
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading customer notifications:', error);
      loadNotificationsFromStorage();
      return;
    }

    const notifications = (notificationsData || [])
      .filter(item => item.notification)
      .map(item => mapDatabaseNotification({
        ...item.notification,
        recipients: [item]
      }, language));

    customerNotifications.set(notifications);
    updateUnreadCount(notifications);
    
    // Cache to localStorage as backup
    setStorageItem('customerNotifications', notifications);

  } catch (error) {
    console.error('Error in loadCustomerNotifications:', error);
    loadNotificationsFromStorage();
  }
}

// Mark notification as read in Supabase
export async function markAsReadInDatabase(notificationId: number) {
  try {
    const currentUser = get(user);
    if (!currentUser || currentUser.type !== 'customer') {
      return;
    }

    // Find the notification in our local store to get the recipient ID
    const notifications = get(customerNotifications);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification || !notification.recipientId) {
      console.warn('Notification not found or missing recipientId:', notificationId);
      return;
    }

    // Update the notification recipient record to mark as read using the recipient ID
    const { error } = await supabase
      .from('notification_recipients')
      .update({ 
        read_at: new Date().toISOString()
      })
      .eq('id', notification.recipientId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }

    console.log('Successfully marked notification as read in database');
  } catch (error) {
    console.error('Error marking notification as read in database:', error);
    throw error;
  }
}

// Send notification from admin (for admin notification center)
export async function sendNotificationToCustomers(
  notification: {
    type: string;
    title: string;
    title_en?: string;
    title_ar?: string;
    message: string;
    message_en?: string;
    message_ar?: string;
    priority: string;
    channels: string[];
    target_audience?: any;
  },
  targetCustomers: string[] = []
) {
  try {
    const currentUser = get(user);
    if (!currentUser || currentUser.type !== 'admin') {
      throw new Error('Only admins can send notifications');
    }

    const adminUser = currentUser as any;

    // Try to find admin user by email, or use null if not found
    let adminUserId = null;
    if (adminUser.email) {
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id')
        .eq('email', adminUser.email)
        .single();
      
      if (adminRecord?.id) {
        adminUserId = adminRecord.id;
      } else {
        // Try to find the default admin user
        const { data: defaultAdmin } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', 'admin@mainloyalty.com')
          .single();
        
        adminUserId = defaultAdmin?.id || null;
      }
    }

    // Create the notification
    const { data: newNotification, error: notificationError } = await supabase
      .from('notifications')
      .insert({
        type: notification.type,
        title: notification.title,
        title_en: notification.title_en,
        title_ar: notification.title_ar,
        message: notification.message,
        message_en: notification.message_en,
        message_ar: notification.message_ar,
        priority: notification.priority,
        channels: notification.channels,
        recipient_type: targetCustomers.length > 0 ? 'customer' : 'all',
        target_audience: notification.target_audience || {},
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_by: adminUserId // Will be null if admin not found in admin_users table
      })
      .select()
      .single();

    if (notificationError) {
      throw notificationError;
    }

    // If targeting specific customers, create recipient records
    if (targetCustomers.length > 0) {
      try {
        const recipientRecords = targetCustomers.map(customerCode => ({
          notification_id: newNotification.id,
          customer_code: customerCode, // Now this field exists in our new table
          sent_at: new Date().toISOString(),
          status: 'sent'
        }));

        const { error: recipientError } = await supabase
          .from('notification_recipients')
          .insert(recipientRecords);

        if (recipientError) {
          console.error('Could not create recipient records:', recipientError);
          // Don't throw error - notification was still created
        }
      } catch (error) {
        console.error('Error creating recipient records for specific customers:', error);
      }
    } else {
      // For "all" notifications, create records for all active customers
      try {
        const { data: customers } = await supabase
          .from('customers')
          .select('customer_code') // Get customer_code from customers table
          .eq('status', 'active')
          .limit(100); // Limit to prevent too many records at once

        if (customers && customers.length > 0) {
          const recipientRecords = customers.map(customer => ({
            notification_id: newNotification.id,
            customer_code: customer.customer_code,
            sent_at: new Date().toISOString(),
            status: 'sent'
          }));

          const { error: recipientError } = await supabase
            .from('notification_recipients')
            .insert(recipientRecords);

          if (recipientError) {
            console.error('Could not create recipient records for all customers:', recipientError);
          } else {
            console.log(`Created notification for ${customers.length} customers`);
          }
        }
      } catch (error) {
        console.error('Error creating recipient records for all customers:', error);
      }
    }

    return newNotification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// Load notifications from localStorage (fallback)
function loadNotificationsFromStorage() {
  const notifications = getStorageItem<Notification[]>('customerNotifications', []);
  customerNotifications.set(notifications);
  updateUnreadCount(notifications);
}

// Legacy localStorage functions (kept for backward compatibility)
export function loadNotifications() {
  loadNotificationsFromStorage();
}

// Add a new notification
export function addNotification(notification: Omit<Notification, 'id'>) {
  const newNotification: Notification = {
    ...notification,
    id: Date.now()
  };

  customerNotifications.update(notifications => {
    const updated = [newNotification, ...notifications];
    setStorageItem('customerNotifications', updated);
    updateUnreadCount(updated);
    return updated;
  });

  return newNotification;
}

// Mark notification as read (hide from UI but keep in database)
export async function markAsRead(notificationId: number) {
  try {
    // Update in database first (mark as read but don't delete)
    await markAsReadInDatabase(notificationId);
    
    // Then remove from UI (but notification stays in database)
    customerNotifications.update(notifications => {
      const updated = notifications.filter(notification => notification.id !== notificationId);
      
      setStorageItem('customerNotifications', updated);
      updateUnreadCount(updated);
      return updated;
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    
    // Still remove from UI even if database update fails
    customerNotifications.update(notifications => {
      const updated = notifications.filter(notification => notification.id !== notificationId);
      
      setStorageItem('customerNotifications', updated);
      updateUnreadCount(updated);
      return updated;
    });
    
    throw error;
  }
}

// Mark all notifications as read (hide all from UI but keep in database)
export async function markAllAsRead() {
  try {
    const currentUser = get(user);
    if (!currentUser || currentUser.type !== 'customer') {
      return;
    }

    const customerUser = currentUser as any;

    // Find customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('customer_code')
      .or(`customer_code.eq.${customerUser.mobile},mobile.eq.${customerUser.mobile}`)
      .single();

    if (!customer) {
      console.warn('Customer not found for marking all notifications as read');
      return;
    }

    // Mark all notifications as read in database (sets read_at timestamp)
    await supabase
      .from('notification_recipients')
      .update({ 
        read_at: new Date().toISOString()
      })
      .eq('customer_code', customer.customer_code)
      .is('read_at', null); // Only update unread notifications

    // Clear all from UI (but they remain in database)
    customerNotifications.set([]);
    unreadNotificationCount.set(0);
    setStorageItem('customerNotifications', []);

    console.log('All notifications marked as read (hidden from UI)');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    
    // Still clear from UI even if database update fails
    customerNotifications.set([]);
    unreadNotificationCount.set(0);
    setStorageItem('customerNotifications', []);
  }
}

// Delete notification
export function deleteNotification(notificationId: number) {
  customerNotifications.update(notifications => {
    const updated = notifications.filter(notification => notification.id !== notificationId);
    
    setStorageItem('customerNotifications', updated);
    updateUnreadCount(updated);
    return updated;
  });
}

// Clear all notifications (hide all from UI but keep in database)
export async function clearAllNotifications() {
  // Use the same logic as markAllAsRead since we want to hide all notifications
  await markAllAsRead();
}

// Update unread count
function updateUnreadCount(notifications: Notification[]) {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  unreadNotificationCount.set(unreadCount);
}

// Get notifications by type
export function getNotificationsByType(type: Notification['type']) {
  return new Promise<Notification[]>((resolve) => {
    customerNotifications.subscribe(notifications => {
      resolve(notifications.filter(notification => notification.type === type));
    })();
  });
}

// Add sample notifications for testing
export function addSampleNotifications() {
  const sampleNotifications: Omit<Notification, 'id'>[] = [
    {
      type: 'terms_update',
      title: 'Terms & Conditions Updated',
      message: 'The Terms and Conditions have been updated. Please review the changes.',
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: 'medium'
    },
    {
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight from 2 AM to 4 AM.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
      priority: 'high'
    },
    {
      type: 'promotion',
      title: 'New Rewards Available',
      message: 'Check out our new rewards in the catalog!',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      isRead: true,
      priority: 'low'
    }
  ];

  sampleNotifications.forEach(notification => {
    addNotification(notification);
  });
}
