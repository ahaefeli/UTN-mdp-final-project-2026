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

export default function PlanillerosAdminPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState('activeScorers'); // 'activeScorers' | 'pendingRequests'

  // Data Lists
  const [scorers, setScorers] = useState([]);
  const [requests, setRequests] = useState([]);

  // Loadings & Messages
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

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
      if (activeTab === 'activeScorers') {
        const res = await apiClient.get('internal/usuarios/?role=SCORER');
        setScorers(res.data?.data || []);
      } else {
        const res = await apiClient.get('admin/club-requests/?role=SCORER');
        setRequests(res.data?.data || []);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setErrorMsg('No se pudieron obtener los datos del servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setGeneratedLink('');
  };

  // Generate Invite Link (POST)
  const handleGenerateLink = async (targetRole = 'SCORER') => {
    setIsGeneratingLink(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('admin/club-requests/generate-link/', { role: targetRole });
      
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

  // Approve or Reject Proposed Request (POST)
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
    <div className={`${styles.container} custom_container`}>
      {/* Cabecera */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Gestión de Planilleros</h1>
          <p className={styles.subtitle}>Supervise los planilleros oficiales activos y administre las solicitudes de registro.</p>
        </div>
        <button 
          onClick={() => handleGenerateLink('SCORER')} 
          disabled={isGeneratingLink}
          className={`${styles.btn} ${styles.btnPrimary}`}
          style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
        >
          {isGeneratingLink ? (
            <>
              <div className={styles.spinner} style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderLeftColor: '#ffffff', marginRight: '0.5rem' }} />
              Generando...
            </>
          ) : (
            <>
              <i className="bi bi-person-badge" style={{ fontSize: '1rem', marginRight: '0.5rem' }}></i>
              Invitar Planillero
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
            setActiveTab('activeScorers');
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`${styles.tab} ${activeTab === 'activeScorers' ? styles.tabActive : styles.tabInactive}`}
        >
          Planilleros Activos
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
      ) : activeTab === 'activeScorers' ? (
        scorers.length === 0 ? (
          <div className={styles.emptyState}>No hay planilleros registrados en el sistema.</div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Nombre</th>
                  <th className={styles.th}>DNI</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((sc) => (
                  <tr key={sc.id} className={styles.trHover}>
                    <td className={styles.td} style={{ fontWeight: 700, color: '#0f172a' }}>
                      {sc.name || `${sc.first_name || ''} ${sc.last_name || ''}`}
                    </td>
                    <td className={styles.td}>{sc.dni || 'Sin especificar'}</td>
                    <td className={styles.td}>{sc.email || 'Sin especificar'}</td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${sc.is_active ? styles.badgeApproved : styles.badgeRejected}`}>
                        {sc.is_active ? 'Activo' : 'Inactivo'}
                      </span>
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
                  <th className={styles.th}>Nombre del Planillero</th>
                  <th className={styles.th}>Email</th>
                  <th className={styles.th}>Fecha</th>
                  <th className={styles.th}>Estado</th>
                  <th className={styles.th} style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className={styles.trHover}>
                    <td className={styles.td} style={{ fontWeight: 700, color: '#0f172a' }}>
                      {req.admin_first_name} {req.admin_last_name}
                    </td>
                    <td className={styles.td}>{req.admin_email}</td>
                    <td className={styles.td}>
                      {req.created_at ? new Date(req.created_at).toLocaleDateString('es-AR') : 'Sin especificar'}
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

      {/* Modal: Enlace de Invitación Generado */}
      {isInviteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer} style={{ maxWidth: '500px' }}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Invitación Generada</h3>
              <button onClick={handleCloseInviteModal} className={styles.btnClose}>&times;</button>
            </header>
            <div className={styles.modalBody}>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: '0 0 1.25rem 0', fontWeight: 600 }}>
                Enlace generado con éxito. Compártelo con el planillero.
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

      {/* Modal: Detalle de Solicitud de Planillero */}
      {isDetailModalOpen && selectedRequest && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer} style={{ maxWidth: '600px' }}>
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detalle de Solicitud</h3>
              <button onClick={() => { setIsDetailModalOpen(false); setSelectedRequest(null); }} className={styles.btnClose}>&times;</button>
            </header>
            <div className={styles.modalBody}>
              
              <div className={styles.detailBlock}>
                <h4 className={styles.detailBlockTitle}>Datos del Planillero</h4>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nombre Completo</span>
                    <span className={styles.detailValue}>
                      {selectedRequest.admin_first_name || ''} {selectedRequest.admin_last_name || ''}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>DNI</span>
                    <span className={styles.detailValue}>{selectedRequest.admin_dni || 'Sin especificar'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email</span>
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
