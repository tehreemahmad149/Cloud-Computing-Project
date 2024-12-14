"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/firebase";

interface AuthContextProps {
  user: User | null;
  token: string | null;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          setUser(firebaseUser);
          const idToken = await firebaseUser.getIdToken(true); // Force refresh token
          setToken(idToken);
        } catch (error) {
          console.error("Error fetching Firebase token:", error);
          setToken(null); // Clear token if retrieval fails
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setInitialized(true); // Mark Firebase as initialized
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
