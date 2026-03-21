import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HOGU_COLORS } from "../../../config/theme.js";
import { mapService } from "../../../api/apiClient.js";
import { 
  MapPin, 
  Clock, 
  Euro, 
  Navigation, 
  Car, 
  CircleDashed, 
  Repeat, 
  ArrowRight
} from "lucide-react";

export const RouteMapNCC = ({
    from,
    fromAddress, 
    to,
    toAddress,   
    tripType = "oneway",
    estimatedPrice,
    distanceKm, // Distanza calcolata dal backend (Stadia Maps)
    className = "",
    fromCoordinates,
    toCoordinates
}) => {
    const { t } = useTranslation();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [routeData, setRouteData] = useState(null);
    const [error, setError] = useState(null);

    const isRoundTrip = tripType === "roundtrip";

    // Costanti per la stima (fallback solo se estimatedPrice non c'è)
    const PRICE_PER_KM = 2.5; 
    const BASE_FEE = 25; 

    useEffect(() => {
        const initMap = async () => {
            setLoading(true);
            setError(null);

            const toNumber = (v) => {
                const n = typeof v === 'string' ? parseFloat(v) : v;
                return typeof n === 'number' && !Number.isNaN(n) ? n : null;
            };
            const normalizeCoordObj = (obj) => {
                if (!obj) return null;
                const lat = toNumber(obj.lat ?? obj.latitude);
                const lon = toNumber(obj.lon ?? obj.lng ?? obj.longitude);
                const display_name = obj.display_name ?? obj.fullAddress ?? obj.address;
                if (lat != null && lon != null) return { lat, lon, display_name };
                return null;
            };
            const geocodeViaBackend = async (query) => {
                if (!query) return null;
                try {
                    const data = await mapService.getCoordinatesFromAddress(query);
                    return normalizeCoordObj(data);
                } catch (e) {
                    return null;
                }
            };

            const startQuery = fromAddress || from;
            const endQuery = toAddress || to;

            let startCoords = normalizeCoordObj(fromCoordinates);
            let endCoords = normalizeCoordObj(toCoordinates);
            if (!startCoords) startCoords = await geocodeViaBackend(startQuery);
            if (!endCoords) endCoords = await geocodeViaBackend(endQuery);

            if (!startCoords || !endCoords) {
                setError(t('ncc_detail.route.error_route'));
                setLoading(false);
                return;
            }

            // 2. Ottieni Percorso (OSRM)
            let routeGeometry = null;
            let distance = 0;
            let duration = 0;

            try {
                const routeRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}?overview=full&geometries=geojson`);
                const routeJson = await routeRes.json();
                
                if (routeJson.routes && routeJson.routes.length > 0) {
                    const route = routeJson.routes[0];
                    routeGeometry = route.geometry;
                    distance = route.distance / 1000; // metri -> km
                    duration = route.duration / 60; // secondi -> minuti
                }
            } catch (e) {
                console.error("Routing error", e);
            }

            // 3. Inizializza Mappa
            if (mapRef.current) {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                }

                const map = L.map(mapRef.current, {
                    scrollWheelZoom: false,
                    zoomControl: false
                });
                mapInstanceRef.current = map;

                L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                    attribution: '&copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 20
                }).addTo(map);
                
                L.control.zoom({ position: 'topleft' }).addTo(map);

                // Custom Icons
                const createCustomIcon = (color) => L.divIcon({
                    className: 'bg-transparent',
                    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>`,
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                    popupAnchor: [0, -12]
                });

                const primaryColor = HOGU_COLORS.primary || '#68B49B';
                const startIcon = createCustomIcon(primaryColor);
                const endIcon = createCustomIcon('#4F46E5'); // Indigo for destination to distinguish

                const startMarker = L.marker([startCoords.lat, startCoords.lon], { icon: startIcon }).addTo(map);
                startMarker.bindPopup(`<b>${t('ncc_detail.route.departure')}</b><br>${startCoords.display_name}`).openPopup();

                const endMarker = L.marker([endCoords.lat, endCoords.lon], { icon: endIcon }).addTo(map);
                endMarker.bindPopup(`<b>${t('ncc_detail.route.arrival')}</b><br>${endCoords.display_name}`);

                // Route Line
                if (routeGeometry) {
                    const latlngs = routeGeometry.coordinates.map(coord => [coord[1], coord[0]]); // GeoJSON is lon,lat -> Leaflet needs lat,lon
                    const polyline = L.polyline(latlngs, { color: primaryColor, weight: 5, opacity: 0.8 }).addTo(map);
                    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
                } else {
                    // Fallback bounds se non c'è rotta
                    const group = new L.featureGroup([startMarker, endMarker]);
                    map.fitBounds(group.getBounds(), { padding: [50, 50] });
                }
            }

            // 4. Aggiorna Dati
            const baseDist = distanceKm || distance;
            const totalKm = isRoundTrip ? baseDist * 2 : baseDist;
            const totalMinutes = isRoundTrip ? duration * 2 : duration;
            
            // Usa il prezzo dal backend se disponibile, altrimenti fallback
            let finalPrice;
            if (estimatedPrice !== undefined && estimatedPrice !== null) {
                finalPrice = estimatedPrice;
            } else {
                let fallbackCost = (totalKm * PRICE_PER_KM) + BASE_FEE;
                if (isRoundTrip) fallbackCost = fallbackCost * 0.9;
                finalPrice = Math.round(fallbackCost);
            }

            setRouteData({
                distance: totalKm.toFixed(1),
                duration: Math.round(totalMinutes),
                price: typeof finalPrice === 'number' ? finalPrice.toFixed(2) : finalPrice,
                fromLabel: from || t('ncc_detail.route.departure'),
                toLabel: to || t('ncc_detail.route.destination'),
                fromDetail: fromAddress || startCoords.display_name,
                toDetail: toAddress || endCoords.display_name
            });

            setLoading(false);
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [from, fromAddress, to, toAddress, tripType, isRoundTrip, estimatedPrice, fromCoordinates, toCoordinates, distanceKm]);

    // ... Rendering ...
    return (
        <div className={`w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
            
            {/* MAPPA REALE */}
            <div className="relative w-full h-64 bg-slate-50 border-b border-gray-100">
                {loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#68B49B] animate-spin mb-2"></div>
                        <p className="text-xs text-gray-400">{t('ncc_detail.route.loading')}</p>
                    </div>
                )}
                
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20 p-4 text-center">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                <div ref={mapRef} className="w-full h-full z-10" />
                
                {/* Badge Tipo Viaggio */}
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200 shadow-sm z-[400]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                        {isRoundTrip ? (
                            <><Repeat size={12} className="text-[#68B49B]" /> {t('ncc_detail.route.round_trip')}</>
                        ) : (
                            <><ArrowRight size={12} className="text-[#68B49B]" /> {t('ncc_detail.route.one_way')}</>
                        )}
                    </span>
                </div>
            </div>

            {/* DATI PERCORSO */}
            {routeData && (
                <div className="p-6">
                    {/* Timeline */}
                    <div className="flex flex-col gap-0 mb-8 relative">
                        {/* Partenza */}
                        <div className="flex gap-4 items-start relative z-10 pb-6">
                            <div className="absolute left-[9px] top-6 bottom-0 w-0 border-l border-dashed border-gray-300"></div>
                            <CircleDashed className="text-gray-400 mt-1 flex-shrink-0 bg-white relative z-10" size={20} />
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t('ncc_detail.route.departure')}</p>
                                <p className="text-gray-900 font-bold text-sm leading-tight">{routeData.fromLabel}</p>
                                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{routeData.fromDetail}</p>
                            </div>
                        </div>

                        {/* Arrivo */}
                        <div className={`flex gap-4 items-start relative z-10 ${isRoundTrip ? 'pb-6' : ''}`}>
                             {isRoundTrip && (
                                <div className="absolute left-[9px] top-6 bottom-0 w-0 border-l border-dashed border-gray-300"></div>
                            )}
                            <MapPin className="text-[#68B49B] mt-1 flex-shrink-0 bg-white relative z-10" size={20} />
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{t('ncc_detail.route.destination')}</p>
                                <p className="text-gray-900 font-bold text-sm leading-tight">{routeData.toLabel}</p>
                                <p className="text-gray-500 text-xs mt-1 line-clamp-2">{routeData.toDetail}</p>
                            </div>
                        </div>

                        {/* Ritorno (se A/R) */}
                        {isRoundTrip && (
                            <div className="flex gap-4 items-start relative z-10">
                                <Repeat className="text-indigo-400 mt-1 flex-shrink-0 bg-white relative z-10" size={20} />
                                <div>
                                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-0.5">{t('ncc_detail.route.return')}</p>
                                    <p className="text-gray-900 font-bold text-sm leading-tight">{routeData.fromLabel}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="h-px w-full bg-gray-100 mb-6"></div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-gray-400">
                                <Navigation size={14} />
                                <span className="text-xs font-medium">{t('ncc_detail.route.total')}</span>
                            </div>
                            <p className="text-lg font-bold text-gray-700">{routeData.distance} km</p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1 text-gray-400">
                                <Clock size={14} />
                                <span className="text-xs font-medium">{t('ncc_detail.route.duration')}</span>
                            </div>
                            <p className="text-lg font-bold text-gray-700">~ {routeData.duration} min</p>
                        </div>

                        {/* Prezzo stimato (locale) */}
                        <div className="flex flex-col gap-1 bg-green-50 -m-2 p-2 rounded-lg border border-green-100/50">
                            <div className="flex items-center gap-1 text-[#68B49B]">
                                <Euro size={14} />
                                <span className="text-xs font-bold uppercase">{t('ncc_detail.route.estimation')}</span>
                            </div>
                            <p className="text-xl font-extrabold text-[#68B49B]">
                                € {routeData.price}
                            </p>
                        </div>
                    </div>
                    
                     <p className="text-[10px] text-gray-400 mt-4 text-center">
                        {t('ncc_detail.route.osm_info')}
                    </p>
                </div>
            )}
        </div>
    );
};
