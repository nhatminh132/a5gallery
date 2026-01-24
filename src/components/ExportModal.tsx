import React, { useState, useEffect } from 'react';
import { Download, Package, FileArchive, Image, Video, CheckCircle2, X, Calendar, User, Tag, Folder } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/fileUtils';
import JSZip from 'jszip';

interface ExportOptions {
  format: 'zip' | 'json' | 'csv';
  includeMetadata: boolean;
  includeComments: boolean;
  includeLikes: boolean;
  dateRange: {
    start: string;
    end: string;
  };
  mediaTypes: ('image' | 'video')[];
  selectedTags: string[];
  selectedCategories: string[];
  quality: 'original' | 'compressed';
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedMedia?: Media[];
}

export default function ExportModal({ isOpen, onClose, preSelectedMedia }: ExportModalProps) {
  const { user, profile } = useAuth();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'zip',
    includeMetadata: true,
    includeComments: false,
    includeLikes: false,
    dateRange: {
      start: '',
      end: new Date().toISOString().split('T')[0]
    },
    mediaTypes: ['image', 'video'],
    selectedTags: [],
    selectedCategories: [],
    quality: 'original'
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [estimatedSize, setEstimatedSize] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAvailableTagsAndCategories();
      estimateExportSize();
    }
  }, [isOpen, exportOptions]);

  const loadAvailableTagsAndCategories = async () => {
    try {
      // Load available tags
      const { data: tagsData } = await supabase
        .from('tags')
        .select('name')
        .order('usage_count', { ascending: false });

      setAvailableTags(tagsData?.map(t => t.name) || []);

      // Load available categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('name')
        .order('media_count', { ascending: false });

      setAvailableCategories(categoriesData?.map(c => c.name) || []);

    } catch (error) {
      console.error('Error loading tags and categories:', error);
    }
  };

  const estimateExportSize = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('media')
        .select('file_size, file_type, upload_date', { count: 'exact' });

      // Apply filters based on export options
      if (!preSelectedMedia) {
        query = query.eq('user_id', user.id);

        if (exportOptions.dateRange.start) {
          query = query.gte('upload_date', exportOptions.dateRange.start);
        }
        if (exportOptions.dateRange.end) {
          query = query.lte('upload_date', exportOptions.dateRange.end + 'T23:59:59');
        }

        // Filter by media types
        if (exportOptions.mediaTypes.length > 0 && exportOptions.mediaTypes.length < 2) {
          const fileTypeFilter = exportOptions.mediaTypes[0] === 'image' ? 'image%' : 'video%';
          query = query.like('file_type', fileTypeFilter);
        }
      }

      const { data, count } = await query;

      let totalSize = 0;
      if (preSelectedMedia) {
        totalSize = preSelectedMedia.reduce((sum, media) => sum + (media.file_size || 0), 0);
        setMediaCount(preSelectedMedia.length);
      } else {
        totalSize = (data || []).reduce((sum, media) => sum + (media.file_size || 0), 0);
        setMediaCount(count || 0);
      }

      // Add metadata overhead (roughly 10% for JSON/CSV)
      if (exportOptions.includeMetadata) {
        totalSize *= 1.1;
      }

      setEstimatedSize(totalSize);

    } catch (error) {
      console.error('Error estimating export size:', error);
    }
  };

  const getFilteredMedia = async (): Promise<Media[]> => {
    if (preSelectedMedia) {
      return preSelectedMedia;
    }

    if (!user) return [];

    try {
      let query = supabase
        .from('media')
        .select(`
          *,
          profiles!media_user_id_fkey(full_name, email),
          media_tags!media_tags_media_id_fkey(
            tags!media_tags_tag_id_fkey(name)
          ),
          categories!media_category_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      // Apply date filters
      if (exportOptions.dateRange.start) {
        query = query.gte('upload_date', exportOptions.dateRange.start);
      }
      if (exportOptions.dateRange.end) {
        query = query.lte('upload_date', exportOptions.dateRange.end + 'T23:59:59');
      }

      // Apply media type filters
      if (exportOptions.mediaTypes.length > 0 && exportOptions.mediaTypes.length < 2) {
        const fileTypeFilter = exportOptions.mediaTypes[0] === 'image' ? 'image%' : 'video%';
        query = query.like('file_type', fileTypeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      // Filter by tags if specified
      if (exportOptions.selectedTags.length > 0) {
        filteredData = filteredData.filter(media =>
          media.media_tags?.some((mt: any) =>
            exportOptions.selectedTags.includes(mt.tags?.name)
          )
        );
      }

      // Filter by categories if specified
      if (exportOptions.selectedCategories.length > 0) {
        filteredData = filteredData.filter(media =>
          exportOptions.selectedCategories.includes(media.categories?.name)
        );
      }

      return filteredData;

    } catch (error) {
      console.error('Error fetching filtered media:', error);
      return [];
    }
  };

  const downloadAsZip = async (media: Media[]) => {
    const zip = new JSZip();

    for (let i = 0; i < media.length; i++) {
      const mediaItem = media[i];
      setExportProgress(Math.round((i / media.length) * 80));

      try {
        // Download file
        const response = await fetch(mediaItem.file_path);
        const blob = await response.blob();
        
        // Add to zip
        const fileName = `${mediaItem.media_id || mediaItem.id}_${mediaItem.filename}`;
        zip.file(fileName, blob);

        // Add metadata if requested
        if (exportOptions.includeMetadata) {
          const metadata = {
            id: mediaItem.id,
            media_id: mediaItem.media_id,
            title: mediaItem.title,
            description: mediaItem.description,
            filename: mediaItem.filename,
            file_type: mediaItem.file_type,
            file_size: mediaItem.file_size,
            upload_date: mediaItem.upload_date,
            uploader: mediaItem.profiles?.full_name || mediaItem.profiles?.email,
            dimensions: mediaItem.width && mediaItem.height ? `${mediaItem.width}x${mediaItem.height}` : null,
            duration: mediaItem.duration,
            tags: mediaItem.media_tags?.map((mt: any) => mt.tags?.name).filter(Boolean) || [],
            category: mediaItem.categories?.name || null
          };

          zip.file(`metadata/${fileName}.json`, JSON.stringify(metadata, null, 2));
        }

      } catch (error) {
        console.error(`Error adding ${mediaItem.filename} to zip:`, error);
      }
    }

    setExportProgress(90);

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    setExportProgress(100);

    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gallery_export_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsJSON = (media: Media[]) => {
    const exportData = {
      export_info: {
        generated_at: new Date().toISOString(),
        generated_by: profile?.full_name || profile?.email,
        total_items: media.length,
        export_options: exportOptions
      },
      media: media.map(mediaItem => ({
        id: mediaItem.id,
        media_id: mediaItem.media_id,
        title: mediaItem.title,
        description: mediaItem.description,
        filename: mediaItem.filename,
        file_path: mediaItem.file_path,
        file_type: mediaItem.file_type,
        file_size: mediaItem.file_size,
        upload_date: mediaItem.upload_date,
        uploader: mediaItem.profiles?.full_name || mediaItem.profiles?.email,
        dimensions: mediaItem.width && mediaItem.height ? `${mediaItem.width}x${mediaItem.height}` : null,
        duration: mediaItem.duration,
        tags: mediaItem.media_tags?.map((mt: any) => mt.tags?.name).filter(Boolean) || [],
        category: mediaItem.categories?.name || null,
        thumbnail_path: mediaItem.thumbnail_path
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gallery_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsCSV = (media: Media[]) => {
    const headers = [
      'ID', 'Media ID', 'Title', 'Description', 'Filename', 'File Type', 
      'File Size', 'Upload Date', 'Uploader', 'Dimensions', 'Duration', 
      'Tags', 'Category', 'File Path', 'Thumbnail Path'
    ];

    const csvData = media.map(mediaItem => [
      mediaItem.id,
      mediaItem.media_id || '',
      mediaItem.title,
      mediaItem.description || '',
      mediaItem.filename,
      mediaItem.file_type,
      mediaItem.file_size,
      mediaItem.upload_date,
      mediaItem.profiles?.full_name || mediaItem.profiles?.email || '',
      mediaItem.width && mediaItem.height ? `${mediaItem.width}x${mediaItem.height}` : '',
      mediaItem.duration || '',
      mediaItem.media_tags?.map((mt: any) => mt.tags?.name).filter(Boolean).join('; ') || '',
      mediaItem.categories?.name || '',
      mediaItem.file_path,
      mediaItem.thumbnail_path || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gallery_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startExport = async () => {
    if (!user) return;

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportComplete(false);

      const media = await getFilteredMedia();

      if (media.length === 0) {
        alert('No media found matching your criteria.');
        return;
      }

      setExportProgress(10);

      switch (exportOptions.format) {
        case 'zip':
          await downloadAsZip(media);
          break;
        case 'json':
          downloadAsJSON(media);
          setExportProgress(100);
          break;
        case 'csv':
          downloadAsCSV(media);
          setExportProgress(100);
          break;
      }

      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        setExportProgress(0);
        setIsExporting(false);
      }, 3000);

    } catch (error) {
      console.error('Error during export:', error);
      alert('Export failed. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Export Gallery</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {preSelectedMedia ? `${preSelectedMedia.length} selected items` : 'Your media collection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Export Format</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'zip', label: 'ZIP Archive', icon: FileArchive, desc: 'Files + metadata' },
                { value: 'json', label: 'JSON Data', icon: Package, desc: 'Metadata only' },
                { value: 'csv', label: 'CSV Spreadsheet', icon: Download, desc: 'Tabular data' }
              ].map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                  disabled={isExporting}
                  className={`p-3 rounded-lg border-2 transition-colors text-center ${
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <format.icon className="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400" />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{format.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{format.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Include</h3>
            <div className="space-y-2">
              {[
                { key: 'includeMetadata', label: 'Metadata (title, description, dates)' },
                { key: 'includeComments', label: 'Comments' },
                { key: 'includeLikes', label: 'Like counts' }
              ].map((option) => (
                <label key={option.key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      [option.key]: e.target.checked 
                    }))}
                    disabled={isExporting}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {!preSelectedMedia && (
            <>
              {/* Date Range */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Date Range</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={exportOptions.dateRange.start}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    disabled={isExporting}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg"
                  />
                  <input
                    type="date"
                    value={exportOptions.dateRange.end}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    disabled={isExporting}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Media Types */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Media Types</h3>
                <div className="flex gap-4">
                  {[
                    { value: 'image', label: 'Images', icon: Image },
                    { value: 'video', label: 'Videos', icon: Video }
                  ].map((type) => (
                    <label key={type.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.mediaTypes.includes(type.value as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExportOptions(prev => ({
                              ...prev,
                              mediaTypes: [...prev.mediaTypes, type.value as any]
                            }));
                          } else {
                            setExportOptions(prev => ({
                              ...prev,
                              mediaTypes: prev.mediaTypes.filter(t => t !== type.value)
                            }));
                          }
                        }}
                        disabled={isExporting}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <type.icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Export Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Export Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Items:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">{mediaCount}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Estimated size:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {formatFileSize(estimatedSize)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress */}
          {isExporting && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {exportComplete ? 'Export Complete!' : 'Exporting...'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {exportProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    exportComplete ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              {exportComplete && (
                <div className="flex items-center gap-2 mt-3 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">Download started successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={startExport}
              disabled={isExporting || mediaCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : `Export ${mediaCount} Items`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}