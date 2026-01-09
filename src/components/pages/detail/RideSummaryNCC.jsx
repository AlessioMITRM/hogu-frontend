import React from "react";
import { HOGU_COLORS, HOGU_THEME } from "../../../config/theme.js";
import { MapPin, MapPinOff, Users, Calendar, Clock9, ArrowRight, ArrowLeft } from "lucide-react";

export const RideSummaryNCC = ({
    tripType = "oneway",               // "oneway" | "roundtrip"
    from = "",
    to = "",
    passengers = 1,
    date = "",
    time = "",
    className = ""
}) => {
    const isOneWay = tripType === "oneway";

    return (
        <div
            className={`
                p-6 bg-gray-100 rounded-3xl shadow-xl flex flex-col gap-6
                ${className}
            `}
        >

            {/* ====================================== */}
            {/*           SWITCH TIPO CORSA            */}
            {/* ====================================== */}
            <div className="flex space-x-4">
                {/* SOLO ANDATA */}
                <button
                    type="button"
                    className={`py-2 px-4 rounded-full text-base font-semibold transition-colors flex items-center
                        ${
                            isOneWay
                                ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md`
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }
                    `}
                >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Sola Andata
                </button>

                {/* ANDATA E RITORNO */}
                <button
                    type="button"
                    className={`py-2 px-4 rounded-full text-base font-semibold transition-colors flex items-center
                        ${
                            !isOneWay
                                ? `bg-[${HOGU_COLORS.primary}] text-white shadow-md`
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }
                    `}
                >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Andata e Ritorno
                </button>
            </div>

            {/* ====================================== */}
            {/*             CAMPI PRINCIPALI            */}
            {/* ====================================== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Partenza */}
                <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                    <input
                        readOnly
                        value={from}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl bg-white shadow-inner text-gray-700"
                        placeholder="Partenza"
                    />
                </div>

                {/* Destinazione */}
                <div className="relative">
                    <MapPinOff className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                    <input
                        readOnly
                        value={to}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl bg-white shadow-inner text-gray-700"
                        placeholder="Destinazione"
                    />
                </div>

                {/* Passeggeri */}
                <div className="relative">
                    <Users className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                    <input
                        readOnly
                        type="number"
                        value={passengers}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl bg-white shadow-inner text-gray-700"
                    />
                </div>

                {/* Pulsante disattivato (stile dei bottoni HOGU) */}
                <button
                    disabled
                    className={`
                        bg-[${HOGU_COLORS.primary}] text-white font-inter
                        px-6 py-3 text-base font-semibold rounded-xl transition-all 
                        shadow-[0_4px_10px_rgba(104,180,155,0.4)] opacity-60
                    `}
                >
                    Cerca NCC
                </button>
            </div>

            {/* ====================================== */}
            {/*                DATA / ORA               */}
            {/* ====================================== */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                {/* Giorno */}
                <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                    <input
                        readOnly
                        type="date"
                        value={date}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl bg-white shadow-inner text-gray-700"
                        placeholder="Data"
                    />
                </div>

                {/* Ora */}
                <div className="relative">
                    <Clock9 className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                    <input
                        readOnly
                        type="time"
                        value={time}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-xl bg-white shadow-inner text-gray-700"
                        placeholder="Ora"
                    />
                </div>
            </div>

        </div>
    );
};
