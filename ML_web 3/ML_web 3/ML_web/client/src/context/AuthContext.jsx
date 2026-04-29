import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { login as apiLogin } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutCallbacksRef = useRef([]);

  const establishSession = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("ml_web_user", JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem("ml_web_token", userData.token);
    } else {
      localStorage.removeItem("ml_web_token");
    }
  }, []);

  const runLogoutCallbacks = useCallback(() => {
    logoutCallbacksRef.current.forEach((cb) => {
      try {
        cb();
      } catch (_) {
        // ignore callback errors to keep logout resilient
      }
    });
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("ml_web_user");
    const storedToken = localStorage.getItem("ml_web_token");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === "object") {
          parsed.token = storedToken || null;
          setUser(parsed);
        } else {
          localStorage.removeItem("ml_web_user");
          localStorage.removeItem("ml_web_token");
        }
      } catch (_) {
        localStorage.removeItem("ml_web_user");
        localStorage.removeItem("ml_web_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // Ensure the previous session is fully torn down before switching account.
      runLogoutCallbacks();
      setUser(null);
      localStorage.removeItem("ml_web_user");
      localStorage.removeItem("ml_web_token");

      const userData = await apiLogin({ email, password });
      establishSession(userData);
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Login failed. Please check your credentials.");
    }
  };

  const logout = useCallback(() => {
    runLogoutCallbacks();

    // Clear state and storage
    setUser(null);
    localStorage.removeItem("ml_web_user");
    localStorage.removeItem("ml_web_token");
  }, [runLogoutCallbacks]);

  const onLogout = useCallback((callback) => {
    logoutCallbacksRef.current.push(callback);
    return () => {
      logoutCallbacksRef.current = logoutCallbacksRef.current.filter((cb) => cb !== callback);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, onLogout, isAuthenticated: !!user, loading }}>
        {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

