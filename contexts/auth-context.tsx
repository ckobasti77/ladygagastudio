"use client";

import { createContext, useContext, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Session = {
  userId: string;
  isAdmin: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type UserAuthResult = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
} | null;

type AuthContextValue = {
  session: Session | null;
  loginUser: (email: string, password: string) => Promise<Session | null>;
  registerUser: (firstName: string, lastName: string, email: string, password: string) => Promise<Session>;
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
  const loginUserMutation = useMutation(api.users.loginCustomer) as (args: { email: string; password: string }) => Promise<UserAuthResult>;
  const registerUserMutation = useMutation(api.users.registerCustomer) as (args: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<Exclude<UserAuthResult, null>>;

  const setAndPersistSession = (nextSession: Session) => {
    setSession(nextSession);
    localStorage.setItem("session", JSON.stringify(nextSession));
  };

  const loginUser = async (email: string, password: string) => {
    const result = await loginUserMutation({ email, password });
    if (!result) return null;
    const nextSession: Session = {
      userId: result._id,
      isAdmin: result.isAdmin === true,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
    };
    setAndPersistSession(nextSession);
    return nextSession;
  };

  const registerUser = async (firstName: string, lastName: string, email: string, password: string) => {
    const result = await registerUserMutation({ firstName, lastName, email, password });
    const nextSession: Session = {
      userId: result._id,
      isAdmin: false,
      firstName: result.firstName,
      lastName: result.lastName,
      email: result.email,
    };
    setAndPersistSession(nextSession);
    return nextSession;
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("session");
  };

  const value = { session, loginUser, registerUser, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
