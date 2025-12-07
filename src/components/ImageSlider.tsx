import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageSliderProps {
  className?: string;
}

export default function ImageSlider({ className = '' }: ImageSliderProps) {
  const { t } = useLanguage();
  const [images, setImages] = useState<Media[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSliderImages();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || images.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, images.length]);

  const loadSliderImages = async () => {
    try {
      // First try to load admin-curated featured images
      console.log('ImageSlider: Loading featured images by media_id...');
      const { data: featuredData, error: featuredError } = await supabase
        .from('slider_featured')
        .select('media_id, display_order')
        .order('display_order', { ascending: true });

      if (!featuredError && featuredData && featuredData.length > 0) {
        console.log('ImageSlider: Found featured media_ids:', featuredData.map(f => f.media_id));
        
        // Get the actual media records using media_id
        const mediaIds = featuredData.map(item => item.media_id);
        const { data: mediaData, error: mediaError } = await supabase
          .from('media')
          .select('*')
          .in('media_id', mediaIds)
          .like('file_type', 'image%');
          
        if (!mediaError && mediaData) {
          // Sort media according to display_order from featured table
          const sortedMedia = featuredData
            .map(featured => mediaData.find(media => media.media_id === featured.media_id))
            .filter(media => media !== undefined) as Media[];
          
          console.log('ImageSlider: Using admin-curated images:', sortedMedia.length);
          setImages(sortedMedia);
        } else {
          console.log('ImageSlider: Error loading featured media:', mediaError);
          throw new Error('Featured media not found');
        }
      } else {
        // Fallback to latest images if no featured images or error
        console.log('No featured images found, using latest images as fallback');
        const { data: latestData, error: latestError } = await supabase
          .from('media')
          .select('*')
          .like('file_type', 'image%')
          .order('upload_date', { ascending: false })
          .limit(6); // Get latest 6 images as fallback

        if (latestError) throw latestError;

        if (latestData && latestData.length > 0) {
          setImages(latestData);
        }
      }
    } catch (error) {
      console.error('Error loading slider images:', error);
      // Final fallback - empty array
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg dark:backdrop-blur-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="bg-gray-300 dark:bg-gray-700 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg dark:backdrop-blur-sm p-6 ${className}`}>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No images available for slideshow</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const imageUrl = supabase.storage.from('media').getPublicUrl(currentImage.file_path).data.publicUrl;

  return (
    <div className={`bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg dark:shadow-cyan-500/10 overflow-hidden w-full ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('slider.featured')}</h3>
        <button
          onClick={toggleAutoPlay}
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {isAutoPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Play</span>
            </>
          )}
        </button>
      </div>

      {/* Slider */}
      <div className="relative">
        {/* Main Image - Full Size */}
        <div className="relative h-96 sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
          <img
            src={imageUrl}
            alt={currentImage.title}
            className="w-full h-full object-contain bg-gray-100 dark:bg-gray-900 transition-all duration-500"
          />
          
          {/* Overlay with image info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h4 className="text-white font-semibold text-lg mb-1">{currentImage.title}</h4>
            {currentImage.description && (
              <p className="text-white/80 text-sm line-clamp-2">{currentImage.description}</p>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white scale-125'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        )}

        {/* Image Counter */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => goToSlide(index)}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <img
                  src={supabase.storage.from('media').getPublicUrl(image.file_path).data.publicUrl}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}