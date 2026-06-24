'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import apiClient from '../../services/apiClient';
import { ROLE_TRANSLATIONS } from '../../utils/roles';
import styles from './page.module.css';

export default function UsuariosPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isInitialized } = useAuth();

  // Estados para datos
  const [usersList, setUsersList] = useState([]);
  const [clubsList, setClubsList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);

  // Estados para filtros
  const [search, setSearch] = useState('');
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  // Estados de carga y error
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirección si no es ADMIN
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  // Carga de clubes y equipos para los filtros
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      const fetchFiltersData = async () => {
        try {
          const [clubsRes, teamsRes] = await Promise.all([
            apiClient.get('internal/clubes/'),
            apiClient.get('internal/equipos/')
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

  // Carga de usuarios con filtros
  const loadUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedClub) params.club_id = selectedClub;
      if (selectedTeam) params.team_id = selectedTeam;

      const response = await userService.getUsers(params);
      setUsersList(response.data || []);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError('Error al sincronizar con el listado de usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      loadUsers();
    }
  }, [isAuthenticated, role, search, selectedClub, selectedTeam]);

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
      <div className={`${styles.container} custom_container`}>
      <div className={styles.wrapper}>
        {/* Cabecera */}
        <header className={styles.header}>
          <h1 className={styles.title}>Panel Global de Usuarios</h1>
          <p className={styles.subtitle}>Gestión, búsqueda y filtrado de todos los usuarios registrados en VoleyHub.</p>
        </header>

        {/* Barra de Búsqueda y Filtros */}
        <section className={styles.searchBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Buscar por nombre / DNI</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.inputSearch}
            />
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtrar por Club</label>
            <select
              value={selectedClub}
              onChange={(e) => setSelectedClub(e.target.value)}
              className={styles.selectFilter}
            >
              <option value="">Todos los Clubes</option>
              {clubsList.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Filtrar por Equipo</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className={styles.selectFilter}
            >
              <option value="">Todos los Equipos</option>
              {teamsList.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.category})
                </option>
              ))}
            </select>
          </div>

          <button onClick={loadUsers} className={styles.btnRefresh} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Actualizar'}
          </button>
        </section>

        {error && <div className={styles.errorBox}>{error}</div>}

        {/* Tabla de Usuarios */}
        <section className={styles.tableCard}>
          {isLoading && usersList.length === 0 ? (
            <div className={styles.spinner} />
          ) : usersList.length === 0 ? (
            <div className={styles.emptyState}>No se encontraron usuarios con los filtros seleccionados.</div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.userTable}>
                <thead>
                  <tr>
                    <th className={styles.tableHeaderCell}>Usuario</th>
                    <th className={styles.tableHeaderCell}>Nombre Completo</th>
                    <th className={styles.tableHeaderCell}>Rol</th>
                    <th className={styles.tableHeaderCell}>DNI</th>
                    <th className={styles.tableHeaderCell}>Club</th>
                    <th className={styles.tableHeaderCell}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr key={u.id}>
                      <td className={`${styles.tableBodyCell} ${styles.usernameCell}`}>{u.username}</td>
                      <td className={`${styles.tableBodyCell} ${styles.nameCell}`}>{u.name || '-'}</td>
                      <td className={styles.tableBodyCell}>
                        <span className={`${styles.roleBadge} ${
                          u.role === 'ADMIN' || u.role === 'CLUB_ADMIN' ? styles.badgeAdmin : u.role === 'COACH' ? styles.badgeCoach : styles.badgePlayer
                        }`}>
                          {ROLE_TRANSLATIONS[u.role] || u.role}
                        </span>
                      </td>
                      <td className={styles.tableBodyCell}>{u.dni || '-'}</td>
                      <td className={`${styles.tableBodyCell} ${styles.clubCell}`}>{u.club_name || '-'}</td>
                      <td className={styles.tableBodyCell}>
                        <span className={`${styles.statusDot} ${u.enable ? styles.statusActive : styles.statusInactive}`} />
                        {u.enable ? 'Activo' : 'Inactivo'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
