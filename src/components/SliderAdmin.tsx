import React, { useState, useEffect } from 'react';
import { getMediaUrl } from '../lib/uploadService';
import { Star, StarOff, Eye, EyeOff, Save, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { supabase, Media } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatFileSize } from '../lib/fileUtils';

export default function SliderAdmin() {
  const { profile } = useAuth();
  const [allImages, setAllImages] = useState<Media[]>([]);
  const [featuredImages, setFeaturedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Check admin permissions
  const isAdmin = profile?.is_admin || 
                  profile?.role === 'ADMIN' || 
                  profile?.role === 'SUPER_ADMIN' ||
                  profile?.email === 'lpnminh472@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      loadImages();
      loadFeaturedImages();
    }
  }, [isAdmin]);

  const loadImages = async () => {
    try {
      console.log('SliderAdmin: Loading ALL images from ALL users...');
      
      // First, let's check what's in the media table without any filters
      const { data: allMedia, error: allError } = await supabase
        .from('media')
        .select('*')
        .order('upload_date', { ascending: false });

      console.log('SliderAdmin: Total media files in database:', allMedia?.length || 0);
      console.log('SliderAdmin: All media types found:', [...new Set(allMedia?.map(m => m.file_type) || [])]);
      
      // Now try to get images specifically using file_type (not media_type)
      const { data, error } = await supabase
        .from('media')
        .select(`
          *,
          profiles!media_user_id_fkey(
            full_name,
            email
          )
        `)
        .like('file_type', 'image%')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('SliderAdmin: Error loading images:', error);
        throw error;
      }
      
      console.log('SliderAdmin: Loaded images from all users:', data?.length || 0, 'images');
      console.log('SliderAdmin: Image sample:', data?.slice(0, 3));
      setAllImages(data || []);
    } catch (error) {
      console.error('SliderAdmin: Error loading images:', error);
      setAllImages([]);
    }
  };

  const loadFeaturedImages = async () => {
    try {
      console.log('SliderAdmin: Loading featured images...');
      // Check if slider_featured table exists, if not create it
      const { data: existingData, error: selectError } = await supabase
        .from('slider_featured')
        .select('media_id')
        .order('display_order');

      if (selectError) {
        // Table might not exist, create it
        console.log('SliderAdmin: slider_featured table error:', selectError);
        console.log('SliderAdmin: Table might not exist, using empty array');
        // For now, just set empty array and let admin select images
        setFeaturedImages([]);
      } else {
        const ids = existingData?.map(item => item.media_id) || [];
        console.log('SliderAdmin: Found featured images:', ids.length, 'featured');
        setFeaturedImages(ids);
      }
    } catch (error) {
      console.error('SliderAdmin: Error loading featured images:', error);
      setFeaturedImages([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = (mediaId: string) => {
    console.log('SliderAdmin: Toggling featured for media_id:', mediaId);
    setFeaturedImages(prev => {
      if (prev.includes(mediaId)) {
        return prev.filter(id => id !== mediaId);
      } else {
        return [...prev, mediaId];
      }
    });
  };

  const saveFeaturedImages = async () => {
    if (!isAdmin) return;

    try {
      setSaving(true);

      // First, try to create the table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_slider_featured_table');
      
      if (createError && !createError.message.includes('already exists')) {
        // If we can't create via RPC, try direct SQL
        const { error: sqlError } = await supabase
          .from('slider_featured')
          .select('media_id')
          .limit(1);

        if (sqlError) {
          // Table doesn't exist, we need to create it manually
          console.warn('Could not create slider_featured table automatically. Using alternative storage.');
          // Store in profiles table or use metadata
          await saveFeaturedToProfile();
          return;
        }
      }

      // Clear existing featured images
      await supabase.from('slider_featured').delete().neq('media_id', '');

      // Insert new featured images with order using media_id
      if (featuredImages.length > 0) {
        console.log('SliderAdmin: Saving featured media_ids:', featuredImages);
        const insertData = featuredImages.map((mediaId, index) => ({
          media_id: mediaId, // This is now the unique media_id (not UUID)
          display_order: index,
          created_by: profile?.id,
          created_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('slider_featured')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      alert(`Successfully updated slider with ${featuredImages.length} featured images!`);
    } catch (error) {
      console.error('Error saving featured images:', error);
      alert('Failed to save featured images. Trying alternative method...');
      await saveFeaturedToProfile();
    } finally {
      setSaving(false);
    }
  };

  const saveFeaturedToProfile = async () => {
    try {
      // Store featured image IDs in user's profile metadata
      const { error } = await supabase
        .from('profiles')
        .update({ 
          metadata: { 
            featured_slider_images: featuredImages,
            updated_at: new Date().toISOString()
          } 
        })
        .eq('id', profile?.id);

      if (error) throw error;
      alert('Featured images saved to profile metadata!');
    } catch (error) {
      console.error('Error saving to profile:', error);
      alert('Failed to save featured images');
    }
  };

  const filteredImages = allImages.filter(image =>
    image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (image.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (image.profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (image.profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Admin Only</h3>
        <p className="text-gray-600 dark:text-gray-400">Only administrators can manage slider images.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-gray-600 dark:text-gray-400">Loading images...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Dashboard Slider Management</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Select any images from all users to feature in the dashboard slider ({featuredImages.length} selected)
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            📸 All uploaded images from all users are available for selection
          </p>
          {/* Debug Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Debug: {allImages.length} total images loaded, {filteredImages.length} after search filter
          </div>
        </div>
        
        <button
          onClick={saveFeaturedImages}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <input
          type="text"
          placeholder="Search by title, description, or uploader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Debug Panel - Remove this after testing */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">🔍 Debug Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Loading:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{loading ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Images:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{allImages.length}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Filtered:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{filteredImages.length}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Featured:</span>
            <span className="ml-2 text-gray-900 dark:text-white">{featuredImages.length}</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Check browser console (F12) for detailed logs
        </div>
      </div>

      {/* Featured Images Preview */}
      {featuredImages.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
            Featured Images Preview ({featuredImages.length})
          </h3>
          <div className="flex space-x-2 overflow-x-auto">
            {featuredImages.map((mediaId, index) => {
              const image = allImages.find(img => (img.media_id || img.id) === mediaId);
              if (!image) return null;
              
              return (
                <div key={mediaId} className="flex-shrink-0 relative">
                  <img
                    src={getMediaUrl(image.file_path, image.storage_provider)}
                    alt={image.title}
                    className="w-20 h-16 object-cover rounded border-2 border-blue-300 dark:border-blue-600"
                  />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </div>
                  <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                    ID: {mediaId.slice(-4)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
              featuredImages.includes(image.media_id || image.id)
                ? 'border-yellow-400 ring-2 ring-yellow-400/20 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => toggleFeatured(image.media_id || image.id)}
          >
            <img
              src={getMediaUrl(image.file_path, image.storage_provider)}
              alt={image.title}
              className="w-full h-32 object-cover"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
              {/* Featured Star */}
              <div className="absolute top-2 left-2">
                {featuredImages.includes(image.media_id || image.id) ? (
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                ) : (
                  <StarOff className="w-5 h-5 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              
              {/* Order Number */}
              {featuredImages.includes(image.media_id || image.id) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {featuredImages.indexOf(image.media_id || image.id) + 1}
                </div>
              )}
            </div>
            
            {/* Image Info */}
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
                {image.title}
              </h4>
              
              {/* Media ID */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 mb-2">
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                  🆔 ID: {image.media_id || 'No ID'}
                </p>
              </div>
              
              <div className="space-y-1">
                {/* Upload Date */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  📅 {new Date(image.upload_date).toLocaleDateString()} {new Date(image.upload_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                
                {/* File Size */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  📦 {formatFileSize(image.file_size)}
                </p>
                
                {/* File Type */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🎨 {image.file_type}
                </p>
                
                {/* Dimensions */}
                {(image.width && image.height) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    📐 {image.width} × {image.height} px
                  </p>
                )}
                
                {/* Uploader */}
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  👤 {image.profiles?.full_name || image.profiles?.email || 'Unknown User'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {allImages.length === 0 
              ? "No images found. Please upload some images first." 
              : searchTerm 
                ? "No images match your search." 
                : "No images available."
            }
          </p>
          {allImages.length === 0 && (
            <button
              onClick={() => window.location.href = '/upload'}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Images
            </button>
          )}
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• Click on images to add/remove them from the slider</li>
          <li>• Featured images show a yellow star and order number</li>
          <li>• Images will appear in the dashboard slider in the selected order</li>
          <li>• Remember to click "Save Changes" to apply your selection</li>
        </ul>
      </div>
    </div>
  );
}