import React from 'react';
import { HOGU_THEME } from '../../../config/theme.js';

export const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="p-4 bg-white rounded-xl shadow-md flex items-center justify-between border border-gray-100">
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className={`text-3xl font-bold ${HOGU_THEME.text}`}>{value}</p>
    </div>
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);