import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [purchasedPersonas, setPurchasedPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyUserData = (data) => {
    setUser(data);
    setPurchasedPersonas(data.purchased_personas ?? []);
  };

  const clearAuth = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setPurchasedPersonas([]);
  };

  const fetchMe = async (t) => {
    try {
      const res = await apiClient.get("/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      });
      applyUserData(res.data);
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // 앱 마운트 시 토큰 있으면 사용자 정보 복원
  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    await fetchMe(newToken);
  };

  const logout = () => {
    clearAuth();
    navigate("/");
  };

  const refreshUser = async () => {
    if (token) await fetchMe(token);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, purchasedPersonas, login, logout, refreshUser, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
}
