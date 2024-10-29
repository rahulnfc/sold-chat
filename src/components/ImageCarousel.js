import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ImageCarousel = ({ images = [], autoplayInterval = 3000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [transitioning, setTransitioning] = useState(false); // Added to handle transition state

  const nextSlide = useCallback(() => {
    setTransitioning(true); // Start transition
    setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
      setTransitioning(false); // End transition
    }, 500); // Duration of transition
  }, [images.length]);

  const prevSlide = () => {
    setTransitioning(true); // Start transition
    setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      );
      setTransitioning(false); // End transition
    }, 500); // Duration of transition
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
    setIsPlaying(false); // Pause autoplay when zooming
  };

  useEffect(() => {
    let intervalId;
    if (isPlaying && !isZoomed && !transitioning) { // Check if not transitioning
      intervalId = setInterval(nextSlide, autoplayInterval);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, isZoomed, transitioning, nextSlide, autoplayInterval]);

  if (!images.length) return null;

  return (
    <div className="relative w-full max-w-3xl mx-auto">
      {/* Main carousel container */}
      <div className="relative overflow-hidden rounded-lg aspect-video">
        {/* Image container */}
        <div 
          className={`relative w-full h-full transition-transform duration-500 ease-out
            ${isZoomed ? 'cursor-zoom-out scale-150' : 'cursor-zoom-in'}
            ${transitioning ? 'transition-opacity' : ''}`}
          onClick={toggleZoom}
        >
          <img
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            className={`absolute w-full h-full object-cover ${transitioning ? 'opacity-50' : ''}`}
          />
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-0 flex items-center justify-between p-4">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 hover:bg-white/90"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
              setIsPlaying(false);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 hover:bg-white/90"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
              setIsPlaying(false);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-4 right-4 bg-white/80 hover:bg-white/90"
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
        >
          {isZoomed ? (
            <ZoomOut className="h-4 w-4" />
          ) : (
            <ZoomIn className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="absolute -bottom-6 w-full flex items-center justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setIsPlaying(false);
              setTransitioning(true); // Start transition
              setTimeout(() => setTransitioning(false), 500); // End transition after duration
            }}
            className={`w-2 h-2 rounded-full transition-all
              ${currentIndex === index 
                ? 'bg-blue-600 w-4' 
                : 'bg-gray-300 hover:bg-gray-400'
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;