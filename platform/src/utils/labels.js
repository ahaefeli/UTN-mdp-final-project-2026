export const CATEGORY_LABELS = {
  SUB_14: 'Sub-14',
  SUB_16: 'Sub-16',
  SUB_18: 'Sub-18',
  SUB_21: 'Sub-21',
  PRIMERA: 'Primera',
  MAXI: 'Maxi',
  'SUB-14': 'Sub-14',
  'SUB-16': 'Sub-16',
  'SUB-18': 'Sub-18',
};

export const BRANCH_LABELS = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  M: 'Masculino',
  F: 'Femenino',
};

export function formatCategory(value) {
  if (!value) return '';
  return CATEGORY_LABELS[value] || String(value).replaceAll('_', ' ');
}

export function formatBranch(value) {
  if (!value) return '';
  return BRANCH_LABELS[value] || value;
}
