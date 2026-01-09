import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../../api/apiClient";

// -------------------------------------------
// CONTEXT DEFAULT
// -------------------------------------------
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  setIsLoading: () => {},
  login: async () => {},
  logout: () => {},
  register: async () => {}
});

// -------------------------------------------
// PROVIDER
// -------------------------------------------
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // LOADER GLOBALE
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------
  // SYNC STATO DA localStorage (su mount + su evento custom)
  // -------------------------------------------
  const syncAuthState = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("authToken");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    syncAuthState();

    const onStorageChange = (e) => {
      if (e.key === "user" || e.key === "authToken") {
        syncAuthState();
      }
    };

    const onCustomChange = () => syncAuthState();

    window.addEventListener("storage", onStorageChange);
    window.addEventListener("auth-state-change", onCustomChange);

    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("auth-state-change", onCustomChange);
    };
  }, []);

  // -------------------------------------------
  // LOGIN
  // -------------------------------------------
  const login = async (email, password, role) => {
    try {
      setIsLoading(true);

      const userData = await authService.login(email, password, role);

      window.dispatchEvent(new Event("auth-state-change"));

      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("isAuthenticated");
      setUser(null);
      setIsAuthenticated(false);

      window.dispatchEvent(new Event("auth-state-change"));

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------
  // LOGOUT
  // -------------------------------------------
  const logout = () => {
    setIsLoading(true);

    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");

    window.dispatchEvent(new Event("auth-state-change"));

    setIsAuthenticated(false);
    setUser(null);

    // Manteniamo un breve delay per mostrare il loader
    setTimeout(() => {
      window.location.href = "/login";
    }, 600);
  };

  // -------------------------------------------
  // REGISTER
  // -------------------------------------------
  const register = async (userData, isProvider = false) => {
    try {
      setIsLoading(true);

      const method = isProvider
        ? authService.providerRegister
        : authService.customerRegister;

      return await method(userData);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------
  // VALORE ESPORTATO
  // -------------------------------------------
  const value = {
    isAuthenticated,
    user,
    isLoading,
    setIsLoading,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// -------------------------------------------
// HOOK custom
// -------------------------------------------
export const useAuth = () => useContext(AuthContext);
