import React, { useState, useEffect } from 'react';
import { Breadcrumbs } from './Breadcrumbs.jsx';

export const PageHeader = ({ 
    breadcrumbs = [], 
    subtitle, 
    titlePart1, 
    titlePart2, 
    description,
    className = ""
}) => {
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            setIsHeaderVisible(window.scrollY < 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`bg-white pt-6 md:pt-8 pb-20 md:pb-16 px-4 lg:px-8 relative overflow-hidden ${className}`}>
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#68B49B]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="max-w-7xl mx-auto relative z-10">
                {breadcrumbs.length > 0 && (
                    <div className="mb-4">
                        <Breadcrumbs items={breadcrumbs} />
                    </div>
                )}
                
                <div className="text-center md:text-left max-w-3xl">
                    {subtitle && (
                        <span className="hidden md:flex text-[#68B49B] mt-0 md:mt-4 font-bold tracking-wider text-xs uppercase mb-1 md:mb-2 items-center gap-2 justify-center md:justify-start">
                            <div className="w-8 h-[1px] bg-[#68B49B] hidden md:block"></div> {subtitle}
                        </span>
                    )}

                    {/* Mobile Badge */}
                    {subtitle && (
                        <div className={`
                            md:hidden fixed top-20 right-4 z-40 w-max pointer-events-none 
                            transition-all duration-500 ease-in-out
                            ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
                        `}>
                            <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_-8px_rgba(104,180,155,0.4)] px-4 py-1.5 rounded-full flex items-center gap-2 pointer-events-auto">
                                <span className="flex h-1.5 w-1.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#68B49B] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#68B49B]"></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-800">
                                    {subtitle}
                                </span>
                            </div>
                        </div>
                    )}

                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 mb-2 md:mb-4 tracking-tight leading-none">
                        {titlePart1}{titlePart2 ? ',' : ''} <br className="md:hidden"/>
                        {titlePart2 && (
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#68B49B] to-[#4A8A75]">
                                {titlePart2}
                            </span>
                        )}
                    </h1>
                    {description && (
                        <p className="text-sm md:text-base text-slate-500 max-w-xl leading-relaxed mb-4 md:mb-0 font-medium mx-auto md:mx-0">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
