import React, { useState, useEffect } from 'react';

const typingTexts = [
  "6A5 Gallery 2021-2022",
  "7A5 Gallery 2022-2023",
  "8A5 Gallery 2023-2024",
  "9A5 Gallery 2024-2025"
];

const GalleryHeader: React.FC = () => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [charIndex, setCharIndex] = useState(0);

  // Function to render text with neon effects for class names and years
  const renderTextWithNeonEffect = (text: string) => {
    // Split text into parts: class name, "Gallery", and year
    const parts = text.match(/^(\d+A5)\s+(Gallery)\s+(\d{4}-\d{4})$/);
    
    if (parts) {
      const [, className, gallery, year] = parts;
      const currentLength = currentText.length;
      
      // Calculate which parts should be visible based on typing progress
      let visibleClassName = '';
      let visibleGallery = '';
      let visibleYear = '';
      
      if (currentLength > 0) {
        if (currentLength <= className.length) {
          visibleClassName = className.substring(0, currentLength);
        } else {
          visibleClassName = className;
          const galleryStart = className.length + 1; // +1 for space
          
          if (currentLength > galleryStart) {
            if (currentLength <= galleryStart + gallery.length) {
              visibleGallery = gallery.substring(0, currentLength - galleryStart);
            } else {
              visibleGallery = gallery;
              const yearStart = galleryStart + gallery.length + 1; // +1 for space
              
              if (currentLength > yearStart) {
                visibleYear = year.substring(0, currentLength - yearStart);
              }
            }
          }
        }
      }
      
      return (
        <>
          {visibleClassName && (
            <span className="neon-glow text-blue-400 dark:text-cyan-400" 
                  style={{
                    textShadow: `
                      0 0 3px currentColor,
                      0 0 6px currentColor,
                      0 0 10px currentColor,
                      0 0 15px currentColor
                    `
                  }}>
              {visibleClassName}
            </span>
          )}
          {visibleGallery && (
            <>
              <span> </span>
              <span className="text-gray-900 dark:text-white">{visibleGallery}</span>
            </>
          )}
          {visibleYear && (
            <>
              <span> </span>
              <span className="neon-glow text-purple-400 dark:text-pink-400"
                    style={{
                      textShadow: `
                        0 0 3px currentColor,
                        0 0 6px currentColor,
                        0 0 10px currentColor,
                        0 0 15px currentColor
                      `
                    }}>
                {visibleYear}
              </span>
            </>
          )}
        </>
      );
    }
    
    // Fallback for non-matching text
    return <span className="text-gray-900 dark:text-white">{currentText}</span>;
  };

  useEffect(() => {
    const text = typingTexts[currentTextIndex];
    
    if (isTyping) {
      if (charIndex < text.length) {
        const timeout = setTimeout(() => {
          setCurrentText(text.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        }, 100); // Typing speed
        return () => clearTimeout(timeout);
      } else {
        // Finished typing, wait then start deleting
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000); // Wait 2 seconds
        return () => clearTimeout(timeout);
      }
    } else {
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setCurrentText(text.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        }, 50); // Deleting speed
        return () => clearTimeout(timeout);
      } else {
        // Finished deleting, move to next text
        setCurrentTextIndex((prevIndex) => (prevIndex + 1) % typingTexts.length);
        setIsTyping(true);
      }
    }
  }, [charIndex, isTyping, currentTextIndex]);

  return (
    <div className="text-center py-12 mb-12">
      <div className="relative">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-wide min-h-[120px] flex items-center justify-center">
          <span>
            {renderTextWithNeonEffect(typingTexts[currentTextIndex])}
            <span className="animate-pulse text-white ml-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">_</span>
          </span>
        </h1>
        
        {/* Subtle background glow effect */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-24 bg-gradient-to-r from-blue-500/5 via-gray-200/10 to-blue-500/5 dark:from-blue-500/10 dark:via-white/20 dark:to-blue-500/10 blur-3xl"></div>
        </div>
      </div>
      
      {/* Progress indicators for typing texts */}
      <div className="flex justify-center mt-6 space-x-3">
        {typingTexts.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-8 rounded-full transition-all duration-500 bg-black ${
              index === currentTextIndex
                ? 'border-2 border-white shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110'
                : 'border border-white/40 hover:border-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default GalleryHeader;