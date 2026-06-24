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

const BRANCH_LABELS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino'
};

const CATEGORY_LABELS = {
  SUB_14: 'Sub 14',
  SUB_16: 'Sub 16',
  SUB_18: 'Sub 18',
  SUB_21: 'Sub 21',
  PRIMERA: 'Primera',
  MAXI: 'Maxi'
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
  const [formData, setFormData] = useState({ name: '', category: 'PRIMERA', branch: 'FEMALE' });
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      
      await fetchTeams(userClubId, token);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Error de comunicación con el servidor.');
      setIsLoading(false);
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
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
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
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        branch: formData.branch,
        club_id: clubId,
        organization_id: organizationId
      };
      
      const res = await fetch(getApiUrl('internal/equipos/'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al intentar crear el equipo.');
      }
      
      setShowCreateModal(false);
      setFormData({ name: '', category: 'PRIMERA', branch: 'FEMALE' });
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
    if (!selectedTeam || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('lnv_token');
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        branch: formData.branch
      };
      
      const res = await fetch(getApiUrl(`internal/equipos/${selectedTeam.id}/`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar el equipo.');
      }
      
      setShowEditModal(false);
      setSelectedTeam(null);
      setFormData({ name: '', category: 'PRIMERA', branch: 'FEMALE' });
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
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
      branch: team.branch || 'FEMALE'
    });
    setShowEditModal(true);
  };

  // Abrir Modal de Borrado
  const openDeleteModal = (team) => {
    setSelectedTeam(team);
    setShowDeleteModal(true);
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
      {/* Cabecera de Página */}
      <header className={styles.header}>
        <div className={styles.actions}>
          <button onClick={() => {
            setFormData({ name: '', category: 'PRIMERA', branch: 'FEMALE' });
            setShowCreateModal(true);
          }} className={styles.btnCreate}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Equipo
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

      {/* Tabla del Listado */}
      <div className={styles.tableWrapper}>
        {isLoading ? (
          <div className={styles.spinner} />
        ) : teams.length === 0 ? (
          <div className={styles.emptyState}>
            No se encontraron equipos registrados en este momento. ¡Crea el primero!
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Nombre del Equipo</th>
                <th className={styles.th}>Categoría</th>
                <th className={styles.th}>Rama</th>
                <th className={styles.th} style={{ width: '120px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id} className={styles.tr}>
                  <td className={styles.td}>{team.name}</td>
                  <td className={styles.td}>
                    {CATEGORY_LABELS[team.category] || team.category}
                  </td>
                  <td className={styles.td}>
                    <span className={`${styles.badge} ${
                      team.branch === 'MALE' ? styles.badgeMale : styles.badgeFemale
                    }`}>
                      {BRANCH_LABELS[team.branch] || team.branch}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.actionCell}>
                      <button onClick={() => openEditModal(team)} className={styles.btnActionEdit}>
                        Editar
                      </button>
                      <button onClick={() => openDeleteModal(team)} className={styles.btnActionDelete}>
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: Crear Equipo */}
      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Crear Nuevo Equipo</h2>
              <p className={styles.modalSubtitle}>Ingresa los datos para registrar un equipo del club</p>
            </div>
            
            <form onSubmit={handleCreateTeam} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del Equipo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Huracán A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={styles.input}
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Categoría *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={styles.select}
                  disabled={isSubmitting}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rama *</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className={styles.select}
                  disabled={isSubmitting}
                >
                  {Object.entries(BRANCH_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  {isSubmitting ? 'Guardando...' : 'Crear Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Equipo */}
      {showEditModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar Equipo</h2>
              <p className={styles.modalSubtitle}>Modifica los datos del equipo seleccionado</p>
            </div>
            
            <form onSubmit={handleEditTeam} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nombre del Equipo *</label>
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
                <label className={styles.label}>Categoría *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={styles.select}
                  disabled={isSubmitting}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rama *</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className={styles.select}
                  disabled={isSubmitting}
                >
                  {Object.entries(BRANCH_LABELS).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTeam(null);
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

      {/* MODAL: Eliminar Equipo */}
      {showDeleteModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirmar Eliminación</h2>
              <p className={styles.modalSubtitle} style={{ color: '#ef4444', fontWeight: 600 }}>Esta acción no se puede deshacer</p>
            </div>
            
            <div style={{ padding: '0.5rem 0 1.5rem 0', fontSize: '0.875rem', color: '#475569', lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar el equipo <strong>{selectedTeam?.name}</strong>? Se dará de baja lógica del sistema.
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTeam(null);
                }}
                className={styles.btnCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
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
