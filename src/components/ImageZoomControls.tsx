import React, { useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ImageZoomControlsProps {
  imageRef: React.RefObject<HTMLImageElement>;
  className?: string;
}

export default function ImageZoomControls({ imageRef, className = '' }: ImageZoomControlsProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.25, 3); // Max 3x zoom
    setZoom(newZoom);
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${newZoom})`;
      imageRef.current.style.transformOrigin = 'center';
      imageRef.current.style.transition = 'transform 0.2s ease';
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.25, 0.5); // Min 0.5x zoom
    setZoom(newZoom);
    if (imageRef.current) {
      imageRef.current.style.transform = `scale(${newZoom})`;
      imageRef.current.style.transformOrigin = 'center';
      imageRef.current.style.transition = 'transform 0.2s ease';
    }
  };

  const handleReset = () => {
    setZoom(1);
    if (imageRef.current) {
      imageRef.current.style.transform = 'scale(1)';
      imageRef.current.style.transition = 'transform 0.2s ease';
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={handleZoomOut}
        disabled={zoom <= 0.5}
        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5" />
      </button>
      
      <button
        onClick={handleReset}
        disabled={zoom === 1}
        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Reset Zoom"
      >
        <Maximize2 className="w-5 h-5" />
      </button>
      
      <button
        onClick={handleZoomIn}
        disabled={zoom >= 3}
        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5" />
      </button>
      
      <span className="flex items-center px-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-sm font-medium">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
}
