import { useState, useEffect } from 'react';
import { Plus, Lock, Globe, Eye, EyeOff, Users, Image as ImageIcon, Video, MoreVertical, Edit2, Trash2, Share2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import UserAvatar from '../components/UserAvatar';

interface Album {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  visibility: 'public' | 'private' | 'password_protected';
  password_hash: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  creator_profile?: {
    full_name: string;
    avatar_url: string;
  };
  media_count?: number;
  is_collaborator?: boolean;
}

interface AlbumsProps {
  onNavigate: (page: string, albumId?: string) => void;
}

export default function Albums({ onNavigate }: AlbumsProps) {
  const { user, profile } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my' | 'shared'>('all');

  useEffect(() => {
    if (user) {
      loadAlbums();
    }
  }, [user, filter]);

  const loadAlbums = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('albums')
        .select(`
          *,
          profiles:creator_id(full_name, avatar_url)
        `);

      // Apply filters
      if (filter === 'my') {
        query = query.eq('creator_id', user.id);
      } else if (filter === 'shared') {
        query = query.neq('creator_id', user.id);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      // Process the data
      const processedAlbums = data?.map(album => ({
        ...album,
        creator_profile: album.profiles,
        media_count: 0, // We'll get this later if needed
        is_collaborator: album.creator_id !== user.id
      })) || [];

      setAlbums(processedAlbums);
    } catch (err) {
      console.error('Error loading albums:', err);
      setError('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

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

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Public';
      case 'password_protected':
        return 'Password Protected';
      default:
        return 'Private';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                  <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Albums
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Organize your photos and videos into collections
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-3">
            {/* Filter buttons */}
            <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
              {[
                { key: 'all', label: 'All' },
                { key: 'my', label: 'My Albums' },
                { key: 'shared', label: 'Shared' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Album
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Albums grid */}
        {albums.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'my' ? 'No albums yet' : filter === 'shared' ? 'No shared albums' : 'No albums found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filter === 'my' 
                ? 'Create your first album to organize your photos and videos'
                : filter === 'shared'
                ? 'You don\'t have access to any shared albums yet'
                : 'Start organizing your media by creating albums'
              }
            </p>
            {filter !== 'shared' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Album
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                currentUserId={user?.id}
                onEdit={() => {/* TODO: Implement edit */}}
                onDelete={() => {/* TODO: Implement delete */}}
                onView={() => onNavigate('album', album.id)}
              />
            ))}
          </div>
        )}

        {/* Create Album Modal */}
        {showCreateModal && (
          <CreateAlbumModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setShowCreateModal(false);
              loadAlbums();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface AlbumCardProps {
  album: Album;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

function AlbumCard({ album, currentUserId, onEdit, onDelete, onView }: AlbumCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = album.creator_id === currentUserId;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover Image */}
      <div 
        className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 cursor-pointer"
        onClick={onView}
      >
        {album.cover_image_url ? (
          <img
            src={album.cover_image_url}
            alt={album.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        
        {/* Overlay with media count */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity">
          <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
            {album.media_count || 0} items
          </div>
        </div>

        {/* Actions menu */}
        {isOwner && (
          <div className="absolute top-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Album Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">
            {album.name}
          </h3>
          <div className="flex items-center gap-1 ml-2">
            {getVisibilityIcon(album.visibility)}
          </div>
        </div>

        {album.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {album.description}
          </p>
        )}

        {/* Creator info */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <UserAvatar
            profile={album.creator_profile}
            size="sm"
          />
          <span className="truncate">
            {album.is_collaborator ? 'Shared by ' : 'Created by '}
            {album.creator_profile?.full_name || 'Unknown'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getVisibilityText(album.visibility)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(album.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CreateAlbumModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateAlbumModal({ onClose, onCreated }: CreateAlbumModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'private' as 'public' | 'private' | 'password_protected',
    password: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const albumData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        creator_id: user.id,
        visibility: formData.visibility,
        password_hash: formData.visibility === 'password_protected' && formData.password 
          ? btoa(formData.password) // Simple encoding - in production use proper hashing
          : null
      };

      const { error } = await supabase
        .from('albums')
        .insert([albumData]);

      if (error) throw error;

      onCreated();
    } catch (err) {
      console.error('Error creating album:', err);
      setError('Failed to create album');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Create New Album
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Album Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter album name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="private">Private - Only you can see</option>
              <option value="public">Public - Anyone can see</option>
              <option value="password_protected">Password Protected</option>
            </select>
          </div>

          {formData.visibility === 'password_protected' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !formData.name.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Album'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}