'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LoadingState } from '../../components/ui';

export default function MiClubPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (role === 'CLUB_ADMIN') {
      router.replace('/gestion-club');
    } else if (role === 'COACH') {
      router.replace('/mis-jugadores');
    } else {
      router.replace('/');
    }
  }, [isInitialized, isAuthenticated, role, router]);

  return <LoadingState full label="Redirigiendo..." />;
}
