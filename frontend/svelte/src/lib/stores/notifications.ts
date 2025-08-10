import { writable } from 'svelte/store';
import { getStorageItem, setStorageItem, removeStorageItem } from '$lib/utils/storage';
import type { Notification } from '$lib/types';

// Re-export the type for backward compatibility
export type { Notification } from '$lib/types';

// Customer notifications store
export const customerNotifications = writable<Notification[]>([]);

// Admin notifications store
export const adminNotifications = writable<Notification[]>([]);

// Notification count store
export const unreadNotificationCount = writable<number>(0);

// Load notifications from localStorage
export function loadNotifications() {
  const notifications = getStorageItem<Notification[]>('customerNotifications', []);
  customerNotifications.set(notifications);
  updateUnreadCount(notifications);
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

// Mark notification as read
export function markAsRead(notificationId: number) {
  customerNotifications.update(notifications => {
    const updated = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    
    setStorageItem('customerNotifications', updated);
    updateUnreadCount(updated);
    return updated;
  });
}

// Mark all notifications as read
export function markAllAsRead() {
  customerNotifications.update(notifications => {
    const updated = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    
    setStorageItem('customerNotifications', updated);
    updateUnreadCount(updated);
    return updated;
  });
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

// Clear all notifications
export function clearAllNotifications() {
  customerNotifications.set([]);
  unreadNotificationCount.set(0);
  removeStorageItem('customerNotifications');
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
