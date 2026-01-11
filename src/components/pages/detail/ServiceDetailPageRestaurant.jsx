import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Utensils, Star, MapPin, Clock, ChefHat, Sparkles, BookOpen } from 'lucide-react';

import { HOGU_COLORS, HOGU_THEME } from '../../../config/theme.js';

// --- IMPORT COMPONENTI RIUTILIZZABILI --
import { PrimaryButton, PrimaryEmphasis } from '../../ui/Button.jsx';
import { ServiceHeaderDetail } from '../../../components/ui/ServiceHeaderDetail.jsx';
import { ServiceImageGallery } from '../../../components/ui/ServiceImageGallery.jsx';
import { Breadcrumbs } from '../../ui/Breadcrumbs.jsx';
import { LocationAddress } from '../../ui/LocationAddress.jsx';
import LoadingScreen from '../../ui/LoadingScreen.jsx';
import ErrorModal from '../../ui/ErrorModal.jsx';

import { ServiceUnavailableOverlay } from './ServiceUnavailableOverlay.jsx'; 

// --- API ---
import { restaurantService, mapService, infoService } from '../../../api/apiClient.js';

// Base URL immagini
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const IMG_BASE_URL = `${API_BASE_URL}/uploads/`;

// --- 1. COMPONENTE MAPPA (LEAFLET) ---
const LeafletMapClub = ({ lat, lon, name }) => {
    // ... (Codice mappa invariato)
    const mapId = "service-map-container";
    const mapInitializedRef = useRef(false);

    useEffect(() => {
        if (!lat || !lon) return;

        let mapInstance = null;
        if (typeof L !== 'undefined' && document.getElementById(mapId)) {
            const container = L.DomUtil.get(mapId);
            if (container._leaflet_id) {
                container._leaflet_id = null;
            }

            if (L.Map.allMaps && L.Map.allMaps.length > 0) {
                L.Map.allMaps.forEach(m => {
                    if (m._container && m._container.id === mapId) {
                        m.remove();
                    }
                });
            }

            const position = [lat, lon];
            mapInstance = L.map(mapId, {
                scrollWheelZoom: false,
                zoomControl: false
            }).setView(position, 16);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
                attribution: '&copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(mapInstance);

            L.control.zoom({ position: 'topleft' }).addTo(mapInstance);

            const customIcon = L.divIcon({
                className: 'bg-transparent',
                html: `<div style="background-color: ${HOGU_COLORS.primary}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.4);"></div>`
            });

            L.marker(position, { icon: customIcon }).addTo(mapInstance)
                .bindPopup(`<div style="font-family: sans-serif; text-align: center; padding: 5px;"><strong>${name}</strong></div>`)
                .openPopup();
        }

        return () => {
            if (mapInstance) {
                mapInstance.remove();
            }
        };
    }, [lat, lon, name]);

    if (!lat || !lon) return (
        <div className="h-72 md:h-[480px] w-full rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 animate-pulse mb-6">
            <MapPin className="text-gray-300 w-12 h-12 mb-3" />
            <span className="text-gray-400 text-sm font-medium">Caricamento mappa...</span>
        </div>
    );

    return (
        <div className="relative group rounded-3xl overflow-hidden shadow-lg border border-gray-100 mb-6 transition-all duration-300 hover:shadow-xl">
            <div id={mapId} className="h-72 md:h-[480px] w-full z-0" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md px-5 py-3 text-xs text-gray-500 border-t border-gray-100 flex items-center justify-between z-[400]">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-[${HOGU_COLORS.primary}] animate-pulse`}></div>
                    <span className="font-medium">Posizione verificata</span>
                </div>
                <span className="opacity-60 text-[10px] uppercase tracking-wider">Stadia Maps ©</span>
            </div>
        </div>
    );
};

// --- 2. SEZIONE MENU (ELEGANCE) ---
const RestaurantMenuSection = ({ menuList, dailySpecials }) => {
    // ... (Codice menu invariato)
    if ((!menuList || menuList.length === 0) && (!dailySpecials || dailySpecials.length === 0)) {
        return (
            <div className="mt-16 p-12 bg-gray-50/30 rounded-[2rem] border border-dashed border-gray-200 text-center">
                <div className="bg-white p-5 rounded-full inline-flex shadow-[0_4px_20px_rgba(0,0,0,0.05)] mb-5">
                    <Utensils className="h-7 w-7 text-gray-300" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Menu non disponibile</h3>
                <p className="text-gray-500 text-base">Al momento il menu digitale non è visibile.</p>
            </div>
        );
    }

    const MenuItemStandard = ({ name, price, description }) => (
        <div className="flex justify-between items-start group w-full mb-6 py-1 border-b border-gray-50 last:border-0">
            <div className="flex flex-col pr-8">
                <span className={`text-[17px] font-medium text-gray-900 leading-tight group-hover:text-[${HOGU_COLORS.primary}] transition-colors`}>
                    {name}
                </span>
                {description && (
                    <span className="text-sm text-gray-500 mt-1 leading-snug">
                        {description}
                    </span>
                )}
            </div>
            {price !== undefined && (
                <span className="text-[16px] font-semibold text-gray-900 whitespace-nowrap pt-0.5">
                    € {parseFloat(price).toFixed(2)}
                </span>
            )}
        </div>
    );

    const MenuItemSpecial = ({ name, price, description }) => (
        <div className="flex flex-col items-center text-center group relative p-4">
            <span className="text-2xl font-serif text-gray-900 mb-2 leading-tight group-hover:text-amber-700 transition-colors">
                {name}
            </span>
            {description && (
                <span className="text-sm text-gray-500 mb-3 italic max-w-xs">
                    {description}
                </span>
            )}
            <div className="w-12 h-px bg-amber-400 mb-3 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"></div>
            <span className="text-lg font-bold text-amber-600 bg-amber-50/50 px-4 py-1 rounded-full border border-amber-100">
                € {parseFloat(price).toFixed(2)}
            </span>
        </div>
    );

    return (
        <div className="mt-16 relative">
            <div className="flex items-center gap-3 mb-8">
                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                    <Utensils className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Il Nostro Menu</h2>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-gray-100/50">
                {dailySpecials && dailySpecials.items && dailySpecials.items.length > 0 && (
                    <div className="mb-16 pb-12 border-b border-gray-100">
                        <div className="flex items-center justify-center gap-6 mb-10">
                            <div className="h-px w-20 bg-gradient-to-r from-transparent to-amber-300"></div>
                            <div className="flex flex-col items-center text-amber-600">
                                <ChefHat className="w-8 h-8 mb-2" strokeWidth={1.5} />
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 opacity-60" />
                                    <h3 className="text-xl font-serif font-bold tracking-wider uppercase text-gray-900">
                                        La Selezione dello Chef
                                    </h3>
                                    <Sparkles className="w-4 h-4 opacity-60" />
                                </div>
                                <span className="text-sm text-amber-600/70 font-medium mt-1 italic">Edizione Limitata</span>
                            </div>
                            <div className="h-px w-20 bg-gradient-to-l from-transparent to-amber-300"></div>
                        </div>
                        <div className="flex flex-col items-center space-y-4 px-4 md:px-12">
                            {dailySpecials.items.map((item, i) => (
                                <MenuItemSpecial key={i} name={item.name} price={item.price} description={item.description} />
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                    {menuList.map((section, idx) => (
                        <div key={idx} className="break-inside-avoid">
                            <div className="mb-10 flex flex-col items-center">
                                <h3 className={`text-sm font-bold uppercase tracking-[0.2em] text-gray-400 mb-4`}>
                                    {section.category}
                                </h3>
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                            </div>
                            <div className="">
                                {section.items && section.items.map((item, i) => (
                                    <MenuItemStandard 
                                        key={i} 
                                        name={item.name} 
                                        price={item.price} 
                                        description={item.description}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 pt-8 border-t border-gray-50 flex flex-col items-center text-center text-xs text-gray-400 font-light spacing-y-2">
                    <span className="">Le immagini sono a scopo illustrativo. Gli ingredienti possono variare in base alla stagionalità.</span>
                    <span className="mt-1 font-medium text-gray-500">* Coperto e bevande esclusi se non specificato diversamente.</span>
                </div>
            </div>
        </div>
    );
};

// --- 3. WIDGET PRENOTAZIONE ---
const generateTimeSlots = () => {
    // ... (Invariato)
    const slots = [];
    for (let hour = 12; hour <= 23; hour++) {
        slots.push(`${hour}:00`);
        if (hour < 23) slots.push(`${hour}:30`);
    }
    return slots;
};

const formatDateDocs = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(date);
};

const BookingFormContent = ({ step, setStep, data, setData, basePrice, onConfirm, timeSlots }) => {
    // ... (Codice BookingFormContent invariato dal turno precedente)
    const updateGuests = (increment) => {
        setData(prev => {
            const newVal = prev.guests + increment;
            if (newVal < 1 || newVal > 20) return prev;
            return { ...prev, guests: newVal };
        });
    };
    const estimatedTotal = basePrice * data.guests;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-[240px] flex flex-col">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full justify-center">
                        <label className="text-sm font-medium text-gray-500 mb-3 text-center">Quando vuoi venire?</label>
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-[${HOGU_COLORS.primary}]/5 rounded-2xl`}></div>
                            <div className={`relative border-2 border-[${HOGU_COLORS.primary}]/20 bg-white rounded-2xl p-4 flex items-center gap-4`}>
                                <Calendar className="h-6 w-6" style={{ color: HOGU_COLORS.primary }} />
                                <input
                                    type="date"
                                    readOnly
                                    className="block w-full bg-transparent text-lg font-bold text-gray-600 focus:outline-none cursor-not-allowed select-none"
                                    value={data.date}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-6">
                            La data è stata pre-selezionata per te.
                        </p>
                    </div>
                )}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                        <label className="text-sm font-medium text-gray-500 mb-3 text-center block">A che ora?</label>
                        <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
                            {timeSlots.map(time => (
                                <button
                                    key={time}
                                    onClick={() => setData(p => ({ ...p, time: time }))}
                                    className={`py-2 px-1 rounded-xl text-sm font-medium transition-all duration-200 border ${data.time === time
                                        ? `bg-[${HOGU_COLORS.primary}] text-white border-[${HOGU_COLORS.primary}] shadow-md`
                                        : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-300 flex flex-col h-full">
                        <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm`}>
                                    <Calendar size={14} style={{ color: HOGU_COLORS.primary }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Data</span>
                                    <span className="text-xs font-bold text-gray-900 capitalize leading-tight">
                                        {formatDateDocs(data.date)}
                                    </span>
                                </div>
                            </div>
                            <div className="w-px h-6 bg-gray-200 mx-1"></div>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm`}>
                                    <Clock size={14} style={{ color: HOGU_COLORS.primary }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Ora</span>
                                    <span className="text-xs font-bold text-gray-900 leading-tight">
                                        {data.time}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <label className="text-sm font-medium text-gray-500 mb-4 text-center block">Numero di ospiti</label>
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <button onClick={() => updateGuests(-1)} className="w-12 h-12 rounded-full border-2 border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 text-2xl pb-1">-</button>
                            <span className="text-3xl font-bold text-gray-900">{data.guests}</span>
                            <button onClick={() => updateGuests(1)} className={`w-12 h-12 rounded-full border-2 border-[${HOGU_COLORS.primary}]/30 flex items-center justify-center text-[${HOGU_COLORS.primary}] hover:bg-[${HOGU_COLORS.primary}] hover:text-white text-2xl pb-1`}>+</button>
                        </div>
                        {basePrice > 0 && (
                            <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
                                <div className="flex justify-between items-center font-bold text-gray-900 text-lg">
                                    <span>Totale stimato</span>
                                    <span>€{estimatedTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mt-6 flex gap-3 pt-4 border-t border-gray-50">
                {step > 1 && (
                    <button onClick={() => setStep(p => p - 1)} className="px-5 py-3 rounded-xl font-medium text-gray-400 hover:bg-gray-50">Indietro</button>
                )}
                <PrimaryButton
                    onClick={() => {
                        if (step < 3) setStep(p => p + 1);
                        else onConfirm(data);
                    }}
                    disabled={(step === 1 && !data.date) || (step === 2 && !data.time) || (step === 3 && !data.guests)}
                    className="flex-1 py-4 text-base font-bold shadow-lg"
                >
                    {step === 3 ? 'Conferma' : 'Continua'}
                </PrimaryButton>
            </div>
        </div>
    );
};

// --- SIDEBAR DESKTOP ---
const DesktopBookingWidget = ({ onConfirmBooking, basePrice, initialDate, initialTime, initialPersons }) => {
    // ... (Codice DesktopBookingWidget invariato)
    const [step, setStep] = useState((initialDate && initialTime) ? 3 : 1);
    const [data, setData] = useState({
        date: initialDate || '',
        time: initialTime || '',
        guests: initialPersons || 2
    });

    const timeSlots = generateTimeSlots();

    useEffect(() => {
        if (initialDate || initialTime) {
            setData(prev => ({
                ...prev,
                date: initialDate || prev.date,
                time: initialTime || prev.time
            }));
            if (initialDate && initialTime) {
                setStep(3);
            } else if (initialDate) {
                setStep(2);
            }
        }
    }, [initialDate, initialTime]);

    return (
        <div className="bg-white rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden sticky top-28">
            <div className="px-6 pt-6 pb-4 bg-white relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5" style={{ color: HOGU_COLORS.primary }} /> Prenota
                    </h2>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase">
                        Step {step}/3
                    </span>
                </div>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full bg-[${HOGU_COLORS.primary}] transition-all duration-500`}
                        style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                    />
                </div>
            </div>
            <div className="p-6 pt-2">
                <BookingFormContent
                    step={step}
                    setStep={setStep}
                    data={data}
                    setData={setData}
                    basePrice={basePrice}
                    onConfirm={onConfirmBooking}
                    timeSlots={timeSlots}
                />
            </div>
        </div>
    );
};

// --- MOBILE SHEET ---
const MobileBookingSheet = ({ onConfirmBooking, basePrice, initialDate, initialTime, initialPersons }) => {
    // ... (Codice MobileBookingSheet invariato)
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState((initialDate && initialTime) ? 3 : 1);
    const [data, setData] = useState({
        date: initialDate || '',
        time: initialTime || '',
        guests: initialPersons || 2
    });

    const timeSlots = generateTimeSlots();

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep((initialDate && initialTime) ? 3 : 1);
            }, 300);
        }
    }, [isOpen, initialDate, initialTime]);

    useEffect(() => {
        if (initialDate || initialTime) {
            setData(prev => ({
                ...prev,
                date: initialDate || prev.date,
                time: initialTime || prev.time
            }));
            if (initialDate && initialTime) setStep(3);
            else if (initialDate) setStep(2);
        }
    }, [initialDate, initialTime]);

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[900] bg-white border-t border-gray-100 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] md:hidden safe-area-bottom">
                <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Prezzo medio</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-xl font-bold text-[${HOGU_COLORS.primary}]`}>€ {basePrice}</span>
                            <span className="text-xs text-gray-400">/persona</span>
                        </div>
                    </div>
                    <PrimaryEmphasis
                        onClick={() => setIsOpen(true)}
                        className={`flex-1 py-3 text-base shadow-lg shadow-[${HOGU_COLORS.primary}]/25 active:scale-95 transition-transform`}
                    >
                        Prenota Tavolo
                    </PrimaryEmphasis>
                </div>
            </div>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[950] transition-opacity duration-300 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) md:hidden flex flex-col max-h-[85vh] ${isOpen ? 'translate-y-0' : 'translate-y-[110%]'}`}>
                <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
                    <div className="w-12 h-1.5 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400 transition-colors opacity-50"></div>
                </div>
                <div className="px-6 pt-2 pb-4 border-b border-gray-50 flex justify-between items-center bg-white rounded-t-[2rem]">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Prenota tavolo</h3>
                        <p className="text-xs text-gray-400 font-medium">Completa in 3 passaggi</p>
                    </div>
                    <div className={`w-10 h-10 rounded-full bg-[${HOGU_COLORS.primary}]/10 flex items-center justify-center font-bold text-[${HOGU_COLORS.primary}] text-sm`}>
                        {step}/3
                    </div>
                </div>
                <div className="p-6 overflow-y-auto safe-area-bottom bg-white">
                    <BookingFormContent
                        step={step}
                        setStep={setStep}
                        data={data}
                        setData={setData}
                        basePrice={basePrice}
                        onConfirm={onConfirmBooking}
                        timeSlots={timeSlots}
                    />
                </div>
            </div>
        </>
    );
};

// --- 4. PAGINA DETTAGLIO PRINCIPALE ---
export const ServiceDetailPageRestaurant = ({ id, dateFrom, timeFrom, totalPersons }) => {
    const navigate = useNavigate();

    const [service, setService] = useState(null);
    const [urgencyCount, setUrgencyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mapCoordinates, setMapCoordinates] = useState({ lat: null, lon: null });

    const loadedId = useRef(null);

    useEffect(() => {
        if (!id) return;
        if (loadedId.current === id) return;
        loadedId.current = id;

        const fetchAllData = async () => {
            try {
                setLoading(true);
                const [restaurantData, infoData] = await Promise.all([
                    restaurantService.getRestaurantDetail(id),
                    infoService.getInfoRestaurant()
                ]);

                let coords = { lat: null, lon: null };
                let addressToGeocode = "";
                if (restaurantData.serviceLocale) {
                    const locale = restaurantData.serviceLocale.find(l => l.language === 'it') || restaurantData.serviceLocale[0];
                    if (locale) addressToGeocode = `${locale.address}, ${locale.city}, ${locale.state}, ${locale.country}`;
                }

                if (addressToGeocode) {
                    try {
                        const mapData = await mapService.getCoordinatesFromAddress(addressToGeocode);
                        if (mapData && mapData.latitude) {
                            coords = { lat: mapData.latitude, lon: mapData.longitude };
                        }
                    } catch (mapError) {
                        console.warn("Non è stato possibile caricare la mappa:", mapError);
                    }
                }

                setService(restaurantData);
                setUrgencyCount(infoData);
                setMapCoordinates(coords);

            } catch (err) {
                console.error(err);
                setError(err.message || "Errore nel caricamento.");
                loadedId.current = null;
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [id]);

    const parsedData = useMemo(() => {
        if (!service) return null;

        let menuItems = [];
        let dailySpecials = null;

        try {
            if (service.menu) {
                const parsed = JSON.parse(service.menu);
                if (parsed && parsed.menu && Array.isArray(parsed.menu)) {
                    const fullMenu = parsed.menu;
                    const specialsIndex = fullMenu.findIndex(c => c.category.toLowerCase().includes('fuori menu'));
                    if (specialsIndex !== -1) {
                        dailySpecials = fullMenu[specialsIndex];
                        menuItems = fullMenu.filter((_, idx) => idx !== specialsIndex);
                    } else {
                        menuItems = fullMenu;
                    }
                }
            }
        } catch (e) { console.error("Errore parsing menu JSON:", e); }

        const locale = service.serviceLocale
            ? (service.serviceLocale.find(l => l.language === 'it') || service.serviceLocale[0])
            : null;

        const displayAddress = locale ? `${locale.address}, ${locale.city}, ${locale.country}` : "";
        const images = (service.images && service.images.length > 0)
            ? service.images.map(img => img.startsWith('http') ? img : `/files/restaurant/${id}/${img}`)
            : ['https://placehold.co/1200x800/f1f5f9/94a3b8?text=Foto+Non+Disponibile'];

        return {
            title: service.name,
            description: service.description,
            type: service.serviceType,
            price: service.basePrice,
            menuItems,
            dailySpecials,
            displayAddress,
            images,
            available: service.available !== false // Estraggo available (default true)
        };
    }, [service, id]);

    const handleBookingRedirect = (bookingData) => {
        navigate('/payment/summary', { state: { booking: bookingData, service: parsedData } });
    };

    if (loading) return <LoadingScreen isLoading={true} />;

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <ErrorModal message={error} onClose={() => navigate('/service/restaurant')} />
        </div>
    );

    if (!parsedData) return null;

    const breadcrumbsItems = [
        { label: 'Home', href: '/' },
        { label: 'Ristoranti', href: '/service/restaurant' },
        { label: parsedData.title }
    ];

    return (
        <div className={`min-h-screen bg-white ${HOGU_THEME.fontFamily} pb-24 md:pb-0`}>
            {/* Sfondo sfumato */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gray-50 to-white -z-10"></div>

            {/* --- OVERLAY NON DISPONIBILE --- */}
            {!parsedData.available && (
                <ServiceUnavailableOverlay
                    onSearchSimilar={() => navigate('/service/restaurant')}
                    onGoBack={() => navigate('/')}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8 lg:py-10">
                <Breadcrumbs items={breadcrumbsItems} className="mb-6 opacity-80" />

                <ServiceHeaderDetail title={parsedData.title} urgencyCount={urgencyCount} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* COLONNA SINISTRA */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                            <ServiceImageGallery images={parsedData.images} />
                        </div>

                        <section>
                            {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <BookOpen className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">L'Esperienza</h2>
                            </div>
                            <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{parsedData.description}</p>
                        </section>

                        <RestaurantMenuSection
                            menuList={parsedData.menuItems}
                            dailySpecials={parsedData.dailySpecials}
                        />

                        <section className="pt-8 border-t border-gray-100">
                            {/* --- HEADER UNIFORME --- */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`p-3 rounded-xl bg-[${HOGU_COLORS.primary}]/10`}>
                                    <MapPin className={`w-6 h-6 text-[${HOGU_COLORS.primary}]`} />
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight text-gray-900">Dove trovarci</h2>
                            </div>
                            <LeafletMapClub lat={mapCoordinates.lat} lon={mapCoordinates.lon} name={parsedData.title} />
                            <div className="pl-2 border-l-4 border-gray-200">
                                <LocationAddress address={parsedData.displayAddress} />
                            </div>
                        </section>
                    </div>

                    {/* COLONNA DESTRA (SOLO DESKTOP) */}
                    <div className="hidden md:block lg:col-span-4">
                        <div className="relative h-full">
                            <DesktopBookingWidget
                                onConfirmBooking={handleBookingRedirect}
                                basePrice={parsedData.price}
                                initialDate={dateFrom}
                                initialTime={timeFrom}
                                initialPersons={totalPersons}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* WIDGET MOBILE (SOLO MOBILE) */}
            <MobileBookingSheet
                onConfirmBooking={handleBookingRedirect}
                basePrice={parsedData.price}
                initialDate={dateFrom}
                initialTime={timeFrom}
                initialPersons={totalPersons}
            />
        </div>
    );
};

export default ServiceDetailPageRestaurant;