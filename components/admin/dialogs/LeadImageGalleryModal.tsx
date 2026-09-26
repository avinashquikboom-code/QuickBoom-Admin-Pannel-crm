'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2,
  Upload,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
} from 'lucide-react';

export interface LeadImageItem {
  id: number;
  url: string;
  caption?: string | null;
  isPrimary?: boolean;
}

const resolveDisplayUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) return trimmed;
  if (trimmed.startsWith('/api/') || trimmed.startsWith('/uploads/')) {
    const apiOrigin = (
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://api.qbapp.online/api/v1'
    ).replace(/\/api\/v1\/?$/, '');
    return `${apiOrigin}${trimmed}`;
  }
  return trimmed;
};

interface LeadImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: LeadImageItem[];
  leadTitle?: string;
  initialIndex?: number;
  onSetPrimary?: (imageId: number) => void;
  onDelete?: (imageId: number) => void;
  onUploadNew?: () => void;
  isSettingPrimary?: boolean;
  deletingImageId?: number | null;
}

export const LeadImageGalleryModal: React.FC<LeadImageGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  leadTitle,
  initialIndex = 0,
  onSetPrimary,
  onDelete,
  onUploadNew,
  isSettingPrimary = false,
  deletingImageId = null,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      if (initialIndex >= 0 && initialIndex < images.length) {
        setCurrentIndex(initialIndex);
      } else {
        const primaryIdx = images.findIndex((img) => img.isPrimary);
        setCurrentIndex(primaryIdx >= 0 ? primaryIdx : 0);
      }
    }
  }, [isOpen, initialIndex, images]);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  const totalImages = images.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full h-full max-w-6xl max-h-[92vh] mx-auto p-4 md:p-6 flex flex-col justify-between">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between text-white/90 z-10 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {leadTitle || 'Lead Image Gallery'}
              </h2>
              {totalImages > 0 && (
                <p className="text-xs text-white/60 font-medium">
                  Image {currentIndex + 1} of {totalImages}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onUploadNew && (
              <button
                type="button"
                onClick={onUploadNew}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Image
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              title="Close Gallery (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Display Area */}
        <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden min-h-0">
          {totalImages > 0 && currentImage ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {/* Prev Button */}
              {totalImages > 1 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 md:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition cursor-pointer shadow-lg hover:scale-110 active:scale-95"
                  title="Previous image (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Main Image */}
              <div className="relative max-w-full max-h-[62vh] rounded-2xl overflow-hidden shadow-2xl bg-black/40 flex items-center justify-center border border-white/10 group">
                <img
                  src={resolveDisplayUrl(currentImage.url)}
                  alt={currentImage.caption || 'Lead Image'}
                  className="max-w-full max-h-[62vh] object-contain select-none"
                />

                {/* Primary Tag Overlay */}
                {currentImage.isPrimary && (
                  <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md backdrop-blur-xs">
                    <Star className="w-3.5 h-3.5 fill-current" /> PRIMARY IMAGE
                  </div>
                )}
              </div>

              {/* Next Button */}
              {totalImages > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 md:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition cursor-pointer shadow-lg hover:scale-110 active:scale-95"
                  title="Next image (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Image Details & Action Controls */}
              <div className="mt-3 flex flex-wrap items-center justify-between w-full max-w-2xl px-4 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-white/90 font-medium truncate">
                    {currentImage.caption || 'No caption provided'}
                  </p>
                  <p className="text-[11px] text-white/40 font-mono">
                    ID #{currentImage.id}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Set Primary Button */}
                  {onSetPrimary && !currentImage.isPrimary && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(currentImage.id)}
                      disabled={isSettingPrimary}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Make this the primary lead cover photo"
                    >
                      {isSettingPrimary ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Star className="w-3.5 h-3.5" />
                      )}
                      Set as Primary
                    </button>
                  )}

                  {/* Delete Button */}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Delete this image permanently?')) {
                          onDelete(currentImage.id);
                        }
                      }}
                      disabled={deletingImageId === currentImage.id}
                      className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Delete Image"
                    >
                      {deletingImageId === currentImage.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Clean Empty State */
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 text-white/40 flex items-center justify-center">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No image available</h3>
                <p className="text-xs text-white/60">
                  There are no images attached to this lead yet.
                </p>
              </div>
              {onUploadNew && (
                <button
                  type="button"
                  onClick={onUploadNew}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Upload className="w-4 h-4" /> Upload First Photo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Thumbnail Strip at Bottom */}
        {totalImages > 1 && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-thin">
              {images.map((img, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 scale-105'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={resolveDisplayUrl(img.url)}
                      alt={img.caption || `Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
