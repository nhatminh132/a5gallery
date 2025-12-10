// Multi-Storage Configuration for A5 Gallery
// This file helps manage multiple Supabase storage instances

export const storageConfig = {
  // Storage Instance 1
  storage1: {
    url: import.meta.env.VITE_SUPABASE_URL_1 || 'https://your-project-1-id.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_1 || 'your-anon-key-1',
    bucket: import.meta.env.VITE_STORAGE_BUCKET_1 || 'gallery-uploads-1',
    maxSize: '100MB',
    region: 'us-east-1' // Optional: specify region
  },
  
  // Storage Instance 2
  storage2: {
    url: import.meta.env.VITE_SUPABASE_URL_2 || 'https://your-project-2-id.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_2 || 'your-anon-key-2',
    bucket: import.meta.env.VITE_STORAGE_BUCKET_2 || 'gallery-uploads-2',
    maxSize: '100MB',
    region: 'us-west-1'
  },
  
  // Storage Instance 3
  storage3: {
    url: import.meta.env.VITE_SUPABASE_URL_3 || 'https://your-project-3-id.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_3 || 'your-anon-key-3',
    bucket: import.meta.env.VITE_STORAGE_BUCKET_3 || 'gallery-uploads-3',
    maxSize: '100MB',
    region: 'eu-central-1'
  },
  
  // Storage Instance 4
  storage4: {
    url: import.meta.env.VITE_SUPABASE_URL_4 || 'https://your-project-4-id.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_4 || 'your-anon-key-4',
    bucket: import.meta.env.VITE_STORAGE_BUCKET_4 || 'gallery-uploads-4',
    maxSize: '100MB',
    region: 'ap-southeast-1'
  }
};

// Storage selection strategies
export const getStorageInstance = (strategy = 'load_balance') => {
  const instances = Object.keys(storageConfig);
  
  switch (strategy) {
    case 'load_balance':
      // Round-robin selection based on current time
      const index = Math.floor(Date.now() / 1000) % instances.length;
      return instances[index];
      
    case 'random':
      // Random selection
      return instances[Math.floor(Math.random() * instances.length)];
      
    case 'primary_first':
      // Always try storage1 first, fallback to others if needed
      return 'storage1';
      
    case 'by_file_type':
      // Different storage for different file types (you can customize this)
      return 'storage1'; // Default
      
    default:
      return 'storage1';
  }
};

// Get configuration for specific storage
export const getStorageConfig = (storageId) => {
  return storageConfig[storageId] || storageConfig.storage1;
};

// Utility function to check storage health
export const checkStorageHealth = async (storageId) => {
  try {
    const config = getStorageConfig(storageId);
    // Add health check logic here
    return { healthy: true, latency: 0 };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

export default {
  storageConfig,
  getStorageInstance,
  getStorageConfig,
  checkStorageHealth
};