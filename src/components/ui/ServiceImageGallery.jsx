import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';

// Questo componente riceve l'array di immagini come prop
export const ServiceImageGallery = ({ images }) => {
  // --- STATI PER MODALI ---
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // --- FUNZIONI PER LIGHTBOX ---
  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // --- FUNZIONE PER MODALE GALLERIA ---
  const openLightboxFromGallery = (index) => {
    setGalleryModalOpen(false);
    openLightbox(index);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
        {/* --- GALLERIA (LAYOUT RESPONSIVE) --- */}
        <div className="flex flex-col gap-2 mb-6 max-w-5xl mx-auto">
            
            {/* 1. IMMAGINE PRINCIPALE (Sempre visibile) */}
            <div 
                className="relative h-64 md:h-[400px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm"
                onClick={() => openLightbox(0)}
            >
                <img 
                    src={images[0]} 
                    alt="Principale" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                
                {/* Badge conteggio foto (Solo Mobile) */}
                <div className="md:hidden absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
                    <Grid size={12} /> 1 / {images.length}
                </div>
            </div>
            
            {/* 2. ANTEPRIMA MOBILE (SCROLL ORIZZONTALE) - Solo Mobile */}
            {/* Mostra le altre immagini (indice 1+) in una striscia scorrevole */}
            {images.length > 1 && (
                <div className="md:hidden mt-1">
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x hide-scrollbar">
                        {images.slice(1).map((img, idx) => (
                            <div 
                                key={idx} 
                                className="flex-shrink-0 w-32 h-24 rounded-xl overflow-hidden snap-start shadow-sm border border-gray-100"
                                onClick={() => openLightbox(idx + 1)} // idx + 1 perché stiamo mappando slice(1)
                            >
                                <img 
                                    src={img} 
                                    alt={`Anteprima ${idx + 1}`} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* 3. GRIGLIA DESKTOP (Layout Bento) - Solo Desktop */}
            {images.length >= 5 && (
                <div className="hidden md:grid grid-cols-4 gap-2 h-40">
                    <div className="col-span-1 rounded-xl overflow-hidden cursor-pointer group" onClick={() => openLightbox(1)}>
                        <img src={images[1]} alt="Foto 2" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="col-span-1 rounded-xl overflow-hidden cursor-pointer group" onClick={() => openLightbox(2)}>
                        <img src={images[2]} alt="Foto 3" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="col-span-1 rounded-xl overflow-hidden cursor-pointer group" onClick={() => openLightbox(3)}>
                        <img src={images[3]} alt="Foto 4" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="col-span-1 rounded-xl overflow-hidden cursor-pointer group relative" onClick={() => setGalleryModalOpen(true)}>
                        <img src={images[4]} alt="Altro" className="w-full h-full object-cover blur-[2px] scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/50">
                            <span className="text-white font-bold text-lg flex items-center gap-2">
                                <Grid size={20} /> Mostra tutte
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottone "Mostra tutte" per Mobile (sotto lo scroll) */}
            <button 
                onClick={() => setGalleryModalOpen(true)} 
                className="md:hidden w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors mt-1 flex items-center justify-center gap-2"
            >
                <Grid size={16} /> Mostra tutte le {images.length} foto
            </button>
        </div>


        {/* --- MODALE LIGHTBOX (FULLSCREEN SLIDER) --- */}
        {lightboxOpen && (
            <div 
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300"
                onClick={closeLightbox}
            >
                {/* Controlli Top */}
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-[70]">
                    <span className="text-white/80 text-sm font-medium ml-2">
                        {currentImageIndex + 1} / {images.length}
                    </span>
                    <button 
                        onClick={closeLightbox}
                        className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Frecce Navigazione (Ora visibili anche su Mobile) */}
                <button
                    onClick={prevImage}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-[70] p-2 md:p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all flex items-center justify-center"
                >
                    <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button
                    onClick={nextImage}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-[70] p-2 md:p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all flex items-center justify-center"
                >
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>

                {/* Immagine */}
                <div 
                    className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
                    onClick={(e) => e.stopPropagation()} // Evita chiusura se clicchi l'immagine
                >
                    <img 
                        src={images[currentImageIndex]} 
                        alt="Ingrandimento"
                        className="max-w-full max-h-full object-contain rounded-md shadow-2xl animate-in fade-in zoom-in duration-300"
                    />
                </div>
            </div>
        )}


        {/* --- MODALE GALLERIA (GRIGLIA COMPLETA) --- */}
        {galleryModalOpen && (
            <div 
                className="fixed inset-0 z-[50] flex flex-col bg-white animate-in slide-in-from-bottom-10 duration-300"
            >
                {/* Header Modale */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Grid size={20} className="text-[#68B49B]" /> Galleria Foto
                    </h2>
                    <button 
                        onClick={() => setGalleryModalOpen(false)}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                    <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
                        {images.map((imgSrc, index) => (
                            <div 
                                key={index}
                                className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative shadow-sm"
                                onClick={() => openLightboxFromGallery(index)}
                            >
                                <img 
                                    src={imgSrc} 
                                    alt={`Galleria ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
        
        {/* Helper CSS inline per nascondere scrollbar su mobile ma mantenere scroll */}
        <style>{`
            .hide-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
    </>
  );
};