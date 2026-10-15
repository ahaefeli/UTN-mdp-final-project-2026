'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import apiClient from '../../services/apiClient';
import { ROLE_TRANSLATIONS } from '../../utils/roles';
import {
  PageHeader,
  Button,
  Alert,
  DataTable,
  LoadingState,
  EmptyState,
  StatusBadge,
} from '../../components/ui';
import chrome from '../../components/ui/PageChrome.module.css';
import styles from './page.module.css';

const USER_COLUMNS = [
  { key: 'username', label: 'Usuario' },
  { key: 'name', label: 'Nombre Completo' },
  { key: 'role', label: 'Rol' },
  { key: 'dni', label: 'DNI' },
  { key: 'club', label: 'Club' },
  { key: 'status', label: 'Estado' },
];

const ROLE_VARIANTS = {
  ADMIN: 'primary',
  CLUB_ADMIN: 'primary',
  COACH: 'accent',
  PLAYER: 'success',
};

export default function UsuariosPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  const [usersList, setUsersList] = useState([]);
  const [clubsList, setClubsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);

  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({
    total_pages: 1,
    current_page: 1,
    total_items: 0,
    page_size: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const filterKeyRef = useRef('');

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      const fetchFiltersData = async () => {
        try {
          const [clubsRes, teamsRes] = await Promise.all([
            apiClient.get('internal/clubes/'),
            apiClient.get('internal/equipos/'),
          ]);
          setClubsList(clubsRes.data?.data || []);
          setTeamsList(teamsRes.data?.data || []);
        } catch (err) {
          console.error('Error al cargar datos de filtros:', err);
        }
      };
      fetchFiltersData();
    }
  }, [isAuthenticated, role]);

  const loadUsers = async (requestPage = page) => {
    setIsLoading(true);
    setError('');
    try {
      const params = { page: requestPage, page_size: pageSize };
      if (search.trim()) params.search = search.trim();
      if (selectedClub) params.club_id = selectedClub;
      if (selectedTeam) params.team_id = selectedTeam;

      const response = await userService.getUsers(params);
      const nextPagination = response.pagination || {
        total_pages: 1,
        current_page: requestPage,
        total_items: (response.data || []).length,
        page_size: pageSize,
      };
      const currentPage = Number(nextPagination.current_page);
      setUsersList(response.data || []);
      setPagination(nextPagination);
      if (currentPage && currentPage !== requestPage) {
        setPage(currentPage);
      }
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError('Error al sincronizar con el listado de usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || role !== 'ADMIN') return;

    const filterKey = `${search}|${selectedClub}|${selectedTeam}|${pageSize}`;
    if (filterKeyRef.current !== filterKey) {
      filterKeyRef.current = filterKey;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    loadUsers(page);
  }, [isAuthenticated, role, search, selectedClub, selectedTeam, page, pageSize]);

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={chrome.page}>
        <PageHeader
          title="Panel Global de Usuarios"
          subtitle="Gestión, búsqueda y filtrado de todos los usuarios registrados en VoleyHub."
        />

        <section className={chrome.card}>
          <div className={styles.filterBar}>
            <div className={`${chrome.formGroup} ${styles.filterField}`}>
              <label className={chrome.label} htmlFor="user-search">
                Buscar por nombre / DNI
              </label>
              <input
                id="user-search"
                type="text"
                placeholder="Ej: Juan Pérez"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={chrome.input}
              />
            </div>

            <div className={`${chrome.formGroup} ${styles.filterField}`}>
              <label className={chrome.label} htmlFor="user-club-filter">
                Filtrar por Club
              </label>
              <select
                id="user-club-filter"
                value={selectedClub}
                onChange={(e) => setSelectedClub(e.target.value)}
                className={chrome.select}
              >
                <option value="">Todos los Clubes</option>
                {clubsList.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${chrome.formGroup} ${styles.filterField}`}>
              <label className={chrome.label} htmlFor="user-team-filter">
                Filtrar por Equipo
              </label>
              <select
                id="user-team-filter"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className={chrome.select}
              >
                <option value="">Todos los Equipos</option>
                {teamsList.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.category})
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={loadUsers} disabled={isLoading}>
              {isLoading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
        </section>

        {error && (
          <Alert variant="error">
            <div className={styles.alertContent}>
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError('')} aria-label="Cerrar alerta">
                ×
              </Button>
            </div>
          </Alert>
        )}

        {isLoading && usersList.length === 0 ? (
          <LoadingState label="Cargando usuarios..." />
        ) : usersList.length === 0 ? (
          <EmptyState title="No se encontraron usuarios con los filtros seleccionados." />
        ) : (
          <DataTable columns={USER_COLUMNS}>
            {usersList.map((u) => (
              <tr key={u.id}>
                <td className={styles.usernameCell}>{u.username}</td>
                <td className={styles.cellStrong}>{u.name || '-'}</td>
                <td>
                  <StatusBadge variant={ROLE_VARIANTS[u.role] || 'neutral'}>
                    {ROLE_TRANSLATIONS[u.role] || u.role}
                  </StatusBadge>
                </td>
                <td>{u.dni || '-'}</td>
                <td className={styles.clubCell}>{u.club_name || '-'}</td>
                <td>
                  <StatusBadge variant={u.enable ? 'success' : 'neutral'}>
                    {u.enable ? 'Activo' : 'Inactivo'}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        {!isLoading || usersList.length > 0 ? (
          <div className={styles.pagination}>
            <label className={styles.pageSizeField}>
              <span className={styles.paginationLabel}>Por página</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className={chrome.select}
                aria-label="Usuarios por página"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={isLoading || page <= 1}
            >
              Anterior
            </Button>
            <span className={styles.paginationLabel}>
              Página {pagination.current_page || page} de {Math.max(1, pagination.total_pages || 1)}
              {` · ${pagination.total_items || 0} usuarios`}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => current + 1)}
              disabled={isLoading || page >= Math.max(1, pagination.total_pages || 1)}
            >
              Siguiente
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
