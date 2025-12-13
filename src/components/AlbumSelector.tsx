import { useState, useEffect } from 'react';
import { Plus, Lock, Globe, EyeOff, X, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Album {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private' | 'password_protected';
  is_default: boolean;
  media_count?: number;
}

interface AlbumSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (albumId: string) => void;
  allowCreateNew?: boolean;
}

export default function AlbumSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  allowCreateNew = true 
}: AlbumSelectorProps) {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'public' | 'private' | 'password_protected',
    password: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadAlbums();
    }
  }, [isOpen, user]);

  const loadAlbums = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('albums')
        .select(`
          id,
          name,
          description,
          visibility,
          is_default,
          album_media(count)
        `)
        .eq('creator_id', user.id)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const processedAlbums = data?.map(album => ({
        ...album,
        media_count: album.album_media?.[0]?.count || 0
      })) || [];

      setAlbums(processedAlbums);
    } catch (err) {
      console.error('Error loading albums:', err);
      setError('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !createFormData.name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const albumData = {
        name: createFormData.name.trim(),
        description: createFormData.description.trim() || null,
        creator_id: user.id,
        visibility: createFormData.visibility,
        password_hash: createFormData.visibility === 'password_protected' && createFormData.password 
          ? btoa(createFormData.password)
          : null
      };

      const { data, error } = await supabase
        .from('albums')
        .insert([albumData])
        .select()
        .single();

      if (error) throw error;

      // Add to albums list
      setAlbums(prev => [{ ...data, media_count: 0 }, ...prev]);
      
      // Select the new album
      onSelect(data.id);
      
      // Reset form
      setCreateFormData({
        name: '',
        description: '',
        visibility: 'private',
        password: ''
      });
      setShowCreateForm(false);
    } catch (err) {
      console.error('Error creating album:', err);
      setError('Failed to create album');
    } finally {
      setCreating(false);
    }
  };

  const filteredAlbums = albums.filter(album =>
    album.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="w-4 h-4 text-green-500" />;
      case 'password_protected':
        return <Lock className="w-4 h-4 text-orange-500" />;
      default:
        return <EyeOff className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {showCreateForm ? 'Create New Album' : 'Choose Album'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showCreateForm ? (
            // Create Album Form
            <form onSubmit={handleCreateAlbum} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Album Name *
                </label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter album name"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility
                </label>
                <select
                  value={createFormData.visibility}
                  onChange={(e) => setCreateFormData({ ...createFormData, visibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="private">Private - Only you can see</option>
                  <option value="public">Public - Anyone can see</option>
                  <option value="password_protected">Password Protected</option>
                </select>
              </div>

              {createFormData.visibility === 'password_protected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter password"
                    required
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={creating || !createFormData.name.trim()}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          ) : (
            // Album Selection
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Search albums..."
                />
              </div>

              {/* Create New Album Button */}
              {allowCreateNew && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors mb-4"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Create New Album
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Organize your photos and videos
                    </p>
                  </div>
                </button>
              )}

              {/* Albums List */}
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-1"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredAlbums.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No albums found matching your search.' : 'No albums yet.'}
                  </p>
                  {!searchQuery && allowCreateNew && (
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="mt-2 text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      Create your first album
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredAlbums.map((album) => (
                    <button
                      key={album.id}
                      onClick={() => onSelect(album.id)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 rounded-lg flex items-center justify-center flex-shrink-0">
                        {getVisibilityIcon(album.visibility)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {album.name}
                            {album.is_default && (
                              <span className="inline-block ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                                Default
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {album.description || `${album.media_count} items`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}