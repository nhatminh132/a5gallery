import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AvatarUploadProps {
  onAvatarUpdate: (avatarUrl: string) => void;
  currentAvatar?: string;
}

export default function AvatarUpload({ onAvatarUpdate, currentAvatar }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size should be less than 2MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const bucket = (import.meta.env.VITE_STORAGE_BUCKET_1 || 'media') as string;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(`avatars/${fileName}`, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: `avatars/${fileName}` })
        .eq('id', user.id);

      if (updateError) throw updateError;

      onAvatarUpdate(`avatars/${fileName}`);
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setError(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    setUploading(true);
    setError(null);

    try {
      // Update profile to remove avatar
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      onAvatarUpdate('');
    } catch (error: any) {
      console.error('Avatar removal error:', error);
      setError(error.message || 'Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>

        {currentAvatar && (
          <button
            onClick={removeAvatar}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
      )}

      <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
        Upload a profile picture (max 2MB, JPG/PNG)
      </p>
    </div>
  );
}