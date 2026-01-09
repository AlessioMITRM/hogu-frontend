import React from 'react';
import { HOGU_THEME } from '../../config/theme.js';

export const Tag = ({ children, className }) => <span className={`px-3 py-1 rounded-full text-xs font-bold bg-[#F0FDF9] text-[#68B49B] uppercase tracking-wide ${className}`}>{children}</span>;
