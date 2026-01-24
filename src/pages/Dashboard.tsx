import { useState, useEffect, useCallback } from 'react';
import { Image, Video, Upload as UploadIcon, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import MediaStats from '../components/MediaStats';
import GalleryHeader from '../components/GalleryHeader';
import ImageSlider from '../components/ImageSlider';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatFileSize } from '../lib/fileUtils';
import { getMediaUrl } from '../lib/uploadService';
import { Media } from '../lib/supabase';

interface DashboardProps {
  onMediaSelect: (media: Media) => void;
  onNavigate: (page: string) => void;
}

interface DashboardData {
  recentMedia: Media[];
  totalImages: number;
  totalVideos: number;
  totalStorage: number;
}

const LOADING_TIMEOUT = 10000; // 10 seconds

export default function Dashboard({ onMediaSelect, onNavigate }: DashboardProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardData>({
    recentMedia: [],
    totalImages: 0,
    totalVideos: 0,
    totalStorage: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  const loadDashboardData = useCallback(async (showLoader = true) => {
    const startTime = Date.now();
    console.log('🏠 Dashboard: Starting data load...');
    
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      setError(null);

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Dashboard: Load timeout reached');
        setIsLoading(false);
        setError('Loading timed out. Please try refreshing.');
      }, LOADING_TIMEOUT);

      let query = supabase
        .from('media')
        .select(`
          *,
          profiles!media_user_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // If user is logged in, prioritize their content
      if (user?.id) {
        query = query.limit(20);
      } else {
        query = query.limit(12);
      }

      console.log('🏠 Dashboard: Executing media query...');
      const { data: mediaData, error: mediaError } = await query;

      clearTimeout(timeoutId);

      if (mediaError) {
        throw new Error(`Media query failed: ${mediaError.message}`);
      }

      console.log(`🏠 Dashboard: Query completed in ${Date.now() - startTime}ms`);
      console.log(`🏠 Dashboard: Found ${mediaData?.length || 0} media items`);

      // Process media URLs
      const mediaWithUrls: Media[] = await Promise.all(
        (mediaData || []).map(async (item) => {
          try {
            const publicUrl = getMediaUrl(item.file_path, item.storage_provider);

            let thumbnailUrl = null;
            if (item.thumbnail_path) {
              const thumbUrl = item.thumbnail_path ? getMediaUrl(item.thumbnail_path, item.storage_provider) : undefined;
              thumbnailUrl = thumbUrl;
            }

            return {
              ...item,
              url: publicUrl,
              thumbnailUrl
            };
          } catch (urlError) {
            console.warn(`Failed to get URL for ${item.filename}:`, urlError);
            return item;
          }
        })
      );

      // Calculate stats
      const imageCount = mediaWithUrls.filter(m => m.file_type.startsWith('image/')).length;
      const videoCount = mediaWithUrls.filter(m => m.file_type.startsWith('video/')).length;
      const totalSize = mediaWithUrls.reduce((sum, m) => sum + (m.file_size || 0), 0);

      setData({
        recentMedia: mediaWithUrls,
        totalImages: imageCount,
        totalVideos: videoCount,
        totalStorage: totalSize
      });

      console.log(`🏠 Dashboard: Data loaded successfully - ${imageCount} images, ${videoCount} videos`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      console.error('🏠 Dashboard: Load error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setHasInitialized(true);
    }
  }, [user?.id]);

  // Initialize dashboard
  useEffect(() => {
    if (!hasInitialized) {
      console.log('🏠 Dashboard: Initializing...');
      loadDashboardData(true);
    }
  }, [loadDashboardData, hasInitialized]);

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  const handleRetry = () => {
    setError(null);
    loadDashboardData(true);
  };

  // Loading state
  if (isLoading && !hasInitialized) {
    return (
      <LoadingSpinner message="Loading Dashboard..." size="lg" fullScreen />
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => onNavigate('images')}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 hover:border-gray-600 transition-colors"
            >
              Browse Gallery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Particle Background - only in dark mode */}
      <div className="particles-bg absolute inset-0 z-0 hidden dark:block"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Gallery Header */}
        <GalleryHeader />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">
              {user ? t('home.welcome', { name: profile?.full_name || 'User' }) : t('home.welcomeGuest')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {user ? t('home.yourActivity') : t('home.explore')}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-black text-white border-2 border-white rounded-lg transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.35)] hover:shadow-[0_0_16px_rgba(255,255,255,0.8)]"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {t('home.refresh')}
            </button>
            
            {user && (
              <button
                onClick={() => onNavigate('upload')}
                className="flex items-center px-4 py-2 bg-black text-white border-2 border-white rounded-lg transition-all shadow-[0_0_10px_rgba(255,255,255,0.35)] hover:shadow-[0_0_16px_rgba(255,255,255,0.8)]"
              >
                <UploadIcon className="w-5 h-5 mr-2" />
                {t('nav.upload')}
              </button>
            )}
          </div>
        </div>

        {/* Image Slider */}
        <ImageSlider className="mb-8" />

        {/* Stats removed as requested */}

        {/* Recent Media */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-6 dark:backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('home.recentMedia')}</h2>
            <button
              onClick={() => onNavigate('images')}
              className="flex items-center text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)] hover:opacity-90 font-medium"
            >
              {t('home.viewAll')}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {data.recentMedia.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('home.noMedia')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {user ? t('home.startUploading') : t('home.checkBack')}
              </p>
              {user && (
                <button
                  onClick={() => onNavigate('upload')}
                  className="px-4 py-2 bg-black text-white border-2 border-white rounded-lg transition-all shadow-[0_0_10px_rgba(255,255,255,0.35)] hover:shadow-[0_0_16px_rgba(255,255,255,0.8)]"
                >
                  {t('home.uploadMedia')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {data.recentMedia.map((media) => (
                <div
                  key={media.id}
                  onClick={() => onMediaSelect(media)}
                  className="aspect-square bg-gray-900 border border-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform group hover:border-gray-700"
                >
                  {media.file_type.startsWith('image/') ? (
                    <img
                      src={media.thumbnailUrl || media.url}
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 border border-gray-700">
                      <Video className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}