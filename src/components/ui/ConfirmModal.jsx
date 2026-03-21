import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  isDeleting = false 
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
          <Trash2 size={32} />
        </div>
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {title || t('common.confirm', 'Conferma')}
        </h3>
        <p className="text-center text-gray-500 mb-8">
          {message}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="py-3 px-6 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {cancelText || t('common.cancel', 'Annulla')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="py-3 px-6 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all flex items-center justify-center"
          >
            {isDeleting ? '...' : (confirmText || t('common.confirm', 'Elimina'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
