import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import SafeImage from './SafeImage.jsx';


// Questo componente riceve l'array di immagini come prop
export const ServiceImageGallery = ({ images, mainImageHeight = "h-64", thumbnailHeight = "h-24" }) => {
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
            <div className="mb-8 w-full">

                {/* DESKTOP: BENTO GRID (Compatta 360px) */}
                <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[360px] rounded-none overflow-hidden">
                    {/* 1. MAIN IMAGE (Metà sinistra) */}
                    <div
                        className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
                        onClick={() => openLightbox(0)}
                    >
                        <SafeImage
                            src={images[0]}
                            alt="Principale"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>

                    {/* 2. GRIGLIA LATERALE (4 immagini) */}
                    {[1, 2, 3, 4].map((idx) => {
                        const img = images[idx];
                        if (!img) return <div key={idx} className="bg-gray-50 col-span-1 row-span-1" />; // Placeholder vuoto

                        const isLast = idx === 4;

                        return (
                            <div
                                key={idx}
                                className="col-span-1 row-span-1 relative cursor-pointer group overflow-hidden"
                                onClick={() => isLast ? setGalleryModalOpen(true) : openLightbox(idx)}
                            >
                                <SafeImage
                                    src={img}
                                    alt={`Galleria ${idx}`}
                                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isLast ? 'blur-[2px]' : ''}`}
                                />

                                {/* Overlay per l'ultimo elemento o hover generico */}
                                {isLast ? (
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                        <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-gray-800 flex items-center gap-1.5 shadow-sm transition-transform group-hover:scale-105">
                                            <Grid size={14} /> Mostra tutte
                                        </span>
                                    </div>
                                ) : (
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* MOBILE: HERO SINGOLA (Come prima) */}
                <div
                    className={`md:hidden relative ${mainImageHeight} rounded-none overflow-hidden cursor-pointer group shadow-sm`}
                    onClick={() => openLightbox(0)}
                >
                    <SafeImage
                        src={images[0]}
                        alt="Principale"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none">
                        <Grid size={14} /> Vedi tutte ({images.length})
                    </div>
                </div>

            </div>


            {/* --- MODALE LIGHTBOX (FULLSCREEN SLIDER) --- */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300"
                    onClick={closeLightbox}
                >
                    {/* Controlli Top */}
                    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-[1110]">
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
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-[1110] p-2 md:p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all flex items-center justify-center"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                    </button>
                    <button
                        onClick={nextImage}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-[1110] p-2 md:p-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full transition-all flex items-center justify-center"
                    >
                        <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                    </button>

                    {/* Immagine */}
                    <div
                        className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
                        onClick={(e) => e.stopPropagation()} // Evita chiusura se clicchi l'immagine
                    >
                        <SafeImage
                            src={images[currentImageIndex]}
                            alt="Ingrandimento"
                            className="max-w-full max-h-full object-contain rounded-none shadow-2xl animate-in fade-in zoom-in duration-300"
                        />
                    </div>
                </div>
            )}


            {/* --- MODALE GALLERIA (GRIGLIA COMPLETA) --- */}
            {galleryModalOpen && (
                <div
                    className="fixed inset-0 z-[1050] flex flex-col bg-white animate-in slide-in-from-bottom-10 duration-300"
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
                                    className="aspect-square rounded-none overflow-hidden cursor-pointer group relative shadow-sm"
                                    onClick={() => openLightboxFromGallery(index)}
                                >
                                    <SafeImage
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