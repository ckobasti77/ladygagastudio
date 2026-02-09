"use client";

import { createContext, useContext, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Session = {
  userId: string;
  username: string;
  isAdmin: boolean;
};

type LoginResult = {
  _id: string;
  username: string;
  isAdmin: boolean;
} | null;

type AuthContextValue = {
  session: Session | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const initialSession: Session | null = (() => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("session");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem("session");
    return null;
  }
})();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const loginMutation = useMutation(api.users.login) as (args: { username: string; password: string }) => Promise<LoginResult>;

  const login = async (username: string, password: string) => {
    const result = await loginMutation({ username, password });
    if (!result) return false;
    const nextSession: Session = { userId: result._id, username: result.username, isAdmin: result.isAdmin };
    setSession(nextSession);
    localStorage.setItem("session", JSON.stringify(nextSession));
    return true;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("session");
  };

  const value = { session, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
