'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';

const PhotoViewer = ({ photos, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const photoCount = Array.isArray(photos) ? photos.length : 0;
  const currentPhoto = photoCount ? photos[currentIndex] : null;

  const handlePrevious = useCallback(() => {
    if (!photoCount) return;
    setCurrentIndex((prev) => (prev === 0 ? photoCount - 1 : prev - 1));
    setIsZoomed(false);
  }, [photoCount]);

  const handleNext = useCallback(() => {
    if (!photoCount) return;
    setCurrentIndex((prev) => (prev === photoCount - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [photoCount]);

  const handleDownload = () => {
    if (!currentPhoto?.url) return;
    if (currentPhoto.url) {
      const link = document.createElement('a');
      link.href = currentPhoto.url;
      link.download = `photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (!currentPhoto?.url || !navigator.share) return;
    if (currentPhoto.url && navigator.share) {
      navigator.share({
        title: 'Photo',
        text: 'Check out this photo',
        url: currentPhoto.url,
      }).catch(err => console.log('Share error:', err));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined' || photoCount === 0) return undefined;
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, onClose, photoCount]);

  if (!photoCount) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white text-sm font-semibold">
          {currentIndex + 1} / {photos.length}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="relative"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto.url}
            alt={`Photo ${currentIndex + 1}`}
            className={`max-h-[70vh] rounded-lg transition-transform duration-300 cursor-zoom-in hover:brightness-110 ${
              isZoomed ? 'scale-125' : 'scale-100'
            }`}
            style={{
              maxWidth: isZoomed ? '90vw' : '100%',
            }}
          />
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
            Click to {isZoomed ? 'zoom out' : 'zoom in'}
          </div>
        </button>
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
        <div className="flex justify-center items-center gap-4">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={photos.length <= 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="Download photo"
          >
            <Download className="w-6 h-6" />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title="Share photo"
          >
            <Share2 className="w-6 h-6" />
          </button>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={photos.length <= 1}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default PhotoViewer;
