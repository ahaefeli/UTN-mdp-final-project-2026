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
  Tabs,
} from '../../components/ui';
import dirStyles from '../../components/ui/AdminDirectory.module.css';
import styles from './page.module.css';

const getApiUrl = (path) => {
  const base = getApiBaseUrl();
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${path}`;
};

const TABS = [
  { id: 'coaches', label: 'Cuerpo Técnico' },
  { id: 'players', label: 'Plantel de Jugadores' },
];

const USER_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'username', label: 'Nombre de Usuario' },
  { key: 'dni', label: 'DNI' },
  { key: 'email', label: 'Correo Electrónico' },
];

const COACH_COLUMNS = [
  ...USER_COLUMNS,
  { key: 'actions', label: 'Acciones', width: '120px' },
];

export default function GestionClubPage() {
  const router = useRouter();
  const { user, role, isAuthenticated, isInitialized } = useAuth();

  // Acceso y Estados Principales
  const [isVerifying, setIsVerifying] = useState(true);
  const [usersList, setUsersList] = useState([]);
  const [clubId, setClubId] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Control de Pestañas
  const [activeTab, setActiveTab] = useState('coaches'); // 'coaches' | 'players'

  // Estados para Modales de Cuerpo Técnico (COACH)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Estado de Formularios e Item Seleccionado
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    dni: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validación de Rol CLUB_ADMIN y redirección inmediata
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated || role !== 'CLUB_ADMIN') {
        router.push('/');
      } else {
        setIsVerifying(false);
        loadClubProfileAndUsers();
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  // Carga el perfil completo para obtener club_id y organization_id
  const loadClubProfileAndUsers = async () => {
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

      const userClubId = profile.club_id || profile.club;
      const userOrgId = profile.organization_id || profile.organization;

      if (!userClubId) {
        throw new Error('Su usuario administrador de club no tiene un club asignado.');
      }

      setClubId(userClubId);
      setOrganizationId(userOrgId);

      await fetchClubUsers(userClubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error de comunicación con el servidor.');
      setIsLoading(false);
    }
  };

  // Obtener todos los usuarios del club
  const fetchClubUsers = async (targetClubId, token) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const currentToken = token || localStorage.getItem('lnv_token');
      const currentClubId = targetClubId || clubId;

      const res = await fetch(getApiUrl(`internal/usuarios/?club_id=${currentClubId}`), {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Error al obtener los usuarios del club.');
      }

      const response = await res.json();
      setUsersList(response.data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cargar usuarios.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrado de usuarios según pestaña activa
  const coaches = usersList.filter((u) => u.role === 'COACH');
  const players = usersList.filter((u) => u.role === 'PLAYER');

  // Crear Entrenador (COACH)
  const handleCreateCoach = async (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.dni.trim() ||
      !formData.password.trim()
    ) {
      setErrorMsg('Por favor completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const payload = {
        role: 'COACH',
        user: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        dni: formData.dni.trim(),
        password: formData.password.trim(),
        club_id: clubId,
        organization_id: organizationId,
      };

      const res = await fetch(getApiUrl('internal/usuarios/'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear el entrenador.');
      }

      setShowCreateModal(false);
      resetForm();
      await fetchClubUsers(clubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editar Entrenador (COACH)
  const handleEditCoach = async (e) => {
    e.preventDefault();
    if (
      !selectedUser ||
      !formData.name.trim() ||
      !formData.username.trim() ||
      !formData.email.trim() ||
      !formData.dni.trim()
    ) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const payload = {
        user: formData.username.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        dni: formData.dni.trim(),
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      const res = await fetch(getApiUrl(`internal/usuarios/${selectedUser.id}/`), {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar el entrenador.');
      }

      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      await fetchClubUsers(clubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar Entrenador (COACH)
  const handleDeleteCoach = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const res = await fetch(getApiUrl(`internal/usuarios/${selectedUser.id}/`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar el entrenador.');
      }

      setShowDeleteModal(false);
      setSelectedUser(null);
      await fetchClubUsers(clubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpiar campos del formulario
  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      dni: '',
      password: '',
    });
  };

  // Abrir Modal de Edición precargado
  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      dni: u.dni || '',
      password: '', // la contraseña queda vacía a menos que se desee cambiar
    });
    setShowEditModal(true);
  };

  // Abrir Modal de Borrado
  const openDeleteModal = (u) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  if (isVerifying) {
    return <LoadingState full />;
  }

  const activeUsers = activeTab === 'coaches' ? coaches : players;
  const isReadOnly = activeTab === 'players';

  return (
    <div className="appShell">
      <div className={dirStyles.page}>
        <PageHeader
          title="Gestión del"
          highlight="Club"
          subtitle="Administra el cuerpo técnico y consulta el plantel de jugadores del club."
          actions={
            <>
              <Button variant="secondary" onClick={() => fetchClubUsers(clubId)} disabled={isLoading}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                {isLoading ? 'Cargando...' : 'Sincronizar'}
              </Button>
              {activeTab === 'coaches' && (
                <Button onClick={handleOpenCreateModal}>
                  <i className="bi bi-plus-lg" aria-hidden="true" />
                  Añadir Entrenador
                </Button>
              )}
            </>
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

        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {isLoading ? (
          <LoadingState label="Cargando información..." />
        ) : activeUsers.length === 0 ? (
          <EmptyState
            title={
              isReadOnly
                ? 'No se encontraron jugadores registrados en este club.'
                : 'No se encontraron entrenadores registrados. ¡Registra el primero!'
            }
          />
        ) : (
          <DataTable columns={isReadOnly ? USER_COLUMNS : COACH_COLUMNS}>
            {activeUsers.map((u) => (
              <tr key={u.id}>
                <td className={styles.cellStrong}>{u.name || '-'}</td>
                <td>{u.username}</td>
                <td>{u.dni || '-'}</td>
                <td>{u.email || '-'}</td>
                {!isReadOnly && (
                  <td className={styles.cellActions}>
                    <div className={dirStyles.tableActions}>
                      <Button variant="secondary" size="sm" onClick={() => openEditModal(u)}>
                        <i className="bi bi-pencil-fill" aria-hidden="true" />
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => openDeleteModal(u)}>
                        <i className="bi bi-trash-fill" aria-hidden="true" />
                        Borrar
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </DataTable>
        )}

        <Modal
          open={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Añadir Entrenador"
          subtitle="Registra un nuevo miembro del cuerpo técnico en el club"
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseCreateModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" form="create-coach-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Crear Entrenador'}
              </Button>
            </>
          }
        >
          <form id="create-coach-form" onSubmit={handleCreateCoach} className={dirStyles.form}>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-coach-name">
                Nombre Completo *
              </label>
              <input
                id="create-coach-name"
                type="text"
                required
                placeholder="Ej: Marcelo Méndez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-coach-username">
                Nombre de Usuario *
              </label>
              <input
                id="create-coach-username"
                type="text"
                required
                placeholder="Ej: marcelovoley"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-coach-dni">
                DNI *
              </label>
              <input
                id="create-coach-dni"
                type="text"
                required
                placeholder="Ej: 22334455"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-coach-email">
                Correo Electrónico *
              </label>
              <input
                id="create-coach-email"
                type="email"
                required
                placeholder="Ej: marcelo@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="create-coach-password">
                Contraseña *
              </label>
              <input
                id="create-coach-password"
                type="password"
                required
                placeholder="Mínimo 8 caracteres"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>
          </form>
        </Modal>

        <Modal
          open={showEditModal}
          onClose={handleCloseEditModal}
          title="Editar Entrenador"
          subtitle="Modifica los datos del cuerpo técnico seleccionado"
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseEditModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" form="edit-coach-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          }
        >
          <form id="edit-coach-form" onSubmit={handleEditCoach} className={dirStyles.form}>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-coach-name">
                Nombre Completo *
              </label>
              <input
                id="edit-coach-name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-coach-username">
                Nombre de Usuario *
              </label>
              <input
                id="edit-coach-username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-coach-dni">
                DNI *
              </label>
              <input
                id="edit-coach-dni"
                type="text"
                required
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-coach-email">
                Correo Electrónico *
              </label>
              <input
                id="edit-coach-email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-coach-password">
                Contraseña (Opcional)
              </label>
              <input
                id="edit-coach-password"
                type="password"
                placeholder="Dejar vacío si no deseas cambiarla"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={dirStyles.input}
                disabled={isSubmitting}
              />
            </div>
          </form>
        </Modal>

        <Modal
          open={showDeleteModal}
          onClose={handleCloseDeleteModal}
          title="Confirmar Eliminación"
          subtitle={
            <span className={styles.deleteWarning}>Esta acción dará de baja definitiva al usuario</span>
          }
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteCoach} disabled={isSubmitting}>
                {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}
              </Button>
            </>
          }
        >
          <p className={styles.deleteMessage}>
            ¿Estás seguro de que deseas eliminar al entrenador{' '}
            <strong>{selectedUser?.name || selectedUser?.username}</strong> del sistema?
          </p>
        </Modal>
      </div>
    </div>
  );
}
