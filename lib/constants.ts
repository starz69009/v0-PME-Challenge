import type { CompanyRole, EventCategory } from './types'

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  social: 'Social',
  commercial: 'Commercial',
  tresorerie: 'Tresorerie',
  production: 'Production',
  reglementaire: 'Reglementaire',
}

export const CATEGORY_COLORS: Record<EventCategory, string> = {
  social: '#38bdf8',
  commercial: '#34d399',
  tresorerie: '#fbbf24',
  production: '#c084fc',
  reglementaire: '#f87171',
}

export const COMPANY_ROLE_LABELS: Record<CompanyRole, string> = {
  dg: 'Directeur General',
  commercial: 'Responsable Commercial',
  rh: 'Responsable RH',
  production: 'Responsable Production',
  finance: 'Responsable Finance',
}

export const SCORE_FIELDS = [
  { key: 'points_social', label: 'Social', short: 'SOC', color: '#38bdf8' },
  { key: 'points_commercial', label: 'Commercial', short: 'COM', color: '#34d399' },
  { key: 'points_tresorerie', label: 'Tresorerie', short: 'TRE', color: '#fbbf24' },
  { key: 'points_production', label: 'Production', short: 'PRO', color: '#c084fc' },
  { key: 'points_reglementaire', label: 'Reglementaire', short: 'REG', color: '#f87171' },
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
