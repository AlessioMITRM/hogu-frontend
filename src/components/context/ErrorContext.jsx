import React, { createContext, useState, useContext } from 'react';

const ErrorContext = createContext({
  error: null,
  setError: () => {},
  clearError: () => {},
});

export const ErrorProvider = ({ children }) => {
  const [error, setErrorState] = useState(null);

  const setError = (errorMessage, errorDetails = {}) => {
    setErrorState({
      message: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
    });
  };

  const clearError = () => {
    setErrorState(null);
  };

  const value = {
    error,
    setError,
    clearError,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
};

// Custom hook for using error context
export const useError = () => {
  const context = useContext(ErrorContext);
  
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  
  return context;
};

// Utility function to handle API errors
export const handleApiError = (error, setError) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        setError('Richiesta non valida', data);
        break;
      case 401:
        setError('Non autorizzato. Effettua nuovamente il login.', data);
        break;
      case 403:
        setError('Accesso negato. Verifica i tuoi permessi.', data);
        break;
      case 404:
        setError('Risorsa non trovata', data);
        break;
      case 500:
        setError('Errore interno del server', data);
        break;
      default:
        setError('Si è verificato un errore imprevisto', data);
    }
  } else if (error.request) {
    // The request was made but no response was received
    setError('Nessuna risposta dal server. Controlla la connessione internet.');
  } else {
    // Something happened in setting up the request
    setError('Errore nella configurazione della richiesta', error.message);
  }
};
