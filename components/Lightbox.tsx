import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Download, Smartphone } from 'lucide-react';
import { ConvertedImage, SaveMethod } from '../types';
import { Button } from './Button';

interface LightboxProps {
  images: ConvertedImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (image: ConvertedImage) => void;
  saveMethod: SaveMethod;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const Lightbox: React.FC<LightboxProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  onSave,
  saveMethod,
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex);
      setDirection(0); // Reset direction on open to trigger "zoom" instead of "slide"
    }
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') paginate(-1);
      if (e.key === 'ArrowRight') paginate(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, index]);

  const paginate = (newDirection: number) => {
    const newIndex = index + newDirection;
    if (newIndex >= 0 && newIndex < images.length) {
      setDirection(newDirection);
      setIndex(newIndex);
    }
  };

  const currentImage = images[index];

  // Animation Variants
  const variants = {
    enter: (direction: number) => {
      // If direction is 0, it means we just opened the lightbox -> Zoom In
      if (direction === 0) {
        return { opacity: 0, scale: 0.8, x: 0 };
      }
      // Otherwise -> Slide In
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 1,
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => {
      // If closing (we'd need to pass a closing prop, but strictly here for slide out)
      // We keep slide out logic for navigation
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 1,
      };
    },
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <AnimatePresence>
      {isOpen && currentImage && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="text-white text-sm font-medium drop-shadow-md px-3 py-1 bg-white/10 rounded-full border border-white/5 backdrop-blur-md">
              {index + 1} / {images.length}
            </div>
            <div className="pointer-events-auto">
                <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
                <X size={28} />
                </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden w-full h-full">
            <AnimatePresence initial={true} custom={direction} mode="popLayout">
              <motion.img
                key={currentImage.id}
                src={currentImage.url}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.3, type: "spring" } // Smooth zoom
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                className="absolute max-w-[95%] max-h-[90%] object-contain pointer-events-auto cursor-grab active:cursor-grabbing shadow-2xl drop-shadow-2xl"
                alt={currentImage.originalName}
              />
            </AnimatePresence>

            {/* Nav Buttons (Desktop) */}
            {index > 0 && (
              <button
                className="absolute left-4 z-10 p-3 bg-black/20 hover:bg-black/50 border border-white/10 backdrop-blur-sm rounded-full text-white hidden md:flex transition-all hover:scale-110 active:scale-95"
                onClick={() => paginate(-1)}
              >
                <ChevronLeft size={32} />
              </button>
            )}
            {index < images.length - 1 && (
              <button
                className="absolute right-4 z-10 p-3 bg-black/20 hover:bg-black/50 border border-white/10 backdrop-blur-sm rounded-full text-white hidden md:flex transition-all hover:scale-110 active:scale-95"
                onClick={() => paginate(1)}
              >
                <ChevronRight size={32} />
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="z-20 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center pb-10 gap-5">
            
            {/* Size Info Badge */}
            <div className="flex items-center gap-3 text-sm font-medium bg-zinc-900/80 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-zinc-700/50 shadow-xl">
                <span className="text-zinc-400">{formatBytes(currentImage.originalSize || 0)}</span>
                <span className="text-zinc-600">→</span>
                <span className="text-primary font-bold">{formatBytes(currentImage.size)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="shadow-[0_0_20px_rgba(139,92,246,0.2)] min-w-[200px] rounded-2xl"
              onClick={() => onSave(currentImage)}
            >
              {saveMethod === SaveMethod.BROWSER_DOWNLOAD ? <Download className="mr-2" size={20} /> : <Smartphone className="mr-2" size={20} />}
              Сохранить
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};