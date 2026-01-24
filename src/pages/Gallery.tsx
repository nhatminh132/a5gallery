import { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileType,
  HardDrive,
  Maximize2,
  Download,
  Loader2,
} from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { getMediaUrl } from '../lib/uploadService';
import { isVideoFile, formatFileSize } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';

interface GalleryProps {
  initialMedia: Media;
  onClose: () => void;
}

export default function Gallery({ initialMedia, onClose }: GalleryProps) {
  const { profile } = useAuth();
  const [currentMedia, setCurrentMedia] = useState<Media>(initialMedia);
  const [allMedia, setAllMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    loadAllMedia();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        navigatePrevious();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, allMedia]);

  const loadAllMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setAllMedia(data);
        const index = data.findIndex((m) => m.id === initialMedia.id);
        setCurrentIndex(index);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentMedia(allMedia[newIndex]);
    }
  };

  const navigateNext = () => {
    if (currentIndex < allMedia.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentMedia(allMedia[newIndex]);
    }
  };

  const handleDownload = async () => {
    const url = getMediaUrl(currentMedia.file_path, currentMedia.storage_provider);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentMedia.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mediaUrl = getMediaUrl(currentMedia.file_path, currentMedia.storage_provider);
  const isVideo = isVideoFile(currentMedia.file_type);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-white">
            <h2 className="text-lg font-semibold truncate max-w-md">{currentMedia.title}</h2>
            <p className="text-sm text-gray-400">
              {currentIndex + 1} of {allMedia.length}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-5 h-5" />
          <span className="hidden sm:inline">Download</span>
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {loading ? (
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        ) : (
          <>
            <button
              onClick={navigatePrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="max-w-7xl max-h-full flex items-center justify-center p-4">
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[calc(100vh-200px)] rounded-lg shadow-2xl"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={mediaUrl}
                  alt={currentMedia.title}
                  className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl"
                />
              )}
            </div>

            <button
              onClick={navigateNext}
              disabled={currentIndex === allMedia.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      <div className="bg-black/50 backdrop-blur-sm border-t border-white/10 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 rounded-xl p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">{currentMedia.title}</h3>
              {currentMedia.description && (
                <p className="text-gray-300 leading-relaxed">{currentMedia.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 text-gray-300">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Uploaded</p>
                  <p className="text-sm font-medium">
                    {new Date(currentMedia.upload_date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <HardDrive className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Size</p>
                  <p className="text-sm font-medium">{formatFileSize(currentMedia.file_size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-300">
                <FileType className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium uppercase">
                    {currentMedia.file_type.split('/')[1]}
                  </p>
                </div>
              </div>

              {currentMedia.width && currentMedia.height && (
                <div className="flex items-center gap-3 text-gray-300">
                  <Maximize2 className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Dimensions</p>
                    <p className="text-sm font-medium">
                      {currentMedia.width} × {currentMedia.height}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
