import { useState, useRef } from 'react';
import { X, Upload, Loader2, CheckCircle2, Image, Video } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { uploadMedia, UploadProgress } from '../lib/uploadService';
import { isAllowedFileType, formatFileSize, getMaxFileSize, isImageFile } from '../lib/fileUtils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export default function UploadModal({ isOpen, onClose, onUploadComplete }: UploadModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [fileDetails, setFileDetails] = useState<{[key: string]: {title: string, description: string}}>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validFiles: File[] = [];
    let hasError = false;

    for (const selectedFile of selectedFiles) {
      if (!isAllowedFileType(selectedFile.type)) {
        setError(`Invalid file type for ${selectedFile.name}. Please upload only image or video files.`);
        hasError = true;
        break;
      }

      const maxSize = getMaxFileSize(selectedFile.type);
      if (selectedFile.size > maxSize) {
        const fileTypeLabel = isImageFile(selectedFile.type) ? 'image' : 'video';
        setError(`${selectedFile.name} exceeds ${formatFileSize(maxSize)} ${fileTypeLabel} limit. Please choose smaller files.`);
        hasError = true;
        break;
      }

      validFiles.push(selectedFile);
    }

    if (!hasError) {
      setFiles(validFiles);
      setCurrentFileIndex(0);
      setUploadedCount(0);
      
      // Initialize file details for each file
      const newFileDetails: {[key: string]: {title: string, description: string}} = {};
      validFiles.forEach(file => {
        newFileDetails[file.name] = {
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: ''
        };
      });
      setFileDetails(newFileDetails);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !user) return;

    setUploading(true);
    setError(null);

    setUploadedCount(0);

    try {
      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        const file = files[i];
        const details = fileDetails[file.name];

        if (!details.title.trim()) {
          setError(`Please provide a title for ${file.name}`);
          return;
        }

        const result = await uploadMedia(
          file,
          details.title.trim(),
          details.description.trim(),
          user.id,
          setUploadProgress
        );

        if (!result.success) {
          setError(result.error || 'Upload failed');
          return;
        }

        setUploadedCount(i + 1);
      }

      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Upload failed. Please try again.');
    }

    setUploading(false);
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setFileDetails({});
      setCurrentFileIndex(0);
      setUploadedCount(0);
      setError(null);
      setUploadProgress(null);
      onClose();
    }
  };

  const getProgressText = () => {
    if (!uploadProgress) return '';
    switch (uploadProgress.stage) {
      case 'compressing':
        return 'Compressing...';
      case 'uploading':
        return 'Uploading...';
      case 'saving':
        return 'Saving...';
      case 'complete':
        return 'Complete!';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Media</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {files.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
            >
              <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('upload.dragDrop')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('upload.supportedFormats')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                onChange={handleFileSelect}
                multiple
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file, index) => (
                <div key={file.name} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 flex items-center gap-4">
                  {isImageFile(file.type) ? (
                    <Image className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  ) : (
                    <Video className="w-10 h-10 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                  {!uploading && (
                    <button
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== index);
                        setFiles(newFiles);
                        if (newFiles.length === 0) {
                          setFileDetails({});
                        }
                      }}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              {files.map((file, index) => (
                <div key={file.name} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">File {index + 1}: {file.name}</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={fileDetails[file.name]?.title || ''}
                      onChange={(e) => setFileDetails(prev => ({
                        ...prev,
                        [file.name]: { ...prev[file.name], title: e.target.value }
                      }))}
                      disabled={uploading}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="Enter a title for your media"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={fileDetails[file.name]?.description || ''}
                      onChange={(e) => setFileDetails(prev => ({
                        ...prev,
                        [file.name]: { ...prev[file.name], description: e.target.value }
                      }))}
                      disabled={uploading}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                      placeholder="Add a description (optional)"
                    />
                  </div>
                </div>
              ))}

              {uploadProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{getProgressText()}</span>
                    <span className="text-gray-500 dark:text-gray-400">{uploadProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {uploadProgress?.stage === 'complete' && (
                <div className="bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Upload successful!
                </div>
              )}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4">
            {uploading && uploadedCount > 0 && (
              <div className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
                Uploaded {uploadedCount} of {files.length} files
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={uploading}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || files.some(file => !fileDetails[file.name]?.title?.trim())}
                className="flex-1 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading {currentFileIndex + 1}/{files.length}...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload {files.length} File{files.length > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
