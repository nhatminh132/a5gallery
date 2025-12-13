import { supabase } from './supabase';
import {
  compressImage,
  getImageDimensions,
  getVideoDimensions,
  generateVideoThumbnail,
  isImageFile,
  isVideoFile,
} from './fileUtils';

import { pickMediaStorage, getStorageClient, getStorageBucket, getPublicUrl, upload as storageUpload, remove as storageRemove } from './storageManager';

// storage1 hosts auth/db; media files go to storage2-4 per config

export interface UploadProgress {
  progress: number;
  stage: 'compressing' | 'uploading' | 'saving' | 'complete';
}

// Generate unique media ID (10-20 digits)
function generateUniqueMediaId(): string {
  const timestamp = Date.now().toString(); // 13 digits
  const random = Math.random().toString().slice(2, 8); // 6 digits  
  return timestamp + random; // 19 digits total
}

export async function uploadMedia(
  file: File,
  title: string,
  description: string,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ success: boolean; error?: string; mediaId?: string }> {
  try {
    // Generate unique media ID once for this upload
    const uniqueMediaId = generateUniqueMediaId();
    console.log('Upload: Generated unique media ID:', uniqueMediaId);
    
    let processedFile: File | Blob = file;
    let width: number | null = null;
    let height: number | null = null;
    let duration: number | null = null;
    let thumbnailPath: string | null = null;

    if (isImageFile(file.type)) {
      onProgress?.({ progress: 20, stage: 'compressing' });

      const dimensions = await getImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;

      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file);
      }
    } else if (isVideoFile(file.type)) {
      onProgress?.({ progress: 20, stage: 'compressing' });

      const dimensions = await getVideoDimensions(file);
      width = dimensions.width;
      height = dimensions.height;
      duration = dimensions.duration;

      const thumbnail = await generateVideoThumbnail(file);
      const thumbnailName = `thumbnails/${userId}/${uniqueMediaId}_thumb.jpg`;
      // Will upload after selecting storage to ensure same provider is used
      thumbnailPath = thumbnailName;
    }

    onProgress?.({ progress: 50, stage: 'uploading' });

    // Choose storage provider for this media
    let storageId = pickMediaStorage();
    let bucket = getStorageBucket(storageId);

    // Use the pre-generated unique media ID for filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uniqueMediaId}.${fileExt}`;

    // Helper to upload to a specific storage, including thumbnail if any
    const doUploadTo = async (targetId: 'storage1' | 'storage2' | 'storage3' | 'storage4') => {
      // Upload thumbnail first if exists
      if (thumbnailPath) {
        await storageUpload(targetId, thumbnailPath, await (async () => {
          // regenerate thumbnail blob
          const thumb = await generateVideoThumbnail(file);
          return thumb;
        })(), { contentType: 'image/jpeg', upsert: false });
      }
      // Upload main file
      await storageUpload(targetId, fileName, processedFile, { contentType: file.type, upsert: false });
    };

    // Try selected storage; on RLS/bad-request, fallback to storage1
    try {
      await doUploadTo(storageId);
    } catch (e: any) {
      console.warn('Primary storage upload failed, attempting fallback to storage1:', e?.message || e);
      // Fallback
      storageId = 'storage1';
      bucket = getStorageBucket(storageId);
      await doUploadTo(storageId);
    }

    onProgress?.({ progress: 80, stage: 'saving' });

    const { data: mediaData, error: dbError } = await supabase
      .from('media')
      .insert({
        user_id: userId,
        media_id: uniqueMediaId,
        filename: file.name,
        file_path: fileName,
        title,
        description: description || null,
        file_type: file.type,
        file_size: file.size,
        width,
        height,
        duration,
        thumbnail_path: thumbnailPath,
        storage_provider: storageId
      })
      .select()
      .single();

    if (dbError) {
      await storageRemove(storageId, [fileName]);
      if (thumbnailPath) {
        await storageRemove(storageId, [thumbnailPath]);
      }
      throw new Error(`Database error: ${dbError.message}`);
    }

    onProgress?.({ progress: 100, stage: 'complete' });

    return { success: true, mediaId: mediaData.id };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export function getMediaUrl(filePath: string, storageProvider: 'storage1' | 'storage2' | 'storage3' | 'storage4' = 'storage1'): string {
  return getPublicUrl(storageProvider, filePath);
}

export async function deleteMedia(mediaId: string, filePath: string, thumbnailPath?: string | null, storageProvider?: 'storage1' | 'storage2' | 'storage3' | 'storage4'): Promise<boolean> {
  try {
    const { error: dbError } = await supabase.from('media').delete().eq('id', mediaId);

    if (dbError) throw dbError;

    const storageId = storageProvider ?? 'storage2';
    await storageRemove(storageId, [filePath]);

    if (thumbnailPath) {
      await storageRemove(storageId, [thumbnailPath]);
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
