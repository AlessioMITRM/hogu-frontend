import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Assicurati di avere questo pacchetto installato
import { HOGU_COLORS } from '../../config/theme.js'; // Adatta il path se necessario

export const Breadcrumbs = ({ items, className = "" }) => {
  const { t } = useTranslation();

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex mt-14 mb-6 ${className}`}
    >
      <ol role="list" className="flex items-center flex-wrap gap-2 text-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isFirst = idx === 0;

          return (
            <li key={idx} className="flex items-center">
              
              {/* Separatore (non mostrarlo per il primo elemento) */}
              {!isFirst && (
                <ChevronRight className="w-4 h-4 text-gray-300 mx-1 flex-shrink-0" />
              )}

              {/* Link o Testo Corrente */}
              {isLast ? (
                // L'ultimo elemento è statico (pagina corrente)
                <span 
                  className="font-semibold text-gray-900 line-clamp-1 max-w-[200px] md:max-w-none" 
                  aria-current="page"
                >
                  {/* Se è un nome proprio (es. Ristorante X) t() restituirà la stringa stessa se non trova la chiave */}
                  {t(item.label)}
                </span>
              ) : (
                // Gli altri elementi sono link
                <Link 
                  to={item.href || '#'}
                  className={`
                    group flex items-center gap-1.5 font-medium text-gray-500 
                    transition-colors duration-200 hover:text-[${HOGU_COLORS.primary}]
                  `}
                >
                  {/* Icona Home per il primo elemento */}
                  {isFirst && item.label.toLowerCase().includes('home') && (
                    <Home className="w-4 h-4 mb-0.5 group-hover:text-[${HOGU_COLORS.primary}]" />
                  )}
                  
                  {/* Testo Link */}
                  <span>{t(item.label)}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};