import React, { useState } from 'react';
import { RefreshCw, Play, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { download as storageDownload, upload as storageUpload } from '../lib/storageManager';
import { generateVideoThumbnail } from '../lib/fileUtils';
import { useAuth } from '../contexts/AuthContext';

interface ThumbnailRegeneratorProps {
  onComplete?: () => void;
}

export default function ThumbnailRegenerator({ onComplete }: ThumbnailRegeneratorProps) {
  const { profile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const isAdmin = profile?.is_admin || 
                 profile?.role === 'ADMIN' || 
                 profile?.role === 'SUPER_ADMIN' ||
                 profile?.email === 'lpnminh472@gmail.com';

  if (!isAdmin) {
    return null; // Only show to admins
  }

  const regenerateThumbnails = async () => {
    setProcessing(true);
    setResults({ success: 0, failed: 0 });

    try {
      // Get all videos without thumbnails
      const { data: videos, error } = await supabase
        .from('media')
        .select('*')
        .in('file_type', ['video/mp4', 'video/webm', 'video/quicktime'])
        .is('thumbnail_path', null);

      if (error) throw error;

      if (!videos || videos.length === 0) {
        alert('No videos found that need thumbnail regeneration.');
        return;
      }

      setProgress({ current: 0, total: videos.length });

      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        setProgress({ current: i + 1, total: videos.length });

        try {
          // Download the video file
          const videoBlob = await storageDownload(video.storage_provider, video.file_path);


          // Create File object from blob
          const videoFile = new File([videoBlob], video.filename, { 
            type: video.file_type 
          });

          // Generate thumbnail
          const thumbnailBlob = await generateVideoThumbnail(videoFile);
          
          // Upload thumbnail
          const thumbnailName = `thumbnails/${video.user_id}/${video.media_id}_thumb.jpg`;
          
          await storageUpload(video.storage_provider, thumbnailName, thumbnailBlob, { contentType: 'image/jpeg', upsert: true });

          // Update database with thumbnail path
          const { error: updateError } = await supabase
            .from('media')
            .update({ thumbnail_path: thumbnailName })
            .eq('id', video.id);

          if (updateError) throw updateError;

          successCount++;
          console.log(`✅ Generated thumbnail for: ${video.title}`);

        } catch (error) {
          console.error(`❌ Failed to generate thumbnail for ${video.title}:`, error);
          failedCount++;
        }
      }

      setResults({ success: successCount, failed: failedCount });
      
      if (onComplete) {
        onComplete();
      }

    } catch (error) {
      console.error('Error regenerating thumbnails:', error);
      alert('Failed to regenerate thumbnails. Check console for details.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Video Thumbnail Generator
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate thumbnails for videos that don't have them (Admin only)
          </p>
        </div>
      </div>

      {processing && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Processing videos...</span>
            <span>{progress.current} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          {results.success > 0 || results.failed > 0 ? (
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-green-600">✅ Success: {results.success}</span>
              <span className="text-red-600">❌ Failed: {results.failed}</span>
            </div>
          ) : null}
        </div>
      )}

      <button
        onClick={regenerateThumbnails}
        disabled={processing}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {processing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        {processing ? 'Generating...' : 'Generate Missing Thumbnails'}
      </button>

      {!processing && (results.success > 0 || results.failed > 0) && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-gray-700 dark:text-gray-300">
              Completed! {results.success} successful, {results.failed} failed
            </span>
          </div>
        </div>
      )}
    </div>
  );
}