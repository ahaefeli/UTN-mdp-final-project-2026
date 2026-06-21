'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const AuthContext = createContext();

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  // Inicialización de la sesión desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lnv_token');
      const session = localStorage.getItem('lnv_session');
      if (token) {
        try {
          const parsedUser = session ? JSON.parse(session) : parseJwt(token);
          if (parsedUser) {
            setUser(parsedUser);
            setRole(parsedUser.role || 'PLAYER');
            setIsAuthenticated(true);
          }
        } catch (e) {
          console.error('Error parseando sesión:', e);
        }
      }
      setIsInitialized(true);
    }
  }, []);

  // REGLA CRÍTICA DE REDIRECCIÓN (RBAC)
  useEffect(() => {
    if (isInitialized && isAuthenticated && role === 'PLAYER') {
      if (pathname === '/mis-jugadores' || pathname === '/inscripciones') {
        router.push('/');
      }
    }
  }, [role, pathname, isAuthenticated, isInitialized, router]);

  const login = (token, user) => {
    localStorage.setItem('lnv_token', token);
    localStorage.setItem('lnv_session', JSON.stringify(user));
    setUser(user);
    setRole(user.role || 'PLAYER');
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('lnv_token');
    localStorage.removeItem('lnv_session');
    setUser(null);
    setRole('');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role, isAuthenticated, isInitialized, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
