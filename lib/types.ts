export type UserRole = 'admin' | 'team_member'
export type CompanyRole = 'dg' | 'commercial' | 'rh' | 'production' | 'finance' | 'collaborateur'
export type SessionStatus = 'setup' | 'active' | 'completed'
export type EventStatus = 'pending' | 'active' | 'resolved'
export type DecisionStatus = 'pending' | 'proposed' | 'voting' | 'validated' | 'rejected'
export type EventCategory = 'social' | 'commercial' | 'tresorerie' | 'production' | 'reglementaire'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  role: UserRole
  plain_password: string | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  slogan: string | null
  colors_primary: string
  colors_secondary: string
  created_by: string | null
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role_in_company: CompanyRole
  created_at: string
  profiles?: Profile
}

export interface GameEvent {
  id: string
  title: string
  description: string
  category: EventCategory | null
  sort_order: number
  is_active: boolean
  created_at: string
  event_options?: EventOption[]
}

export interface EventOption {
  id: string
  event_id: string
  label: string
  description: string | null
  points_social: number
  points_commercial: number
  points_tresorerie: number
  points_production: number
  points_reglementaire: number
  points_moyenne: number
  sort_order: number
  created_at: string
}

export interface GameSession {
  id: string
  name: string
  status: SessionStatus
  current_event_order: number
  created_by: string | null
  created_at: string
}

export interface SessionEvent {
  id: string
  session_id: string
  event_id: string
  status: EventStatus
  event_order: number
  triggered_at: string | null
  resolved_at: string | null
  duration_seconds: number | null
  expires_at: string | null
  created_at: string
  events?: GameEvent
}

export interface Decision {
  id: string
  session_event_id: string
  team_id: string
  proposed_option_id: string | null
  proposed_by: string | null
  status: DecisionStatus
  dg_validated: boolean
  dg_validated_by: string | null
  dg_validated_at: string | null
  created_at: string
  event_options?: EventOption
  teams?: Team
}

export interface Vote {
  id: string
  decision_id: string
  user_id: string
  option_id: string
  created_at: string
  event_options?: EventOption
  profiles?: Profile
}

export interface TeamScore {
  id: string
  team_id: string
  session_id: string
  session_event_id: string | null
  points_social: number
  points_commercial: number
  points_tresorerie: number
  points_production: number
  points_reglementaire: number
  points_moyenne: number
  created_at: string
  teams?: Team
}

export interface ScoreCategories {
  social: number
  commercial: number
  tresorerie: number
  production: number
  reglementaire: number
}
