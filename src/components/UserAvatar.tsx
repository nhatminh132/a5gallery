import { User } from 'lucide-react';
import { Profile, supabase } from '../lib/supabase';

interface UserAvatarProps {
  profile: Profile | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  namePosition?: 'right' | 'bottom';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

export default function UserAvatar({ 
  profile, 
  size = 'md', 
  showName = false,
  namePosition = 'right',
  className = '',
  onClick 
}: UserAvatarProps) {
  
  // Handle click event
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Avatar clicked!', onClick); // Debug log
    if (onClick) {
      onClick();
    }
  };

  // Get avatar image source
  const getAvatarSrc = () => {
    if (!profile?.avatar_url) return null;
    
    // If it's an emoji or very short string, return null (we'll render as emoji)
    if (profile.avatar_url.length <= 4 && !profile.avatar_url.includes('/')) {
      return null;
    }
    
    // If it's a storage path
    if (profile.avatar_url.startsWith('avatars/')) {
      const bucket = (import.meta.env.VITE_STORAGE_BUCKET_1 || 'media') as string;
      const { data } = supabase.storage.from(bucket).getPublicUrl(profile.avatar_url); // Avatars stay on storage1
      return data.publicUrl;
    }
    
    // If it's a full URL
    if (profile.avatar_url.startsWith('http')) {
      return profile.avatar_url;
    }
    
    return null;
  };

  const avatarSrc = getAvatarSrc();
  const isEmoji = profile?.avatar_url && profile.avatar_url.length <= 4 && !profile.avatar_url.includes('/');
  const cursorClass = onClick ? 'cursor-pointer' : '';
  const hoverClass = onClick ? (avatarSrc ? 'hover:opacity-80' : 'hover:bg-gray-200 dark:hover:bg-gray-600') : '';

  // Render the actual avatar element
  const avatarElement = avatarSrc ? (
    <img
      src={avatarSrc}
      alt={profile?.full_name || 'User avatar'}
      className={`${sizeClasses[size]} rounded-full object-cover ${cursorClass} ${hoverClass} transition-all`}
      onClick={handleClick}
      onError={(e) => {
        console.error('Avatar image failed to load:', avatarSrc);
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const container = target.parentElement;
        if (container) {
          container.innerHTML = `<div class="${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${cursorClass} ${hoverClass} transition-colors"><svg class="${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg></div>`;
        }
      }}
    />
  ) : isEmoji ? (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${cursorClass} ${hoverClass} transition-colors`}
      onClick={handleClick}
    >
      <span className={size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'}>
        {profile?.avatar_url}
      </span>
    </div>
  ) : (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${cursorClass} ${hoverClass} transition-colors`}
      onClick={handleClick}
    >
      <User className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 dark:text-gray-500`} />
    </div>
  );

  const nameElement = showName && profile?.full_name && (
    <span className={`${textSizeClasses[size]} font-medium text-gray-900 dark:text-white truncate`}>
      {profile.full_name}
    </span>
  );

  // Return the complete component
  if (!showName) {
    return (
      <div className={`${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
        {avatarElement}
      </div>
    );
  }

  if (namePosition === 'bottom') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
        {avatarElement}
        {nameElement}
      </div>
    );
  }

  // namePosition === 'right'
  return (
    <div className={`flex items-center gap-3 ${className} ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
      {avatarElement}
      {nameElement}
    </div>
  );
}