import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { withAuthProtection } from './../../../auth/withAuthProtection.jsx';

import ClubDashboard from './ClubDashboard';
import RestaurantDashboard from './RestaurantDashboard';
import BebDashboard from './BebDashboard';
import NccDashboard from './NccDashboard';
import LuggageDashboard from './LuggageDashboard';

const CoreDashboardBase = () => {
    const navigate = useNavigate();

    const parsedServices = JSON.parse(localStorage.getItem('services'));

    // Funzione per renderizzare il componente corretto
    // Esiste UN SOLO servizio attivo alla volta
    const renderDashboardContent = () => {
        if (parsedServices?.hasClub) {
            return <ClubDashboard />;
        }

        if (parsedServices?.hasRestaurant) {
            return <RestaurantDashboard />;
        }

        if (parsedServices?.hasBnb) {
            return <BebDashboard />;
        }

        if (parsedServices?.hasNcc) {
            return <NccDashboard />;
        }

        if (parsedServices?.hasLuggage) {
            return <LuggageDashboard />;
        }

        // Nessun servizio attivo
        navigate('/not-found', { replace: true });
        return null;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-[#68B49B] selection:text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 lg:px-8">

                {/* --- HEADER COMUNE --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1A202C] tracking-tight">
                            Dashboard Provider
                        </h1>

                    </div>

                    {/* Bottone Account / Sicurezza */}
                    <button
                        onClick={() => navigate('/provider/credential-reset')}
                        className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-50 hover:text-[#1A202C] hover:border-slate-300 transition-all shadow-sm active:scale-95"
                    >
                        <ShieldCheck size={18} />
                        Sicurezza Account
                    </button>
                </div>

                {/* --- CONTENUTO DINAMICO --- */}
                {/* Wrapper con animazione per rendere fluido il cambio */}
                <div className="animate-in fade-in zoom-in-95 duration-300">
                    {renderDashboardContent()}
                </div>

            </div>
        </div>
    );
};

// Esportazione con protezione Auth (Ruolo PROVIDER)
export const CoreDashboard = withAuthProtection(CoreDashboardBase, ['PROVIDER']);

export default CoreDashboard;