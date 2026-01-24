import { Heart } from 'lucide-react';
import { useFavorites } from '../contexts/FavoritesContext';

interface FavoriteButtonProps {
  mediaId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function FavoriteButton({ 
  mediaId, 
  size = 'md', 
  showLabel = false,
  className = '' 
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const favorite = isFavorite(mediaId);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFavorite(mediaId);
      }}
      disabled={loading}
      className={`group flex items-center gap-2 rounded-lg transition-all ${buttonSizes[size]} ${
        favorite
          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart 
        className={`${sizeClasses[size]} transition-all ${
          favorite ? 'fill-current scale-110' : 'group-hover:scale-110'
        }`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {favorite ? 'Favorited' : 'Favorite'}
        </span>
      )}
    </button>
  );
}
