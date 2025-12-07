import { useState, useEffect } from 'react';
import { Play, Calendar, User, Loader2, Trash2, Heart, MessageCircle } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { getMediaUrl, deleteMedia } from '../lib/uploadService';
import { isVideoFile, formatFileSize } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface MediaGridProps {
  searchQuery: string;
  filterType: 'all' | 'images' | 'videos';
  onMediaClick: (media: Media) => void;
  refreshTrigger?: number;
}

export default function MediaGrid({
  searchQuery,
  filterType,
  onMediaClick,
  refreshTrigger,
}: MediaGridProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [likes, setLikes] = useState<Record<string, { count: number; isLiked: boolean }>>({});
  const [comments, setComments] = useState<Record<string, number>>({});

  useEffect(() => {
    loadMedia();
  }, [user?.id, searchQuery, filterType, refreshTrigger]);

  useEffect(() => {
    if (media.length > 0) {
      loadLikesAndComments();
    }
  }, [media, user?.id]);

  const loadMedia = async () => {
    try {
      setLoading(true);
      
      if (user?.id) {
        console.log('Loading media for authenticated user:', user.id);
      } else {
        console.log('Loading verified media for anonymous user');
      }

      let query = supabase
        .from('media')
        .select(`
          *,
          profiles!media_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('upload_date', { ascending: false });

      // Show all media from all users (both authenticated and anonymous users see everything)
      // No user filtering - everyone sees all public media

      if (searchQuery) {
        // Check if search query looks like a media ID (numeric only)
        const isNumericSearch = /^\d+$/.test(searchQuery);
        
        if (isNumericSearch) {
          // Search by media_id if query is numeric
          query = query.or(`media_id.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        } else {
          // Regular text search
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
      }

      if (filterType === 'images') {
        query = query.in('file_type', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
      } else if (filterType === 'videos') {
        query = query.in('file_type', ['video/mp4', 'video/webm', 'video/quicktime']);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Media loading error:', error);
        throw error;
      }

      console.log('Loaded media:', data?.length || 0, 'items');
      setMedia(data || []);
    } catch (error) {
      console.error('MediaGrid error:', error);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLikesAndComments = async () => {
    if (!media.length) return;

    try {
      const mediaIds = media.map(m => m.id);

      // Load likes count and user's like status
      const { data: likesData } = await supabase
        .from('likes')
        .select('media_id, user_id')
        .in('media_id', mediaIds);

      // Load comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('media_id')
        .in('media_id', mediaIds);

      // Process likes data
      const likesMap: Record<string, { count: number; isLiked: boolean }> = {};
      mediaIds.forEach(id => {
        const mediaLikes = likesData?.filter(like => like.media_id === id) || [];
        likesMap[id] = {
          count: mediaLikes.length,
          isLiked: user ? mediaLikes.some(like => like.user_id === user.id) : false,
        };
      });

      // Process comments data
      const commentsMap: Record<string, number> = {};
      mediaIds.forEach(id => {
        const mediaComments = commentsData?.filter(comment => comment.media_id === id) || [];
        commentsMap[id] = mediaComments.length;
      });

      setLikes(likesMap);
      setComments(commentsMap);
    } catch (error) {
      console.error('Error loading likes and comments:', error);
    }
  };


  const handleDelete = async (e: React.MouseEvent, mediaItem: Media) => {
    e.stopPropagation();

    // Double-check admin permissions
    if (!profile?.is_admin) {
      alert('Only administrators can delete media');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${mediaItem.title}"?\n\nThis action cannot be undone.`)) return;

    setDeleting(mediaItem.id);
    const success = await deleteMedia(mediaItem.id, mediaItem.file_path, mediaItem.thumbnail_path);

    if (success) {
      setMedia((prev) => prev.filter((m) => m.id !== mediaItem.id));
      alert('Media deleted successfully');
    } else {
      alert('Failed to delete media. Please try again.');
    }
    setDeleting(null);
  };

  const getMediaThumbnail = (mediaItem: Media): string => {
    if (isVideoFile(mediaItem.file_type) && mediaItem.thumbnail_path) {
      return getMediaUrl(mediaItem.thumbnail_path);
    }
    return getMediaUrl(mediaItem.file_path);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Remove the check that blocks anonymous users from viewing media
  // Anonymous users can now view all public media

  if (media.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <Play className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('common.noMediaFound')}</h3>
        <p className="text-gray-600 dark:text-gray-400">
          {searchQuery
            ? t('common.tryAdjusting')
            : t('common.startUploading')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {media.map((mediaItem) => (
          <div
            key={mediaItem.id}
            onClick={() => onMediaClick(mediaItem)}
            className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl dark:shadow-gray-900/25 dark:hover:shadow-gray-900/40 transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-gray-700">
              <img
                src={getMediaThumbnail(mediaItem)}
                alt={mediaItem.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const container = img.parentElement;
                  if (container && !container.querySelector('.fallback-content')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'fallback-content absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-600';
                    fallback.innerHTML = isVideoFile(mediaItem.file_type) 
                      ? '<svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>'
                      : '<svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>';
                    container.appendChild(fallback);
                  }
                }}
              />

              {/* Video Play Button Overlay */}
              {isVideoFile(mediaItem.file_type) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-900 ml-1" />
                  </div>
                </div>
              )}


              {/* Stats Overlay - Always visible at bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex items-center justify-between text-white text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{likes[mediaItem.id]?.count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{comments[mediaItem.id] || 0}</span>
                    </div>
                  </div>
                  <div className="text-xs opacity-75">
                    {mediaItem.media_id && `#${mediaItem.media_id}`}
                  </div>
                </div>
              </div>
            </div>

          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
              {mediaItem.title}
            </h3>
            
            {/* Media ID */}
            {mediaItem.media_id && (
              <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 mb-2">
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  🆔 ID: {mediaItem.media_id}
                </p>
              </div>
            )}
            
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {/* Upload Date & Time */}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(mediaItem.upload_date).toLocaleDateString()} {new Date(mediaItem.upload_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              
              {/* Uploader */}
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="truncate">
                  {mediaItem.profiles?.full_name || mediaItem.profiles?.email || 'Unknown User'}
                </span>
              </div>
              
              {/* File Details */}
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  📦 {formatFileSize(mediaItem.file_size)}
                </span>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  🎨 {mediaItem.file_type.split('/')[1]}
                </span>
                {(mediaItem.width && mediaItem.height) && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    📐 {mediaItem.width}×{mediaItem.height}
                  </span>
                )}
              </div>
            </div>
          </div>

          {profile?.is_admin && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              {/* Admin Badge */}
              <div className="bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Admin
              </div>
              
              {/* Delete Button */}
              <button
                onClick={(e) => handleDelete(e, mediaItem)}
                disabled={deleting === mediaItem.id}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete (Admin Only)"
              >
                {deleting === mediaItem.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Show info for non-admin users */}
          {!profile?.is_admin && user && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-80 transition-opacity">
              <div className="bg-gray-700 text-white text-xs px-2 py-1 rounded-lg">
                Admin Only
              </div>
            </div>
          )}
        </div>
      ))}
      </div>
    </>
  );
}