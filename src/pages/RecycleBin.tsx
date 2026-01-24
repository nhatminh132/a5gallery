import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MediaGrid from '../components/MediaGrid';
import { MediaGridSkeleton } from '../components/SkeletonLoader';
import type { Media } from '../lib/supabase';

export default function RecycleBin() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deletedMedia, setDeletedMedia] = useState<Media[]>([]);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDeletedMedia();
    }
  }, [user]);

  const loadDeletedMedia = async () => {
    try {
      let query = supabase
        .from('media')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      // Non-admins can only see their own deleted items
      if (!profile?.is_admin) {
        query = query.eq('user_id', user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeletedMedia(data || []);
    } catch (error) {
      console.error('Error loading recycle bin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (mediaId: string) => {
    try {
      setRestoring(mediaId);
      
      const { error } = await supabase.rpc('restore_from_recycle_bin', {
        media_uuid: mediaId
      });

      if (error) throw error;

      // Remove from list
      setDeletedMedia(prev => prev.filter(m => m.id !== mediaId));
      alert('Media restored successfully!');
    } catch (error) {
      console.error('Error restoring media:', error);
      alert('Failed to restore media');
    } finally {
      setRestoring(null);
    }
  };

  const handlePermanentDelete = async (mediaId: string) => {
    if (!confirm('This will permanently delete the media. This action cannot be undone. Continue?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setDeletedMedia(prev => prev.filter(m => m.id !== mediaId));
      alert('Media permanently deleted');
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const getDaysUntilDeletion = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const fiveDaysLater = new Date(deleted.getTime() + 5 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.ceil((fiveDaysLater.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Please log in</h2>
          <button
            onClick={() => navigate('/auth')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-3">
              <Trash2 className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recycle Bin</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {deletedMedia.length} item{deletedMedia.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              Items in the recycle bin will be permanently deleted after 5 days
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <MediaGridSkeleton />
        ) : deletedMedia.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Recycle bin is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deletedMedia.map((media) => {
              const daysLeft = getDaysUntilDeletion(media.deleted_at!);
              return (
                <div key={media.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md border-2 border-red-200 dark:border-red-800">
                  {/* Image */}
                  <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                    <img
                      src={media.thumbnail_path || media.file_path}
                      alt={media.title}
                      className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Trash2 className="w-12 h-12 text-red-500" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {media.title}
                    </h3>
                    
                    {/* Days left */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>
                        {daysLeft === 0 
                          ? 'Deletes today' 
                          : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                        }
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestore(media.id)}
                        disabled={restoring === media.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-4 h-4 ${restoring === media.id ? 'animate-spin' : ''}`} />
                        Restore
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(media.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
