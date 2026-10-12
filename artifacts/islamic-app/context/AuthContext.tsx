import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  language: "en" | "ar" | "ur";
  theme: "light" | "dark";
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (user: User, token: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const GUEST_USER: User = {
  id: "guest-user",
  name: "طالبِ علم (Guest)",
  email: "guest@knowledgehub.local",
  role: "user",
  language: "ur",
  theme: "light",
  avatarUrl: null,
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          setIsGuest(false);
        } else {
          // Instant Guest Mode: App opens right away!
          setUser(GUEST_USER);
          setToken("guest-token");
          setIsGuest(true);
        }
      } catch {
        setUser(GUEST_USER);
        setToken("guest-token");
        setIsGuest(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const login = useCallback(async (newUser: User, newToken: string) => {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, newToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const loginAsGuest = useCallback(async () => {
    setUser(GUEST_USER);
    setToken("guest-token");
    setIsGuest(true);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
    setUser(GUEST_USER);
    setToken("guest-token");
    setIsGuest(true);
  }, []);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isGuest, login, loginAsGuest, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
