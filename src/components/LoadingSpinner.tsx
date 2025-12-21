import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  message = "Loading...", 
  size = 'md',
  fullScreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = fullScreen
    ? "min-h-screen bg-black flex items-center justify-center"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} text-white animate-spin mx-auto mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]`} />
        <p className={`text-white ${textSizes[size]} drop-shadow-[0_0_8px_rgba(255,255,255,0.85)]`}>
          {message}
        </p>
      </div>
    </div>
  );
}