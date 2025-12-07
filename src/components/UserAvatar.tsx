import { User } from 'lucide-react';
import { Profile } from '../lib/supabase';

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
  const avatarContent = () => {
    if (profile?.avatar_url) {
      // Check if it's an emoji (not a URL)
      if (!profile.avatar_url.startsWith('http')) {
        return (
          <div className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${onClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''} transition-colors`}>
            <span className={size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'}>
              {profile.avatar_url}
            </span>
          </div>
        );
      }
      // If it's a URL (uploaded image)
      else if (profile.avatar_url.startsWith('http')) {
        return (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'User avatar'}
            className={`${sizeClasses[size]} rounded-full object-cover ${onClick ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
          />
        );
      }
    }
    
    // Default avatar (user icon)
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${onClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''} transition-colors`}>
        <User className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400 dark:text-gray-500`} />
      </div>
    );
  };

  const nameElement = showName && profile?.full_name && (
    <span className={`${textSizeClasses[size]} font-medium text-gray-900 dark:text-white truncate`}>
      {profile.full_name}
    </span>
  );

  if (!showName) {
    return (
      <div className={className} onClick={onClick}>
        {avatarContent()}
      </div>
    );
  }

  if (namePosition === 'bottom') {
    return (
      <div className={`flex flex-col items-center gap-2 ${className}`} onClick={onClick}>
        {avatarContent()}
        {nameElement}
      </div>
    );
  }

  // namePosition === 'right'
  return (
    <div className={`flex items-center gap-3 ${className}`} onClick={onClick}>
      {avatarContent()}
      {nameElement}
    </div>
  );
}