import { useState } from 'react';
import { Camera, Upload, User, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_AVATARS = [
  '👤', '🧑', '👩', '👨', '🧓', '👴', '👵',
  '😀', '😃', '😄', '😁', '😆', '😊', '😉',
  '🤓', '😎', '🤩', '🥳', '😇', '🤗', '🤖',
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻',
  '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎸',
  '⭐', '🌟', '✨', '🔥', '💎', '🌈', '🦄'
];

export default function AvatarSelector({ isOpen, onClose }: AvatarSelectorProps) {
  const { profile, user, updateProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmojiSelect = async (emoji: string) => {
    if (!user) return;

    console.log('Selected emoji:', emoji, 'Length:', emoji.length);
    setUploading(true);
    setError(null);

    try {
      const { error } = await updateProfile({ avatar_url: emoji });

      if (error) throw error;

      console.log('Emoji avatar updated successfully');
      // Close the modal - the profile is already updated
      onClose();
    } catch (err) {
      console.error('Error updating avatar:', err);
      setError('Failed to update avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await updateProfile({ avatar_url: data.publicUrl });

      if (updateError) throw updateError;

      // Close the modal - the profile is already updated
      onClose();
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!user) return;

    setUploading(true);
    setError(null);

    try {
      const { error } = await updateProfile({ avatar_url: null });

      if (error) throw error;

      // Close the modal - the profile is already updated
      onClose();
    } catch (err) {
      console.error('Error removing avatar:', err);
      setError('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Choose Avatar
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Current Avatar */}
          <div className="text-center">
            <div className="inline-block relative">
              {profile?.avatar_url ? (
                !profile.avatar_url.startsWith('http') || profile.avatar_url.startsWith('http') ? (
                  !profile.avatar_url.startsWith('http') ? (
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-3xl">
                      {profile.avatar_url}
                    </div>
                  ) : (
                    <img
                      src={profile.avatar_url}
                      alt="Current avatar"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Current Avatar</p>
          </div>

          {/* Upload Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Upload Custom Image
              </label>
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <Upload className="w-5 h-5" />
                    <span className="text-sm font-medium">Upload Image</span>
                  </div>
                </label>
                {profile?.avatar_url && (
                  <button
                    onClick={removeAvatar}
                    disabled={uploading}
                    className="px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Emoji Avatars */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Choose Emoji Avatar
              </label>
              <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                {DEFAULT_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    disabled={uploading}
                    className="w-12 h-12 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-xl transition-colors disabled:opacity-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {uploading && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                Updating avatar...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}