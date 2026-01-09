import axios from 'axios';

// Base configuration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR – Add Authorization token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR – Handle 401 + Token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// LOGOUT
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// AUTH SERVICE
export const authService = {
  async login(email, password, role) {
    try {
      const response = await apiClient.post('/api/public/auth/login', { email, password, role });
      const { token, user, services, expiresAt } = response.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tokenExpiry', expiresAt);
      localStorage.setItem('services', JSON.stringify(services));

      return user;
    } catch (error) {
      throw error.response?.data || new Error('Login failed');
    }
  },

  async customerRegister(userData) {
    try {
      const response = await apiClient.post('/api/public/auth/customer-register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Customer Registration failed');
    }
  },

  async providerRegister(userData) {
    try {
      const response = await apiClient.post('/api/public/auth/provider-register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Provider Registration failed');
    }
  },

  async verifyOtp(email, otpCode, isProvider = false) {
    const endpoint = isProvider
      ? '/api/public/auth/provider-otp-verification'
      : '/api/public/auth/customer-otp-verification';

    try {
      const response = await apiClient.post(endpoint, { email, otpCode });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('OTP Verification failed');
    }
  },

  async resendOtp(email, isProvider = false) {
    const endpoint = '/api/public/auth/resend-otp-verification';

    try {
      const response = await apiClient.post(endpoint, { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Resend OTP failed');
    }
  },

  async requestPasswordReset(email) {
    try {
      const response = await apiClient.post(
        '/api/public/auth/password-reset-request',
        { email }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Errore richiesta reset password');
    }
  },

  async confirmPasswordReset(email, otpCode, newPassword) {
    try {
      const response = await apiClient.post(
        '/api/public/auth/password-reset-confirm',
        { email, otpCode, newPassword }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Errore conferma password');
    }
  },

  async providerPasswordReset(password) {
    try {
      const response = await apiClient.post(
        '/api/provider/auth/password-reset-account',
        { password }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Errore conferma password');
    }
  },

  async customerPasswordReset(password) {
    try {
      const response = await apiClient.post(
        '/api/provider/auth/password-reset-account',
        { password }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Errore conferma password');
    }
  }

};

// CLUB SERVICE
export const clubService = {

  async getInfo() {
    try {
      const response = await apiClient.get('/api/provider/services/club/get-info');
      return response.data;
    } catch (error) {
      console.error("Errore getInfo:", error);
      throw error;
    }
  },

  async getAllEvents(clubId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/${clubId}/event/get-all`, {
        params: { page, size }
      });

      return response.data;
    } catch (error) {
      console.error("Errore getAllEvents:", error);
      throw error;
    }
  },

  async getEventsToday(clubId, page = 0, size = 4) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/${clubId}/event/get-all-today`, {
        params: { page, size }
      });

      return response.data;
    } catch (error) {
      console.error("Errore getEventsToday:", error);
      throw error;
    }
  },

  async getEventProvider(eventId) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/event/get-event/${eventId}`);

      return response.data;
    } catch (error) {
      console.error("Errore getEventsToday:", error);
      throw error;
    }
  },

  async getBookings(clubId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/${clubId}/bookings`, {
        params: { page, size }
      });

      return response.data;
    } catch (error) {
      console.error("Errore getBookings:", error);
      throw error;
    }
  },

  async advancedSearchClubs(searchRequest, page = 0, size = 10) {
    const response = await apiClient.post(
      `/api/public/services/club/search?page=${page}&size=${size}`,
      searchRequest
    );
    return response.data;
  },

  async getEventDetail(id) {
    try {
      const response = await apiClient.get(`/api/public/services/club/event/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch club details for ID ${id}`, error);
      throw error;
    }
  },

  async getEventDetailProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/event/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch club details for ID ${id}`, error);
      throw error;
    }
  },

  updateEventProvider: async (id, formData) => {
    try {
      const response = await apiClient.put(
        `/api/provider/services/club/event/${id}/update`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update event:', error);
      throw error;
    }
  },

  createEventProvider: async (formData) => {
    try {
      const response = await apiClient.post(
        `/api/provider/services/club/event/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create event:', error);
      throw error;
    }
  },


};

// --- SERVIZIO INFO (Nuovo) ---
export const infoService = {

  async getInfoRestaurant() {
    const response = await apiClient.get('/api/public/info/restaurant');
    return response.data;
  },

  async getInfoBnB() {
    const response = await apiClient.get('/api/public/info/bnb');
    return response.data;
  },

  async getInfoClub() {
    const response = await apiClient.get('/api/public/info/club');
    return response.data;
  }

};

// --- SERVIZIO MAPPE (Nuovo) ---
export const mapService = {

  async getCoordinatesFromAddress(address) {
    const response = await apiClient.get('/api/public/maps/geocoding', {
      params: { address }
    });
    return response.data;
  }

};

// RESTAURANT SERVICE
export const restaurantService = {
  async advancedSearchRestaurants(searchRequest, page = 0, size = 10) {
    const response = await apiClient.post(
      `/api/public/services/restaurant/search?page=${page}&size=${size}`,
      searchRequest
    );
    return response.data;
  },

  async getActiveRestaurants(params = {}) {
    try {
      const { page = 0, size = 10, searchTerm = '' } = params;

      const response = await apiClient.get('/api/public/services/restaurant', {
        params: {
          page,
          size,
          ...(searchTerm && { searchTerm })
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch restaurants', error);
      throw error;
    }
  },

  // Dettaglio Singolo (Pagina Dettaglio)
  async getRestaurantDetail(id) {
    try {
      const response = await apiClient.get(`/api/public/services/restaurant/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch restaurant details for ID ${id}`, error);
      throw error;
    }
  },
};

// BNB SERVICE
export const bnbService = {
  async advancedSearchBnB(searchRequest, page = 0, size = 10) {
    try {
      const response = await apiClient.post(
        `/api/public/services/bnb/search?page=${page}&size=${size}`,
        searchRequest
      );
      return response.data;
    } catch (error) {
      console.error('Failed to search BnB services', error);
      throw error;
    }
  },

  async getActiveBnBs(params = {}) {
    try {
      const {
        page = 0,
        size = 10,
        searchTerm = '',
        location = '',
        checkIn = '',
        checkOut = '',
        adults = 2,
        children = 0,
        rooms = 1
      } = params;

      const response = await apiClient.get('/api/public/services/bnb', {
        params: {
          page,
          size,
          ...(searchTerm && { searchTerm }),
          ...(location && { location: location }),
          ...(checkIn && { checkIn }),
          ...(checkOut && { checkOut }),
          ...(adults && { adults }),
          ...(children && { children }),
          ...(rooms && { rooms })
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch BnB services', error);
      throw error;
    }
  },

  async getBnBDetail(id, checkIn, checkOut) {
    try {
      const response = await apiClient.get(`/api/public/services/bnb/room/${id}?checkIn=${checkIn}&checkOut=${checkOut}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch BnB details for ID ${id}`, error);
      throw error;
    }
  }
};

// ** LUGGAGE LISTING SERVICE **
export const listingService = {
  /**
   * Cerca depositi bagagli.
   * Endpoint: POST /api/public/services/luggage/search
   */
  async searchLuggage(params = {}) {
    try {
      // 1. Estrazione parametri speciali
      const {
        page = 0,
        size = 10,
        ...otherParams // Qui ci sono dropOff, pickUp, bagsS, totalBags ecc.
      } = params;

      // 3. Costruzione Body per il DTO Java
      const requestBody = {
        page,
        size,
        ...otherParams,
      };

      // 4. Chiamata POST (Body come secondo argomento)
      const response = await apiClient.post('/api/public/services/luggage/search', requestBody);

      return response.data;
    } catch (error) {
      console.error("❌ Errore API searchLuggage:", error);
      // Rilanciamo l'errore per farlo gestire al componente React (ErrorModal)
      throw error.response?.data || new Error('Errore nel recupero dei servizi');
    }
  },

  async getServiceDetails(id) {
    try {
      const response = await apiClient.get(`/api/public/luggage-storage/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export const luggageService = {

  async getLuggageProvider(id) {
    try {
      const response = await apiClient.get(`/api/public/services/luggage/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch luggage details for ID ${id}`, error);
      throw error;
    }
  },

  async getLuggageDetail(id) {
    try {
      const response = await apiClient.get(`/api/public/services/luggage/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch luggage details for ID ${id}`, error);
      throw error;
    }
  },

  updateLuggageProvider: async (id, formData) => {
    try {
      const response = await apiClient.put(
        `/api/provider/services/club/event/${id}/update`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update event:', error);
      throw error;
    }
  },

  createLuggageProvider: async (formData) => {
    try {
      const response = await apiClient.post(
        `/api/provider/services/club/event/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create event:', error);
      throw error;
    }
  },

}


// NCC SERVICE
export const nccService = {
  /**
   * Esegue la ricerca dei servizi NCC.
   * Endpoint: POST /api/public/services/ncc (o /search in base al RequestMapping della classe Java)
   * * @param {Object} searchRequest - Oggetto NccSearchRequestDto
   * @param {number} page - Numero di pagina (default 0)
   * @param {number} size - Dimensione pagina (default 10)
   * @param {string} sort - Ordinamento (default 'basePrice,desc')
   */
  async search(searchRequest, page = 0, size = 10) {
    try {
      // Costruzione dei parametri di query string come richiesto dal controller Java (@RequestParam)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      }).toString();

      // NOTA: Ho ipotizzato l'URL "/api/public/services/ncc/search" per coerenza con gli altri tuoi servizi.
      // Se il Controller Java ha @RequestMapping("/api/public/services/ncc") e il metodo ha solo @PostMapping senza value,
      // l'URL potrebbe essere semplicemente "/api/public/services/ncc". Verifica il Mapping della classe.
      const response = await apiClient.post(
        `/api/public/services/ncc/search?${queryParams}`,
        searchRequest
      );

      return response.data;
    } catch (error) {
      console.error('Failed to search NCC services', error);
      // Rilancia l'errore gestito o un errore generico
      throw error.response?.data || new Error('NCC Search failed');
    }
  },

  /**
   * Recupera il dettaglio di un servizio NCC specifico (Opzionale, utile per la pagina dettaglio)
   */
  async getNccDetail(id) {
    try {
      const response = await apiClient.get(`/api/public/services/ncc/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch NCC details for ID ${id}`, error);
      throw error;
    }
  }
};

export default apiClient;