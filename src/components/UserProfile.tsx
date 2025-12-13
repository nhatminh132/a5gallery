import React, { useState, useEffect } from 'react';
import { Camera, Edit, Save, X, Mail, Calendar, Upload, Image, Video, Heart, MessageCircle, Award } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/fileUtils';

interface UserStats {
  totalMedia: number;
  totalImages: number;
  totalVideos: number;
  totalLikes: number;
  totalComments: number;
  storageUsed: number;
  joinDate: string;
}

interface UserProfileProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfile({ userId, isOpen, onClose }: UserProfileProps) {
  const { user: currentUser, profile: currentProfile, updateProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [userMedia, setUserMedia] = useState<Media[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    bio: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadUserProfile();
    }
  }, [isOpen, targetUserId]);

  const loadUserProfile = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setEditData({
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || ''
      });

      // Load user's media
      const { data: mediaData, error: mediaError } = await supabase
        .from('media')
        .select('*')
        .eq('user_id', targetUserId)
        .order('upload_date', { ascending: false })
        .limit(12);

      if (mediaError) throw mediaError;
      setUserMedia(mediaData || []);

      // Load user statistics
      await loadUserStats(targetUserId);

    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async (userId: string) => {
    try {
      // Get media stats
      const { data: mediaStats, error: mediaError } = await supabase
        .from('media')
        .select('file_type, file_size, upload_date')
        .eq('user_id', userId);

      if (mediaError) throw mediaError;

      // Get likes received
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('likes.id, media!inner(user_id)')
        .eq('media.user_id', userId);

      if (likesError) throw likesError;

      // Get comments made
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .eq('user_id', userId);

      if (commentsError) throw commentsError;

      const totalMedia = mediaStats?.length || 0;
      const totalImages = mediaStats?.filter(m => m.file_type.startsWith('image')).length || 0;
      const totalVideos = mediaStats?.filter(m => m.file_type.startsWith('video')).length || 0;
      const totalLikes = likesData?.length || 0;
      const totalComments = commentsData?.length || 0;
      const storageUsed = mediaStats?.reduce((sum, m) => sum + (m.file_size || 0), 0) || 0;
      const joinDate = mediaStats?.length > 0 
        ? mediaStats.reduce((earliest, m) => 
            new Date(m.upload_date) < new Date(earliest.upload_date) ? m : earliest
          ).upload_date
        : profile?.created_at || new Date().toISOString();

      setStats({
        totalMedia,
        totalImages,
        totalVideos,
        totalLikes,
        totalComments,
        storageUsed,
        joinDate
      });

    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!isOwnProfile || !currentUser) return;

    try {
      setSaving(true);

      const updates = {
        full_name: editData.full_name.trim() || null,
        bio: editData.bio.trim() || null,
        avatar_url: editData.avatar_url.trim() || null,
      };

      await updateProfile(updates);
      
      // Refresh profile data
      setProfile(prev => ({ ...prev, ...updates }));
      setIsEditing(false);

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getUserRole = (profile: any) => {
    if (profile?.role === 'SUPER_ADMIN' || profile?.email === 'lpnminh472@gmail.com') {
      return { text: 'Super Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' };
    }
    if (profile?.role === 'ADMIN' || profile?.is_admin) {
      return { text: 'Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' };
    }
    return { text: 'Member', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
            <div className="h-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">User profile not found</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const roleInfo = getUserRole(profile);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isOwnProfile ? 'My Profile' : 'User Profile'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                {(isEditing ? editData.avatar_url : profile.avatar_url) ? (
                  <img
                    src={isEditing ? editData.avatar_url : profile.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-12 h-12 text-gray-500" />
                )}
              </div>
              {isEditing && (
                <input
                  type="url"
                  placeholder="Avatar URL"
                  value={editData.avatar_url}
                  onChange={(e) => setEditData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  className="mt-2 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg w-32 text-center"
                />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              {/* Name */}
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={editData.full_name}
                    onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
                    className="text-2xl font-bold bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profile.full_name || 'No name set'}
                  </h1>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>
                    {roleInfo.text}
                  </span>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</h3>
                {isEditing ? (
                  <textarea
                    placeholder="Tell us about yourself..."
                    value={editData.bio}
                    onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg resize-none"
                  />
                ) : (
                  <p className="text-gray-600 dark:text-gray-400">
                    {profile.bio || 'No bio added yet.'}
                  </p>
                )}
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({
                        full_name: profile.full_name || '',
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url || ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMedia}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Uploads</div>
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <Image className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalImages}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Images</div>
              </div>
              
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
                <Video className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalVideos}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Videos</div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <Heart className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalLikes}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Likes Received</div>
              </div>
            </div>
          )}

          {/* Additional Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Comments Made</span>
                </div>
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300">{stats.totalComments}</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Storage Used</span>
                </div>
                <div className="text-xl font-bold text-gray-700 dark:text-gray-300">
                  {formatFileSize(stats.storageUsed)}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Member Since</span>
                </div>
                <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {new Date(stats.joinDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Recent Media */}
          {userMedia.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Uploads ({userMedia.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {userMedia.map((media) => (
                  <div key={media.id} className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={media.thumbnail_path || media.file_path}
                      alt={media.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {userMedia.length === 0 && (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {isOwnProfile ? "You haven't uploaded any media yet" : "This user hasn't uploaded any media yet"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}