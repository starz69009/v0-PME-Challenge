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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { CategoryBadge } from "@/components/category-badge"
import { Plus, Play, Eye, Trash2, Zap, Building2, Users, Timer, ChevronRight, Square } from "lucide-react"
import { SESSION_STATUS_LABELS, SCORE_FIELDS, CATEGORY_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { GameSession, GameEvent, Team, Entreprise, SessionTeam, SessionStatus, EventCategory } from "@/lib/types"

const STATUS_STYLES: Record<string, string> = {
  setup: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
  active: "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]",
  completed: "border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16]",
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

export function SessionsManager({
  initialSessions,
  events,
  teams,
  entreprises,
  sessionTeams,
}: {
  initialSessions: GameSession[]
  events: GameEvent[]
  teams: Team[]
  entreprises: Entreprise[]
  sessionTeams: SessionTeam[]
}) {
  const router = useRouter()
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

  const activeEvents = useMemo(() => events.filter((e) => e.is_active), [events])

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  function getSessionTeams(sessionId: string) {
    return sessionTeams.filter((st) => st.session_id === sessionId)
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

  async function createSession() {
    if (!sessionName.trim()) return
    if (!selectedEntrepriseId) {
      toast.error("Selectionnez une entreprise")
      return
    }
    if (selectedTeamIds.size === 0) {
      toast.error("Selectionnez au moins une equipe")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        name: sessionName,
        created_by: user?.id,
        entreprise_id: selectedEntrepriseId,
      })
      .select()
      .single()

    if (error || !session) {
      toast.error("Erreur lors de la creation")
      setLoading(false)
      return
    }

    const teamLinks = Array.from(selectedTeamIds).map((teamId) => ({
      session_id: session.id,
      team_id: teamId,
    }))
    await supabase.from("session_teams").insert(teamLinks)

    toast.success("Session creee avec succes")
    setSessionName("")
    setSelectedEntrepriseId("")
    setSelectedTeamIds(new Set())
    setCreateOpen(false)
    router.refresh()
    setLoading(false)
  }

  async function deleteSession(id: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("game_sessions").delete().eq("id", id)
    if (error) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Session supprimee")
    }
    router.refresh()
    setLoading(false)
  }

  async function startSession(id: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from("game_sessions")
      .update({ status: "active", current_event_order: 0 })
      .eq("id", id)
    toast.success("Session demarree")
    router.refresh()
    setLoading(false)
  }

  async function triggerEvent() {
    if (!triggerSessionId || !selectedEventId) return
    const durationSeconds = getDurationSeconds()
    if (durationSeconds < 60) {
      toast.error("La duree doit etre d'au moins 1 minute")
      return
    }

    setLoading(true)
    const supabase = createClient()

    // Find the event
    const event = events.find((e) => e.id === selectedEventId)
    if (!event) {
      toast.error("Evenement introuvable")
      setLoading(false)
      return
    }

    // Check if this event is already linked as a session_event
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
      // Reactivate existing session event
      const { error } = await supabase
        .from("session_events")
        .update({
          status: "active",
          triggered_at: now.toISOString(),
          duration_seconds: durationSeconds,
          expires_at: expiresAt.toISOString(),
          resolved_at: null,
        })
        .eq("id", existingSessionEvent.id)

      if (error) {
        toast.error("Erreur: " + error.message)
        setLoading(false)
        return
      }
      sessionEventId = existingSessionEvent.id
    } else {
      // Create new session_event
      const { data: newSE, error } = await supabase
        .from("session_events")
        .insert({
          session_id: triggerSessionId,
          event_id: selectedEventId,
          event_order: event.sort_order,
          status: "active",
          triggered_at: now.toISOString(),
          duration_seconds: durationSeconds,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error || !newSE) {
        toast.error("Erreur: " + (error?.message || "Impossible de creer l'evenement"))
        setLoading(false)
        return
      }
      sessionEventId = newSE.id
    }

    // Create empty decisions for each team in this session
    const sTeams = getSessionTeams(triggerSessionId)
    if (sTeams.length > 0) {
      const teamDecisions = sTeams.map((st) => ({
        session_event_id: sessionEventId,
        team_id: st.team_id,
      }))
      await supabase.from("decisions").insert(teamDecisions)
    }

    // Update session current_event_order
    await supabase
      .from("game_sessions")
      .update({ current_event_order: event.sort_order })
      .eq("id", triggerSessionId)

    toast.success(`"${event.title}" declenche pour ${formatDuration(durationSeconds)}`)
    resetTriggerForm()
    router.refresh()
    setLoading(false)
  }

  async function completeSession(id: string) {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from("game_sessions")
      .update({ status: "completed" })
      .eq("id", id)
    toast.success("Session terminee")
    router.refresh()
    setLoading(false)
  }

  // Selected event details for trigger dialog
  const selectedEvent = events.find((e) => e.id === selectedEventId)

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setSessionName("")
            setSelectedEntrepriseId("")
            setSelectedTeamIds(new Set())
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle session
            </Button>
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
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ex: Classe BTS1 - Janvier 2026"
                  className="bg-secondary/50 border-border/40"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Entreprise simulee</Label>
                {entreprises.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">
                    Aucune entreprise. Creez-en une dans la page Entreprises.
                  </p>
                ) : (
                  <Select value={selectedEntrepriseId} onValueChange={setSelectedEntrepriseId}>
                    <SelectTrigger className="bg-secondary/50 border-border/40">
                      <SelectValue placeholder="Selectionner une entreprise" />
                    </SelectTrigger>
                    <SelectContent className="border-border/40 bg-card">
                      {entreprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {e.name}
                            {e.secteur && <span className="text-muted-foreground">- {e.secteur}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Equipes participantes
                  {selectedTeamIds.size > 0 && (
                    <span className="ml-2 text-primary">({selectedTeamIds.size})</span>
                  )}
                </Label>
                {teams.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">
                    Aucune equipe. Creez-en dans la page Equipes.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/30 bg-secondary/20 p-2">
                    {teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/30"
                      >
                        <Checkbox
                          checked={selectedTeamIds.has(team.id)}
                          onCheckedChange={() => toggleTeam(team.id)}
                        />
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.colors_primary }}
                        />
                        <span className="text-sm text-foreground">{team.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={createSession}
                disabled={loading || !sessionName.trim() || !selectedEntrepriseId || selectedTeamIds.size === 0}
                className="w-full"
              >
                {loading ? "Creation..." : "Creer la session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {initialSessions.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Zap className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aucune session</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Creez votre premiere session pour lancer le jeu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {initialSessions.map((session) => {
            const sTeams = getSessionTeams(session.id)
            const isActive = session.status === "active"
            const isCompleted = session.status === "completed"
            const isSetup = session.status === "setup"

            return (
              <Card key={session.id} className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-foreground">{session.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[session.status as string] || STATUS_STYLES.setup}
                    >
                      {SESSION_STATUS_LABELS[session.status as SessionStatus]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {session.entreprises && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1">
                        <Building2 className="h-3 w-3" />
                        {session.entreprises.name}
                      </Badge>
                    )}
                    {sTeams.length > 0 && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1">
                        <Users className="h-3 w-3" />
                        {sTeams.length} equipe{sTeams.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 pt-0">
                  <Button asChild variant="outline" size="sm" className="border-border/40">
                    <Link href={`/admin/sessions/${session.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      Details
                    </Link>
                  </Button>

                  {isSetup && (
                    <Button size="sm" variant="default" onClick={() => startSession(session.id)} disabled={loading}>
                      <Play className="mr-1 h-3 w-3" />
                      Demarrer
                    </Button>
                  )}

                  {isActive && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setTriggerSessionId(session.id)
                          setSelectedEventId("")
                        }}
                        disabled={loading}
                      >
                        <Zap className="mr-1 h-3 w-3" />
                        Declencher un evenement
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border/40"
                        onClick={() => completeSession(session.id)}
                        disabled={loading}
                      >
                        <Square className="mr-1 h-3 w-3" />
                        Terminer
                      </Button>
                    </>
                  )}

                  {(isSetup || isCompleted) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="border-border/40 bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Supprimer cette session ?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            La session &quot;{session.name}&quot; et toutes ses donnees (evenements declenches, decisions, scores) seront definitivement supprimees.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-border/40">Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSession(session.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Zap className="h-5 w-5 text-primary" />
              Declencher un evenement
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choisissez l{"'"}evenement a envoyer aux equipes de cette session et definissez le temps de reaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Event selection */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Evenement</Label>
              {activeEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">
                  Aucun evenement actif. Creez-en dans la page Evenements.
                </p>
              ) : (
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="bg-secondary/50 border-border/40">
                    <SelectValue placeholder="Selectionner un evenement" />
                  </SelectTrigger>
                  <SelectContent className="border-border/40 bg-card max-h-64">
                    {activeEvents
                      .sort((a, b) => a.sort_order - b.sort_order)
                      .map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">#{ev.sort_order}</span>
                            <span>{ev.title}</span>
                            {ev.category && (
                              <span className="text-xs text-muted-foreground">({CATEGORY_LABELS[ev.category as EventCategory]})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected event preview */}
            {selectedEvent && (
              <Card className="border-border/30 bg-muted/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{selectedEvent.title}</h4>
                    {selectedEvent.category && (
                      <CategoryBadge category={selectedEvent.category as EventCategory} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>

                  {/* Options preview */}
                  {selectedEvent.event_options && selectedEvent.event_options.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {selectedEvent.event_options.length} option{selectedEvent.event_options.length > 1 ? "s" : ""} de decision
                      </p>
                      <div className="space-y-1.5">
                        {selectedEvent.event_options
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((opt) => (
                            <div key={opt.id} className="rounded-md border border-border/20 bg-card/50 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                                <div className="flex items-center gap-1.5">
                                  {SCORE_FIELDS.map((f) => {
                                    const val = opt[f.key as keyof typeof opt] as number
                                    if (val === 0) return null
                                    return (
                                      <span
                                        key={f.key}
                                        className="text-[10px] font-mono font-bold rounded px-1 py-0.5"
                                        style={{
                                          color: f.color,
                                          backgroundColor: `${f.color}15`,
                                        }}
                                      >
                                        {val > 0 ? `+${val}` : val}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                              {opt.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Duree de reaction</Label>

              <div className="flex gap-2">
                <Button
                  variant={durationMode === "preset" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDurationMode("preset")}
                  className="flex-1"
                >
                  Predefinie
                </Button>
                <Button
                  variant={durationMode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDurationMode("custom")}
                  className="flex-1"
                >
                  Personnalisee
                </Button>
              </div>

              {durationMode === "preset" ? (
                <div className="grid grid-cols-3 gap-2">
                  {DURATION_PRESETS.map((p) => (
                    <Button
                      key={p.value}
                      variant={selectedPreset === p.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPreset(p.value)}
                      className={selectedPreset === p.value ? "" : "border-border/40"}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="trigDays" className="text-xs text-muted-foreground">Jours</Label>
                    <Input
                      id="trigDays"
                      type="number"
                      min="0"
                      max="30"
                      placeholder="0"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      className="bg-secondary/50 border-border/40"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="trigHours" className="text-xs text-muted-foreground">Heures</Label>
                    <Input
                      id="trigHours"
                      type="number"
                      min="0"
                      max="23"
                      placeholder="0"
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className="bg-secondary/50 border-border/40"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor="trigMins" className="text-xs text-muted-foreground">Minutes</Label>
                    <Input
                      id="trigMins"
                      type="number"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="bg-secondary/50 border-border/40"
                    />
                  </div>
                </div>
              )}

              {/* Duration preview */}
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border/30 bg-muted/20 p-3">
                <Timer className="h-4 w-4 text-primary" />
                <span className="font-mono text-lg font-bold text-foreground">
                  {formatDuration(getDurationSeconds())}
                </span>
              </div>
            </div>

            {/* Teams impacted */}
            {triggerSessionId && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Equipes impactees</Label>
                <div className="flex flex-wrap gap-1.5">
                  {getSessionTeams(triggerSessionId).map((st) => {
                    const team = teams.find((t) => t.id === st.team_id)
                    if (!team) return null
                    return (
                      <Badge key={st.id} variant="outline" className="text-xs border-border/40 gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: team.colors_primary }} />
                        {team.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-border/40" onClick={resetTriggerForm}>
              Annuler
            </Button>
            <Button
              onClick={triggerEvent}
              disabled={loading || !selectedEventId || getDurationSeconds() < 60}
            >
              {loading ? "Declenchement..." : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Declencher
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
