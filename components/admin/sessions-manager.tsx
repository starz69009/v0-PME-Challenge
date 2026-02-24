"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CategoryBadge } from "@/components/category-badge"
import { Plus, Play, Eye, Trash2, Zap, Building2, Users, Timer, Square, ChevronDown, ChevronRight, CheckCircle2, Clock, Trophy, MessageSquare, Award } from "lucide-react"
import { SESSION_STATUS_LABELS, SCORE_FIELDS, CATEGORY_LABELS, COMPANY_ROLE_LABELS, CATEGORY_SPECIALIST_ROLE, DECISION_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { GameSession, GameEvent, Team, Entreprise, SessionTeam, SessionEvent, Decision, TeamScore, Vote, TeamMember, Profile, SessionStatus, EventCategory, CompanyRole, EventOption } from "@/lib/types"

const STATUS_STYLES: Record<string, string> = {
  setup: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
  active: "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]",
  completed: "border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16]",
}

const EVENT_STATUS_STYLES: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground" },
  active: { label: "En cours", className: "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]" },
  resolved: { label: "Termine", className: "border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16]" },
}

const DURATION_PRESETS = [
  { label: "5 min", value: 300 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 heure", value: 3600 },
  { label: "1 jour", value: 86400 },
  { label: "3 jours", value: 259200 },
]

function formatDuration(seconds: number) {
  if (seconds >= 86400) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    return h > 0 ? `${d}j ${h}h` : `${d}j`
  }
  if (seconds >= 3600) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }
  const m = Math.floor(seconds / 60)
  return `${m}min`
}

interface ScoreOverrides {
  [teamId: string]: {
    points_social: number
    points_commercial: number
    points_tresorerie: number
    points_production: number
    points_reglementaire: number
    admin_comment: string
  }
}

export function SessionsManager({
  initialSessions,
  events,
  teams,
  entreprises,
  sessionTeams,
  sessionEvents,
  decisions,
  teamScores,
  votes = [],
  teamMembers = [],
}: {
  initialSessions: GameSession[]
  events: GameEvent[]
  teams: Team[]
  entreprises: Entreprise[]
  sessionTeams: SessionTeam[]
  sessionEvents: SessionEvent[]
  decisions: Decision[]
  teamScores: TeamScore[]
  votes?: Vote[]
  teamMembers?: TeamMember[]
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState(initialSessions)
  const [createOpen, setCreateOpen] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState("")
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // Event trigger state
  const [triggerSessionId, setTriggerSessionId] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState("")
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset")
  const [selectedPreset, setSelectedPreset] = useState(1800)
  const [customDays, setCustomDays] = useState("")
  const [customHours, setCustomHours] = useState("")
  const [customMinutes, setCustomMinutes] = useState("")

  // Scoring state
  const [scoringEventId, setScoringEventId] = useState<string | null>(null)
  const [scoreOverrides, setScoreOverrides] = useState<ScoreOverrides>({})

  // Collapsible history state
  const [openHistories, setOpenHistories] = useState<Set<string>>(new Set())

  const activeEvents = useMemo(() => events.filter((e) => e.is_active), [events])

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  function toggleHistory(sessionId: string) {
    setOpenHistories((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  function getSessionTeams(sessionId: string) {
    return sessionTeams.filter((st) => st.session_id === sessionId)
  }

  function getSessionEvents(sessionId: string) {
    return sessionEvents.filter((se) => se.session_id === sessionId)
  }

  function getDecisionsForEvent(sessionEventId: string) {
    return decisions.filter((d) => d.session_event_id === sessionEventId)
  }

  function getTeamScoresForEvent(sessionEventId: string) {
    return teamScores.filter((s) => s.session_event_id === sessionEventId)
  }

  function getVotesForDecision(decisionId: string) {
    return votes.filter((v) => v.decision_id === decisionId)
  }

  function getMemberRole(userId: string, teamId: string): CompanyRole | undefined {
    const m = teamMembers.find((tm) => tm.user_id === userId && tm.team_id === teamId)
    return m?.role_in_company
  }

  function getMemberName(userId: string): string {
    const m = teamMembers.find((tm) => tm.user_id === userId)
    return m?.profiles?.display_name || m?.profiles?.email || "Joueur"
  }

  function getDurationSeconds(): number {
    if (durationMode === "preset") return selectedPreset
    const days = parseInt(customDays) || 0
    const hours = parseInt(customHours) || 0
    const mins = parseInt(customMinutes) || 0
    return days * 86400 + hours * 3600 + mins * 60
  }

  function resetTriggerForm() {
    setTriggerSessionId(null)
    setSelectedEventId("")
    setDurationMode("preset")
    setSelectedPreset(1800)
    setCustomDays("")
    setCustomHours("")
    setCustomMinutes("")
  }

  // Initialize score overrides from the chosen options' predefined scores
  function initScoreOverrides(sessionEventId: string) {
    const eventDecisions = getDecisionsForEvent(sessionEventId)
    const overrides: ScoreOverrides = {}
    for (const d of eventDecisions) {
      const opt = d.event_options
      overrides[d.team_id] = {
        points_social: opt?.points_social ?? 0,
        points_commercial: opt?.points_commercial ?? 0,
        points_tresorerie: opt?.points_tresorerie ?? 0,
        points_production: opt?.points_production ?? 0,
        points_reglementaire: opt?.points_reglementaire ?? 0,
        admin_comment: d.admin_comment || "",
      }
    }
    setScoreOverrides(overrides)
    setScoringEventId(sessionEventId)
  }

  function updateScoreOverride(teamId: string, field: string, value: number | string) {
    setScoreOverrides((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [field]: value,
      },
    }))
  }

  async function createSession() {
    if (!sessionName.trim()) return
    if (!selectedEntrepriseId) { toast.error("Selectionnez une entreprise"); return }
    if (selectedTeamIds.size === 0) { toast.error("Selectionnez au moins une equipe"); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({ name: sessionName, created_by: user?.id, entreprise_id: selectedEntrepriseId })
      .select()
      .single()

    if (error || !session) { toast.error("Erreur lors de la creation"); setLoading(false); return }

    const teamLinks = Array.from(selectedTeamIds).map((teamId) => ({ session_id: session.id, team_id: teamId }))
    await supabase.from("session_teams").insert(teamLinks)

    toast.success("Session creee avec succes")
    setSessionName(""); setSelectedEntrepriseId(""); setSelectedTeamIds(new Set()); setCreateOpen(false)
    router.refresh()
    setLoading(false)
  }

  async function deleteSession(id: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("game_sessions").delete().eq("id", id)
    if (error) toast.error("Erreur lors de la suppression")
    else {
      toast.success("Session supprimee")
      setSessions((prev) => prev.filter((s) => s.id !== id))
    }
    router.refresh()
    setLoading(false)
  }

  async function startSession(id: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from("game_sessions").update({ status: "active", current_event_order: 0 }).eq("id", id)
    toast.success("Session demarree")
    router.refresh()
    setLoading(false)
  }

  async function completeSession(id: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase.from("game_sessions").update({ status: "completed" }).eq("id", id)
    toast.success("Session terminee")
    router.refresh()
    setLoading(false)
  }

  async function triggerEvent() {
    if (!triggerSessionId || !selectedEventId) return
    const durationSeconds = getDurationSeconds()
    if (durationSeconds < 60) { toast.error("La duree doit etre d'au moins 1 minute"); return }

    setLoading(true)
    const supabase = createClient()
    const event = events.find((e) => e.id === selectedEventId)
    if (!event) { toast.error("Evenement introuvable"); setLoading(false); return }

    const { data: existingSessionEvent } = await supabase
      .from("session_events")
      .select("*")
      .eq("session_id", triggerSessionId)
      .eq("event_id", selectedEventId)
      .single()

    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000)
    let sessionEventId: string

    if (existingSessionEvent) {
      const { error } = await supabase
        .from("session_events")
        .update({ status: "active", triggered_at: now.toISOString(), duration_seconds: durationSeconds, expires_at: expiresAt.toISOString(), resolved_at: null })
        .eq("id", existingSessionEvent.id)
      if (error) { toast.error("Erreur: " + error.message); setLoading(false); return }
      sessionEventId = existingSessionEvent.id
    } else {
      const { data: newSE, error } = await supabase
        .from("session_events")
        .insert({ session_id: triggerSessionId, event_id: selectedEventId, event_order: event.sort_order, status: "active", triggered_at: now.toISOString(), duration_seconds: durationSeconds, expires_at: expiresAt.toISOString() })
        .select().single()
      if (error || !newSE) { toast.error("Erreur: " + (error?.message || "Impossible de creer")); setLoading(false); return }
      sessionEventId = newSE.id
    }

    const sTeams = getSessionTeams(triggerSessionId)
    if (sTeams.length > 0) {
      // Check if decisions already exist for this session event (re-triggered event)
      const { data: existingDecisions } = await supabase
        .from("decisions")
        .select("id")
        .eq("session_event_id", sessionEventId)
      
      if (!existingDecisions || existingDecisions.length === 0) {
        const teamDecisions = sTeams.map((st) => ({ session_event_id: sessionEventId, team_id: st.team_id, status: "pending" as const }))
        const { error: decError } = await supabase.from("decisions").insert(teamDecisions)
        if (decError) {
          console.error("[v0] Failed to insert decisions:", decError)
          toast.error("Erreur lors de la creation des decisions: " + decError.message)
          setLoading(false)
          return
        }
      }
    }

    await supabase.from("game_sessions").update({ current_event_order: event.sort_order }).eq("id", triggerSessionId)
    toast.success(`"${event.title}" declenche pour ${formatDuration(durationSeconds)}`)
    resetTriggerForm()
    router.refresh()
    setLoading(false)
  }

  async function submitScores() {
    if (!scoringEventId) return
    setLoading(true)
    const supabase = createClient()

    // Find the session_event to get session_id
    const sessionEvent = sessionEvents.find((se) => se.id === scoringEventId)
    if (!sessionEvent) { toast.error("Evenement introuvable"); setLoading(false); return }

    // Upsert team_scores and update decisions with admin_comment
    for (const [teamId, scores] of Object.entries(scoreOverrides)) {
      const moyenne = parseFloat(((scores.points_social + scores.points_commercial + scores.points_tresorerie + scores.points_production + scores.points_reglementaire) / 5).toFixed(2))

      await supabase.from("team_scores").upsert({
        team_id: teamId,
        session_id: sessionEvent.session_id,
        session_event_id: scoringEventId,
        points_social: scores.points_social,
        points_commercial: scores.points_commercial,
        points_tresorerie: scores.points_tresorerie,
        points_production: scores.points_production,
        points_reglementaire: scores.points_reglementaire,
        points_moyenne: moyenne,
      }, { onConflict: "team_id,session_id,session_event_id" })

      // Update admin_comment on decision
      if (scores.admin_comment) {
        await supabase
          .from("decisions")
          .update({ admin_comment: scores.admin_comment })
          .eq("session_event_id", scoringEventId)
          .eq("team_id", teamId)
      }
    }

    // Mark event as scored + resolved
    await supabase.from("session_events").update({ scored: true, status: "resolved", resolved_at: new Date().toISOString() }).eq("id", scoringEventId)

    toast.success("Points attribues avec succes")
    setScoringEventId(null)
    setScoreOverrides({})
    router.refresh()
    setLoading(false)
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId)

  // Get the scoring event details
  const scoringSessionEvent = sessionEvents.find((se) => se.id === scoringEventId)
  const scoringEvent = scoringSessionEvent?.events

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) { setSessionName(""); setSelectedEntrepriseId(""); setSelectedTeamIds(new Set()) }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Nouvelle session</Button>
          </DialogTrigger>
          <DialogContent className="border-border/40 bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Creer une session</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Une session represente une classe. Choisissez l{"'"}entreprise simulee et les equipes participantes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Nom de la session</Label>
                <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="Ex: Classe BTS1 - Janvier 2026" className="bg-secondary/50 border-border/40" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Entreprise simulee</Label>
                {entreprises.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">Aucune entreprise. Creez-en une dans la page Entreprises.</p>
                ) : (
                  <Select value={selectedEntrepriseId} onValueChange={setSelectedEntrepriseId}>
                    <SelectTrigger className="bg-secondary/50 border-border/40"><SelectValue placeholder="Selectionner une entreprise" /></SelectTrigger>
                    <SelectContent className="border-border/40 bg-card">
                      {entreprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{e.name}{e.secteur && <span className="text-muted-foreground">- {e.secteur}</span>}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Equipes participantes{selectedTeamIds.size > 0 && <span className="ml-2 text-primary">({selectedTeamIds.size})</span>}</Label>
                {teams.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">Aucune equipe. Creez-en dans la page Equipes.</p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/30 bg-secondary/20 p-2">
                    {teams.map((team) => (
                      <label key={team.id} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/30">
                        <Checkbox checked={selectedTeamIds.has(team.id)} onCheckedChange={() => toggleTeam(team.id)} />
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: team.colors_primary }} />
                        <span className="text-sm text-foreground">{team.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={createSession} disabled={loading || !sessionName.trim() || !selectedEntrepriseId || selectedTeamIds.size === 0} className="w-full">
                {loading ? "Creation..." : "Creer la session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4"><Zap className="h-10 w-10 text-muted-foreground/40" /></div>
            <h3 className="text-lg font-semibold text-foreground">Aucune session</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Creez votre premiere session pour lancer le jeu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const sTeams = getSessionTeams(session.id)
            const sEvents = getSessionEvents(session.id)
            const isActive = session.status === "active"
            const isCompleted = session.status === "completed"
            const isSetup = session.status === "setup"
            const historyOpen = openHistories.has(session.id)

            // Find events that need scoring: all teams have validated + not yet scored
            const eventsToScore = sEvents.filter((se) => {
              if (se.scored) return false
              if (se.status === "pending") return false
              const eventDecisions = getDecisionsForEvent(se.id)
              if (eventDecisions.length === 0) return false
              return eventDecisions.every((d) => d.status === "validated" || d.dg_validated)
            })

            return (
              <Card key={session.id} className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-foreground">{session.name}</CardTitle>
                    <Badge variant="outline" className={STATUS_STYLES[session.status as string] || STATUS_STYLES.setup}>
                      {SESSION_STATUS_LABELS[session.status as SessionStatus]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {session.entreprises && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1"><Building2 className="h-3 w-3" />{session.entreprises.name}</Badge>
                    )}
                    {sTeams.length > 0 && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1"><Users className="h-3 w-3" />{sTeams.length} equipe{sTeams.length > 1 ? "s" : ""}</Badge>
                    )}
                    {sEvents.filter((se) => se.status !== "pending").length > 0 && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1"><Zap className="h-3 w-3" />{sEvents.filter((se) => se.status !== "pending").length} evt</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="border-border/40">
                      <Link href={`/admin/sessions/${session.id}`}><Eye className="mr-1 h-3 w-3" />Details</Link>
                    </Button>
                    {isSetup && (
                      <Button size="sm" variant="default" onClick={() => startSession(session.id)} disabled={loading}><Play className="mr-1 h-3 w-3" />Demarrer</Button>
                    )}
                    {isActive && (
                      <>
                        <Button size="sm" onClick={() => { setTriggerSessionId(session.id); setSelectedEventId("") }} disabled={loading}>
                          <Zap className="mr-1 h-3 w-3" />Declencher un evenement
                        </Button>
                        <Button variant="outline" size="sm" className="border-border/40" onClick={() => completeSession(session.id)} disabled={loading}>
                          <Square className="mr-1 h-3 w-3" />Terminer
                        </Button>
                      </>
                    )}
                    {(isSetup || isCompleted) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-border/40 bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Supprimer cette session ?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">La session &quot;{session.name}&quot; et toutes ses donnees seront supprimees.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border/40">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteSession(session.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Pending scoring alerts */}
                  {eventsToScore.length > 0 && (
                    <div className="space-y-2">
                      {eventsToScore.map((se) => {
                        const event = se.events
                        if (!event) return null
                        const eventDecisions = getDecisionsForEvent(se.id)
                        return (
                          <div key={se.id} className="flex items-center justify-between rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b]/20">
                                <Award className="h-4 w-4 text-[#f59e0b]" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{event.title}</p>
                                <p className="text-xs text-muted-foreground">{eventDecisions.length} equipe{eventDecisions.length > 1 ? "s" : ""} ont valide leur decision</p>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => initScoreOverrides(se.id)}>
                              <Trophy className="mr-1 h-3 w-3" />Attribuer les points
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Event history collapsible - only show started events (active + resolved) */}
                  {(() => {
                    const startedEvents = sEvents.filter((se) => se.status === "active" || se.status === "resolved")
                    if (startedEvents.length === 0) return null
                    return (
                    <Collapsible open={historyOpen} onOpenChange={() => toggleHistory(session.id)}>
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center gap-2 rounded-lg border border-border/20 bg-muted/20 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40">
                          {historyOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          Suivi des evenements ({startedEvents.length})
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2">
                        {startedEvents
                          .sort((a, b) => a.event_order - b.event_order)
                          .map((se) => {
                            const event = se.events
                            if (!event) return null
                            const eventDecisions = getDecisionsForEvent(se.id)
                            const eventScores = getTeamScoresForEvent(se.id)
                            const statusStyle = EVENT_STATUS_STYLES[se.status] || EVENT_STATUS_STYLES.pending

                            return (
                              <div key={se.id} className="rounded-lg border border-border/30 bg-card/50 overflow-hidden">
                                {/* Event header */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-muted-foreground">#{se.event_order}</span>
                                    <span className="text-sm font-medium text-foreground">{event.title}</span>
                                    {event.category && <CategoryBadge category={event.category as EventCategory} />}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {se.scored && (
                                      <Badge variant="outline" className="text-[10px] border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16] gap-1">
                                        <CheckCircle2 className="h-3 w-3" />Points attribues
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className={`text-[10px] ${statusStyle.className}`}>{statusStyle.label}</Badge>
                                  </div>
                                </div>

                                {/* Workflow progress summary for active events */}
                                {se.status === "active" && eventDecisions.length > 0 && (
                                  <div className="px-4 py-2 border-b border-border/20 bg-muted/5">
                                    <div className="flex items-center gap-4 text-[10px]">
                                      {(() => {
                                        const waitingSpecialist = eventDecisions.filter((d) => d.status === "pending").length
                                        const waitingVotes = eventDecisions.filter((d) => d.status === "proposed" || (d.status === "voting" && !d.dg_validated)).length
                                        const validated = eventDecisions.filter((d) => d.status === "validated" || d.dg_validated).length
                                        return (
                                          <>
                                            {waitingSpecialist > 0 && <span className="text-muted-foreground"><Clock className="inline h-3 w-3 mr-0.5" />{waitingSpecialist} en attente specialiste</span>}
                                            {waitingVotes > 0 && <span className="text-[#f59e0b]"><Timer className="inline h-3 w-3 mr-0.5" />{waitingVotes} vote/DG en cours</span>}
                                            {validated > 0 && <span className="text-[#84cc16]"><CheckCircle2 className="inline h-3 w-3 mr-0.5" />{validated} validee{validated > 1 ? "s" : ""}</span>}
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                )}

                                {/* Team decisions */}
                                {eventDecisions.length > 0 && (
                                  <div className="divide-y divide-border/10">
                                    {eventDecisions.map((decision) => {
                                      const team = teams.find((t) => t.id === decision.team_id)
                                      if (!team) return null
                                      const chosenOption = decision.event_options
                                      const score = eventScores.find((s) => s.team_id === decision.team_id)

                                      const decisionVotes = getVotesForDecision(decision.id)
                                      const specialistRole = event?.category ? CATEGORY_SPECIALIST_ROLE[event.category as EventCategory] : undefined
                                      const proposerRole = decision.proposed_by ? getMemberRole(decision.proposed_by, decision.team_id) : undefined
                                      const proposerName = decision.proposed_by ? getMemberName(decision.proposed_by) : null

                                      return (
                                        <div key={decision.id} className="px-4 py-3 space-y-2.5">
                                          {/* Team header + status */}
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.colors_primary }} />
                                              <span className="text-sm font-medium text-foreground">{team.name}</span>
                                              {decision.status === "validated" ? (
                                                <Badge variant="outline" className="text-[10px] border-[#84cc16]/30 text-[#84cc16]">Valide</Badge>
                                              ) : decision.status === "pending" ? (
                                                <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">En attente specialiste</Badge>
                                              ) : decision.status === "voting" ? (
                                                <Badge variant="outline" className="text-[10px] border-[#f59e0b]/30 text-[#f59e0b]">Vote/Decision DG</Badge>
                                              ) : (
                                                <Badge variant="outline" className="text-[10px] border-muted-foreground/30">{DECISION_STATUS_LABELS[decision.status]}</Badge>
                                              )}
                                            </div>
                                            {chosenOption && <span className="text-xs font-medium text-muted-foreground">{chosenOption.label}</span>}
                                          </div>

                                          {/* STEP 1: Specialist proposal */}
                                          {decision.proposed_by && (
                                            <div className="rounded-md border border-border/20 bg-muted/10 p-2.5 space-y-1.5">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Proposition</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                  par {proposerName}
                                                  {proposerRole && ` (${COMPANY_ROLE_LABELS[proposerRole]})`}
                                                </span>
                                              </div>
                                              {decision.comment_avantages && (
                                                <p className="text-[10px] text-muted-foreground"><span className="font-semibold text-success">+ Avantages :</span> {decision.comment_avantages}</p>
                                              )}
                                              {decision.comment_inconvenients && (
                                                <p className="text-[10px] text-muted-foreground"><span className="font-semibold text-destructive">- Inconvenients :</span> {decision.comment_inconvenients}</p>
                                              )}
                                              {decision.comment_justification && (
                                                <p className="text-[10px] text-muted-foreground"><span className="font-semibold text-primary">Justification :</span> {decision.comment_justification}</p>
                                              )}
                                            </div>
                                          )}

                                          {/* STEP 2: Voter comments */}
                                          {decisionVotes.length > 0 && (
                                            <div className="rounded-md border border-border/20 bg-muted/10 p-2.5 space-y-1.5">
                                              <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Votes ({decisionVotes.length})</span>
                                              {decisionVotes.map((v) => {
                                                const voterRole = getMemberRole(v.user_id, decision.team_id)
                                                const voterName = getMemberName(v.user_id)
                                                return (
                                                  <div key={v.id} className="flex items-start gap-2 py-1 border-t border-border/10 first:border-t-0 first:pt-0">
                                                    <div className="flex-1">
                                                      <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold">{voterName}</span>
                                                        {voterRole && <span className="text-[9px] text-muted-foreground">({COMPANY_ROLE_LABELS[voterRole]})</span>}
                                                        {v.approved === true
                                                          ? <Badge className="bg-success/15 text-success text-[8px] py-0 px-1 border-success/30">Pour</Badge>
                                                          : v.approved === false
                                                          ? <Badge className="bg-destructive/15 text-destructive text-[8px] py-0 px-1 border-destructive/30">Contre</Badge>
                                                          : null
                                                        }
                                                      </div>
                                                      {v.comment && <p className="text-[10px] text-muted-foreground mt-0.5 italic">{v.comment}</p>}
                                                    </div>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}

                                          {/* STEP 3: DG decision */}
                                          {decision.dg_validated && (
                                            <div className="rounded-md border border-border/20 bg-muted/10 p-2.5 space-y-1">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Decision DG</span>
                                                {decision.dg_override_option_id
                                                  ? <Badge variant="outline" className="text-[8px] border-warning/30 text-warning py-0 px-1">Unilaterale</Badge>
                                                  : <Badge variant="outline" className="text-[8px] border-success/30 text-success py-0 px-1">Collegiale</Badge>
                                                }
                                                {decision.dg_validated_by && (
                                                  <span className="text-[10px] text-muted-foreground">par {getMemberName(decision.dg_validated_by)}</span>
                                                )}
                                              </div>
                                              {decision.dg_comment && (
                                                <p className="text-[10px] text-muted-foreground italic">{decision.dg_comment}</p>
                                              )}
                                            </div>
                                          )}

                                          {/* Scores */}
                                          {score && (
                                            <div className="flex items-center gap-1.5">
                                              {SCORE_FIELDS.map((f) => {
                                                const val = score[f.key as keyof typeof score] as number
                                                if (val === 0) return null
                                                return (
                                                  <span key={f.key} className="text-[10px] font-mono font-bold rounded px-1 py-0.5" style={{ color: f.color, backgroundColor: `${f.color}15` }}>
                                                    {f.short}: {val > 0 ? `+${val}` : val}
                                                  </span>
                                                )
                                              })}
                                            </div>
                                          )}

                                          {/* Admin comment */}
                                          {decision.admin_comment && (
                                            <div className="flex items-start gap-1.5">
                                              <MessageSquare className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                                              <p className="text-xs text-muted-foreground italic">{decision.admin_comment}</p>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        }
                      </CollapsibleContent>
                    </Collapsible>
                    )
                  })()}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Event Trigger Dialog */}
      <Dialog open={triggerSessionId !== null} onOpenChange={(open) => { if (!open) resetTriggerForm() }}>
        <DialogContent className="border-border/40 bg-card sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground"><Zap className="h-5 w-5 text-primary" />Declencher un evenement</DialogTitle>
            <DialogDescription className="text-muted-foreground">Choisissez l{"'"}evenement et definissez le temps de reaction.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Evenement</Label>
              {activeEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">Aucun evenement actif.</p>
              ) : (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="bg-secondary/50 border-border/40"><SelectValue placeholder="Selectionner un evenement" /></SelectTrigger>
                  <SelectContent className="border-border/40 bg-card max-h-64">
                    {activeEvents.sort((a, b) => a.sort_order - b.sort_order).map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">#{ev.sort_order}</span>
                          <span>{ev.title}</span>
                          {ev.category && <span className="text-xs text-muted-foreground">({CATEGORY_LABELS[ev.category as EventCategory]})</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedEvent && (
              <Card className="border-border/30 bg-muted/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{selectedEvent.title}</h4>
                    {selectedEvent.category && <CategoryBadge category={selectedEvent.category as EventCategory} />}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                  {selectedEvent.event_options && selectedEvent.event_options.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{selectedEvent.event_options.length} option{selectedEvent.event_options.length > 1 ? "s" : ""}</p>
                      <div className="space-y-1.5">
                        {selectedEvent.event_options.sort((a, b) => a.sort_order - b.sort_order).map((opt) => (
                          <div key={opt.id} className="rounded-md border border-border/20 bg-card/50 px-3 py-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{opt.label}</span>
                              <div className="flex items-center gap-1.5">
                                {SCORE_FIELDS.map((f) => {
                                  const val = opt[f.key as keyof typeof opt] as number
                                  if (val === 0) return null
                                  return <span key={f.key} className="text-[10px] font-mono font-bold rounded px-1 py-0.5" style={{ color: f.color, backgroundColor: `${f.color}15` }}>{val > 0 ? `+${val}` : val}</span>
                                })}
                              </div>
                            </div>
                            {opt.description && <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Duree de reaction</Label>
              <div className="flex gap-2">
                <Button variant={durationMode === "preset" ? "default" : "outline"} size="sm" onClick={() => setDurationMode("preset")} className="flex-1">Predefinie</Button>
                <Button variant={durationMode === "custom" ? "default" : "outline"} size="sm" onClick={() => setDurationMode("custom")} className="flex-1">Personnalisee</Button>
              </div>
              {durationMode === "preset" ? (
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_PRESETS.map((p) => (
                    <Button key={p.value} variant={selectedPreset === p.value ? "default" : "outline"} size="sm" onClick={() => setSelectedPreset(p.value)} className={selectedPreset === p.value ? "" : "border-border/40"}>{p.label}</Button>
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5"><Label htmlFor="trigDays" className="text-xs text-muted-foreground">Jours</Label><Input id="trigDays" type="number" min="0" max="30" placeholder="0" value={customDays} onChange={(e) => setCustomDays(e.target.value)} className="bg-secondary/50 border-border/40" /></div>
                  <div className="flex-1 space-y-1.5"><Label htmlFor="trigHours" className="text-xs text-muted-foreground">Heures</Label><Input id="trigHours" type="number" min="0" max="23" placeholder="0" value={customHours} onChange={(e) => setCustomHours(e.target.value)} className="bg-secondary/50 border-border/40" /></div>
                  <div className="flex-1 space-y-1.5"><Label htmlFor="trigMins" className="text-xs text-muted-foreground">Minutes</Label><Input id="trigMins" type="number" min="0" max="59" placeholder="0" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} className="bg-secondary/50 border-border/40" /></div>
                </div>
              )}
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border/30 bg-muted/20 p-3">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-mono text-lg font-bold text-foreground">{formatDuration(getDurationSeconds())}</span>
              </div>
            </div>

            {triggerSessionId && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Equipes impactees</Label>
                <div className="flex flex-wrap gap-1.5">
                  {getSessionTeams(triggerSessionId).map((st) => {
                    const team = teams.find((t) => t.id === st.team_id)
                    if (!team) return null
                    return <Badge key={st.id} variant="outline" className="text-xs border-border/40 gap-1.5"><span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: team.colors_primary }} />{team.name}</Badge>
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-border/40" onClick={resetTriggerForm}>Annuler</Button>
            <Button onClick={triggerEvent} disabled={loading || !selectedEventId || getDurationSeconds() < 60}>
              {loading ? "Declenchement..." : <><Zap className="mr-2 h-4 w-4" />Declencher</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scoring Dialog */}
      <Dialog open={scoringEventId !== null} onOpenChange={(open) => { if (!open) { setScoringEventId(null); setScoreOverrides({}) } }}>
        <DialogContent className="border-border/40 bg-card sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Trophy className="h-5 w-5 text-[#f59e0b]" />
              Attribuer les points
            </DialogTitle>
            {scoringEvent && (
              <DialogDescription className="text-muted-foreground">
                Evenement : <span className="font-medium text-foreground">{scoringEvent.title}</span> - Verifiez les decisions des equipes et ajustez les points si necessaire.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {scoringEventId && getDecisionsForEvent(scoringEventId).map((decision) => {
              const team = teams.find((t) => t.id === decision.team_id)
              if (!team) return null
              const chosenOption = decision.event_options
              const override = scoreOverrides[decision.team_id]
              if (!override) return null

              return (
                <div key={decision.id} className="rounded-lg border border-border/30 bg-card/50 overflow-hidden">
                  {/* Team header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: team.colors_primary }} />
                      <span className="font-medium text-foreground">{team.name}</span>
                    </div>
                    {chosenOption && (
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                        Choix : {chosenOption.label}
                      </Badge>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Option description if available */}
                    {chosenOption?.description && (
                      <p className="text-xs text-muted-foreground bg-muted/20 rounded-md px-3 py-2">{chosenOption.description}</p>
                    )}

                    {/* Specialist argumentaire */}
                    {(decision.comment_avantages || decision.comment_inconvenients || decision.comment_justification) && (
                      <div className="space-y-2 rounded-lg border border-border/30 bg-muted/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Argumentaire du specialiste</p>
                        {decision.comment_avantages && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-semibold text-success">Avantages</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{decision.comment_avantages}</p>
                          </div>
                        )}
                        {decision.comment_inconvenients && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-semibold text-destructive">Inconvenients</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{decision.comment_inconvenients}</p>
                          </div>
                        )}
                        {decision.comment_justification && (
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-semibold text-primary">Justification</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{decision.comment_justification}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Voter comments */}
                    {(() => {
                      const decisionVotes = getVotesForDecision(decision.id)
                      if (decisionVotes.length === 0) return null
                      return (
                        <div className="space-y-1.5 rounded-lg border border-border/30 bg-muted/10 p-3">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Votes de l{"'"}equipe ({decisionVotes.length})</p>
                          {decisionVotes.map((v) => {
                            const role = getMemberRole(v.user_id, decision.team_id)
                            return (
                              <div key={v.id} className="flex items-start gap-2 py-1 border-t border-border/10 first:border-t-0">
                                <div className="flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-semibold">{getMemberName(v.user_id)}</span>
                                    {role && <span className="text-[9px] text-muted-foreground">({COMPANY_ROLE_LABELS[role]})</span>}
                                    {v.approved === true
                                      ? <Badge className="bg-success/15 text-success text-[8px] py-0 px-1 border-success/30">Pour</Badge>
                                      : <Badge className="bg-destructive/15 text-destructive text-[8px] py-0 px-1 border-destructive/30">Contre</Badge>
                                    }
                                  </div>
                                  {v.comment && <p className="text-[10px] text-muted-foreground italic mt-0.5">{v.comment}</p>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* DG decision */}
                    {decision.dg_validated && decision.dg_comment && (
                      <div className="rounded-lg border border-border/30 bg-muted/10 p-3 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Decision DG</p>
                          {decision.dg_override_option_id
                            ? <Badge variant="outline" className="text-[8px] border-warning/30 text-warning py-0 px-1">Unilaterale</Badge>
                            : <Badge variant="outline" className="text-[8px] border-success/30 text-success py-0 px-1">Collegiale</Badge>
                          }
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">{decision.dg_comment}</p>
                      </div>
                    )}

                    {/* Score fields */}
                    <div className="grid grid-cols-5 gap-2">
                      {SCORE_FIELDS.map((f) => {
                        const predefVal = chosenOption ? (chosenOption[f.key as keyof typeof chosenOption] as number) : 0
                        const currentVal = override[f.key as keyof typeof override] as number

                        return (
                          <div key={f.key} className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: f.color }}>{f.short}</Label>
                            <Input
                              type="number"
                              value={currentVal}
                              onChange={(e) => updateScoreOverride(decision.team_id, f.key, parseInt(e.target.value) || 0)}
                              className="h-9 text-center font-mono text-sm bg-secondary/50 border-border/40"
                            />
                            {currentVal !== predefVal && (
                              <p className="text-[9px] text-muted-foreground text-center">
                                prevu: {predefVal > 0 ? `+${predefVal}` : predefVal}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Admin comment */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Commentaire admin (optionnel)</Label>
                      <Textarea
                        placeholder="Feedback sur la decision de l'equipe..."
                        value={override.admin_comment}
                        onChange={(e) => updateScoreOverride(decision.team_id, "admin_comment", e.target.value)}
                        rows={2}
                        className="bg-secondary/50 border-border/40 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-border/40" onClick={() => { setScoringEventId(null); setScoreOverrides({}) }}>
              Annuler
            </Button>
            <Button onClick={submitScores} disabled={loading}>
              {loading ? "Attribution..." : (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Confirmer les points</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
