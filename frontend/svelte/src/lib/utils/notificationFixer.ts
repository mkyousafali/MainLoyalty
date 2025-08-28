import { supabase } from '$lib/supabase';

// Branch name mappings - English to Arabic
const branchNameMap: { [key: string]: string } = {
  'Urban Market Abu Arish': 'أربان ماركت أبو عريش',
  'Urban Market': 'أربان ماركت',
  'Abu Arish': 'أبو عريش',
  'Jazan': 'جازان',
  'Riyadh': 'الرياض',
  'Jeddah': 'جدة',
  'Dammam': 'الدمام',
  'Mecca': 'مكة',
  'Medina': 'المدينة',
  // Add more branch mappings as needed
};

export async function fixNotificationBranchNames() {
  try {
    console.log('Starting notification branch name fix...');
    
    // Get all notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, message_ar, message_en, title_ar, title_en');

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError);
      return { success: false, error: fetchError };
    }

    if (!notifications || notifications.length === 0) {
      console.log('No notifications found');
      return { success: true, updated: 0 };
    }

    let updatedCount = 0;
    const updates = [];

    for (const notification of notifications) {
      let needsUpdate = false;
      let updatedData: any = {};

      // Check and fix Arabic message
      if (notification.message_ar) {
        let fixedMessageAr = notification.message_ar;
        for (const [english, arabic] of Object.entries(branchNameMap)) {
          if (fixedMessageAr.includes(english)) {
            fixedMessageAr = fixedMessageAr.replace(new RegExp(english, 'g'), arabic);
            needsUpdate = true;
          }
        }
        if (needsUpdate) {
          updatedData.message_ar = fixedMessageAr;
        }
      }

      // Check and fix Arabic title
      if (notification.title_ar) {
        let fixedTitleAr = notification.title_ar;
        for (const [english, arabic] of Object.entries(branchNameMap)) {
          if (fixedTitleAr.includes(english)) {
            fixedTitleAr = fixedTitleAr.replace(new RegExp(english, 'g'), arabic);
            needsUpdate = true;
            updatedData.title_ar = fixedTitleAr;
          }
        }
      }

      if (needsUpdate) {
        updates.push({ id: notification.id, data: updatedData });
        updatedCount++;
      }
    }

    // Apply updates
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('notifications')
        .update(update.data)
        .eq('id', update.id);

      if (updateError) {
        console.error(`Error updating notification ${update.id}:`, updateError);
      } else {
        console.log(`Updated notification ${update.id}`);
      }
    }

    console.log(`Fixed ${updatedCount} notifications`);
    return { success: true, updated: updatedCount };

  } catch (error) {
    console.error('Error in fixNotificationBranchNames:', error);
    return { success: false, error };
  }
}

// Function to add more branch mappings
export function addBranchMapping(englishName: string, arabicName: string) {
  branchNameMap[englishName] = arabicName;
}

// Function to get current mappings
export function getBranchMappings() {
  return { ...branchNameMap };
}
