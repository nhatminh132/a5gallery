import React, { useState, useEffect } from 'react';
import { Users, UserPlus, X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Collaborator {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  added_at: string;
}

interface AlbumCollaboratorsProps {
  albumId: string;
  isOwner: boolean;
}

export default function AlbumCollaborators({ albumId, isOwner }: AlbumCollaboratorsProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCollaborators();
  }, [albumId]);

  const loadCollaborators = async () => {
    try {
      const { data, error } = await supabase.rpc('get_album_collaborators', {
        album_uuid: albumId
      });

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;

      // Filter out users who are already collaborators
      const existingIds = collaborators.map(c => c.user_id);
      const filtered = (data || []).filter(u => !existingIds.includes(u.id) && u.id !== user?.id);
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const addCollaborator = async (userId: string, role: string = 'contributor') => {
    try {
      setAdding(true);

      const { error } = await supabase
        .from('album_collaborators')
        .insert({
          album_id: albumId,
          user_id: userId,
          added_by: user?.id,
          role: role
        });

      if (error) throw error;

      await loadCollaborators();
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding collaborator:', error);
      alert('Failed to add collaborator');
    } finally {
      setAdding(false);
    }
  };

  const removeCollaborator = async (collaboratorId: string) => {
    if (!confirm('Remove this collaborator?')) return;

    try {
      const { error } = await supabase
        .from('album_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
    } catch (error) {
      console.error('Error removing collaborator:', error);
      alert('Failed to remove collaborator');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Collaborators ({collaborators.length})
          </h3>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add
          </button>
        )}
      </div>

      {/* Collaborators List */}
      <div className="space-y-2">
        {collaborators.map((collab) => (
          <div
            key={collab.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {collab.avatar_url ? (
              <img
                src={collab.avatar_url}
                alt={collab.full_name || 'User'}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {(collab.full_name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {collab.full_name || 'Anonymous'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {collab.role}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => removeCollaborator(collab.id)}
                className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {collaborators.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
            No collaborators yet
          </p>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Collaborator
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search users by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Search Results */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {(user.full_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name || 'Anonymous'}
                    </p>
                  </div>
                  <button
                    onClick={() => addCollaborator(user.id)}
                    disabled={adding}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  No users found
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
