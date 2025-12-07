// Debug script to check why media isn't loading
// Paste this in browser console to check what's happening

console.log('🔍 DEBUGGING MEDIA LOADING');

async function debugMediaLoading() {
    // Get supabase instance
    const { supabase } = await import('./src/lib/supabase.js');
    
    console.log('1. Testing direct database query...');
    
    // Test basic media query
    const { data: allMedia, error: allError } = await supabase
        .from('media')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(10);
        
    console.log('All media query result:', { data: allMedia, error: allError });
    
    if (allMedia && allMedia.length > 0) {
        console.log('✅ Media found in database:', allMedia.length, 'items');
        console.log('First item:', allMedia[0]);
        
        // Check storage URLs
        const firstItem = allMedia[0];
        const { data: storageData } = supabase.storage
            .from('media')
            .getPublicUrl(firstItem.file_path);
            
        console.log('Storage URL for first item:', storageData.publicUrl);
        
        // Test if we can fetch the image
        try {
            const response = await fetch(storageData.publicUrl);
            console.log('Image fetch status:', response.status, response.statusText);
        } catch (fetchError) {
            console.error('❌ Cannot fetch image:', fetchError);
        }
        
    } else if (allError) {
        console.error('❌ Database query error:', allError);
    } else {
        console.log('⚠️ No media found in database');
    }
    
    // Test current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user ? `${user.email} (${user.id})` : 'Not logged in');
    
    // Test with user filter (if authenticated)
    if (user) {
        const { data: userMedia, error: userError } = await supabase
            .from('media')
            .select('*')
            .eq('user_id', user.id)
            .order('upload_date', { ascending: false });
            
        console.log('User-specific media:', { data: userMedia, error: userError });
    }
}

debugMediaLoading();