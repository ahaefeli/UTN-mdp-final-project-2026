'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../services/apiClient';
import { copyText } from '../../utils/copyText';
import { phoneError } from '../../utils/phone';
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

const STATUS_VARIANTS = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

const TABS = [
  { id: 'activeClubs', label: 'Clubes Activos' },
  { id: 'pendingRequests', label: 'Solicitudes Pendientes' },
];

const ACTIVE_CLUB_COLUMNS = [
  { key: 'name', label: 'Nombre' },
  { key: 'address', label: 'Dirección' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'email', label: 'Email Institucional' },
  { key: 'actions', label: 'Acciones' },
];

const REQUEST_COLUMNS = [
  { key: 'club', label: 'Club' },
  { key: 'address', label: 'Dirección / Teléfono' },
  { key: 'admin', label: 'Administrador' },
  { key: 'status', label: 'Estado' },
  { key: 'actions', label: 'Acciones' },
];

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
  const [copyError, setCopyError] = useState('');

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
  const [inviteLabel, setInviteLabel] = useState('');
  const [inviteTick, setInviteTick] = useState(0);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

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
    const invalidPhone = phoneError(editPhone);
    if (invalidPhone) {
      setErrorMsg(invalidPhone);
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
        organization_id: selectedClub.organization_id,
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
    setInviteLabel('');
    setIsCopied(false);
    setCopyError('');
  };

  const openInviteModal = () => {
    setGeneratedLink('');
    setInviteLabel('');
    setCopyError('');
    setIsInviteModalOpen(true);
  };

  // Generate Invite Link (POST)
  const handleGenerateLink = async (targetRole = 'CLUB_ADMIN') => {
    setIsGeneratingLink(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.post('admin/club-requests/generate-link/', {
        role: targetRole,
        recipient_label: inviteLabel.trim(),
      });

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

  // Approve or Reject Proposed Club Request (POST)
  const handleReviewRequest = (requestId, action) => {
    setReviewError('');
    setRejectionReason('');
    setReviewTarget({ requestId, action });
  };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    const { requestId, action } = reviewTarget;
    if (action === 'REJECT' && !rejectionReason.trim()) {
      setReviewError('El rechazo necesita un motivo.');
      return;
    }
    setIsSubmitting(true);
    setReviewError('');
    setSuccessMsg('');
    try {
      await apiClient.post(`admin/club-requests/${requestId}/review/`, {
        action,
        rejection_reason: rejectionReason.trim(),
      });
      setSuccessMsg(`Solicitud ${action === 'APPROVE' ? 'aprobada' : 'rechazada'} con éxito.`);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      setReviewTarget(null);
      setRejectionReason('');
      setInviteTick((value) => value + 1);
      loadData();
    } catch (err) {
      console.error('Error al procesar solicitud:', err);
      setReviewError(err.response?.data?.error || 'No se pudo procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  };

  if (!isInitialized || !isAuthenticated || role !== 'ADMIN') {
    return <LoadingState full />;
  }

  return (
    <div className="appShell">
      <div className={dirStyles.page}>
        <PageHeader
          title="Gestión de Clubes"
          subtitle="El alta es por invitación: generá el enlace, el club completa sus datos y vos aprobás la solicitud. No se carga el usuario a mano."
          actions={
            <Button onClick={openInviteModal} disabled={isGeneratingLink}>
              <i className="bi bi-building" aria-hidden="true" />
              {isGeneratingLink ? 'Generando...' : 'Invitar Club'}
            </Button>
          }
        />

        <PendingInvites role="CLUB_ADMIN" refreshKey={inviteTick} />

        <Modal
          open={Boolean(reviewTarget)}
          stacked
          onClose={() => {
            if (isSubmitting) return;
            setReviewTarget(null);
            setReviewError('');
            setRejectionReason('');
          }}
          title={reviewTarget?.action === 'APPROVE' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => { setReviewTarget(null); setReviewError(''); setRejectionReason(''); }} disabled={isSubmitting}>
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
              ? 'Se crea el usuario con los datos de la solicitud.'
              : 'La solicitud queda rechazada y, si era un enlace, deja de servir.'}
          </p>
          {reviewTarget?.action === 'REJECT' && (
            <label className={dirStyles.label} htmlFor="club-rejection-reason">
              Motivo
              <textarea
                id="club-rejection-reason"
                className={dirStyles.textarea}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </label>
          )}
          {reviewError && <Alert variant="error">{reviewError}</Alert>}
        </Modal>

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

        <Tabs tabs={TABS} active={activeTab} onChange={handleTabChange} />

        {isLoading ? (
          <LoadingState label="Cargando información..." />
        ) : activeTab === 'activeClubs' ? (
          clubs.length === 0 ? (
            <EmptyState title="No hay clubes registrados en el sistema." />
          ) : (
            <DataTable columns={ACTIVE_CLUB_COLUMNS}>
              {clubs.map((club) => (
                <tr key={club.id}>
                  <td className={styles.cellStrong}>{club.name}</td>
                  <td>{club.address || 'Sin especificar'}</td>
                  <td>{club.phone || 'Sin especificar'}</td>
                  <td>{club.email || 'Sin especificar'}</td>
                  <td className={styles.cellActions}>
                    <Button variant="secondary" size="sm" onClick={() => handleOpenEditModal(club)}>
                      <i className="bi bi-pencil-fill" aria-hidden="true" />
                      Editar
                    </Button>
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
                <td>
                  <div className={styles.cellStrong}>{req.club_name}</div>
                  <div className={styles.cellMuted}>{req.club_email}</div>
                </td>
                <td>
                  <div>{req.club_address || 'Sin especificar'}</div>
                  <div className={styles.cellMuted}>Tel: {req.club_phone || 'Sin especificar'}</div>
                </td>
                <td>
                  <div className={styles.cellStrong}>
                    {req.admin_first_name} {req.admin_last_name}
                  </div>
                  <div className={styles.cellMuted}>{req.admin_email}</div>
                </td>
                <td>
                  <StatusBadge variant={STATUS_VARIANTS[req.status] || 'neutral'}>
                    {STATUS_LABELS[req.status] || req.status}
                  </StatusBadge>
                </td>
                <td className={styles.cellActions}>
                  {req.status === 'PENDING' && (
                    <div className={dirStyles.tableActions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleFetchRequestDetail(req.id)}
                        disabled={isSubmitting || isFetchingDetail}
                      >
                        <i className="bi bi-info-circle-fill" aria-hidden="true" />
                        Ver Detalle
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReviewRequest(req.id, 'APPROVE')}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-check-circle-fill" aria-hidden="true" />
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReviewRequest(req.id, 'REJECT')}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-x-circle-fill" aria-hidden="true" />
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
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          title="Editar Club"
          footer={
            <>
              <Button variant="secondary" onClick={handleCloseEditModal}>
                Cancelar
              </Button>
              <Button type="submit" form="edit-club-form" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          }
        >
          <form id="edit-club-form" onSubmit={handleUpdateClub} className={dirStyles.form}>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-club-name">
                Nombre del Club *
              </label>
              <input
                id="edit-club-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={dirStyles.input}
                required
              />
            </div>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-club-address">
                Dirección
              </label>
              <input
                id="edit-club-address"
                type="text"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className={dirStyles.input}
              />
            </div>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-club-phone">
                Teléfono de Contacto
              </label>
              <input
                id="edit-club-phone"
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className={dirStyles.input}
              />
            </div>
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="edit-club-email">
                Email Institucional
              </label>
              <input
                id="edit-club-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={dirStyles.input}
              />
            </div>
          </form>
        </Modal>

        <Modal
          open={isInviteModalOpen}
          onClose={handleCloseInviteModal}
          title={generatedLink ? 'Invitación generada' : 'Nueva invitación'}
          size="sm"
          footer={
            generatedLink ? (
              <Button variant="secondary" onClick={handleCloseInviteModal}>
                Cerrar
              </Button>
            ) : (
              <Button onClick={() => handleGenerateLink('CLUB_ADMIN')} disabled={isGeneratingLink}>
                {isGeneratingLink ? 'Generando...' : 'Generar enlace'}
              </Button>
            )
          }
        >
          <div className={dirStyles.form}>
            {!generatedLink ? (
              <label className={dirStyles.label} htmlFor="invite-recipient">
                Destinatario (opcional)
                <input
                  id="invite-recipient"
                  className={dirStyles.input}
                  value={inviteLabel}
                  onChange={(e) => setInviteLabel(e.target.value)}
                  placeholder="Ej: DT de Huracán"
                />
              </label>
            ) : null}
            <p className={dirStyles.muted}>
              {generatedLink
                ? 'Enlace generado. Compartilo con la persona indicada.'
                : 'El enlace sirve una sola vez y vence a las 48 horas.'}
            </p>
            {generatedLink ? (
            <div className={dirStyles.formGroup}>
              <label className={dirStyles.label} htmlFor="invite-link">
                Enlace de registro:
              </label>
              <div className={styles.linkRow}>
                <input
                  id="invite-link"
                  type="text"
                  readOnly
                  value={generatedLink}
                  className={dirStyles.input}
                  onClick={(e) => e.target.select()}
                />
                <Button
                  type="button"
                  onClick={handleCopyLink}
                  className={isCopied ? buttonStyles.copied : ''}
                >
                  {isCopied ? 'Copiado' : 'Copiar Link'}
                </Button>
              </div>
              {copyError ? <p className={dirStyles.copyError}>{copyError}</p> : null}
            </div>
            ) : null}
          </div>
        </Modal>

        <Modal
          open={isDetailModalOpen && Boolean(selectedRequest)}
          onClose={handleCloseDetailModal}
          title="Detalle de Solicitud"
          size="lg"
          footer={
            <div className={styles.footerSplit}>
              <div>
                {selectedRequest?.status === 'PENDING' && (
                  <div className={styles.actionGroup}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleReviewRequest(selectedRequest.id, 'APPROVE')}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-check-circle-fill" aria-hidden="true" />
                      Aprobar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReviewRequest(selectedRequest.id, 'REJECT')}
                      disabled={isSubmitting}
                    >
                      <i className="bi bi-x-circle-fill" aria-hidden="true" />
                      Rechazar
                    </Button>
                  </div>
                )}
              </div>
              <Button variant="secondary" onClick={handleCloseDetailModal}>
                Cerrar
              </Button>
            </div>
          }
        >
          {selectedRequest && (
            <>
              <div className={dirStyles.formGroup}>
                <span className={dirStyles.detailLabel}>Datos de la Institución</span>
                <div className={dirStyles.detailGrid}>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Nombre del Club</span>
                    <span className={dirStyles.detailValue}>
                      {selectedRequest.club_name || 'Sin especificar'}
                    </span>
                  </div>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Email del Club</span>
                    <span className={dirStyles.detailValue}>
                      {selectedRequest.club_email || 'Sin especificar'}
                    </span>
                  </div>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Dirección</span>
                    <span className={dirStyles.detailValue}>
                      {selectedRequest.club_address || 'Sin especificar'}
                    </span>
                  </div>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Teléfono</span>
                    <span className={dirStyles.detailValue}>
                      {selectedRequest.club_phone || 'Sin especificar'}
                    </span>
                  </div>
                </div>
              </div>

              <div className={dirStyles.formGroup}>
                <span className={dirStyles.detailLabel}>Datos del Administrador</span>
                <div className={dirStyles.detailGrid}>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Nombre Completo</span>
                    <span className={dirStyles.detailValue}>
                      {selectedRequest.admin_first_name || ''} {selectedRequest.admin_last_name || ''}
                      {!selectedRequest.admin_first_name && !selectedRequest.admin_last_name && 'Sin especificar'}
                    </span>
                  </div>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Email de Administración</span>
                    <span className={dirStyles.detailValue}>
                      {selectedRequest.admin_email || 'Sin especificar'}
                    </span>
                  </div>
                  <div className={dirStyles.detailItem}>
                    <span className={dirStyles.detailLabel}>Estado</span>
                    <StatusBadge variant={STATUS_VARIANTS[selectedRequest.status] || 'neutral'}>
                      {STATUS_LABELS[selectedRequest.status] || selectedRequest.status}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </>
          )}
        </Modal>
      </div>
    </div>
  );
}
