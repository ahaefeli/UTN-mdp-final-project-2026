'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '../../context/AuthContext';

const getApiUrl = (path) => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${path}`;
};

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
    password: ''
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
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
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.dni.trim() || !formData.password.trim()) {
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
        organization_id: organizationId
      };
      
      const res = await fetch(getApiUrl('internal/usuarios/'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
    if (!selectedUser || !formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.dni.trim()) {
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
        dni: formData.dni.trim()
      };
      
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }
      
      const res = await fetch(getApiUrl(`internal/usuarios/${selectedUser.id}/`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      password: ''
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
      password: '' // la contraseña queda vacía a menos que se desee cambiar
    });
    setShowEditModal(true);
  };

  // Abrir Modal de Borrado
  const openDeleteModal = (u) => {
    setSelectedUser(u);
    setShowDeleteModal(true);
  };

  // Renderizado de tabla genérico parametrizado por isReadOnly
  const renderUserTable = (users, isReadOnly = false) => {
    if (users.length === 0) {
      return (
        <div className={styles.emptyState}>
          {isReadOnly 
            ? 'No se encontraron jugadores registrados en este club.' 
            : 'No se encontraron entrenadores registrados. ¡Registra el primero!'}
        </div>
      );
    }
    
    return (
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Nombre</th>
            <th className={styles.th}>Nombre de Usuario</th>
            <th className={styles.th}>DNI</th>
            <th className={styles.th}>Correo Electrónico</th>
            {!isReadOnly && <th className={styles.th} style={{ width: '120px' }}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={styles.tr}>
              <td className={styles.td}>{u.name || '-'}</td>
              <td className={styles.td}>{u.username}</td>
              <td className={styles.td}>{u.dni || '-'}</td>
              <td className={styles.td}>{u.email || '-'}</td>
              {!isReadOnly && (
                <td className={styles.td}>
                  <div className={styles.actionCell}>
                    <button onClick={() => openEditModal(u)} className={styles.btnActionEdit}>
                      Editar
                    </button>
                    <button onClick={() => openDeleteModal(u)} className={styles.btnActionDelete}>
                      Borrar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Renderizado del Loading General o Redirección
  if (isVerifying) {
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
        <h1 className={styles.headerTitle}>
          <span className={styles.headerTitleHighlight}>Gestión</span> del Club
        </h1>
        
        <div className={styles.actions}>
          <button onClick={() => fetchClubUsers(clubId)} className={styles.btnRefresh} disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Sincronizar'}
          </button>
          
          {activeTab === 'coaches' && (
            <button onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }} className={styles.btnCreate}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Añadir Entrenador
            </button>
          )}
          
          <Link href="/" className={styles.btnBack}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Link>
        </div>
      </header>

      {/* Control de Pestañas (Tabs) */}
      <div className={styles.tabsContainer}>
        <button 
          onClick={() => setActiveTab('coaches')} 
          className={`${styles.tabButton} ${activeTab === 'coaches' ? styles.tabButtonActive : ''}`}
        >
          Cuerpo Técnico
        </button>
        <button 
          onClick={() => setActiveTab('players')} 
          className={`${styles.tabButton} ${activeTab === 'players' ? styles.tabButtonActive : ''}`}
        >
          Plantel de Jugadores
        </button>
      </div>

      {/* Alertas */}
      {errorMsg && <div className={styles.error}>{errorMsg}</div>}

      {/* Contenedor de Tabla */}
      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div className={styles.spinner} />
        ) : activeTab === 'coaches' ? (
          renderUserTable(coaches, false)
        ) : (
          renderUserTable(players, true)
        )}
      </div>

      {/* MODAL: Añadir Entrenador (COACH) */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Añadir Entrenador</h2>
              <p className={styles.modalSubtitle}>Registra un nuevo miembro del cuerpo técnico en el club</p>
            </div>
            
            <form onSubmit={handleCreateCoach} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcelo Méndez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: marcelovoley"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>DNI *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 22334455"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: marcelo@email.com"
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
                  placeholder="Mínimo 8 caracteres"
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
                    resetForm();
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
                  {isSubmitting ? 'Guardando...' : 'Crear Entrenador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Entrenador (COACH) */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar Entrenador</h2>
              <p className={styles.modalSubtitle}>Modifica los datos del cuerpo técnico seleccionado</p>
            </div>
            
            <form onSubmit={handleEditCoach} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre de Usuario *</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>DNI *</label>
                <input
                  type="text"
                  required
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Contraseña (Opcional)</label>
                <input
                  type="password"
                  placeholder="Dejar vacío si no deseas cambiarla"
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
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
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
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Eliminar Entrenador (COACH) */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirmar Eliminación</h2>
              <p className={styles.modalSubtitle} style={{ color: '#ef4444', fontWeight: 600 }}>Esta acción dará de baja definitiva al usuario</p>
            </div>
            
            <div style={{ padding: '0.5rem 0 1.5rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar al entrenador <strong>{selectedUser?.name || selectedUser?.username}</strong> del sistema?
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className={styles.btnCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteCoach}
                className={styles.btnDanger}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
