import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl as string;

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    setUser(data.user);
    setToken(data.token);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    await SecureStore.setItemAsync("token", data.token);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: "user" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    setUser(data.user);
    setToken(data.token);
    await SecureStore.setItemAsync("user", JSON.stringify(data.user));
    await SecureStore.setItemAsync("token", data.token);
  };

  const logout = async (): Promise<boolean> => {
    try {
      setUser(null);
      setToken(null);
      await SecureStore.deleteItemAsync("user");
      await SecureStore.deleteItemAsync("token");
      return true;
    } catch (err) {
      console.error("Logout failed:", err);
      return false;
    }
  };

  // Restore user and token from SecureStore
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await SecureStore.getItemAsync("user");
        const storedToken = await SecureStore.getItemAsync("token");
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
      } catch (err) {
        console.error("Failed to restore auth:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);