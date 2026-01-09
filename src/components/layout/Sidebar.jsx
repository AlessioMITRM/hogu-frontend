import React from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // .jsx
import { HOGU_COLORS, HOGU_THEME } from '../../config/theme.js'; // .js
import {
  LogOut, User, DollarSign, Calendar, BookOpen,
  BarChart2, Briefcase, Settings, Users
} from 'lucide-react';

// ... (il resto del codice del componente Sidebar rimane invariato)
export const Sidebar = ({ role, currentPage, setPage }) => {
  const { logout } = useAuth();

  const navItems = {
    CUSTOMER: [
      { name: 'Dashboard', icon: BarChart2, page: 'customerDashboard' },
      { name: 'Le mie prenotazioni', icon: Calendar, page: 'customerBookings' },
      { name: 'Checkout e Pagamenti', icon: DollarSign, page: 'customerPayments' },
      { name: 'Gestione Profilo', icon: User, page: 'customerProfile' },
    ],
    PROVIDER: [
      { name: 'Dashboard Statistiche', icon: BarChart2, page: 'providerDashboard' },
      { name: 'Crea/Modifica Servizi', icon: Briefcase, page: 'providerServices' },
      { name: 'Prenotazioni Ricevute', icon: BookOpen, page: 'providerBookings' },
      { name: 'Gestione Eventi/Camere', icon: Settings, page: 'providerManagement' },
      { name: 'Gestione Profilo', icon: User, page: 'providerProfile' },
    ],
    ADMIN: [
      { name: 'Dashboard Generale', icon: BarChart2, page: 'adminDashboard' },
      { name: 'Gestione Provider', icon: Users, page: 'adminProviders' },
      { name: 'Gestione Utenti', icon: User, page: 'adminUsers' },
      { name: 'Commissioni', icon: DollarSign, page: 'adminCommissions' },
    ],
  };

  const items = navItems[role] || [];

  return (
    <div className={`w-64 flex flex-col p-4 border-r border-gray-100 ${HOGU_THEME.bg} hidden lg:flex`}>
      <h2 className={`text-2xl font-bold mb-8 ${HOGU_THEME.text}`}>Area {role}</h2>
      <nav className="flex-grow">
        {items.map((item) => (
          <div
            key={item.page}
            onClick={() => setPage(item.page)}
            className={`
              flex items-center p-3 mb-2 rounded-xl cursor-pointer transition-colors
              ${currentPage === item.page
                ? `bg-[${HOGU_COLORS.lightAccent}] text-[${HOGU_COLORS.dark}] font-semibold`
                : `text-[${HOGU_COLORS.subtleText}] hover:bg-gray-50`
              }
            `}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </div>
        ))}
      </nav>
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={logout}
          className={`flex items-center w-full p-3 rounded-xl transition-colors text-red-500 hover:bg-red-50`}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Esci
        </button>
      </div>
    </div>
  );
};