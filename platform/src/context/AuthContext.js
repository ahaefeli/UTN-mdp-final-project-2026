'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [clubId, setClubId] = useState(null);
  
  const pathname = usePathname();
  const router = useRouter();

  // Inicialización de la sesión desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('lnv_token');
      const session = localStorage.getItem('lnv_session');
      if (token) {
        try {
          // Prefer stored session; otherwise decode JWT to obtain full user data including club_id
          const parsedUser = session ? JSON.parse(session) : parseJwt(token);
          if (parsedUser) {
            setUser(parsedUser);
            setClubId(parsedUser.club_id || null);
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
    if (isInitialized && isAuthenticated) {
      if (role === 'PLAYER') {
        if (pathname === '/mis-jugadores' || pathname === '/inscripciones' || pathname === '/usuarios') {
          router.push('/');
        }
      } else if (role === 'ADMIN') {
        if (pathname === '/mis-jugadores') {
          router.push('/usuarios');
        }
      }
    }
  }, [role, pathname, isAuthenticated, isInitialized, router]);
  const login = (token, user) => {
    // Persist token and user (including club_id) in localStorage
    localStorage.setItem('lnv_token', token);
    // Ensure club_id is present; if missing, decode from JWT
    const enrichedUser = { ...user };
    if (!enrichedUser.club_id) {
      try {
        const decoded = parseJwt(token);
        if (decoded && decoded.club_id) {
          enrichedUser.club_id = decoded.club_id;
        }
      } catch (e) {
        console.error('Error extracting club_id from token:', e);
      }
    }
    localStorage.setItem('lnv_session', JSON.stringify(enrichedUser));
    setUser(enrichedUser);
    setClubId(enrichedUser.club_id || null);
    setRole(enrichedUser.role || 'PLAYER');
    setIsAuthenticated(true);
  };

  const updateSession = useCallback((partial) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...partial };
      localStorage.setItem('lnv_session', JSON.stringify(next));
      return next;
    });
    if (Object.prototype.hasOwnProperty.call(partial, 'club_id')) {
      setClubId(partial.club_id || null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('lnv_token');
    localStorage.removeItem('lnv_session');
    setUser(null);
    setClubId(null);
    setRole('');
    setIsAuthenticated(false);
    router.push('/login');
  };




  return (
    <AuthContext.Provider value={{ user, clubId, role, isAuthenticated, isInitialized, login, logout, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
