import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Trash2, Plus, FolderOpen, Sparkles } from 'lucide-react';
import { uploadMedia, UploadProgress } from '../lib/uploadService';
import { isImageSafe } from '../lib/nsfwDetector';
import { formatFileSize, isAllowedFileType, isImageFile } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeUserText } from '../lib/textSafety';
import { computeAHashHex } from '../lib/imageHash';

interface FileWithMetadata {
  file: File;
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

interface BulkUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function BulkUpload({ isOpen, onClose, onComplete }: BulkUploadProps) {
  async function suggestCaptionFromFile(file: File): Promise<string> {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('failed_to_load_image'));
        i.src = url;
      });

      const maxSide = 256;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'Photo';
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      let sumBrightness = 0;
      const buckets: Record<string, number> = {};
      for (let y = 0; y < h; y += 2) {
        for (let x = 0; x < w; x += 2) {
          const i = (y * w + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sumBrightness += brightness;
          const key = `${Math.round(r/32)}-${Math.round(g/32)}-${Math.round(b/32)}`;
          buckets[key] = (buckets[key] || 0) + 1;
        }
      }
      const pixels = Math.ceil((w/2) * (h/2));
      const avgBrightness = pixels > 0 ? sumBrightness / pixels : 128;

      const [topColorKey] = Object.entries(buckets).sort((a,b) => b[1]-a[1])[0] || ['0-0-0', 0];
      const [rBucket, gBucket, bBucket] = topColorKey.split('-').map(n => parseInt(n, 10));
      const domColor = { r: rBucket*32, g: gBucket*32, b: bBucket*32 };

      const orientation = w >= h ? 'landscape' : 'portrait';
      const brightnessLabel = avgBrightness > 170 ? 'bright' : avgBrightness < 85 ? 'dim' : 'evenly lit';

      const colorName = (() => {
        const { r, g, b } = domColor;
        if (r > 180 && g < 100 && b < 100) return 'reddish';
        if (g > 180 && r < 120 && b < 120) return 'greenish';
        if (b > 180 && r < 120 && g < 120) return 'bluish';
        if (r > 200 && g > 200 && b > 200) return 'mostly white';
        if (r < 60 && g < 60 && b < 60) return 'dark toned';
        if (r > 180 && g > 180 && b < 120) return 'yellowish';
        if (r > 160 && b > 160 && g < 120) return 'magenta/pinkish';
        if (g > 160 && b > 160 && r < 120) return 'cyan/teal';
        return 'colorful';
      })();

      return `${brightnessLabel} ${orientation} photo, dominant ${colorName} tones`;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const { user } = useAuth();
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const aiSuggestionsRef = useRef<string[]>([]);
  const aiWarningsRef = useRef<string[]>([]);
  const dupWarningsRef = useRef<string[]>([]);
  const batchHashesRef = useRef<string[]>([]);

  const generateId = () => Math.random().toString(36).substring(2);

  const handleFilesDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (!isAllowedFileType(file.type)) {
        alert(`File type ${file.type} is not supported for ${file.name}`);
        return false;
      }
      return true;
    });

    const filesWithMetadata: FileWithMetadata[] = validFiles.map(file => ({
      file,
      id: generateId(),
      title: file.name.split('.')[0],
      description: '',
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...filesWithMetadata]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const updateFileMetadata = (id: string, field: 'title' | 'description', value: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, [field]: value } : file
    ));
  };

  const startBulkUpload = async () => {
    if (!user || files.length === 0) return;

    setIsUploading(true);
    setUploadedCount(0);

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      
      if (fileData.status === 'success') continue;

      // Update status to uploading
      setFiles(prev => prev.map(file => 
        file.id === fileData.id 
          ? { ...file, status: 'uploading', progress: 0 }
          : file
      ));

      try {
        // Client-side NSFW check for images
        if (isImageFile(fileData.file.type)) {
          const safe = await isImageSafe(fileData.file);
          if (!safe) {
            // mark as error and skip upload
            setFiles(prev => prev.map(file => 
              file.id === fileData.id 
                ? { ...file, status: 'error', error: 'Blocked by NSFW detector', progress: 0 }
                : file
            ));
            continue;
          }
        }

        // Local text safety check
        const titleStr = fileData.title.trim() || fileData.file.name.split('.')[0];
        const titleSafety = await sanitizeUserText(titleStr);
        if (!titleSafety.safe) {
          setFiles(prev => prev.map(file => 
            file.id === fileData.id 
              ? { ...file, status: 'error', error: 'Title contains inappropriate language', progress: 0 }
              : file
          ));
          continue;
        }
        if (fileData.description.trim()) {
          const descSafety = await sanitizeUserText(fileData.description.trim());
          if (!descSafety.safe) {
            setFiles(prev => prev.map(file => 
              file.id === fileData.id 
                ? { ...file, status: 'error', error: 'Description contains inappropriate language', progress: 0 }
                : file
            ));
            continue;
          }
        }

        // Local fallback checks
        const titleCheck = await sanitizeUserText(fileData.title.trim() || fileData.file.name.split('.')[0]);
        if (!titleCheck.safe) {
          setFiles(prev => prev.map(file => 
            file.id === fileData.id 
              ? { ...file, status: 'error', error: 'Title contains inappropriate language', progress: 0 }
              : file
          ));
          continue;
        }
        const descCheck = await sanitizeUserText(fileData.description.trim());
        if (!descCheck.safe) {
          setFiles(prev => prev.map(file => 
            file.id === fileData.id 
              ? { ...file, status: 'error', error: 'Description contains inappropriate language', progress: 0 }
              : file
          ));
          continue;
        }

        // Dedupe warning for images within this bulk batch
        let newHash: string | undefined;
        if (isImageFile(fileData.file.type)) {
          try {
            newHash = await computeAHashHex(fileData.file);
            // Duplicate detection removed - was using external AI service
          } catch (e) {
            console.warn('Bulk image hash failed', e);
          }
        }

        await uploadMedia(
          fileData.file,
          fileData.title.trim() || fileData.file.name.split('.')[0],
          descCheck.filteredText,
          user.id,
          (progress: UploadProgress) => {
            setFiles(prev => prev.map(file => 
              file.id === fileData.id 
                ? { ...file, progress: progress.progress }
                : file
            ));
          }
        );

        // Track batch hash after success
        if (newHash) batchHashesRef.current.push(newHash);

        // Recommendations (non-intrusive)
        try {
          const rec = await recommend({
            caption: [fileData.title?.trim(), fileData.description?.trim()].filter(Boolean).join(' - '),
            newHash,
            existingHashes: batchHashesRef.current,
          });
          if (rec.suggestions?.length) aiSuggestionsRef.current.push(...rec.suggestions);
          if (rec.warnings?.length) aiWarningsRef.current.push(...rec.warnings);
        } catch (e) {
          console.info('Bulk recommend unavailable', e);
        }

        // Update status to success
        setFiles(prev => prev.map(file => 
          file.id === fileData.id 
            ? { ...file, status: 'success', progress: 100 }
            : file
        ));

        setUploadedCount(prev => prev + 1);
      } catch (error) {
        // Update status to error
        setFiles(prev => prev.map(file => 
          file.id === fileData.id 
            ? { 
                ...file, 
                status: 'error', 
                progress: 0,
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : file
        ));
      }
    }

    setIsUploading(false);
  };

  const retryFailedUploads = () => {
    setFiles(prev => prev.map(file => 
      file.status === 'error' 
        ? { ...file, status: 'pending', progress: 0, error: undefined }
        : file
    ));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(file => file.status !== 'success'));
  };

  const handleComplete = () => {
    onComplete();
    onClose();
    setFiles([]);
    setUploadedCount(0);
  };

  if (!isOpen) return null;

  const pendingFiles = files.filter(f => f.status === 'pending');
  const successFiles = files.filter(f => f.status === 'success');
  const errorFiles = files.filter(f => f.status === 'error');
  const totalProgress = files.length > 0 
    ? Math.round(files.reduce((sum, file) => sum + file.progress, 0) / files.length)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col neon-white bulk-upload">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black border border-white rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white neon-white">Bulk Upload</h2>
              <p className="text-sm text-white/70">
                {files.length} files • {successFiles.length} completed • {errorFiles.length} failed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        {files.length > 0 && (
          <div className="px-6 py-4 border-b border-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                Overall Progress
              </span>
              <span className="text-sm text-white/70">
                {totalProgress}%
              </span>
            </div>
            <div className="w-full bg-black border border-white rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Drop Zone */}
        {files.length === 0 && (
          <div
            onDrop={handleFilesDrop}
            onDragOver={(e) => e.preventDefault()}
            className="m-6 border-2 border-dashed border-white rounded-xl p-12 text-center hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-all group cursor-pointer bg-black text-white"
            onClick={() => document.getElementById('bulk-file-input')?.click()}
          >
            <FolderOpen className="w-16 h-16 text-white mx-auto mb-4 transition-colors" />
            <h3 className="text-lg font-medium text-white neon-white mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-white/70 mb-4">
              Select multiple images and videos to upload at once
            </p>
            <div className="text-sm text-white/60">
              Supported formats: JPEG, PNG, GIF, MP4, MOV, AVI
            </div>
            <input
              id="bulk-file-input"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFilesSelect}
              className="hidden"
            />
          </div>
        )}

        {/* Files List */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto p-6">
            {(aiSuggestionsRef.current.length > 0 || aiWarningsRef.current.length > 0 || dupWarningsRef.current.length > 0) && (
              <div className="mb-4 p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-sm text-blue-800 dark:text-blue-200">
                {dupWarningsRef.current.length > 0 && (
                  <div className="mb-1">
                    <strong>Duplicate check:</strong>
                    <ul className="list-disc list-inside">
                      {dupWarningsRef.current.map((w, i) => (<li key={`dup-b-${i}`}>{w}</li>))}
                    </ul>
                  </div>
                )}
                {aiWarningsRef.current.length > 0 && (
                  <div className="mb-1">
                    <strong>Warnings:</strong>
                    <ul className="list-disc list-inside">
                      {aiWarningsRef.current.map((w, i) => (<li key={`warn-b-${i}`}>{w}</li>))}
                    </ul>
                  </div>
                )}
                {aiSuggestionsRef.current.length > 0 && (
                  <div>
                    <strong>Suggestions:</strong>
                    <ul className="list-disc list-inside">
                      {aiSuggestionsRef.current.map((s, i) => (<li key={`sug-b-${i}`}>{s}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-4">
              {files.map((fileData) => (
                <div 
                  key={fileData.id}
                  className="bg-black border border-white rounded-lg p-4 space-y-3 neon-white"
                >
                  <div className="flex items-start gap-3">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {fileData.status === 'success' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {fileData.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      {(fileData.status === 'pending' || fileData.status === 'uploading') && (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-white truncate neon-white">
                          {fileData.file.name}
                        </h4>
                        <span className="text-xs text-white/70">
                          {formatFileSize(fileData.file.size)}
                        </span>
                        <button
                          onClick={() => removeFile(fileData.id)}
                          disabled={fileData.status === 'uploading'}
                          className="p-1 bg-black border border-white rounded text-white disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>

                      {/* Progress Bar */}
                      {fileData.status === 'uploading' && (
                        <div className="mb-2">
                          <div className="w-full bg-black border border-white rounded-full h-1.5">
                            <div 
                              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${fileData.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {fileData.status === 'error' && fileData.error && (
                        <p className="text-sm text-red-400 mb-2">
                          {fileData.error}
                        </p>
                      )}

                      {/* Metadata Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Title"
                          value={fileData.title}
                          onChange={(e) => updateFileMetadata(fileData.id, 'title', e.target.value)}
                          disabled={fileData.status === 'uploading'}
                          className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                        />
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={fileData.description}
                            onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                            disabled={fileData.status === 'uploading'}
                            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 w-full"
                          />
                          {isImageFile(fileData.file.type) && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const suggestion = await suggestCaptionFromFile(fileData.file);
                                    let i = 0;
                                    const timer = setInterval(() => {
                                      i++;
                                      updateFileMetadata(fileData.id, 'description', suggestion.slice(0, i));
                                      if (i >= suggestion.length) clearInterval(timer);
                                    }, 25);
                                  } catch (e) {
                                    console.error(e);
                                    alert('Failed to generate a suggestion.');
                                  }
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                title="Suggest caption (on-device)"
                              >
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                Suggest caption
                              </button>
                              <span className="text-[11px] text-gray-500">Runs in your browser • Not auto-saved</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Files */}
            <button
              onClick={() => document.getElementById('bulk-file-input')?.click()}
              disabled={isUploading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add More Files
            </button>
          </div>
        )}

        {/* Footer Actions */}
        {files.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {errorFiles.length > 0 && (
                <button
                  onClick={retryFailedUploads}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3 py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Retry Failed ({errorFiles.length})
                </button>
              )}
              
              {successFiles.length > 0 && (
                <button
                  onClick={clearCompleted}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Clear Completed ({successFiles.length})
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {successFiles.length === files.length && files.length > 0 && (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Complete ({successFiles.length})
                </button>
              )}
              
              <button
                onClick={startBulkUpload}
                disabled={isUploading || pendingFiles.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-black border border-white text-white neon-white border-glow rounded-lg transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.8)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : `Upload ${pendingFiles.length} Files`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}