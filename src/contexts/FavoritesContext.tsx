import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface FavoritesContextType {
  favorites: Set<string>;
  isFavorite: (mediaId: string) => boolean;
  toggleFavorite: (mediaId: string) => Promise<void>;
  loading: boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const toast = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('media_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const favoriteIds = new Set(data.map(f => f.media_id));
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isFavorite = useCallback((mediaId: string) => {
    return favorites.has(mediaId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (mediaId: string) => {
    if (!user) {
      toast.warning('Please sign in to add favorites');
      return;
    }

    const wasFavorite = favorites.has(mediaId);

    // Optimistic update
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (wasFavorite) {
        newFavorites.delete(mediaId);
      } else {
        newFavorites.add(mediaId);
      }
      return newFavorites;
    });

    try {
      if (wasFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('media_id', mediaId);

        if (error) throw error;
        toast.success('Removed from favorites');
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            media_id: mediaId
          });

        if (error) throw error;
        toast.success('Added to favorites');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      // Revert optimistic update on error
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (wasFavorite) {
          newFavorites.add(mediaId);
        } else {
          newFavorites.delete(mediaId);
        }
        return newFavorites;
      });

      toast.error('Failed to update favorite');
    }
  }, [user, favorites, toast]);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      isFavorite,
      toggleFavorite,
      loading,
      refreshFavorites
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
