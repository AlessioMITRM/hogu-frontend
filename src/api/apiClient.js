import axios from 'axios';

// Base configuration
const ENV_URL = import.meta.env.VITE_API_BASE_URL;
const DYNAMIC_URL = `${window.location.protocol}//${window.location.hostname}:8080`;
const BASE_URL =
  ENV_URL && ENV_URL.includes('localhost') && window.location.hostname !== 'localhost'
    ? DYNAMIC_URL
    : (ENV_URL || DYNAMIC_URL);

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

  async providerRegister(formData) {
    try {
      const response = await apiClient.post('/api/public/auth/provider-register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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
  },

  async updateCustomerProfile(profileData) {
    try {
      const response = await apiClient.put('/api/customer/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Update profile failed');
    }
  },

  async getCustomerProfile() {
    try {
      const response = await apiClient.get('/api/customer/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Get profile failed');
    }
  },

  async updateProviderProfile(profileData) {
    try {
      const response = await apiClient.put('/api/provider/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Update profile failed');
    }
  },

  async getProviderProfile() {
    try {
      const response = await apiClient.get('/api/provider/auth/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Get profile failed');
    }
  },

  async deleteCustomerAccount() {
    try {
      const response = await apiClient.delete('/api/customer/auth/account');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Account deletion failed');
    }
  },

  async deleteProviderAccount() {
    try {
      const response = await apiClient.delete('/api/provider/auth/account');
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Account deletion failed');
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

  async getBookingsHistory(clubId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/${clubId}/bookings-history`, {
        params: { page, size }
      });

      return response.data;
    } catch (error) {
      console.error("Errore getBookingsHistory:", error);
      throw error;
    }
  },

  async getBookingsPending(clubId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/${clubId}/bookings-pending`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsPending:", error);
      throw error;
    }
  },

  async cancelBooking(bookingId, reason) {
    try {
      const response = await apiClient.delete(`/api/provider/services/club/booking/${bookingId}`, {
        params: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Errore cancelBooking:', error);
      throw error;
    }
  },

  async acceptBooking(bookingId) {
    try {
      const response = await apiClient.post(`/api/provider/services/club/booking/${bookingId}/confirm`);
      return response.data;
    } catch (error) {
      console.error('Errore acceptBooking:', error);
      throw error;
    }
  },

  async validateClubBookingForEvent(eventId, bookingId) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/event/${eventId}/booking/validate`, {
        params: { bookingId }
      });
      return response.data;
    } catch (error) {
      console.error("Errore validateClubBookingForEvent:", error);
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

  async deleteEventProvider(eventId) {
    try {
      const response = await apiClient.delete(`/api/provider/services/club/event/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Errore delete event:', error);
      throw error;
    }
  },

  async getClubProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/club/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch Club provider details for ID ${id}`, error);
      throw error;
    }
  },

  async updateClubProvider(id, formData) {
    try {
      const response = await apiClient.put(
        `/api/provider/services/club/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update Club:', error);
      throw error;
    }
  },

  async createClubProvider(formData) {
    try {
      const response = await apiClient.post(
        `/api/provider/services/club/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create Club:', error);
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

  // --- PROVIDER METHODS ---

  async getInfoProvider() {
    try {
      const response = await apiClient.get('/api/provider/services/restaurant/get-info');
      return response.data;
    } catch (error) {
      console.error("Errore getInfo:", error);
      throw error;
    }
  },

  async getBookings(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/${serviceId}/bookings`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookings:", error);
      throw error;
    }
  },

  async getBookingsPending(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/${serviceId}/bookings-pending`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsPending:", error);
      throw error;
    }
  },

  async getBookingsHistory(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/${serviceId}/bookings-history`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsHistory:", error);
      throw error;
    }
  },

  async getBookingsUpcoming(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/${serviceId}/bookings-upcoming`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsUpcoming:", error);
      throw error;
    }
  },

  async getCompletedBookingsForCommissions(page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/bookings-completed-commissions`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getCompletedBookingsForCommissions:", error);
      throw error;
    }
  },

  async validateBookingCode(code) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/booking/validate`, {
        params: { code }
      });
      return response.data;
    } catch (error) {
      console.error("Errore validateBookingCode:", error);
      throw error;
    }
  },

  async payRestaurantCommissions() {
    try {
      const response = await apiClient.post(`/api/provider/services/restaurant/commissions/paypal`);
      return response.data;
    } catch (error) {
      console.error("Errore payRestaurantCommissions:", error);
      throw error;
    }
  },

  async executeRestaurantCommissionsPayment(paymentId, payerId) {
    try {
      const response = await apiClient.post(`/api/provider/services/restaurant/commissions/paypal/execute`, null, {
        params: { paymentId, payerId }
      });
      return response.data;
    } catch (error) {
      console.error("Errore executeRestaurantCommissionsPayment:", error);
      throw error;
    }
  },

  async payRestaurantCommissionsStripe() {
    try {
      const response = await apiClient.post(`/api/provider/services/restaurant/commissions/stripe`);
      return response.data;
    } catch (error) {
      console.error("Errore payRestaurantCommissionsStripe:", error);
      throw error;
    }
  },

  async executeRestaurantCommissionsPaymentStripe(paymentId) {
    try {
      const response = await apiClient.post(`/api/provider/services/restaurant/commissions/stripe/execute`, null, {
        params: { paymentId }
      });
      return response.data;
    } catch (error) {
      console.error("Errore executeRestaurantCommissionsPaymentStripe:", error);
      throw error;
    }
  },

  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/api/provider/services/restaurant/booking/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId, reason) {
    // Usiamo DELETE per coerenza con il backend aggiornato
    const response = await apiClient.delete(`/api/provider/services/restaurant/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },

  async rectifyBooking(bookingId, newPrice, note) {
    const response = await apiClient.put(`/api/provider/services/restaurant/booking/${bookingId}/rectify`, { price: newPrice, note });
    return response.data;
  },

  async cancelBooking(bookingId, reason) {
    // Usiamo DELETE per coerenza con il backend aggiornato
    const response = await apiClient.delete(`/api/provider/services/restaurant/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },

  async reportComplaint(bookingId, reason) {
    const response = await apiClient.post(`/api/provider/services/restaurant/booking/${bookingId}/complaint`, { reason });
    return response.data;
  },

  async getRestaurantProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/restaurant/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch restaurant provider details for ID ${id}`, error);
      throw error;
    }
  },

  async updateRestaurantProvider(id, formData) {
    try {
      const response = await apiClient.put(
        `/api/provider/services/restaurant/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update restaurant:', error);
      throw error;
    }
  },

  async createRestaurantProvider(formData) {
    try {
      const response = await apiClient.post(
        `/api/provider/services/restaurant/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create restaurant:', error);
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
          searchTerm,
          location,
          checkIn,
          checkOut,
          adults,
          children,
          rooms
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active BnBs', error);
      throw error;
    }
  },

  async getBnBDetail(id, checkIn, checkOut) {
    try {
      const params = {};
      if (checkIn) params.checkIn = checkIn;
      if (checkOut) params.checkOut = checkOut;

      const response = await apiClient.get(`/api/public/services/bnb/room/${id}`, { params });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch BnB details for ID ${id}`, error);
      throw error;
    }
  },

  // --- PROVIDER METHODS ---
  async getInfoProvider() {
    try {
      const response = await apiClient.get('/api/provider/services/bnb/get-info');
      return response.data;
    } catch (error) {
      console.error("Errore getInfo:", error);
      throw error;
    }
  },

  async getBookings(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/bnb/${serviceId}/bookings`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookings:", error);
      throw error;
    }
  },

  async getBookingsPending(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/bnb/${serviceId}/bookings-pending`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsPending:", error);
      throw error;
    }
  },

  async getBookingsHistory(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/bnb/${serviceId}/bookings-history`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsHistory:", error);
      throw error;
    }
  },

  async getBookingsUpcoming(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/bnb/${serviceId}/bookings-upcoming`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsUpcoming:", error);
      throw error;
    }
  },

  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/api/provider/services/bnb/booking/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId, reason) {
    const response = await apiClient.delete(`/api/provider/services/bnb/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },
  
  async cancelBooking(bookingId, reason) {
    const response = await apiClient.delete(`/api/provider/services/bnb/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },

  async getBnBProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/bnb/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch bnb provider details for ID ${id}`, error);
      throw error;
    }
  },

  async updateBnBProvider(id, formData) {
    try {
      const response = await apiClient.put(
        `/api/provider/services/bnb/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update bnb:', error);
      throw error;
    }
  },

  async createBnBProvider(formData) {
    try {
      const response = await apiClient.post(
        `/api/provider/services/bnb/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create bnb:', error);
      throw error;
    }
  },

  async getAllRoomsProvider(page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/provider/services/bnb/rooms', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getAllRoomsProvider:", error);
      throw error;
    }
  },

  async getRoomProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/bnb/rooms/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Errore getRoomProvider per ID ${id}:`, error);
      throw error;
    }
  },

  async createRoomProvider(formData) {
    try {
      const response = await apiClient.post(
        '/api/provider/services/bnb/create-room',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore createRoomProvider:', error);
      throw error;
    }
  },

  async updateRoomProvider(id, formData) {
    try {
      const response = await apiClient.put(
        `/api/provider/services/bnb/${id}/update-room`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Errore updateRoomProvider per ID ${id}:`, error);
      throw error;
    }
  },
};

// NCC SERVICE
export const nccService = {
  async advancedSearchNcc(searchRequest, page = 0, size = 10) {
    try {
      const response = await apiClient.post(
        `/api/public/services/ncc/search?page=${page}&size=${size}`,
        searchRequest
      );
      return response.data;
    } catch (error) {
      console.error('Failed to search NCC services', error);
      throw error;
    }
  },

  async getActiveNccServices(params = {}) {
    try {
      const {
        page = 0,
        size = 10,
        fromAddress = '',
        toAddress = '',
        date = '',
        passengers = 1,
        luggage = 0
      } = params;

      const response = await apiClient.get('/api/public/services/ncc', {
        params: {
          page,
          size,
          fromAddress,
          toAddress,
          date,
          passengers,
          luggage
        }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active NCC services', error);
      throw error;
    }
  },

  async getNccDetail(id, date, time, passengers, from, fromCity, fromProvince, fromCountry, to, toCity, toProvince, toCountry, tripType) {
    try {
      const response = await apiClient.get(`/api/public/services/ncc/${id}`, {
        params: {
          date,
          time,
          passengers,
          from,
          fromCity,
          fromProvince,
          fromCountry,
          to,
          toCity,
          toProvince,
          toCountry,
          tripType
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch NCC details for ID ${id}`, error);
      throw error;
    }
  },

  // --- PROVIDER METHODS ---
  async getInfoProvider() {
    try {
      const response = await apiClient.get('/api/provider/services/ncc/get-info');
      return response.data;
    } catch (error) {
      console.error("Errore getInfo:", error);
      throw error;
    }
  },

  async getBookings(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/ncc/${serviceId}/bookings`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookings:", error);
      throw error;
    }
  },

  async getBookingsPending(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/ncc/${serviceId}/bookings-pending`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsPending:", error);
      throw error;
    }
  },

  async getBookingsHistory(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/ncc/${serviceId}/bookings-history`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsHistory:", error);
      throw error;
    }
  },

  async getBookingsUpcoming(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/ncc/${serviceId}/bookings-upcoming`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsUpcoming:", error);
      throw error;
    }
  },

  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/api/provider/services/ncc/booking/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId, reason) {
    const response = await apiClient.delete(`/api/provider/services/ncc/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },

  async getNccProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/ncc/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch ncc provider details for ID ${id}`, error);
      throw error;
    }
  },

  async updateNccProvider(id, formData) {
    try {
      const response = await apiClient.put(
        `/api/provider/services/ncc/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update ncc:', error);
      throw error;
    }
  },

  async createNccProvider(formData) {
    try {
      const response = await apiClient.post(
        `/api/provider/services/ncc/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create ncc:', error);
      throw error;
    }
  },
};

// LUGGAGE SERVICE
export const luggageService = {
  async searchLuggage(searchRequest, page = 0, size = 10) {
    try {
      const response = await apiClient.post(
        `/api/public/services/luggage/search?page=${page}&size=${size}`,
        searchRequest
      );
      return response.data;
    } catch (error) {
      console.error('Failed to search Luggage services', error);
      throw error;
    }
  },

  async getActiveLuggageServices(params = {}) {
    try {
      const { page = 0, size = 10 } = params;
      const response = await apiClient.get('/api/public/services/luggage', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch active Luggage services', error);
      throw error;
    }
  },

  async getLuggageDetail(id) {
    try {
      const response = await apiClient.get(`/api/public/services/luggage/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch Luggage details for ID ${id}`, error);
      throw error;
    }
  },

  // --- PROVIDER METHODS ---
  async getInfoProvider() {
    try {
      const response = await apiClient.get('/api/provider/services/luggage/get-info');
      return response.data;
    } catch (error) {
      console.error("Errore getInfo:", error);
      throw error;
    }
  },

  async getLuggageProvider(id) {
    try {
      const response = await apiClient.get(`/api/provider/services/luggage/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch Luggage provider details for ID ${id}`, error);
      throw error;
    }
  },

  async updateLuggageProvider(id, formData) {
    try {
      const response = await apiClient.put(
        `/api/provider/services/luggage/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore update luggage:', error);
      throw error;
    }
  },

  async createLuggageProvider(formData) {
    try {
      const response = await apiClient.post(
        `/api/provider/services/luggage/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Errore create luggage:', error);
      throw error;
    }
  },

  async getAllLuggageServicesByProvider(page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/provider/services/luggage', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getAllLuggageServicesByProvider:", error);
      throw error;
    }
  },

  async getBookings(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/luggage/${serviceId}/bookings`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookings:", error);
      throw error;
    }
  },

  async getBookingsHistory(serviceId, page = 0, size = 10) {
    try {
      const response = await apiClient.get(`/api/provider/services/luggage/${serviceId}/bookings-history`, {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingsHistory:", error);
      throw error;
    }
  },

  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/api/provider/services/luggage/booking/${bookingId}/confirm`);
    return response.data;
  },

  async rejectBooking(bookingId, reason) {
    const response = await apiClient.delete(`/api/provider/services/luggage/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },

  async cancelBooking(bookingId, reason) {
    const response = await apiClient.delete(`/api/provider/services/luggage/booking/${bookingId}`, {
      params: { reason }
    });
    return response.data;
  },

  async reportComplaint(bookingId, reason) {
    const response = await apiClient.post(`/api/provider/services/luggage/booking/${bookingId}/complaint`, { reason });
    return response.data;
  },

  async rectifyBooking(bookingId, newPrice, note) {
    const response = await apiClient.put(`/api/provider/services/luggage/booking/${bookingId}/rectify`, { price: newPrice, note });
    return response.data;
  }
};

// ADMIN SERVICE
export const adminService = {
  async getDashboardKpis() {
    try {
      const response = await apiClient.get('/api/admin/kpis');
      return response.data;
    } catch (error) {
      console.error("Errore getDashboardKpis:", error);
      throw error;
    }
  },

  async getCustomers(search = "", page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/admin/customers', {
        params: { search, page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getCustomers:", error);
      throw error;
    }
  },

  async getCustomerById(userId) {
    try {
      const response = await apiClient.get(`/api/admin/customers/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Errore getCustomerById:", error);
      throw error;
    }
  },

  async getProviders(search = "", page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/admin/providers', {
        params: { search, page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getProviders:", error);
      throw error;
    }
  },

  async getPendingVerifications() {
    try {
      const response = await apiClient.get('/api/admin/verifications/pending');
      return response.data;
    } catch (error) {
      console.error("Errore getPendingVerifications:", error);
      throw error;
    }
  },

  async approveVerification(id) {
    try {
      const response = await apiClient.post(`/api/admin/verifications/${id}/approve`);
      return response.data;
    } catch (error) {
      console.error("Errore approveVerification:", error);
      throw error;
    }
  },

  async rejectVerification(id, motivation) {
    try {
      const response = await apiClient.post(`/api/admin/verifications/${id}/reject`, null, {
        params: { motivation }
      });
      return response.data;
    } catch (error) {
      console.error("Errore rejectVerification:", error);
      throw error;
    }
  },

  async getProviderDocuments(providerId) {
    try {
      const response = await apiClient.get(`/api/admin/providers/${providerId}/documents`);
      return response.data;
    } catch (error) {
      console.error("Errore getProviderDocuments:", error);
      throw error;
    }
  },

  async getVerificationDocument(documentId) {
    try {
      const response = await apiClient.get(`/api/admin/verifications/documents/${documentId}`);
      return response.data;
    } catch (error) {
      console.error("Errore getVerificationDocument:", error);
      throw error;
    }
  },

  async getBookings(search = "", page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/admin/bookings', {
        params: { search, page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookings:", error);
      throw error;
    }
  },

  async getBookingById(bookingId) {
    try {
      const response = await apiClient.get(`/api/admin/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      console.error("Errore getBookingById:", error);
      throw error;
    }
  },

  async updateBookingStatus(bookingId, status, statusReason) {
    try {
      const response = await apiClient.put(`/api/admin/bookings/${bookingId}/status`, {
        status,
        statusReason
      });
      return response.data;
    } catch (error) {
      console.error("Errore updateBookingStatus:", error);
      throw error;
    }
  },

  async updateUserStatus(userId, status) {
    try {
      const response = await apiClient.put(`/api/admin/users/${userId}/status`, null, {
        params: { status }
      });
      return response.data;
    } catch (error) {
      console.error("Errore updateUserStatus:", error);
      throw error;
    }
  }
};

// PAYMENT SERVICE
export const paymentService = {
  async startPayPalPayment(paymentData) {
    try {
      const response = await apiClient.post('/api/customer/payment/paypal', paymentData);
      return response.data;
    } catch (error) {
      console.error("Errore startPayPalPayment:", error);
      throw error;
    }
  },

  async executePayPalPayment(paymentId, payerId) {
    try {
      const response = await apiClient.post('/api/customer/payment/paypal/execute', null, {
        params: { paymentId, payerId }
      });
      return response.data;
    } catch (error) {
      console.error("Errore executePayPalPayment:", error);
      throw error;
    }
  },

  async getBookingInfoByPaymentId(paymentId) {
    try {
      const response = await apiClient.get('/api/customer/payment/paypal/booking-info', {
        params: { paymentId }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getBookingInfoByPaymentId:", error);
      throw error;
    }
  },

  async processStripePayment(paymentData) {
    try {
      const response = await apiClient.post('/api/customer/payment/stripe', paymentData);
      return response.data;
    } catch (error) {
      console.error("Error processStripePayment:", error);
      throw error;
    }
  }
};

// BOOKING SERVICE (Unified)
export const bookingService = {
  async getPendingPaymentBooking() {
    try {
      const response = await apiClient.get('/api/customer/payment/booking/pending-payment');
      return response.data;
    } catch (error) {
      // Se non ci sono prenotazioni pendenti (404), restituiamo null senza loggare errore
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error("Error getting pending payment booking:", error);
      throw error;
    }
  },

  async createRestaurantBooking(restaurantId, bookingData) {
    try {
      const response = await apiClient.post(`/api/customer/services/restaurants/${restaurantId}/bookings`, bookingData);
      return response.data;
    } catch (error) {
      console.error("Error creating restaurant booking:", error);
      throw error;
    }
  },

  async createBnbBooking(userId, bookingData) {
    try {
      const response = await apiClient.post(`/api/customer/services/bnb/bookings`, bookingData, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error("Error creating B&B booking:", error);
      throw error;
    }
  },

  async createClubBooking(clubId, bookingData) {
    try {
      const response = await apiClient.post(`/api/customer/services/club/${clubId}/booking`, bookingData);
      return response.data;
    } catch (error) {
      console.error("Error creating Club booking:", error);
      throw error;
    }
  },

  async createNccBooking(nccId, bookingData) {
    try {
      const response = await apiClient.post(`/api/customer/services/ncc/${nccId}/bookings`, bookingData);
      return response.data;
    } catch (error) {
      console.error("Error creating NCC booking:", error);
      throw error;
    }
  },

  async createLuggageBooking(luggageId, bookingData) {
    try {
      const response = await apiClient.post(`/api/customer/services/luggage/bookings`, bookingData);
      return response.data;
    } catch (error) {
      console.error("Error creating Luggage booking:", error);
      throw error;
    }
  },

  async cancelBooking(bookingId, serviceType) {
    try {
      // Use the generic payment controller endpoint for cancellation
      const response = await apiClient.delete(`/api/customer/payment/booking/${bookingId}/cancel`, {
        params: { serviceType }
      });
      return response.data;
    } catch (error) {
      console.error("Errore cancelBooking:", error);
      throw error;
    }
  }
};

// CUSTOMER SERVICE
export const customerService = {
  async getUpcomingBookings(page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/customer/services/upcoming-bookings', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getUpcomingBookings:", error);
      throw error;
    }
  },

  async getPastBookings(page = 0, size = 10) {
    try {
      const response = await apiClient.get('/api/customer/services/past-bookings', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      console.error("Errore getPastBookings:", error);
      throw error;
    }
  },

  async cancelBooking(bookingId, serviceType) {
    try {
      // Use the generic payment controller endpoint for cancellation
      const response = await apiClient.delete(`/api/customer/payment/booking/${bookingId}/cancel`, {
        params: { serviceType }
      });
      return response.data;
    } catch (error) {
      console.error("Errore cancelBooking:", error);
      throw error;
    }
  }
};

export default apiClient;
