import React from "react";
import { HOGU_COLORS, HOGU_THEME } from "../../../config/theme.js"; // Assicurati il percorso sia corretto
import { ShieldCheck, Star, MapPin, ChevronRight, Image as ImageIcon } from "lucide-react";

export const ProviderInfoCard = ({
    providerName = "Prestige Mobility NCC",
    description = "Specializzati in trasporti di lusso dal 2015. Offriamo una flotta di Mercedes-Benz Classe S e V-Class sempre igienizzate. I nostri autisti parlano fluentemente inglese e garantiscono la massima discrezione e puntualità per ogni tipo di viaggio, dal business al leisure.",
    rating = 4.9,
    reviews = 124,
    location = "Milano, IT",
    images = [
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80", // Mercedes interior
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80", // Black car exterior
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=800&q=80"  // Driver
    ],
    logoUrl = "https://ui-avatars.com/api/?name=Prestige+Mobility&background=1A202C&color=fff&size=128", // Fallback logo
    className = ""
}) => {

    return (
        <div className={`w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            
            {/* ---- HEADER PROVIDER ---- */}
            <div className="p-6 border-b border-gray-50 flex items-start justify-between gap-4">
                <div className="flex gap-4">
                    {/* Logo / Avatar */}
                    <div className="relative">
                        <img 
                            src={logoUrl} 
                            alt={providerName} 
                            className="w-16 h-16 rounded-xl object-cover border border-gray-100 shadow-sm"
                        />
                        {/* Badge Verificato Assoluto */}
                        <div className={`absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-gray-100`}>
                            <ShieldCheck size={16} fill={HOGU_COLORS.primary} color="white" />
                        </div>
                    </div>

                    {/* Info Testuali */}
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className={`text-xl font-bold ${HOGU_THEME.text}`}>
                                {providerName}
                            </h3>
                            {/* Badge "Superhost" style */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[${HOGU_COLORS.lightAccent}] text-[${HOGU_COLORS.primary}]`}>
                                Pro
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                <span className="font-semibold text-gray-800">{rating}</span>
                                <span className="text-gray-400">({reviews})</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                                <MapPin size={14} />
                                <span>{location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- DESCRIZIONE ---- */}
            <div className="px-6 py-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Informazioni sul servizio</h4>
                <p className={`text-sm leading-relaxed ${HOGU_THEME.subtleText}`}>
                    {description}
                </p>
            </div>

            {/* ---- GALLERIA IMMAGINI (Scroll orizzontale) ---- */}
            <div className="pl-6 pb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ImageIcon size={14} />
                    Flotta & Dettagli
                </h4>
                
                {/* Contenitore Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-4 pr-6 hide-scrollbar snap-x">
                    {images.map((img, index) => (
                        <div 
                            key={index} 
                            className="relative min-w-[200px] h-32 rounded-lg overflow-hidden border border-gray-100 shadow-sm snap-start group cursor-pointer"
                        >
                            <img 
                                src={img} 
                                alt={`Dettaglio servizio ${index + 1}`} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                    ))}
                    
                    {/* Card "Vedi tutte" finale */}
                    <div className="min-w-[100px] h-32 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-300 cursor-pointer transition-all snap-start">
                        <div className={`p-2 rounded-full bg-[${HOGU_COLORS.lightAccent}]`}>
                            <ChevronRight size={16} className={`text-[${HOGU_COLORS.primary}]`} />
                        </div>
                        <span className="text-xs font-medium">Vedi tutte</span>
                    </div>
                </div>
            </div>

            {/* Stile inline per nascondere scrollbar ma mantenere funzionalità */}
            <style>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};