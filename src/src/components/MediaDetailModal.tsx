import React, { useState } from 'react';
import { X, Calendar, User, HardDrive, Image as ImageIcon, Video, Download, Copy, Maximize, Minimize, Share2, ChevronDown, ChevronRight, Pencil } from 'lucide-react';
import CommentsLikes from './CommentsLikes';
import ShareModal from './ShareModal';
import { Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { deleteMedia } from '../lib/uploadService';
import { formatFileSize, isVideoFile } from '../lib/fileUtils';
import { getMediaUrl } from '../lib/uploadService';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface MediaDetailModalProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function MediaDetailModal({ media, isOpen, onClose }: MediaDetailModalProps) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showUploadInfo, setShowUploadInfo] = useState(false);

 // Inline editable title component for owner/admin
 const EditableTitle: React.FC<{ media: Media; canEdit: boolean }> = ({ media, canEdit }) => {
   const [editing, setEditing] = useState(false);
   const [value, setValue] = useState(media.title);
   const [saving, setSaving] = useState(false);

   const saveTitle = async () => {
     if (!canEdit) return setEditing(false);
     const newTitle = value.trim();
     if (!newTitle || newTitle === media.title) {
       setEditing(false);
       return;
     }
     try {
       setSaving(true);
       const { error } = await supabase
         .from('media')
         .update({ title: newTitle })
         .eq('id', media.id);
       if (error) throw error;
     } catch (e) {
       console.error('Rename failed:', e);
       alert('Failed to rename media.');
     } finally {
       setSaving(false);
       setEditing(false);
     }
   };

   if (!canEdit) {
     return <h2 className="text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">{media.title}</h2>;
   }

   return (
     <div className="flex items-center gap-2">
       {editing ? (
         <>
           <input
             id="editable-title-input"
             value={value}
             onChange={(e) => setValue(e.target.value)}
             className="text-xl font-bold bg-black border-b border-white focus:outline-none text-white placeholder-white/70 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
             autoFocus
             onKeyDown={(e) => {
               if (e.key === 'Enter') saveTitle();
               if (e.key === 'Escape') setEditing(false);
             }}
             onBlur={saveTitle}
           />
           {saving && <span className="text-sm text-gray-500">Saving...</span>}
         </>
       ) : (
         <button
           className="text-left text-xl font-bold text-white hover:underline drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]"
           onClick={() => setEditing(true)}
           title="Click to rename"
         >
           {media.title}
         </button>
       )}
     </div>
   );
 };

 
  if (!isOpen || !media) return null;

  const mediaUrl = getMediaUrl(media.file_path, media.storage_provider);
  const thumbnailUrl = media.thumbnail_path ? getMediaUrl(media.thumbnail_path, media.storage_provider) : mediaUrl;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Simple feedback - you could replace with toast notification
    const button = document.activeElement as HTMLButtonElement;
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }
  };

  const downloadMedia = () => {
    const link = document.createElement('a');
    link.href = mediaUrl;
    link.download = media.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleCloseModal = () => {
    setIsFullScreen(false);
    onClose();
  };

  // Full-screen image view
  if (isFullScreen && !isVideoFile(media.file_type)) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <img
          src={mediaUrl}
          alt={media.title}
          className="max-w-full max-h-full object-contain"
        />
        
        {/* Full-screen controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={toggleFullScreen}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
            title="Exit Full Screen"
          >
            <Minimize className="w-6 h-6" />
          </button>
          <button
            onClick={handleCloseModal}
            className="p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all backdrop-blur-sm"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Full-screen info overlay */}
        <div className="absolute bottom-4 left-4 bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold">{media.title}</h3>
          <p className="text-sm opacity-80">
            🆔 ID: {media.media_id} | 📐 {media.width}×{media.height} | 📦 {formatFileSize(media.file_size)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-black rounded-xl sm:rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.6)] w-full max-w-6xl h-[95vh] sm:h-[90vh] overflow-hidden flex flex-col border border-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-white flex-shrink-0 bg-black">
          <div className="flex items-center gap-3 text-white">
            {isVideoFile(media.file_type) ? (
              <Video className="w-6 h-6 text-red-500" />
            ) : (
              <ImageIcon className="w-6 h-6 text-blue-500" />
            )}
            <div>
              <EditableTitle media={media} canEdit={!!user && (profile?.is_admin || user.id === media.user_id)} />
              <p className="text-sm text-gray-500 dark:text-gray-400">Media Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Owner/Admin actions in modal header */}
            {user && (profile?.is_admin || user.id === media.user_id) && (
              <>
                <button
                  onClick={() => {
                    const el = document.getElementById('editable-title-input');
                    if (el) (el as HTMLInputElement).focus();
                  }}
                  className="flex items-center gap-1 px-3 py-2 border border-white text-white rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)] transition"
                  title="Rename"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="text-sm">Rename</span>
                </button>

                <button
                  onClick={async () => {
                    if (!confirm('Delete this media? This cannot be undone.')) return;
                    const success = await deleteMedia(media.id, media.file_path, media.thumbnail_path, media.storage_provider);
                    if (success) {
                      alert('Media deleted.');
                      onClose();
                    } else {
                      alert('Failed to delete media.');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 border border-white text-white rounded-lg shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)] transition"
                  title="Delete"
                >
                  <X className="w-5 h-5 text-red-600" />
                </button>
              </>
            )}
            {!isVideoFile(media.file_type) && (
              <button
                onClick={toggleFullScreen}
                className="p-2 rounded-lg transition border border-white text-white hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
                title="View Full Screen"
              >
                <Maximize className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <button
              onClick={handleCloseModal}
              className="p-2 rounded-lg transition border border-white text-white hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Media Preview */}
          <div className="lg:w-1/2 bg-black flex items-center justify-center p-3 sm:p-6">
            {isVideoFile(media.file_type) ? (
              <video
                src={mediaUrl}
                controls
                className="max-w-full max-h-32 sm:max-h-96 rounded-lg shadow-lg"
                poster={thumbnailUrl}
              />
            ) : (
              <img
                src={mediaUrl}
                alt={media.title}
                className="max-w-full max-h-32 sm:max-h-96 rounded-lg shadow-lg object-contain"
              />
            )}
          </div>

          {/* Details Panel */}
          <div className="lg:w-1/2 p-3 sm:p-6 flex-1 overflow-y-auto">
            <div className="space-y-3 sm:space-y-6">
              {/* Media Information - Collapsible */}
              <div>
                <button
                  onClick={() => setShowBasicInfo(!showBasicInfo)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    📋 {t('modal.mediaInformation')}
                  </h3>
                  {showBasicInfo ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {showBasicInfo && (
                  <div className="mt-3 space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('modal.title')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white" title={media.title}>
                          {media.title.length > 20 ? `${media.title.substring(0, 20)}...` : media.title}
                        </p>
                      </div>
                      {media.description && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">{t('modal.description')}:</span>
                          <p className="font-medium text-gray-900 dark:text-white">{media.description}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Media Identification */}
                    <div className="border-t pt-4">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        🆔 {t('modal.identification')}
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t('modal.mediaId')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                              {media.media_id || 'No ID'}
                            </span>
                            {media.media_id && (
                              <button
                                onClick={() => copyToClipboard(media.media_id!, 'Media ID')}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                                title={t('modal.copyMediaId')}
                              >
                                <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{t('modal.databaseId')}:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                              {media.id}
                            </span>
                            <button
                              onClick={() => copyToClipboard(media.id, 'Database ID')}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
                              title={t('modal.copyDatabaseId')}
                            >
                              <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Upload Information - Collapsible */}
              <div>
                <button
                  onClick={() => setShowUploadInfo(!showUploadInfo)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    📅 {t('modal.uploadInformation')}
                  </h3>
                  {showUploadInfo ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                
                {showUploadInfo && (
                  <div className="mt-3 grid grid-cols-1 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('modal.uploadDate')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(media.upload_date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">{t('modal.uploadedBy')}:</span>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {media.profiles?.full_name || media.profiles?.email || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>


              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={downloadMedia}
                    className="flex items-center gap-2 px-4 py-2 border border-white text-white rounded-lg transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
                  >
                    <Download className="w-4 h-4" />
                    {t('modal.downloadOriginal')}
                  </button>
                  <button
                    onClick={() => setShareModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-white text-white rounded-lg transition shadow-[0_0_10px_rgba(255,255,255,0.8)] hover:shadow-[0_0_16px_rgba(255,255,255,1)]"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('modal.share')}
                  </button>
                </div>
              </div>

              {/* Comments and Likes Section */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <CommentsLikes media={media} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        media={media}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}