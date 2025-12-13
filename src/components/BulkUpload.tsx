import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Trash2, Plus, FolderOpen } from 'lucide-react';
import { uploadMedia, UploadProgress } from '../lib/uploadService';
import { formatFileSize, isAllowedFileType } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

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
        await uploadMedia(
          fileData.file,
          fileData.title.trim() || fileData.file.name.split('.')[0],
          fileData.description.trim(),
          user.id,
          (progress: UploadProgress) => {
            setFiles(prev => prev.map(file => 
              file.id === fileData.id 
                ? { ...file, progress: progress.progress }
                : file
            ));
          }
        );

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
      <div className="bg-black border border-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col neon-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black border border-white rounded-lg flex items-center justify-center">
              <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
                          className="p-1 hover:bg-white/10 border border-white rounded disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
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
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={fileData.description}
                          onChange={(e) => updateFileMetadata(fileData.id, 'description', e.target.value)}
                          disabled={fileData.status === 'uploading'}
                          className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                        />
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
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:opacity-50"
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