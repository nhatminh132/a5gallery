import { supabase } from './supabase';

export interface UploadLimitInfo {
  limitMB: number;
  usedMB: number;
  remainingMB: number;
  isAdmin: boolean;
  canUpload: boolean;
}

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Convert bytes to MB
export const bytesToMB = (bytes: number): number => {
  return Math.round((bytes / 1048576) * 100) / 100; // Round to 2 decimal places
};

// Convert MB to bytes
export const mbToBytes = (mb: number): number => {
  return Math.round(mb * 1048576);
};

// Check if user can upload a file
export const checkUploadLimit = async (userId: string, fileSizeBytes: number): Promise<UploadLimitInfo> => {
  try {
    // Get user's current upload stats
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('upload_limit_mb, total_uploaded_mb, is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to get user limits: ${error.message}`);
    }

    const isAdmin = profile?.is_admin || false;
    const limitMB = profile?.upload_limit_mb || 500;
    const usedMB = profile?.total_uploaded_mb || 0;
    const fileMB = bytesToMB(fileSizeBytes);
    const remainingMB = Math.max(0, limitMB - usedMB);
    
    // Admins have unlimited uploads
    const canUpload = isAdmin || (usedMB + fileMB <= limitMB);

    return {
      limitMB: isAdmin ? -1 : limitMB, // -1 indicates unlimited
      usedMB,
      remainingMB: isAdmin ? -1 : remainingMB,
      isAdmin,
      canUpload
    };
  } catch (error) {
    console.error('Error checking upload limits:', error);
    throw error;
  }
};

// Update user's upload limit (admin only)
export const updateUserUploadLimit = async (userId: string, newLimitMB: number): Promise<boolean> => {
  try {
    console.log(`🔧 Updating upload limit for user ${userId} to ${newLimitMB}MB`);
    
    const { data, error } = await supabase
      .from('profiles')
      .update({ upload_limit_mb: newLimitMB })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('❌ Supabase error:', error);
      throw new Error(`Failed to update upload limit: ${error.message}`);
    }

    console.log('✅ Update successful:', data);
    return true;
  } catch (error) {
    console.error('❌ Error updating upload limit:', error);
    throw error;
  }
};

// Get all users with their upload stats (admin only)
export const getUserUploadStats = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, upload_limit_mb, total_uploaded_mb, created_at')
      .order('total_uploaded_mb', { ascending: false });

    if (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user upload stats:', error);
    throw error;
  }
};