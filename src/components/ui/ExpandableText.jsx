import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { HOGU_COLORS } from '../../config/theme.js';

/**
 * Componente ExpandableText
 * Mostra un testo che può essere espanso o ridotto se supera una certa lunghezza.
 */
export const ExpandableText = ({ text, maxLength = 300 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldTruncate, setShouldTruncate] = useState(false);
    const textRef = useRef(null);

    useEffect(() => {
        if (text && text.length > maxLength) {
            setShouldTruncate(true);
        } else {
            setShouldTruncate(false);
        }
    }, [text, maxLength]);

    if (!text) return null;

    if (!shouldTruncate) {
        return <p className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-line">{text}</p>;
    }

    return (
        <div className="relative">
            <div className={`relative transition-all duration-500 ease-in-out ${isExpanded ? '' : 'max-h-[120px] overflow-hidden'}`}>
                <p ref={textRef} className="text-gray-600 text-base md:text-lg leading-relaxed whitespace-pre-line">
                    {text}
                </p>
                
                {/* Sfumatura quando chiuso */}
                {!isExpanded && (
                    <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
            </div>

            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-2 flex items-center gap-1.5 text-[${HOGU_COLORS.primary}] font-semibold text-sm hover:opacity-80 transition-opacity focus:outline-none`}
            >
                {isExpanded ? (
                    <>
                        Mostra meno
                        <ChevronUp className="w-4 h-4" />
                    </>
                ) : (
                    <>
                        Mostra altro
                        <ChevronDown className="w-4 h-4" />
                    </>
                )}
            </button>
        </div>
    );
};
