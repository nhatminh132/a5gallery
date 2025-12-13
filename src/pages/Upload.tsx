import { useState, useRef } from 'react';
import { ArrowLeft, Upload as UploadIcon, Image, Video, CheckCircle2, X, Loader2 } from 'lucide-react';
import { uploadMedia, UploadProgress } from '../lib/uploadService';
import { formatFileSize, isImageFile, getMaxFileSize, isAllowedFileType } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
// import UploadLimitDisplay from '../components/UploadLimitDisplay';
import BulkUpload from '../components/BulkUpload';
import { supabase } from '../lib/supabase';

interface UploadProps {
  onNavigate: (page: string) => void;
  onUploadComplete?: () => void;
}

export default function Upload({ onNavigate, onUploadComplete }: UploadProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Note: Duplicate filename checking removed - now using unique media IDs
  // Each uploaded file gets a unique 10-20 digit ID, eliminating duplication issues

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    if (!isAllowedFileType(selectedFile.type)) {
      setError('Unsupported file type. Please select a JPEG, PNG, GIF, WebP image or MP4, WebM, MOV video.');
      return;
    }

    // Validate file size based on type
    const maxSize = getMaxFileSize(selectedFile.type);
    if (selectedFile.size > maxSize) {
      const fileTypeLabel = isImageFile(selectedFile.type) ? 'image' : 'video';
      setError(`${fileTypeLabel.charAt(0).toUpperCase() + fileTypeLabel.slice(1)} size exceeds ${formatFileSize(maxSize)} limit. Please choose a smaller file.`);
      return;
    }

    setFile(selectedFile);
    setTitle(selectedFile.name.split('.')[0]);
    setError(null);
    setUploadSuccess(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!file || !user || !title.trim()) return;

    try {
      setUploading(true);
      setError(null);

      // Unique media ID system eliminates duplication issues
      console.log('Upload: Proceeding with unique media ID system - no duplicates possible');

      await uploadMedia(
        file,
        title.trim(),
        description.trim(),
        user.id,
        setUploadProgress
      );

      setUploadSuccess(true);
      setTimeout(() => {
        onUploadComplete?.();
        onNavigate('home');
      }, 2000);
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const [showBulk, setShowBulk] = useState(false);

  const resetUpload = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setError(null);
    setUploadProgress(null);
    setUploadSuccess(false);
  };

  const getProgressText = () => {
    if (!uploadProgress) return '';
    switch (uploadProgress.stage) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing media...';
      case 'saving':
        return 'Saving to database...';
      case 'complete':
        return 'Upload complete!';
      default:
        return 'Preparing...';
    }
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
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
              <span className="hidden sm:inline">Back to Gallery</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-black border border-white rounded-lg shadow-[0_0_12px_rgba(255,255,255,0.9)] neon-white">
                <UploadIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('upload.title')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('upload.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Upload Limit Display removed per request */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg overflow-hidden dark:backdrop-blur-sm">
          <div className="p-8">
            {uploadSuccess ? (
              /* Success State */
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Your media has been uploaded and is now available in your gallery.</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={resetUpload}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={() => onNavigate('home')}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium"
                  >
                    View Gallery
                  </button>
                </div>
              </div>
            ) : !file ? (
              /* File Selection */
              <div className="space-y-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => setShowBulk(true)}
                  className="border-2 border-white rounded-xl p-16 text-center bg-black text-white shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.9)] transition-all cursor-pointer group"
                >
                  <UploadIcon className="w-20 h-20 text-white mx-auto mb-6 transition-colors" />
                  <h3 className="text-xl font-semibold text-white mb-3 transition-colors">
                    {t('upload.dragDrop')}
                  </h3>
                  <p className="text-white/80 mb-4">
                    {t('upload.subtitle')}
                  </p>
                  <div className="text-sm text-white/80 space-y-1">
                    <p>{t('upload.supportedFormats')}</p>
                    <p><strong>Videos:</strong> MP4, WebM, MOV (max 1GB)</p>
                  </div>
                </div>

                {/* Hidden input no longer used; bulk modal handles selection */}
              </div>
            ) : (
              /* Upload Form */
              <div className="space-y-6">
                {/* Selected File */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 flex items-center gap-4">
                  {isImageFile(file.type) ? (
                    <Image className="w-12 h-12 text-green-600 dark:text-green-400 flex-shrink-0" />
                  ) : (
                    <Video className="w-12 h-12 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate text-lg">{file.name}</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={resetUpload}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Title *
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="Enter a title for your media"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={uploading}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="Add a description (optional)"
                    />
                  </div>
                </div>

                {/* Progress */}
                {uploadProgress && (
                  <div className="space-y-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {getProgressText()}
                      </span>
                      <span className="text-primary-600 dark:text-primary-400 font-medium">{uploadProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary-600 dark:bg-primary-500 h-3 transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={resetUpload}
                    disabled={uploading}
                    className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !title.trim()}
                    className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-5 h-5 text-white" />
                        Upload Media
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bulk Upload Modal */}
      <BulkUpload
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onComplete={() => {
          setShowBulk(false);
          onNavigate('home');
        }}
      />
    </div>
  );
}