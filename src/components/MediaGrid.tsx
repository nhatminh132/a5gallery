import { useState, useEffect } from 'react';
import MediaImage from './MediaImage';
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

      // Show all media to everyone (no verification filtering)
      console.log('Loading all public media for all users');

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
      
      // Debug: Check video thumbnails
      const videos = (data || []).filter(item => isVideoFile(item.file_type));
      console.log('Videos found:', videos.length);
      videos.forEach((video, index) => {
        console.log(`Video ${index + 1}:`, {
          title: video.title,
          file_type: video.file_type,
          thumbnail_path: video.thumbnail_path,
          hasThumbnail: !!video.thumbnail_path
        });
      });
      
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
    const success = await deleteMedia(mediaItem.id, mediaItem.file_path, mediaItem.thumbnail_path, mediaItem.storage_provider);

    if (success) {
      setMedia((prev) => prev.filter((m) => m.id !== mediaItem.id));
      alert('Media deleted successfully');
    } else {
      alert('Failed to delete media. Please try again.');
    }
    setDeleting(null);
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
            className="group relative bg-black rounded-xl overflow-hidden border border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-square relative overflow-hidden bg-black">
              {/* Robust media image with provider fallback */}
              {(isVideoFile(mediaItem.file_type) && mediaItem.thumbnail_path) ? (
                <MediaImage
                  filePath={mediaItem.thumbnail_path}
                  storageProvider={mediaItem.storage_provider}
                  alt={mediaItem.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <MediaImage
                  filePath={mediaItem.file_path}
                  storageProvider={mediaItem.storage_provider}
                  alt={mediaItem.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}

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
                    
                  </div>
                </div>
              </div>
            </div>

          <div className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
              {mediaItem.title}
            </h3>
            
            {/* Media ID */}
            {/* Removed media ID display */ false && (
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
              
              {/* File Details removed: size, format, resolution */}
            </div>
          </div>

          {/* Admin hover badge and delete button removed as requested */}

          
        </div>
      ))}
      </div>
    </>
  );
}