import React from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // .jsx
import { HOGU_THEME } from '../../config/theme.js'; // .js
import { Sidebar } from './Sidebar.jsx'; // .jsx

export const DashboardShell = ({ role, currentPage, setPage, children }) => {
  const { user } = useAuth();
  return (
    <div className={`flex min-h-screen ${HOGU_THEME.fontFamily}`}>
      <Sidebar role={role} currentPage={currentPage} setPage={setPage} />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 lg:p-8">
          <h1 className={`text-3xl font-bold mb-6 ${HOGU_THEME.text}`}>
            {children.props.title}
          </h1>
          <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};