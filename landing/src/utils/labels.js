export const STATUS_LABELS = {
  PREPARATION: 'En preparación',
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En disputa',
  CANCELLED: 'Cancelado',
  FINISHED: 'Finalizado',
};

export const CATEGORY_LABELS = {
  SUB_14: 'Sub-14',
  SUB_16: 'Sub-16',
  SUB_18: 'Sub-18',
  SUB_21: 'Sub-21',
  PRIMERA: 'Primera',
  MAXI: 'Maxi',
};

export const BRANCH_LABELS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
};

export function formatStatus(status) {
  if (!status) return 'Próximamente';
  return STATUS_LABELS[status] || 'Próximamente';
}

export function formatCategory(value) {
  if (!value) return '';
  return CATEGORY_LABELS[value] || String(value).replaceAll('_', ' ');
}

export function formatBranch(value) {
  if (!value) return '';
  return BRANCH_LABELS[value] || value;
}
