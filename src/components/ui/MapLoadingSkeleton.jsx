import React from 'react';
import { MapPin } from 'lucide-react';

const MapLoadingSkeleton = ({ className = "h-72 md:h-[480px]" }) => {
    return (
        <div className={`${className} w-full rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-dashed border-gray-300 animate-pulse mb-6`}>
            <MapPin className="text-gray-300 w-12 h-12 mb-3" />
            <span className="text-gray-400 text-sm font-medium">Caricamento mappa...</span>
        </div>
    );
};

export default MapLoadingSkeleton;
