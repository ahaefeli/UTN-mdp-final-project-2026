'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import styles from './page.module.css';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada'
};

export default function ClubesAdminPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState('activeClubs'); // 'activeClubs' | 'pendingRequests'

  // Data Lists
  const [clubs, setClubs] = useState([]);
  const [requests, setRequests] = useState([]);

  // Loadings & Messages
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Edit Club form state
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  // Invitation Link state
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Enforce ADMIN role-based access
  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (role !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isInitialized, isAuthenticated, role, router]);

  // Load data depending on active tab
  useEffect(() => {
    if (isAuthenticated && role === 'ADMIN') {
      loadData();
    }
  }, [activeTab, isAuthenticated, role]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'activeClubs') {
        const res = await apiClient.get('internal/clubes/');
        setClubs(res.data?.data || []);
      } else {
        const res = await apiClient.get('admin/club-requests/');
        setRequests(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setErrorMsg('No se pudieron obtener los datos del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Club Modal
  const handleOpenEditModal = (club) => {
    setSelectedClub(club);
    setEditName(club.name || '');
    setEditAddress(club.address || '');
    setEditPhone(club.phone || '');
    setEditEmail(club.email || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedClub(null);
    setIsEditModalOpen(false);
    setErrorMsg('');
  };

  // Submit Edit Club (PUT)
  const handleUpdateClub = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg('El nombre del club es obligatorio.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await apiClient.put(`internal/clubes/${selectedClub.id}/`, {
        name: editName.trim(),
        address: editAddress.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        organization_id: selectedClub.organization_id
      });
      setSuccessMsg('Club actualizado exitosamente.');
      handleCloseEditModal();
      loadData();
    } catch (err) {
      console.error('Error al editar el club:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo guardar los cambios del club.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setGeneratedLink('');
  };

  // Generate Invite Link (POST)
  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('admin/club-requests/generate-link/', {});
      
      const token = res.data?.token || '';
      const link = `${window.location.origin}/register?token=${token}`;
      
      setGeneratedLink(link);
      setIsInviteModalOpen(true);
      setSuccessMsg('Enlace generado exitosamente.');
    } catch (err) {
      console.error('Error al generar enlace:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo generar el enlace de invitación.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Copy Generated Link to Clipboard
  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Fetch Request Detail (GET)
  const handleFetchRequestDetail = async (requestId) => {
    setIsFetchingDetail(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get(`admin/club-requests/${requestId}/`);
      setSelectedRequest(res.data?.data || null);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Error al obtener detalle:', err);
      setErrorMsg('No se pudo obtener el detalle de la solicitud.');
    } finally {
      setIsFetchingDetail(false);
    }
  };

  // Approve or Reject Proposed Club Request (POST)
  const handleReviewRequest = async (requestId, action) => {
    if (!confirm(`¿Está seguro de que desea ${action === 'APPROVE' ? 'aprobar' : 'rechazar'} esta solicitud?`)) {
      return;
    }
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post(`admin/club-requests/${requestId}/review/`, { action });
      setSuccessMsg(`Solicitud ${action === 'APPROVE' ? 'aprobada' : 'rechazada'} con éxito.`);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      loadData();
    } catch (err) {
      console.error('Error al procesar solicitud:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return (
      <div className={styles.loadingContainer} style={{ minHeight: '100vh' }}>
        <div className={styles.spinner} />
      </div>
    );
  }

  return (
    <div className={`${styles.container} container`}>
      {/* Cabecera */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Gestión de Clubes</h1>
          <p className={styles.subtitle}>Supervise los clubes federados activos y administre las solicitudes de registro.</p>
        </div>
          <button 
            onClick={handleGenerateLink} 
            disabled={isGeneratingLink}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            {isGeneratingLink ? (
              <>
                <div className={styles.spinner} style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderLeftColor: '#ffffff', marginRight: '0.5rem' }} />
                Generando...
              </>
            ) : (
              <>
                <i className="bi bi-link-45deg" style={{ fontSize: '1.1rem' }}></i>
                Generar Enlace de Invitación
              </>
            )}
          </button>
      </header>

      {/* Alertas de Mensaje */}
      {successMsg && (
        <div className={styles.successBox} style={{ marginBottom: '1.5rem' }}>
          {successMsg}
          <button onClick={() => setSuccessMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {errorMsg && (
        <div className={styles.errorBox} style={{ marginBottom: '1.5rem' }}>
          {errorMsg}
          <button onClick={() => setErrorMsg('')} style={{ float: 'right', background: 'none', border: 'none', color: 'inherit', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          onClick={() => {
            setActiveTab('activeClubs');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`${styles.tab} ${activeTab === 'activeClubs' ? styles.tabActive : styles.tabInactive}`}
        >
          Clubes Activos
        </button>
        <button
          onClick={() => {
            setActiveTab('pendingRequests');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`${styles.tab} ${activeTab === 'pendingRequests' ? styles.tabActive : styles.tabInactive}`}
        >
          Solicitudes Pendientes
        </button>
      </div>

      {/* Contenido de Tablas */}
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Cargando información...</p>
        </div>
      ) : activeTab === 'activeClubs' ? (
        clubs.length === 0 ? (
          <div className={styles.emptyState}>No hay clubes registrados en el sistema.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Nombre</th>
                  <th className={styles.th}>Dirección</th>
                  <th className={styles.th}>Teléfono</th>
                  <th className={styles.th}>Email Institucional</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((club) => (
                  <tr key={club.id} className={styles.trHover}>
                    <td className={styles.td} style={{ fontWeight: 700, color: '#0f172a' }}>{club.name}</td>
                    <td className={styles.td}>{club.address || 'Sin especificar'}</td>
                    <td className={styles.td}>{club.phone || 'Sin especificar'}</td>
                    <td className={styles.td}>{club.email || 'Sin especificar'}</td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEditModal(club)}
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                      >
                        <i className="bi bi-pencil-fill"></i>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <div className={styles.emptyState}>No hay solicitudes de registro pendientes.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Club</th>
                  <th className={styles.th}>Dirección / Teléfono</th>
                  <th className={styles.th}>Administrador</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className={styles.trHover}>
                    <td className={styles.td}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{req.club_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.club_email}</div>
                    </td>
                    <td className={styles.td}>
                      <div>{req.club_address || 'Sin especificar'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tel: {req.club_phone || 'Sin especificar'}</div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ fontWeight: 600 }}>{req.admin_first_name} {req.admin_last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{req.admin_email}</div>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${
                        req.status === 'PENDING' ? styles.badgePending :
                        req.status === 'APPROVED' ? styles.badgeApproved : styles.badgeRejected
                      }`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </td>
                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      {req.status === 'PENDING' && (
                        <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleFetchRequestDetail(req.id)}
                            disabled={isSubmitting || isFetchingDetail}
                            className={`${styles.btn} ${styles.btnDetail}`}
                          >
                            <i className="bi bi-info-circle-fill"></i>
                            Ver Detalle
                          </button>
                          <button
                            onClick={() => handleReviewRequest(req.id, 'APPROVE')}
                            disabled={isSubmitting}
                            className={`${styles.btn} ${styles.btnApprove}`}
                          >
                            <i className="bi bi-check-circle-fill"></i>
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleReviewRequest(req.id, 'REJECT')}
                            disabled={isSubmitting}
                            className={`${styles.btn} ${styles.btnReject}`}
                          >
                            <i className="bi bi-x-circle-fill"></i>
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Modal 1: Editar Club */}
      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Editar Club</h3>
              <button onClick={handleCloseEditModal} className={styles.btnClose}>&times;</button>
            </header>
            <form onSubmit={handleUpdateClub}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre del Club *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Dirección</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Institucional</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>
              <footer className={styles.modalFooter}>
                <button type="button" onClick={handleCloseEditModal} className={`${styles.btn} ${styles.btnSecondary}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className={`${styles.btn} ${styles.btnPrimary}`}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Enlace de Invitación Generado */}
      {isInviteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer} style={{ maxWidth: '500px' }}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Invitación Generada</h3>
              <button onClick={handleCloseInviteModal} className={styles.btnClose}>&times;</button>
            </header>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 1.25rem 0', fontWeight: 600 }}>
                Enlace generado con éxito. Compártelo con el administrador del club.
              </p>
              <div className={styles.linkGeneratedBox} style={{ marginTop: 0 }}>
                <p className={styles.linkGeneratedTitle}>Enlace de registro:</p>
                <div className={styles.linkInputRow}>
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className={styles.linkInput}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    style={{ padding: '0 1.25rem', height: '40px', fontSize: '0.8rem', borderRadius: '0.5rem' }}
                  >
                    {isCopied ? '¡Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button type="button" onClick={handleCloseInviteModal} className={`${styles.btn} ${styles.btnSecondary}`}>
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal 3: Detalle de Solicitud */}
      {isDetailModalOpen && selectedRequest && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer} style={{ maxWidth: '600px' }}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detalle de Solicitud</h3>
              <button onClick={() => { setIsDetailModalOpen(false); setSelectedRequest(null); }} className={styles.btnClose}>&times;</button>
            </header>
            <div className={styles.modalBody}>
              
              {/* Bloque 1: Datos de la Institución */}
              <div className={styles.detailBlock}>
                <h4 className={styles.detailBlockTitle}>Datos de la Institución</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nombre del Club</span>
                    <span className={styles.detailValue}>{selectedRequest.club_name || 'Sin especificar'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email del Club</span>
                    <span className={styles.detailValue}>{selectedRequest.club_email || 'Sin especificar'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Dirección</span>
                    <span className={styles.detailValue}>{selectedRequest.club_address || 'Sin especificar'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Teléfono</span>
                    <span className={styles.detailValue}>{selectedRequest.club_phone || 'Sin especificar'}</span>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Datos de la Cuenta de Usuario */}
              <div className={styles.detailBlock}>
                <h4 className={styles.detailBlockTitle}>Datos del Administrador</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nombre Completo</span>
                    <span className={styles.detailValue}>
                      {selectedRequest.admin_first_name || ''} {selectedRequest.admin_last_name || ''}
                      {(!selectedRequest.admin_first_name && !selectedRequest.admin_last_name) && 'Sin especificar'}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email de Administración</span>
                    <span className={styles.detailValue}>{selectedRequest.admin_email || 'Sin especificar'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Estado</span>
                    <span className={`${styles.badge} ${
                      selectedRequest.status === 'PENDING' ? styles.badgePending :
                      selectedRequest.status === 'APPROVED' ? styles.badgeApproved : styles.badgeRejected
                    }`}>
                      {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

            </div>
            <footer className={styles.modalFooter} style={{ justifyContent: 'space-between' }}>
              <div>
                {selectedRequest.status === 'PENDING' && (
                  <div className={styles.actionsCell}>
                    <button
                      onClick={() => handleReviewRequest(selectedRequest.id, 'APPROVE')}
                      disabled={isSubmitting}
                      className={`${styles.btn} ${styles.btnApprove}`}
                    >
                      <i className="bi bi-check-circle-fill"></i>
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReviewRequest(selectedRequest.id, 'REJECT')}
                      disabled={isSubmitting}
                      className={`${styles.btn} ${styles.btnReject}`}
                    >
                      <i className="bi bi-x-circle-fill"></i>
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => { setIsDetailModalOpen(false); setSelectedRequest(null); }} 
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Cerrar
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
