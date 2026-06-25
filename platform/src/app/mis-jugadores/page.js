'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import authService from '../../services/authService';
import playerService from '../../services/playerService';
import { userService } from '../../services/userService';
import teamService from '../../services/teamService';

export default function MisJugadoresPage() {
  const router = useRouter();
  
  // Estados reactivos
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selección temporal para asignación de equipos
  const [selectedTeamsMap, setSelectedTeamsMap] = useState({});

  // Estados para Modal de Nuevo Jugador
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ user: '', email: '', password: '', dni: '', name: '', role: 'PLAYER' });

  // Validación de la sesión en el cliente
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      loadAllData();
    }
  }, [router]);

  const loadAllData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await Promise.all([loadPlayers(), loadTeams()]);
    } catch (err) {
      console.error('Error al cargar datos iniciales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Consumir datos de jugadores del backend
  const loadPlayers = async () => {
    try {
      const response = await playerService.getPlayers();
      setPlayers(response.data || []);
    } catch (err) {
      console.error('Error al cargar jugadores:', err);
      setErrorMsg('Ocurrió un error al obtener la lista de jugadores.');
    }
  };

  // Consumir datos de equipos del backend
  const loadTeams = async () => {
    try {
      const response = await teamService.getTeams();
      setTeams(response.data || []);
    } catch (err) {
      console.error('Error al cargar equipos:', err);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      await userService.createUser(formData);
      setShowCreateModal(false);
      setFormData({ user: '', email: '', password: '', dni: '', name: '', role: 'PLAYER' });
      setSuccessMsg('¡Jugador registrado y federado exitosamente!');
      await loadAllData();
    } catch (err) {
      console.error('Error al registrar jugador:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo crear el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignPlayerToTeam = async (playerId, teamId) => {
    if (!teamId) {
      setErrorMsg('Por favor seleccione un equipo.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const team = teams.find(t => t.id === teamId || t.id.toString() === teamId.toString());
      if (!team) {
        throw new Error('No se encontró el equipo seleccionado.');
      }
      
      // Armar nuevo arreglo de IDs de jugadores
      const existingPlayerIds = (team.players || []).map(p => p.id);
      if (existingPlayerIds.includes(playerId)) {
        setErrorMsg('El jugador ya pertenece a este equipo.');
        return;
      }

      const updatedPlayerIds = [...existingPlayerIds, playerId];

      // Actualizar el equipo en el backend
      await teamService.updateTeam(team.id, { players: updatedPlayerIds });
      setSuccessMsg(`¡Jugador asignado a ${team.name} correctamente!`);
      await loadAllData();
    } catch (err) {
      console.error('Error al asignar jugador:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo asignar el jugador al equipo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', padding: '3rem', justifyContent: 'center' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={`${styles.container} custom_container`}>
      {/* Cabecera del Panel */}
      <header className={styles.header}>
        <div className={styles.actions}>
          <button 
            onClick={() => {
              setErrorMsg('');
              setSuccessMsg('');
              setShowCreateModal(true);
            }} 
            className={`${styles.btnNew} ${styles.btnNewActive}`}
            disabled={isLoading}
          >
            + Nuevo Jugador
          </button>
          
          <Link href="/" className={styles.btnBack}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Link>
        </div>
      </header>

      {/* Alertas */}
      {errorMsg && <div className={styles.error}>{errorMsg}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      {isLoading ? (
        <div className={styles.spinner} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* SECCIÓN 1: Padrón General del Club */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#002F87', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Padrón General de Jugadores
            </h2>
            <div className={styles.tableWrapper}>
              {players.length === 0 ? (
                <div className={styles.emptyState}>
                  No se encontraron jugadores registrados en el club.
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Nombre y Apellido</th>
                      <th className={styles.th}>DNI</th>
                      <th className={styles.th}>Usuario</th>
                      <th className={styles.th}>Estado</th>
                      <th className={styles.th} style={{ width: '250px' }}>Asignación de Equipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player) => (
                      <tr key={player.id} className={styles.tr}>
                        <td className={styles.td}>
                          {player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim()}
                        </td>
                        <td className={styles.td}>{player.dni || '-'}</td>
                        <td className={styles.td}>{player.username}</td>
                        <td className={styles.td}>
                          <span className={`${styles.badge} ${player.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                            {player.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select
                              value={selectedTeamsMap[player.id] || ''}
                              onChange={(e) => setSelectedTeamsMap({ ...selectedTeamsMap, [player.id]: e.target.value })}
                              style={{ padding: '0.35rem 0.5rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontWeight: 600, color: '#334155', flex: 1 }}
                            >
                              <option value="">Seleccione equipo...</option>
                              {teams.map((team) => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignPlayerToTeam(player.id, selectedTeamsMap[player.id])}
                              disabled={isSubmitting}
                              style={{ backgroundColor: '#002F87', color: 'white', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Asignar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* SECCIÓN 2 a N: Tablas dedicadas por Equipo */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#002F87', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Equipos Coordinados
            </h2>
            {teams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px dashed #cbd5e1', color: '#64748b', fontWeight: 700, fontSize: '0.875rem' }}>
                No tenés equipos asignados como entrenador actualmente.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {teams.map((team) => (
                  <div key={team.id} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        {team.name}
                      </h3>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', backgroundColor: '#eff6ff', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>
                        {team.category} • {team.branch === 'MALE' ? 'Masculino' : 'Femenino'}
                      </span>
                    </div>

                    <div className={styles.tableWrapper} style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
                      {!team.players || team.players.length === 0 ? (
                        <div className={styles.emptyState} style={{ padding: '2rem 1rem' }}>
                          No hay jugadores asignados a este equipo todavía.
                        </div>
                      ) : (
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th className={styles.th}>Nombre y Apellido</th>
                              <th className={styles.th}>DNI</th>
                              <th className={styles.th}>Usuario</th>
                              <th className={styles.th}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.players.map((player) => (
                              <tr key={player.id} className={styles.tr}>
                                <td className={styles.td}>
                                  {player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim()}
                                </td>
                                <td className={styles.td}>{player.dni || '-'}</td>
                                <td className={styles.td}>{player.username}</td>
                                <td className={styles.td}>
                                  <span className={`${styles.badge} ${player.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                                    {player.is_active ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
      {/* MODAL: Nuevo Jugador */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Registrar Nuevo Jugador</h2>
              <p className={styles.modalSubtitle}>Ingresa los datos para registrar y federar un jugador</p>
            </div>

            <form onSubmit={handleCreatePlayer} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>DNI *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 45678912"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: juan.perez"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: juan@mail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Contraseña *</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ user: '', email: '', password: '', dni: '', name: '', role: 'PLAYER' });
                  }}
                  className={styles.btnCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
