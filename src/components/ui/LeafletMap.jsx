import React, { useEffect, useRef } from 'react';
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { HOGU_COLORS } from '../../config/theme.js';
import MapLoadingSkeleton from './MapLoadingSkeleton.jsx';

const LeafletMap = ({ lat, lon, name }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        if (!lat || !lon || !mapContainerRef.current) return;

        // Cleanup istanza precedente se esiste
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const position = [lat, lon];

        // Inizializza mappa
        const map = L.map(mapContainerRef.current, {
            scrollWheelZoom: false,
            zoomControl: false
        }).setView(position, 16);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
            attribution: '&copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        L.control.zoom({ position: 'topleft' }).addTo(map);

        const customIcon = L.divIcon({
            className: 'bg-transparent',
            html: `<div style="background-color: ${HOGU_COLORS.primary || '#68B49B'}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`
        });

        L.marker(position, { icon: customIcon }).addTo(map)
            .bindPopup(`<div style="font-family: sans-serif; text-align: center; padding: 5px;"><strong>${name}</strong></div>`)
            .openPopup();

        mapInstanceRef.current = map;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lon, name]);

    if (!lat || !lon) return <MapLoadingSkeleton />;

    return (
        <div className="relative group rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-4 md:mb-6 transition-all duration-300 hover:shadow-xl">
            <div ref={mapContainerRef} className="h-64 md:h-[480px] w-full z-0" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-4 py-2 md:px-5 md:py-3 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between z-[400]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-[${HOGU_COLORS.primary || '#68B49B'}] animate-pulse`}></div>
                    <span className="font-medium">Posizione verificata</span>
                </div>
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Stadia Maps ©</span>
            </div>
        </div>
    );
};

export default LeafletMap;
