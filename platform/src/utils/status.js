export const STATUS_TRANSLATIONS = {
  PREPARATION: 'En preparación',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En disputa',
  CANCELLED: 'Cancelado',
  FINISHED: 'Finalizado',
};

export function formatStatus(status) {
  if (!status) return '';
  return STATUS_TRANSLATIONS[status] || status;
}
