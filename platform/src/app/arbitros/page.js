'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { copyText } from '../../utils/copyText';
import buttonStyles from '../../components/ui/Button.module.css';
import {
  PageHeader,
  Button,
  Alert,
  Modal,
  DataTable,
  LoadingState,
  EmptyState,
  StatusBadge,
  Tabs,
} from '../../components/ui';
import dirStyles from '../../components/ui/AdminDirectory.module.css';
import styles from './page.module.css';
import PendingInvites from '../../components/PendingInvites/PendingInvites';

const STATUS_LABELS = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

const ACTIVE_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'dni', label: 'DNI' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Estado' },
];

const REQUEST_COLUMNS = [
  { key: 'name', label: 'Nombre del Árbitro' },
  { key: 'email', label: 'Email' },
  { key: 'date', label: 'Fecha' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
];

function RequestStatusBadge({ status }) {
  const variant =
    status === 'PENDING' ? 'warning' : status === 'APPROVED' ? 'success' : 'danger';

  return <StatusBadge variant={variant} label={STATUS_LABELS[status] || status} />;
}

export default function ArbitrosAdminPage() {
  const router = useRouter();
  const { role, isAuthenticated, isInitialized } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState('activeReferees'); // 'activeReferees' | 'pendingRequests'

  // Data Lists
  const [referees, setReferees] = useState([]);
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
  const [copyError, setCopyError] = useState('');

  // Detail Modal state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  // Invitation Link state
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [inviteTick, setInviteTick] = useState(0);
  const [reviewTarget, setReviewTarget] = useState(null);

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
      if (activeTab === 'activeReferees') {
        const res = await apiClient.get('internal/usuarios/?role=REFEREE');
        setReferees(res.data?.data || []);
      } else {
        const res = await apiClient.get('admin/club-requests/?role=REFEREE');
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
    setIsCopied(false);
    setCopyError('');
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Generate Invite Link (POST)
  const handleGenerateLink = async (targetRole = 'REFEREE') => {
    setIsGeneratingLink(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('admin/club-requests/generate-link/', { role: targetRole });

      const token = res.data?.token || '';
      const link = `${window.location.origin}/register?token=${token}`;

      setGeneratedLink(link);
      setIsCopied(false);
      setCopyError('');
      setIsInviteModalOpen(true);
      setInviteTick((value) => value + 1);
      setSuccessMsg('Enlace generado exitosamente.');
    } catch (err) {
      console.error('Error al generar enlace:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo generar el enlace de invitación.');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    setCopyError('');
    const ok = await copyText(generatedLink);
    if (!ok) {
      setIsCopied(false);
      setCopyError('No se pudo copiar el enlace. Seleccionalo y copialo manualmente.');
      return;
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
  const handleReviewRequest = (requestId, action) => {
    setReviewTarget({ requestId, action });
  };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    const { requestId, action } = reviewTarget;
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiClient.post(`admin/club-requests/${requestId}/review/`, { action });
      setSuccessMsg(`Solicitud ${action === 'APPROVE' ? 'aprobada' : 'rechazada'} con éxito.`);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      setReviewTarget(null);
      setInviteTick((value) => value + 1);
      loadData();
    } catch (err) {
      console.error('Error al procesar solicitud:', err);
      setErrorMsg(err.response?.data?.error || 'No se pudo procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={dirStyles.page}>
        <PageHeader
          title="Gestión de Árbitros"
          subtitle="El alta es por invitación: generá el enlace, la persona completa sus datos y vos aprobás la solicitud. No se carga el usuario a mano."
          actions={
            <Button
              variant="accent"
              onClick={() => handleGenerateLink('REFEREE')}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? (
                'Generando...'
              ) : (
                <>
                  <i className="bi bi-person-badge" aria-hidden="true"></i>
                  Invitar Árbitro
                </>
              )}
            </Button>
          }
        />

        <PendingInvites role="REFEREE" refreshKey={inviteTick} />

        <Modal
          open={Boolean(reviewTarget)}
          onClose={() => !isSubmitting && setReviewTarget(null)}
          title={reviewTarget?.action === 'APPROVE' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setReviewTarget(null)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                variant={reviewTarget?.action === 'REJECT' ? 'danger' : 'primary'}
                onClick={confirmReview}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : reviewTarget?.action === 'APPROVE' ? 'Aprobar' : 'Rechazar'}
              </Button>
            </>
          }
        >
          <p>
            {reviewTarget?.action === 'APPROVE'
              ? 'Se crea la cuenta con los datos de la solicitud.'
              : 'La solicitud queda rechazada y, si era un enlace, deja de servir.'}
          </p>
        </Modal>

        {(successMsg || errorMsg) && (
          <div className={dirStyles.alerts}>
            {successMsg && (
              <Alert variant="success">
                <div className={styles.alertRow}>
                  <span>{successMsg}</span>
                  <button
                    type="button"
                    className={styles.dismissBtn}
                    onClick={() => setSuccessMsg('')}
                    aria-label="Cerrar mensaje"
                  >
                    ×
                  </button>
                </div>
              </Alert>
            )}
            {errorMsg && (
              <Alert variant="error">
                <div className={styles.alertRow}>
                  <span>{errorMsg}</span>
                  <button
                    type="button"
                    className={styles.dismissBtn}
                    onClick={() => setErrorMsg('')}
                    aria-label="Cerrar mensaje"
                  >
                    ×
                  </button>
                </div>
              </Alert>
            )}
          </div>
        )}

        <Tabs
          tabs={[
            { id: 'activeReferees', label: 'Árbitros Activos' },
            { id: 'pendingRequests', label: 'Solicitudes Pendientes' },
          ]}
          active={activeTab}
          onChange={handleTabChange}
        />

        {isLoading ? (
          <LoadingState label="Cargando información..." />
        ) : activeTab === 'activeReferees' ? (
          referees.length === 0 ? (
            <EmptyState title="No hay árbitros registrados en el sistema." />
          ) : (
            <DataTable columns={ACTIVE_COLUMNS}>
              {referees.map((ref) => (
                <tr key={ref.id}>
                  <td className={styles.nameCell}>
                    {ref.name || `${ref.first_name || ''} ${ref.last_name || ''}`}
                  </td>
                  <td>{ref.dni || 'Sin especificar'}</td>
                  <td>{ref.email || 'Sin especificar'}</td>
                  <td>
                    <StatusBadge
                      variant={ref.is_active ? 'success' : 'neutral'}
                      label={ref.is_active ? 'Activo' : 'Inactivo'}
                    />
                  </td>
                </tr>
              ))}
            </DataTable>
          )
        ) : requests.length === 0 ? (
          <EmptyState title="No hay solicitudes de registro pendientes." />
        ) : (
          <DataTable columns={REQUEST_COLUMNS}>
            {requests.map((req) => (
              <tr key={req.id}>
                <td className={styles.nameCell}>
                  {req.admin_first_name} {req.admin_last_name}
                </td>
                <td>{req.admin_email}</td>
                <td>
                  {req.created_at
                    ? new Date(req.created_at).toLocaleDateString('es-AR')
                    : 'Sin especificar'}
                </td>
                <td>
                  <RequestStatusBadge status={req.status} />
                </td>
                <td>
                  {req.status === 'PENDING' && (
                    <div className={dirStyles.tableActions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleFetchRequestDetail(req.id)}
                        disabled={isSubmitting || isFetchingDetail}
                      >
                        <i className="bi bi-info-circle-fill" aria-hidden="true"></i>
                        Ver Detalle
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={() => handleReviewRequest(req.id, 'APPROVE')}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReviewRequest(req.id, 'REJECT')}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
                        Rechazar
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}

        <Modal
          open={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          title="Invitación Generada"
          footer={
            <Button variant="secondary" onClick={handleCloseInviteModal}>
              Cerrar
            </Button>
          }
        >
          <p className={dirStyles.muted}>
            Enlace generado con éxito. Compártelo con el árbitro.
          </p>
          <div className={dirStyles.formGroup}>
            <span className={dirStyles.label}>Enlace de registro:</span>
            <div className={styles.linkRow}>
              <input
                type="text"
                readOnly
                value={generatedLink}
                className={dirStyles.input}
                onClick={(e) => e.target.select()}
              />
              <Button
                type="button"
                onClick={handleCopyLink}
                size="sm"
                className={isCopied ? buttonStyles.copied : ''}
              >
                {isCopied ? 'Copiado' : 'Copiar Link'}
              </Button>
            </div>
            {copyError ? <p className={dirStyles.copyError}>{copyError}</p> : null}
          </div>
        </Modal>

        <Modal
          open={isDetailModalOpen && Boolean(selectedRequest)}
          onClose={handleCloseDetailModal}
          title="Detalle de Solicitud"
          size="lg"
          footer={
            <div className={styles.footerSplit}>
              <div className={styles.footerActions}>
                {selectedRequest?.status === 'PENDING' && (
                  <>
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => handleReviewRequest(selectedRequest.id, 'APPROVE')}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReviewRequest(selectedRequest.id, 'REJECT')}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
                      Rechazar
                    </Button>
                  </>
                )}
              </div>
              <Button variant="secondary" onClick={handleCloseDetailModal}>
                Cerrar
              </Button>
            </div>
          }
        >
          {selectedRequest && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailSectionTitle}>Datos del Árbitro</h4>
              <div className={dirStyles.detailGrid}>
                <div className={dirStyles.detailItem}>
                  <span className={dirStyles.detailLabel}>Nombre Completo</span>
                  <span className={dirStyles.detailValue}>
                    {selectedRequest.admin_first_name || ''} {selectedRequest.admin_last_name || ''}
                  </span>
                </div>
                <div className={dirStyles.detailItem}>
                  <span className={dirStyles.detailLabel}>DNI</span>
                  <span className={dirStyles.detailValue}>
                    {selectedRequest.admin_dni || 'Sin especificar'}
                  </span>
                </div>
                <div className={dirStyles.detailItem}>
                  <span className={dirStyles.detailLabel}>Email</span>
                  <span className={dirStyles.detailValue}>
                    {selectedRequest.admin_email || 'Sin especificar'}
                  </span>
                </div>
                <div className={dirStyles.detailItem}>
                  <span className={dirStyles.detailLabel}>Estado</span>
                  <RequestStatusBadge status={selectedRequest.status} />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
