import { useState } from 'react';
import { Image, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import MediaGrid from '../components/MediaGrid';
import SearchFiltersSimple from '../components/SearchFiltersSimple';
import MediaDetailModal from '../components/MediaDetailModal';
import { Media as DbMedia } from '../lib/supabase';

interface ImagesProps {
    onMediaSelect: (media: DbMedia) => void;
    onNavigate: (page: string) => void;
}

export default function Images({ onMediaSelect, onNavigate }: ImagesProps) {
    const { t } = useLanguage();

    const [searchQuery, setSearchQuery] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [selectedMedia, setSelectedMedia] = useState<DbMedia | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);


    const handleMediaClick = (media: DbMedia) => {
        setSelectedMedia(media);
        setShowDetailModal(true);
    };


    // =========================
    // UI
    // =========================
    return (
        <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
            {/* Header */}
            <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 shadow-sm relative z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate('home')}
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>{t('images.backToGallery')}</span>
                        </button>

                        <div className="flex items-center gap-3 flex-1">
                            <Image className="w-6 h-6 text-white" />
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('images.title')}
                            </h1>

                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <SearchFiltersSimple
                    searchQuery={searchQuery}
                    onSearchChange={(q) => {
                        setSearchQuery(q);
                    }}
                />

                <MediaGrid
                    searchQuery={searchQuery}
                    filterType="images"
                    onMediaClick={handleMediaClick}
                    refreshTrigger={refreshTrigger}
                />
            </main>

            {/* Detail modal */}
            <MediaDetailModal
                media={selectedMedia}
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
            />

        </div>
    );
}
