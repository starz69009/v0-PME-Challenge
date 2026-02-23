import type { CompanyRole, EventCategory } from './types'

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  social: 'Social',
  commercial: 'Commercial',
  tresorerie: 'Tresorerie',
  production: 'Production',
  reglementaire: 'Reglementaire',
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  social: '#3b82f6',
  commercial: '#10b981',
  tresorerie: '#f59e0b',
  production: '#8b5cf6',
  reglementaire: '#ef4444',
}

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  dg: 'Directeur General',
  commercial: 'Responsable Commercial',
  rh: 'Responsable RH',
  production: 'Responsable Production',
  finance: 'Responsable Finance',
  collaborateur: 'Collaborateur',
}

export const SCORE_FIELDS = [
  { key: 'points_social', label: 'Social', color: '#3b82f6' },
  { key: 'points_commercial', label: 'Commercial', color: '#10b981' },
  { key: 'points_tresorerie', label: 'Tresorerie', color: '#f59e0b' },
  { key: 'points_production', label: 'Production', color: '#8b5cf6' },
  { key: 'points_reglementaire', label: 'Reglementaire', color: '#ef4444' },
] as const

export const SESSION_STATUS_LABELS = {
  setup: 'Configuration',
  active: 'En cours',
  completed: 'Terminee',
} as const

export const DECISION_STATUS_LABELS = {
  pending: 'En attente',
  proposed: 'Proposee',
  voting: 'Vote en cours',
  validated: 'Validee',
  rejected: 'Rejetee',
} as const
