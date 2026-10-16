'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '../../services/authService';
import playerService from '../../services/playerService';
import { userService } from '../../services/userService';
import teamService from '../../services/teamService';
import {
  PageHeader,
  Button,
  Alert,
  Modal,
  DataTable,
  LoadingState,
  EmptyState,
  StatusBadge,
} from '../../components/ui';
import dirStyles from '../../components/ui/AdminDirectory.module.css';
import chrome from '../../components/ui/PageChrome.module.css';
import styles from './page.module.css';
import { formatBranch, formatCategory } from '../../utils/labels';

const PLAYERS_PER_PAGE = 10;

const ROSTER_COLUMNS = [
  { key: 'name', label: 'Nombre y Apellido' },
  { key: 'dni', label: 'DNI' },
  { key: 'gender', label: 'Género' },
  { key: 'email', label: 'Email' },
  { key: 'medical', label: 'Apto Físico' },
  { key: 'status', label: 'Estado' },
  { key: 'assignment', label: 'Asignación de Equipo', width: '250px' },
];

const TEAM_PLAYER_COLUMNS = [
  { key: 'name', label: 'Nombre y Apellido' },
  { key: 'dni', label: 'DNI' },
  { key: 'email', label: 'Email' },
  { key: 'medical', label: 'Apto Físico' },
  { key: 'status', label: 'Estado' },
];

function formatGender(gender) {
  if (gender === 'M') return 'Masculino';
  if (gender === 'F') return 'Femenino';
  return '-';
}

function getPlayerName(player) {
  return player.name || `${player.first_name || ''} ${player.last_name || ''}`.trim();
}

function PaginationBar({ page, totalItems, onPrev, onNext }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / PLAYERS_PER_PAGE));
  const activePage = Math.min(page, totalPages);

  if (totalItems <= PLAYERS_PER_PAGE) return null;

  return (
    <div className={styles.pagination}>
      <Button variant="secondary" size="sm" onClick={onPrev} disabled={activePage === 1}>
        Anterior
      </Button>
      <span className={styles.paginationLabel}>
        Página {activePage} de {totalPages}
      </span>
      <Button variant="secondary" size="sm" onClick={onNext} disabled={activePage >= totalPages}>
        Siguiente
      </Button>
    </div>
  );
}

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
  const [playerToRemove, setPlayerToRemove] = useState(null);

  // Estados de paginado (máximo 10 por página)
  const [playersPage, setPlayersPage] = useState(1);
  const [teamPages, setTeamPages] = useState({});

  // Selección temporal para asignación de equipos
  const [selectedTeamsMap, setSelectedTeamsMap] = useState({});
  const [editingAssignmentMap, setEditingAssignmentMap] = useState({});

  // Estados para Modal de Nuevo Jugador
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    user: '',
    email: '',
    password: '',
    dni: '',
    name: '',
    gender: '',
    role: 'PLAYER',
  });

  // Validación de la sesión en el cliente
  useEffect(() => {
    const session = authService.getCurrentUser();
    if (!authService.isAuthenticated() || !session) {
      router.push('/login');
    } else if (session.role !== 'COACH' && session.role !== 'CLUB_ADMIN') {
      router.push('/');
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
      const session = authService.getCurrentUser();
      const clubId = session?.club_id;
      const list = response.data || [];
      setTeams(clubId ? list.filter((team) => String(team.club_id) === String(clubId)) : list);
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
      setFormData({ user: '', email: '', password: '', dni: '', name: '', gender: '', role: 'PLAYER' });
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
      const team = teams.find((t) => t.id === teamId || t.id.toString() === teamId.toString());
      if (!team) {
        throw new Error('No se encontró el equipo seleccionado.');
      }

      // Armar nuevo arreglo de IDs de jugadores
      const existingPlayerIds = (team.players || []).map((p) => p.id);
      if (existingPlayerIds.includes(playerId)) {
        setErrorMsg('El jugador ya pertenece a este equipo.');
        return;
      }

      const updatedPlayerIds = [...existingPlayerIds, playerId];

      // Actualizar el equipo en el backend
      await teamService.updateTeam(team.id, { players: updatedPlayerIds });
      setSuccessMsg(`¡Jugador asignado a ${team.name} correctamente!`);
      setEditingAssignmentMap((prev) => ({ ...prev, [playerId]: false }));
      await loadAllData();
    } catch (err) {
      console.error('Error al asignar jugador:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo asignar el jugador al equipo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignPlayer = async (playerId, teamId) => {
    setPlayerToRemove(null);
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const team = teams.find((t) => t.id === teamId || t.id.toString() === teamId.toString());
      if (!team) throw new Error('No se encontró el equipo para desasignar.');

      const existingPlayerIds = (team.players || []).map((p) => p.id);
      const updatedPlayerIds = existingPlayerIds.filter((id) => id !== playerId);
      await teamService.updateTeam(team.id, { players: updatedPlayerIds });
      setSuccessMsg('¡Jugador desasignado del equipo correctamente!');
      setEditingAssignmentMap((prev) => ({ ...prev, [playerId]: false }));
      await loadAllData();
    } catch (err) {
      console.error('Error al desasignar jugador:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo desasignar el jugador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setFormData({ user: '', email: '', password: '', dni: '', name: '', gender: '', role: 'PLAYER' });
  };

  const handleOpenCreateModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setShowCreateModal(true);
  };

  const maxPlayersPage = Math.max(1, Math.ceil(players.length / PLAYERS_PER_PAGE));
  const activePlayersPage = Math.min(playersPage, maxPlayersPage);
  const paginatedPlayers = players.slice(
    (activePlayersPage - 1) * PLAYERS_PER_PAGE,
    activePlayersPage * PLAYERS_PER_PAGE
  );

  const renderAssignmentCell = (player) => {
    if (player.team_info && !editingAssignmentMap[player.id]) {
      return (
        <div className={styles.assignmentDisplay}>
          <span className={styles.assignmentLabel}>
            {formatCategory(player.team_info.category)} - {formatBranch(player.team_info.branch)}
          </span>
          <div className={styles.assignmentActions}>
            <button
              type="button"
              className={`${styles.linkAction} ${styles.linkEdit}`}
              onClick={() => setEditingAssignmentMap((prev) => ({ ...prev, [player.id]: true }))}
            >
              Editar
            </button>
            <button
              type="button"
              className={`${styles.linkAction} ${styles.linkDanger}`}
              onClick={() => setPlayerToRemove({ playerId: player.id, teamId: player.team_info.id, name: getPlayerName(player) })}
              disabled={isSubmitting}
            >
              Desasignar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.assignmentForm}>
        <select
          value={selectedTeamsMap[player.id] || ''}
          onChange={(e) => setSelectedTeamsMap({ ...selectedTeamsMap, [player.id]: e.target.value })}
          className={styles.teamSelect}
        >
          <option value="">Seleccione equipo...</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {formatCategory(team.category)} - {formatBranch(team.branch)}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={() => handleAssignPlayerToTeam(player.id, selectedTeamsMap[player.id])}
          disabled={isSubmitting}
        >
          Asignar
        </Button>
      </div>
    );
  };

  const renderPlayerStatusBadge = (player) => (
    <StatusBadge variant={player.team_info ? 'success' : 'neutral'}>
      {player.team_info ? 'Activo' : 'Sin Equipo'}
    </StatusBadge>
  );

  const renderMedicalBadge = (player) => (
    <StatusBadge variant={player.medical_certificate ? 'success' : 'danger'}>
      {player.medical_certificate ? 'Apto (Cert. Cargado)' : 'Pendiente'}
    </StatusBadge>
  );

  if (!isAuthenticated) {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={dirStyles.page}>
        <PageHeader
          title="Mis"
          highlight="Jugadores"
          subtitle="Gestiona el padrón del club y las asignaciones por equipo."
          actions={
            <Button onClick={handleOpenCreateModal} disabled={isLoading}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Nuevo Jugador
            </Button>
          }
        />

        {(successMsg || errorMsg) && (
          <div className={dirStyles.alerts}>
            {successMsg && (
              <Alert variant="success">
                <div className={styles.alertContent}>
                  <span>{successMsg}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSuccessMsg('')} aria-label="Cerrar alerta">
                    ×
                  </Button>
                </div>
              </Alert>
            )}
            {errorMsg && (
              <Alert variant="error">
                <div className={styles.alertContent}>
                  <span>{errorMsg}</span>
                  <Button variant="ghost" size="sm" onClick={() => setErrorMsg('')} aria-label="Cerrar alerta">
                    ×
                  </Button>
                </div>
              </Alert>
            )}
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Cargando jugadores..." />
        ) : (
          <div className={chrome.page}>
            <section className={chrome.section}>
              <h2 className={chrome.sectionTitle}>Jugadores del club</h2>

              {players.length === 0 ? (
                <EmptyState title="No se encontraron jugadores registrados en el club." />
              ) : (
                <>
                  <DataTable columns={ROSTER_COLUMNS}>
                    {paginatedPlayers.map((player) => (
                      <tr key={player.id}>
                        <td>{getPlayerName(player)}</td>
                        <td>{player.dni || '-'}</td>
                        <td>{formatGender(player.gender)}</td>
                        <td>{player.email || '-'}</td>
                        <td>{renderMedicalBadge(player)}</td>
                        <td>{renderPlayerStatusBadge(player)}</td>
                        <td className={styles.assignmentCell}>{renderAssignmentCell(player)}</td>
                      </tr>
                    ))}
                  </DataTable>

                  <PaginationBar
                    page={playersPage}
                    totalItems={players.length}
                    onPrev={() => setPlayersPage((prev) => Math.max(prev - 1, 1))}
                    onNext={() =>
                      setPlayersPage((prev) => Math.min(prev + 1, Math.ceil(players.length / PLAYERS_PER_PAGE)))
                    }
                  />
                </>
              )}
            </section>

            <section className={chrome.section}>
              <h2 className={chrome.sectionTitle}>Equipos Coordinados</h2>

              {teams.length === 0 ? (
                <div className={styles.teamsEmpty}>
                  No tenés equipos asignados como entrenador actualmente.
                </div>
              ) : (
                <div className={chrome.stack}>
                  {teams.map((team) => {
                    const teamPage = teamPages[team.id] || 1;
                    const maxTeamPage = Math.max(1, Math.ceil((team.players || []).length / PLAYERS_PER_PAGE));
                    const activeTeamPage = Math.min(teamPage, maxTeamPage);
                    const paginatedTeamPlayers = (team.players || []).slice(
                      (activeTeamPage - 1) * PLAYERS_PER_PAGE,
                      activeTeamPage * PLAYERS_PER_PAGE
                    );

                    return (
                      <div key={team.id} className={chrome.card}>
                        <div className={styles.teamCardHeader}>
                          <h3 className={styles.teamCardTitle}>{team.name}</h3>
                          <span className={styles.teamCardMeta}>
                            {formatCategory(team.category)} • {formatBranch(team.branch)}
                          </span>
                        </div>

                        {!team.players || team.players.length === 0 ? (
                          <div className={styles.teamEmpty}>
                            <EmptyState title="No hay jugadores asignados a este equipo todavía." />
                          </div>
                        ) : (
                          <>
                            <div className={styles.teamTableWrap}>
                              <DataTable columns={TEAM_PLAYER_COLUMNS}>
                                {paginatedTeamPlayers.map((player) => (
                                  <tr key={player.id}>
                                    <td>{getPlayerName(player)}</td>
                                    <td>{player.dni || '-'}</td>
                                    <td>{player.email || '-'}</td>
                                    <td>{renderMedicalBadge(player)}</td>
                                    <td>{renderPlayerStatusBadge(player)}</td>
                                  </tr>
                                ))}
                              </DataTable>
                            </div>

                            <PaginationBar
                              page={teamPage}
                              totalItems={team.players.length}
                              onPrev={() =>
                                setTeamPages((prev) => ({
                                  ...prev,
                                  [team.id]: Math.max((prev[team.id] || 1) - 1, 1),
                                }))
                              }
                              onNext={() =>
                                setTeamPages((prev) => ({
                                  ...prev,
                                  [team.id]: Math.min(
                                    (prev[team.id] || 1) + 1,
                                    Math.ceil(team.players.length / PLAYERS_PER_PAGE)
                                  ),
                                }))
                              }
                            />
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        <Modal
          open={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Registrar Nuevo Jugador"
          subtitle="Ingresa los datos para registrar y federar un jugador"
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseCreateModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" form="create-player-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Jugador'}
              </Button>
            </>
          }
        >
          <form id="create-player-form" onSubmit={handleCreatePlayer} className={dirStyles.form}>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-player-name">
                Nombre y Apellido *
              </label>
              <input
                id="create-player-name"
                type="text"
                required
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-player-gender">
                Género *
              </label>
              <select
                id="create-player-gender"
                className={dirStyles.select}
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccione el género...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-player-dni">
                DNI *
              </label>
              <input
                id="create-player-dni"
                type="text"
                required
                placeholder="Ej: 45678912"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-player-user">
                Nombre de Usuario *
              </label>
              <input
                id="create-player-user"
                type="text"
                required
                placeholder="Ej: juan.perez"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-player-email">
                Correo Electrónico *
              </label>
              <input
                id="create-player-email"
                type="email"
                required
                placeholder="Ej: juan@mail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-player-password">
                Contraseña *
              </label>
              <input
                id="create-player-password"
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>
          </form>
        </Modal>

        <Modal
          open={Boolean(playerToRemove)}
          onClose={() => !isSubmitting && setPlayerToRemove(null)}
          title="Sacar jugador del equipo"
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setPlayerToRemove(null)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                disabled={isSubmitting}
                onClick={() => handleUnassignPlayer(playerToRemove.playerId, playerToRemove.teamId)}
              >
                {isSubmitting ? 'Guardando...' : 'Sacar del equipo'}
              </Button>
            </>
          }
        >
          <p>
            {playerToRemove?.name
              ? `${playerToRemove.name} deja de figurar en ese equipo. El jugador sigue dado de alta en el club.`
              : 'El jugador deja de figurar en ese equipo y sigue dado de alta en el club.'}
          </p>
        </Modal>
      </div>
    </div>
  );
}
