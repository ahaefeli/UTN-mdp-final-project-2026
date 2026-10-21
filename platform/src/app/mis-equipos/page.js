'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../services/apiClient';
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
import styles from './page.module.css';
import { formatBranch, formatCategory } from '../../utils/labels';

const getApiUrl = (path) => {
  const base = getApiBaseUrl();
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${path}`;
};

const TEAM_COLUMNS = [
  { key: 'name', label: 'Nombre del Equipo' },
  { key: 'category', label: 'Categoría' },
  { key: 'branch', label: 'Rama' },
  { key: 'actions', label: 'Acciones', width: '120px' },
];

const BRANCH_VARIANTS = {
  MALE: 'primary',
  FEMALE: 'accent',
};

export default function MisEquiposPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isInitialized } = useAuth();

  // Acceso y Estados Principales
  const [isVerifying, setIsVerifying] = useState(true);
  const [teams, setTeams] = useState([]);
  const [clubId, setClubId] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados para Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estado de Formularios e Item Seleccionado
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [formData, setFormData] = useState({ name: '', category: 'PRIMERA', branch: 'FEMALE', coach_id: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validación de Rol CLUB_ADMIN y redirección
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || role !== 'CLUB_ADMIN') {
        router.push('/');
      } else {
        setIsVerifying(false);
        loadClubProfileAndTeams();
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  // Carga el perfil completo para obtener club_id y organization_id
  const loadClubProfileAndTeams = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const sessionUser = JSON.parse(localStorage.getItem('lnv_session') || '{}');

      if (!sessionUser.id) {
        throw new Error('No se encontró el identificador del usuario.');
      }

      const profileRes = await fetch(getApiUrl(`internal/usuarios/${sessionUser.id}/`), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!profileRes.ok) {
        throw new Error('Error al obtener la información de perfil.');
      }

      const response = await profileRes.json();
      const profile = response.data;

      // Fallback seguro de obtención de IDs
      const userClubId = profile.club_id || profile.club;
      const userOrgId = profile.organization_id || profile.organization;

      if (!userClubId) {
        throw new Error('Su usuario administrador de club no tiene asociado ningún club.');
      }

      setClubId(userClubId);
      setOrganizationId(userOrgId);

      await fetchCoaches(token);
      await fetchTeams(userClubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error de comunicación con el servidor.');
      setIsLoading(false);
    }
  };

  // Cargar entrenadores
  const fetchCoaches = async (token) => {
    try {
      const res = await fetch(getApiUrl('internal/usuarios/?role=COACH'), {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCoaches(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar entrenadores:', err);
    }
  };

  // Cargar lista de equipos
  const fetchTeams = async (targetClubId, token) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const currentToken = token || localStorage.getItem('lnv_token');
      const currentClubId = targetClubId || clubId;

      const res = await fetch(getApiUrl(`internal/equipos/?club_id=${currentClubId}`), {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Error al obtener el listado de equipos.');
      }

      const data = await res.json();
      setTeams(data.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar equipos.');
    } finally {
      setIsLoading(false);
    }
  };

  // Creación de equipo
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre del equipo es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        branch: formData.branch,
        club_id: clubId,
        organization_id: organizationId,
        coach_id: formData.coach_id || null,
      };

      const res = await fetch(getApiUrl('internal/equipos/'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al intentar crear el equipo.');
      }

      setShowCreateModal(false);
      setFormData({ name: '', category: 'PRIMERA', branch: 'FEMALE', coach_id: '' });
      await fetchTeams(clubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edición de equipo
  const handleEditTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !formData.name.trim()) {
      if (!formData.name.trim()) setErrorMsg('El nombre del equipo es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        branch: formData.branch,
        coach_id: formData.coach_id || null,
      };

      const res = await fetch(getApiUrl(`internal/equipos/${selectedTeam.id}/`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar el equipo.');
      }

      setShowEditModal(false);
      setSelectedTeam(null);
      setFormData({ name: '', category: 'PRIMERA', branch: 'FEMALE', coach_id: '' });
      await fetchTeams(clubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminación de equipo
  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const res = await fetch(getApiUrl(`internal/equipos/${selectedTeam.id}/`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar el equipo.');
      }

      setShowDeleteModal(false);
      setSelectedTeam(null);
      await fetchTeams(clubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal de Edición precargado
  const openEditModal = (team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name || '',
      category: team.category || 'PRIMERA',
      branch: team.branch || 'FEMALE',
      coach_id: team.coach_id || '',
    });
    setShowEditModal(true);
  };

  // Abrir Modal de Borrado
  const openDeleteModal = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
  };

  const resetFormData = () => {
    setFormData({ name: '', category: 'PRIMERA', branch: 'FEMALE', coach_id: '' });
  };

  const handleOpenCreateModal = () => {
    resetFormData();
    setShowCreateModal(true);
  };

  const renderTeamFormFields = (idPrefix) => (
    <>
      <div className={dirStyles.formGroup}>
        <label className={dirStyles.label} htmlFor={`${idPrefix}-name`}>
          Nombre del Equipo *
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          placeholder={idPrefix === 'create-team' ? 'Ej: Huracán A' : undefined}
          value={formData.name}
          maxLength={100}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={dirStyles.input}
          disabled={isSubmitting}
        />
      </div>

      <div className={dirStyles.formGroup}>
        <label className={dirStyles.label} htmlFor={`${idPrefix}-category`}>
          Categoría *
        </label>
        <select
          id={`${idPrefix}-category`}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className={dirStyles.select}
          disabled={isSubmitting}
        >
          {['SUB_14', 'SUB_16', 'SUB_18', 'SUB_21', 'PRIMERA', 'MAXI'].map((key) => (
            <option key={key} value={key}>
              {formatCategory(key)}
            </option>
          ))}
        </select>
      </div>

      <div className={dirStyles.formGroup}>
        <label className={dirStyles.label} htmlFor={`${idPrefix}-branch`}>
          Rama *
        </label>
        <select
          id={`${idPrefix}-branch`}
          value={formData.branch}
          onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
          className={dirStyles.select}
          disabled={isSubmitting}
        >
          {['MALE', 'FEMALE'].map((key) => (
            <option key={key} value={key}>
              {formatBranch(key)}
            </option>
          ))}
        </select>
      </div>

      <div className={dirStyles.formGroup}>
        <label className={dirStyles.label} htmlFor={`${idPrefix}-coach`}>
          Entrenador (Opcional)
        </label>
        <select
          id={`${idPrefix}-coach`}
          value={formData.coach_id || ''}
          onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })}
          className={dirStyles.select}
          disabled={isSubmitting}
        >
          <option value="">Sin entrenador asignado</option>
          {coaches.map((coach) => (
            <option key={coach.id} value={coach.id}>
              {coach.name || coach.username || coach.email}
            </option>
          ))}
        </select>
      </div>
    </>
  );

  if (isVerifying) {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={dirStyles.page}>
        <PageHeader
          title="Mis"
          highlight="Equipos"
          subtitle="Gestiona los equipos registrados en tu club."
          actions={
            <Button onClick={handleOpenCreateModal}>
              <i className="bi bi-plus-lg" aria-hidden="true" />
              Nuevo Equipo
            </Button>
          }
        />

        {errorMsg && (
          <div className={dirStyles.alerts}>
            <Alert variant="error">
              <div className={styles.alertContent}>
                <span>{errorMsg}</span>
                <Button variant="ghost" size="sm" onClick={() => setErrorMsg('')} aria-label="Cerrar alerta">
                  ×
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {isLoading ? (
          <LoadingState label="Cargando equipos..." />
        ) : teams.length === 0 ? (
          <EmptyState title="No se encontraron equipos registrados en este momento. ¡Crea el primero!" />
        ) : (
          <DataTable columns={TEAM_COLUMNS}>
            {teams.map((team) => (
              <tr key={team.id}>
                <td>
                  <div className={styles.teamCell}>
                    <span className={styles.cellStrong}>{team.name}</span>
                    {team.coach_name && (
                      <span className={styles.cellMuted}>
                        <i className="bi bi-person-fill" aria-hidden="true" />
                        Entrenador: {team.coach_name}
                      </span>
                    )}
                  </div>
                </td>
                <td>{formatCategory(team.category)}</td>
                <td>
                  <StatusBadge variant={BRANCH_VARIANTS[team.branch] || 'neutral'}>
                    {formatBranch(team.branch)}
                  </StatusBadge>
                </td>
                <td className={styles.cellActions}>
                  <div className={dirStyles.tableActions}>
                    <Button variant="secondary" size="sm" onClick={() => openEditModal(team)}>
                      <i className="bi bi-pencil-fill" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openDeleteModal(team)}>
                      <i className="bi bi-trash-fill" aria-hidden="true" />
                      Borrar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        <Modal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Crear Nuevo Equipo"
          subtitle="Ingresá los datos para registrar un equipo del club"
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" form="create-team-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Crear Equipo'}
              </Button>
            </>
          }
        >
          <form id="create-team-form" onSubmit={handleCreateTeam} className={dirStyles.form} noValidate>
            {renderTeamFormFields('create-team')}
          </form>
        </Modal>

        <Modal
          open={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTeam(null);
          }}
          title="Editar Equipo"
          subtitle="Modifica los datos del equipo seleccionado"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTeam(null);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" form="edit-team-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          }
        >
          <form id="edit-team-form" onSubmit={handleEditTeam} className={dirStyles.form} noValidate>
            {renderTeamFormFields('edit-team')}
          </form>
        </Modal>

        <Modal
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedTeam(null);
          }}
          title="Confirmar Eliminación"
          subtitle={<span className={styles.deleteWarning}>Esta acción no se puede deshacer</span>}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTeam(null);
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteTeam} disabled={isSubmitting}>
                {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}
              </Button>
            </>
          }
        >
          <p className={styles.deleteMessage}>
            ¿Estás seguro de que deseas eliminar el equipo <strong>{selectedTeam?.name}</strong>? Se dará de baja
            lógica del sistema.
          </p>
        </Modal>
      </div>
    </div>
  );
}
