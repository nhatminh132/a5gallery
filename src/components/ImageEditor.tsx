import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw, RotateCcw, Crop, Save, Undo, Redo, Download } from 'lucide-react';
import { Media } from '../lib/supabase';

interface ImageEditorProps {
  media: Media | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (editedImage: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageEditor({ media, isOpen, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [rotation, setRotation] = useState(0);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalImageData, setOriginalImageData] = useState<string>('');

  useEffect(() => {
    if (isOpen && media && canvasRef.current) {
      loadImage();
    }
  }, [isOpen, media]);

  const loadImage = () => {
    if (!media || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = canvas.toDataURL();
      setOriginalImageData(imageData);
      saveToHistory(imageData);
      
      if (imageRef.current) {
        imageRef.current.src = imageData;
      }
    };
    img.src = media.file_path;
  };

  const saveToHistory = (imageData: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const imageData = history[historyIndex - 1];
      if (imageRef.current) {
        imageRef.current.src = imageData;
      }
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const imageData = history[historyIndex + 1];
      if (imageRef.current) {
        imageRef.current.src = imageData;
      }
    }
  };

  const rotateImage = (degrees: number) => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const newRotation = (rotation + degrees) % 360;
    setRotation(newRotation);

    // Calculate new canvas dimensions for rotation
    const radians = (newRotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    const newWidth = img.width * cos + img.height * sin;
    const newHeight = img.width * sin + img.height * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Apply rotation
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(radians);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

    const imageData = canvas.toDataURL();
    img.src = imageData;
    saveToHistory(imageData);
  };

  const startCrop = () => {
    setCropMode(!cropMode);
    if (!cropMode && imageRef.current) {
      const img = imageRef.current;
      setCropArea({
        x: img.width * 0.1,
        y: img.height * 0.1,
        width: img.width * 0.8,
        height: img.height * 0.8,
      });
    }
  };

  const applyCrop = () => {
    if (!canvasRef.current || !imageRef.current || !cropMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    
    // Create cropped image
    canvas.width = cropArea.width;
    canvas.height = cropArea.height;
    
    ctx.drawImage(
      img,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    const imageData = canvas.toDataURL();
    img.src = imageData;
    saveToHistory(imageData);
    setCropMode(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const width = x - dragStart.x;
    const height = y - dragStart.y;
    
    setCropArea({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const downloadEdited = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `edited-${media?.filename || 'image.jpg'}`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  const saveEdited = () => {
    if (!canvasRef.current || !onSave) return;
    
    const editedImageData = canvasRef.current.toDataURL();
    onSave(editedImageData);
  };

  if (!isOpen || !media || !media.file_type.startsWith('image')) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Crop className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Image Editor</h2>
            <span className="text-sm text-gray-300">- {media.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center gap-2 p-4 bg-black/50 backdrop-blur-sm">
          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            <Undo className="w-4 h-4" />
            Undo
          </button>
          
          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            <Redo className="w-4 h-4" />
            Redo
          </button>

          <div className="w-px h-6 bg-gray-600 mx-2"></div>

          <button
            onClick={() => rotateImage(-90)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Rotate Left
          </button>

          <button
            onClick={() => rotateImage(90)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
            Rotate Right
          </button>

          <button
            onClick={startCrop}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              cropMode
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <Crop className="w-4 h-4" />
            {cropMode ? 'Apply Crop' : 'Start Crop'}
          </button>

          {cropMode && (
            <button
              onClick={applyCrop}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Apply
            </button>
          )}

          <div className="w-px h-6 bg-gray-600 mx-2"></div>

          <button
            onClick={downloadEdited}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          {onSave && (
            <button
              onClick={saveEdited}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div 
            className="relative max-w-full max-h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imageRef}
              alt="Edit preview"
              className="max-w-full max-h-full object-contain"
              style={{ userSelect: 'none' }}
              draggable={false}
            />
            
            {/* Crop overlay */}
            {cropMode && (
              <div
                className="absolute border-2 border-blue-500 bg-blue-500/20"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height,
                  pointerEvents: 'none',
                }}
              >
                <div className="absolute inset-0 border border-dashed border-white/50"></div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}