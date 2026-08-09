import React from 'react';
import { MapPin, X } from 'lucide-react';
import { GALLERY_PHOTOS } from '../data/mockData';
import { TiltBox } from './Tilt';

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhotoGalleryModal: React.FC<PhotoGalleryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-medium text-ink tracking-[-0.02em]">
              Around the property
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              The restaurant, the rooms, the workspace and the garden terrace
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-6 pr-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {GALLERY_PHOTOS.map((item) => (
            <TiltBox key={item.id} className="group rounded-2xl overflow-hidden relative bg-ink">
              <img
                src={item.imageUrl}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="tilt-layer w-full h-[260px] object-cover scale-[1.06] transition-transform duration-500 group-hover:scale-[1.12]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/70 mb-1.5">
                  {item.year}
                </span>
                <h3 className="font-medium text-base leading-snug">{item.title}</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-white/60 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{item.location}</span>
                </div>
              </div>
            </TiltBox>
          ))}
        </div>
      </div>
    </div>
  );
};
