import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../ui/LoadingScreen.jsx'; 

/**
 * Higher-Order Component per proteggere le rotte.
 * @param {React.Component} WrappedComponent - Il componente (pagina) da proteggere.
 * @param {Array<string>} allowedRoles - (Opzionale) Array di ruoli permessi es: ['PROVIDER', 'ADMIN']. Se vuoto, basta essere loggati.
 */
export const withAuthProtection = (WrappedComponent, allowedRoles = [], typeService = null) => {
    return (props) => {
        const navigate = useNavigate();
        const [isAuthorized, setIsAuthorized] = useState(false);
        const [user, setUser] = useState(null);

        useEffect(() => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('authToken');

            if (!storedUser || !token) {
                navigate('/unauthorized-page', { 
                    replace: true, 
                    state: { type: 'expired' }
                });
                return;
            }

            let parsedUser;
            try {
                parsedUser = JSON.parse(storedUser);
            } catch (error) {
                localStorage.clear();
                navigate('/login');
                return;
            }
            
            if (allowedRoles.length > 0 && !allowedRoles.includes(parsedUser.role)) {
                // Utente loggato ma ruolo sbagliato -> Accesso Negato
                navigate('/unauthorized-page', { 
                    replace: true, 
                    state: { type: 'unauthorized' }
                });

                return;
            }

            if (parsedUser.role === 'PROVIDER') {
                let serviceIsAuthorized = false;
                const parsedServices = JSON.parse(localStorage.getItem('services'));
                if (typeService == "RESTAURANT") {
                    if (parsedServices.hasRestaurant)
                        serviceIsAuthorized = true;
                }
                else if (typeService == "BNB") {
                    if (parsedServices.hasBnb)
                        serviceIsAuthorized = true;
                }
                else if (typeService == "CLUB") {
                    if (parsedServices.hasClub)
                        serviceIsAuthorized = true;
                }
                else if (typeService == "NCC") {
                    if (parsedServices.hasNcc)
                        serviceIsAuthorized = true;
                }
                else if (typeService == "LUGGAGE") {
                    if (parsedServices.hasLuggage)
                        serviceIsAuthorized = true;
                }
                else {
                    serviceIsAuthorized = true;
                }

                if (!serviceIsAuthorized) {
                    navigate('/unauthorized-page', {
                        replace: true,
                        state: { type: 'unauthorized' }
                    });

                    return;
                }

            }

            setUser(parsedUser);
            setIsAuthorized(true);

        }, [navigate]);

        if (!isAuthorized) {
            return <LoadingScreen isLoading={true} />;
        }

        return <WrappedComponent {...props} user={user} />;
    };
};