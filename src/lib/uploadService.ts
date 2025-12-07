import { supabase } from './supabase';
import {
  compressImage,
  getImageDimensions,
  getVideoDimensions,
  generateVideoThumbnail,
  isImageFile,
  isVideoFile,
} from './fileUtils';

const STORAGE_BUCKET = 'media';

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

      const { error: thumbError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(thumbnailName, thumbnail, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (!thumbError) {
        thumbnailPath = thumbnailName;
      }
    }

    onProgress?.({ progress: 50, stage: 'uploading' });

    // Use the pre-generated unique media ID for filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${uniqueMediaId}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, processedFile, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
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
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
      if (thumbnailPath) {
        await supabase.storage.from(STORAGE_BUCKET).remove([thumbnailPath]);
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

export function getMediaUrl(filePath: string): string {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteMedia(mediaId: string, filePath: string, thumbnailPath?: string | null): Promise<boolean> {
  try {
    const { error: dbError } = await supabase.from('media').delete().eq('id', mediaId);

    if (dbError) throw dbError;

    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

    if (thumbnailPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([thumbnailPath]);
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
