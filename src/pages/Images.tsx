import { useState } from 'react';
import { Image, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import MediaGrid from '../components/MediaGrid';
import SearchFiltersSimple from '../components/SearchFiltersSimple';
import MediaDetailModal from '../components/MediaDetailModal';
import { Media } from '../lib/supabase';

interface ImagesProps {
  onMediaSelect: (media: Media) => void;
  onNavigate: (page: string) => void;
}

export default function Images({ onMediaSelect, onNavigate }: ImagesProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleMediaClick = (media: Media) => {
    setSelectedMedia(media);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Particle Background - only in dark mode */}
      <div className="particles-bg absolute inset-0 z-0 hidden dark:block"></div>
      
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              <span className="hidden sm:inline">{t('images.backToGallery')}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-black border border-white rounded-lg shadow-[0_0_12px_rgba(255,255,255,0.9)] neon-white">
                <Image className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('images.title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('images.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="space-y-6">
          {/* Search */}
          <SearchFiltersSimple
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Images Grid */}
          <MediaGrid
            searchQuery={searchQuery}
            filterType="images"
            onMediaClick={handleMediaClick}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </main>

      {/* Detail Modal */}
      <MediaDetailModal
        media={selectedMedia}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}