import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Image, 
  Video, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Crown,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  Download,
  User,
  Calendar,
  HardDrive,
  Save,
  X,
  Settings
} from 'lucide-react';
import { supabase, Profile, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/fileUtils';
import { deleteMedia, getMediaUrl } from '../lib/uploadService';
import SliderAdmin from './SliderAdmin';
import AdminStorageManager from './AdminStorageManager';
import ThumbnailRegenerator from './ThumbnailRegenerator';

interface UserWithStats extends Profile {
  media_count: number;
  total_storage_used: number;
  storage_used_s1: number;
  storage_used_s2: number;
  storage_used_s3: number;
  storage_used_s4: number;
  last_upload: string | null;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'media' | 'limits' | 'slider' | 'storage'>('users');
  
  console.log('AdminDashboard: Component mounted, activeTab:', activeTab, 'profile:', profile);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // User management state
  const [users, setUsers] = useState<UserWithStats[]>([]);
  
  // Media management state
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all');
  
  // Upload limits management state
  const [editingLimits, setEditingLimits] = useState<{[key: string]: boolean}>({});
  const [limitValues, setLimitValues] = useState<{[key: string]: string}>({});
  
  // IP address visibility state
  const [showIpModal, setShowIpModal] = useState(false);
  const [selectedUserIp, setSelectedUserIp] = useState<{email: string, ip: string, userAgent: string} | null>(null);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'limits') {
      loadUsers();
    } else if (activeTab === 'media') {
      loadMedia();
    }
    // Slider tab loads its own data internally
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('Loading users...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          media!media_user_id_fkey(
            id,
            file_size,
            upload_date,
            storage_provider
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Users query result:', { data: data?.length, error: error?.message });

      if (error) throw error;

      // Process user stats with per-storage breakdown
      const usersWithStats: UserWithStats[] = (data || []).map(user => {
        const userMedia = user.media || [];
        const totalStorage = userMedia.reduce((sum: number, m: any) => sum + (m.file_size || 0), 0);

        // Compute per-storage usage
        const byProvider: Record<string, number> = userMedia.reduce((acc: Record<string, number>, m: any) => {
          const sp = (m.storage_provider || 'storage1') as string;
          const size = m.file_size || 0;
          acc[sp] = (acc[sp] || 0) + size;
          return acc;
        }, {});

        const lastUpload = userMedia.length > 0 
          ? userMedia.reduce((latest: any, m: any) => 
              !latest || new Date(m.upload_date) > new Date(latest.upload_date) ? m : latest
            ).upload_date
          : null;

        return {
          ...user,
          media_count: userMedia.length,
          total_storage_used: totalStorage,
          storage_used_s1: byProvider['storage1'] || 0,
          storage_used_s2: byProvider['storage2'] || 0,
          storage_used_s3: byProvider['storage3'] || 0,
          storage_used_s4: byProvider['storage4'] || 0,
          last_upload: lastUpload
        };
      });

      setUsers(usersWithStats);
      console.log('Final users with stats:', usersWithStats.length);
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Fallback: try simple query without media join
      try {
        console.log('Trying fallback query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
          
        console.log('Fallback query result:', { data: fallbackData?.length, error: fallbackError?.message });
        
        if (fallbackData && !fallbackError) {
          const simpleUsers = fallbackData.map(user => ({
            ...user,
            media_count: 0,
            total_storage_used: 0,
            storage_used_s1: 0,
            storage_used_s2: 0,
            storage_used_s3: 0,
            storage_used_s4: 0,
            last_upload: null
          }));
          setUsers(simpleUsers);
          console.log('Using fallback data:', simpleUsers.length);
        }
      } catch (fallbackErr) {
        console.error('Fallback query also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('media')
        .select(`
          *,
          profiles!media_user_id_fkey(
            full_name,
            email
          )
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setMedia(data || []);
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"?\n\nThis will also delete all their media files and cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(userId);

      // First, delete all user's media files
      const { data: userMedia, error: mediaError } = await supabase
        .from('media')
        .select('id, file_path, thumbnail_path')
        .eq('user_id', userId);

      if (mediaError) throw mediaError;

      // Delete media files from storage and database
      if (userMedia && userMedia.length > 0) {
        for (const media of userMedia) {
          await deleteMedia(media.id, media.file_path, media.thumbnail_path, media.storage_provider);
        }
      }

      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete user from auth (if possible - may require admin privileges)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn('Could not delete auth user (may require additional permissions):', authError);
        }
      } catch (authErr) {
        console.warn('Auth deletion not available:', authErr);
      }

      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      alert('User deleted successfully');

    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteMedia = async (mediaId: string, filePath: string, thumbnailPath: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(mediaId);
      const success = await deleteMedia(mediaId, filePath, thumbnailPath, storageProvider);

      if (success) {
        setMedia(prev => prev.filter(m => m.id !== mediaId));
        alert('Media deleted successfully');
      } else {
        alert('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    } finally {
      setDeleting(null);
    }
  };

  const handleEditLimit = (userId: string, currentLimitMB: number) => {
    setEditingLimits(prev => ({ ...prev, [userId]: true }));
    setLimitValues(prev => ({ ...prev, [userId]: currentLimitMB.toString() }));
  };

  const handleSaveLimit = async (userId: string, userEmail: string) => {
    const newLimitMB = parseFloat(limitValues[userId]);
    
    if (isNaN(newLimitMB) || newLimitMB < 0) {
      alert('Please enter a valid limit (0 or greater)');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ upload_limit_mb: Math.round(newLimitMB) })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, upload_limit_mb: Math.round(newLimitMB) }
          : user
      ));

      setEditingLimits(prev => ({ ...prev, [userId]: false }));
      alert(`Upload limit for ${userEmail} updated to ${newLimitMB} MB`);

    } catch (error) {
      console.error('Error updating upload limit:', error);
      alert('Failed to update upload limit: ' + (error as Error).message);
    }
  };

  const handleCancelEdit = (userId: string) => {
    setEditingLimits(prev => ({ ...prev, [userId]: false }));
    setLimitValues(prev => ({ ...prev, [userId]: '' }));
  };

  const handleShowIpDetails = (userEmail: string, ipAddress: string, userAgent: string) => {
    setSelectedUserIp({
      email: userEmail,
      ip: ipAddress || 'No IP recorded',
      userAgent: userAgent || 'No user agent recorded'
    });
    setShowIpModal(true);
  };

  const formatUploadLimit = (limitMB: number) => {
    const limitGB = limitMB / 1024;
    return limitGB >= 1 ? `${limitGB.toFixed(1)} GB` : `${limitMB} MB`;
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = mediaFilter === 'all' || 
                         (mediaFilter === 'images' && item.media_type === 'image') ||
                         (mediaFilter === 'videos' && item.media_type === 'video');
    
    return matchesSearch && matchesFilter;
  });

  const getUserRoleDisplay = (user: Profile) => {
    if (user.role === 'SUPER_ADMIN') return { text: 'Super Admin', color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' };
    if (user.role === 'ADMIN' || user.is_admin) return { text: 'Admin', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' };
    return { text: 'User', color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' };
  };

  // Check admin permissions
  const isAdmin = profile?.is_admin || 
                  profile?.role === 'ADMIN' || 
                  profile?.role === 'SUPER_ADMIN' ||
                  profile?.email === 'lpnminh472@gmail.com';

  console.log('AdminDashboard: isAdmin check:', isAdmin, 'activeTab:', activeTab);

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">You don't have admin privileges.</p>
      </div>
    );
  }

  try {
    return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Admin Dashboard</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage users and media content. Use with caution - deletions cannot be undone.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'media'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Image className="w-4 h-4 inline mr-2" />
            Media Management
          </button>
          <button
            onClick={() => setActiveTab('limits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'limits'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <HardDrive className="w-4 h-4 inline mr-2" />
            Upload Limits
          </button>
          <button
            onClick={() => setActiveTab('slider')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'slider'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Image className="w-4 h-4 inline mr-2" />
            Slider Images
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'storage'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <HardDrive className="w-4 h-4 inline mr-2" />
            Storage Management
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={
                activeTab === 'users' ? 'Search users...' : 
                activeTab === 'limits' ? 'Search users...' : 
                activeTab === 'slider' ? 'Search images...' :
                'Search media...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-white bg-black text-white rounded-lg focus:ring-2 focus:ring-white/70 focus:border-white"
              disabled={activeTab === 'slider'}
            />
          </div>
        </div>

        {activeTab === 'media' && (
          <div className="flex gap-2">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mediaFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setMediaFilter('images')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mediaFilter === 'images'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Image className="w-4 h-4 inline mr-1" />
              Images
            </button>
            <button
              onClick={() => setMediaFilter('videos')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mediaFilter === 'videos'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <Video className="w-4 h-4 inline mr-1" />
              Videos
            </button>
          </div>
        )}

        <button
          onClick={activeTab === 'media' ? loadMedia : activeTab === 'slider' ? () => window.location.reload() : loadUsers}
          disabled={loading || activeTab === 'slider'}
          className="px-4 py-2 bg-black border border-white text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cyber-button"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : activeTab === 'users' ? (
        /* Users Management */
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Media Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Storage Used (Total)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    S2
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    S3
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    S4
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Last Upload
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Device
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    OS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredUsers.map((user) => {
                  const roleInfo = getUserRoleDisplay(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'No name'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleInfo.color}`}>
                          {roleInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.media_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatFileSize(user.total_storage_used)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {formatFileSize(user.storage_used_s2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {formatFileSize(user.storage_used_s3)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 dark:text-gray-300">
                        {formatFileSize(user.storage_used_s4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.last_upload ? new Date(user.last_upload).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {(user as any).ip_address ? '••••••••••••' : 'Not available'}
                          </span>
                          {(user as any).ip_address && (
                            <button
                              onClick={() => handleShowIpDetails(user.email, (user as any).ip_address, (user as any).user_agent)}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                              title="View IP details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="truncate max-w-24" title={(user as any).device_name || 'No device info'}>
                          {(user as any).device_name || 'Not available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <span className="text-xs" title={(user as any).user_agent || 'No user agent'}>
                          {(user as any).device_os || 'Not available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={deleting === user.id || user.email === profile?.email}
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          title={user.email === profile?.email ? "Cannot delete your own account" : "Delete user"}
                        >
                          {deleting === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      ) : activeTab === 'media' ? (
        /* Media Management */
        <div className="space-y-6">
          {/* Thumbnail Regenerator */}
          <ThumbnailRegenerator onComplete={loadMedia} />
          
          {/* Media Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedia.map((item) => (
            <div key={item.id} className="bg-black border border-white rounded-lg overflow-hidden group neon-white">
              <div className="aspect-video bg-black border-b border-white relative">
                {item.media_type === 'video' ? (
                  <video
                    src={`${getMediaUrl(item.file_path, item.storage_provider)}`}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={item.thumbnail_path 
                      ? `${getMediaUrl(item.thumbnail_path!, item.storage_provider)}`
                      : `${getMediaUrl(item.file_path, item.storage_provider)}`
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                )}
                
                <div className="absolute top-2 left-2">
                  {item.media_type === 'video' ? (
                    <div className="bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      Video
                    </div>
                  ) : (
                    <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Image className="w-3 h-3" />
                      Image
                    </div>
                  )}
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteMedia(item.id, item.file_path, item.thumbnail_path, item.title)}
                    disabled={deleting === item.id}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg disabled:opacity-50"
                    title="Delete media"
                  >
                    {deleting === item.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-sm text-white/80 mb-2 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <div className="text-xs text-white/70 space-y-1">
                  <div>By: {item.profiles?.email}</div>
                  <div>Size: {formatFileSize(item.file_size)}</div>
                  <div>Date: {new Date(item.upload_date).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredMedia.length === 0 && (
            <div className="col-span-full text-center py-8">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No media found</p>
            </div>
          )}
          </div>
        </div>
      ) : activeTab === 'limits' ? (
        /* Upload Limits Management */
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Upload Limits Management ({filteredUsers.length} users)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage individual user upload limits. Changes take effect immediately.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Current Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Upload Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usage %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                {filteredUsers.map((user) => {
                  const isEditing = editingLimits[user.id];
                  const limitMB = user.upload_limit_mb || 500; // Default 500MB
                  const limitBytes = limitMB * 1024 * 1024;
                  const usagePercent = limitBytes > 0 ? (user.total_storage_used / limitBytes) * 100 : 0;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'No name'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatFileSize(user.total_storage_used)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.media_count} files
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={limitValues[user.id] || ''}
                              onChange={(e) => setLimitValues(prev => ({ ...prev, [user.id]: e.target.value }))}
                              className="w-20 px-2 py-1 text-sm border border-white bg-black text-white rounded focus:ring-2 focus:ring-white/70 focus:border-white"
                              placeholder="MB"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">MB</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatUploadLimit(limitMB)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                usagePercent >= 90 ? 'bg-red-500' :
                                usagePercent >= 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            usagePercent >= 90 ? 'text-red-600 dark:text-red-400' :
                            usagePercent >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-green-600 dark:text-green-400'
                          }`}>
                            {usagePercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveLimit(user.id, user.email)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-900 dark:hover:text-green-400 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              onClick={() => handleCancelEdit(user.id)}
                              disabled={loading}
                              className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400 disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditLimit(user.id, limitMB)}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 disabled:opacity-50 flex items-center gap-1"
                          >
                            <Settings className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      ) : activeTab === 'storage' ? (
        /* Storage Management */
        <div className="space-y-6">
          <AdminStorageManager />
        </div>
      ) : activeTab === 'slider' ? (
        /* Slider Images Management */
        <SliderAdmin />
      ) : null}

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Warning: Permanent Actions
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Deleting users or media is permanent and cannot be undone. Use these features with extreme caution.
              Deleting a user will also delete all their uploaded media.
            </p>
          </div>
        </div>
      </div>

      {/* IP Details Modal */}
      {showIpModal && selectedUserIp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                IP Address Details
              </h3>
              <button
                onClick={() => setShowIpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {selectedUserIp.email}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IP Address
                </label>
                <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {selectedUserIp.ip}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Agent
                </label>
                <p className="text-xs text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded break-all">
                  {selectedUserIp.userAgent}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setShowIpModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('AdminDashboard: Render error:', error);
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Component Error</h3>
        <p className="text-gray-600 dark:text-gray-400">
          There was an error loading the admin dashboard: {error instanceof Error ? error.message : String(error)}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Reload Page
        </button>
      </div>
    );
  }
}