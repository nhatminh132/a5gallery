import { supabase } from './supabase';

/**
 * Track a media view
 */
export async function trackMediaView(mediaId: string, userId?: string) {
  try {
    // Insert view record
    await supabase.from('media_views').insert({
      media_id: mediaId,
      user_id: userId || null
    });

    // Increment counter
    await supabase.rpc('increment_media_view_count', { media_uuid: mediaId });
  } catch (error) {
    console.error('Error tracking view:', error);
  }
}

/**
 * Track a media download
 */
export async function trackMediaDownload(mediaId: string, userId?: string) {
  try {
    // Insert download record
    await supabase.from('media_downloads').insert({
      media_id: mediaId,
      user_id: userId || null
    });

    // Increment counter
    await supabase.rpc('increment_media_download_count', { media_uuid: mediaId });
  } catch (error) {
    console.error('Error tracking download:', error);
  }
}

/**
 * Get media analytics
 */
export async function getMediaAnalytics(mediaId: string) {
  try {
    const { data: media } = await supabase
      .from('media')
      .select('view_count, download_count')
      .eq('id', mediaId)
      .single();

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId);

    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('media_id', mediaId);

    return {
      views: media?.view_count || 0,
      downloads: media?.download_count || 0,
      comments: commentsCount || 0,
      likes: likesCount || 0
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    return { views: 0, downloads: 0, comments: 0, likes: 0 };
  }
}
