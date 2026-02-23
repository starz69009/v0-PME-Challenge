"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventCard } from "@/components/event-card"
import { CategoryBadge } from "@/components/category-badge"
import { Play, CheckCircle, Clock, ChevronRight, Square, Timer } from "lucide-react"
import { SESSION_STATUS_LABELS, DECISION_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { GameSession, SessionEvent, Decision, Team, SessionStatus, EventStatus, DecisionStatus, EventCategory } from "@/lib/types"

interface SessionEventWithEvent extends SessionEvent {
  events: {
    id: string
    title: string
    description: string
    category: string | null
    sort_order: number
    is_active: boolean
    event_options: Array<{
      id: string
      label: string
      description: string | null
      points_social: number
      points_commercial: number
      points_tresorerie: number
      points_production: number
      points_reglementaire: number
      points_moyenne: number
    }>
  }
}

interface DecisionWithRelations extends Decision {
  teams: Team
  event_options: {
    id: string
    label: string
    points_social: number
    points_commercial: number
    points_tresorerie: number
    points_production: number
    points_reglementaire: number
    points_moyenne: number
  } | null
}

const DURATION_PRESETS = [
  { label: "5 min", value: 300 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 heure", value: 3600 },
  { label: "1 jour", value: 86400 },
  { label: "3 jours", value: 259200 },
]

export function SessionDetail({
  session,
  sessionEvents,
  decisions,
  teams,
}: {
  session: GameSession
  sessionEvents: SessionEventWithEvent[]
  decisions: DecisionWithRelations[]
  teams: Team[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDurationDialog, setShowDurationDialog] = useState(false)
  const [durationMode, setDurationMode] = useState<"preset" | "custom">("preset")
  const [selectedPreset, setSelectedPreset] = useState<number>(1800)
  const [customDays, setCustomDays] = useState("")
  const [customHours, setCustomHours] = useState("")
  const [customMinutes, setCustomMinutes] = useState("")

  const resolvedCount = sessionEvents.filter((se) => se.status === "resolved").length
  const activeEvent = sessionEvents.find((se) => se.status === "active")
  const progress = sessionEvents.length > 0 ? (resolvedCount / sessionEvents.length) * 100 : 0

  const nextPendingEvent = sessionEvents
    .filter((se) => se.status === "pending")
    .sort((a, b) => a.event_order - b.event_order)[0]

  // Compute remaining time for active event
  const activeExpiry = activeEvent?.expires_at ? new Date(activeEvent.expires_at) : null
  const activeTimeLeft = activeExpiry ? Math.max(0, Math.floor((activeExpiry.getTime() - Date.now()) / 1000)) : null
  const activeExpired = activeTimeLeft !== null && activeTimeLeft <= 0

  function getDurationSeconds(): number {
    if (durationMode === "preset") return selectedPreset
    const days = parseInt(customDays) || 0
    const hours = parseInt(customHours) || 0
    const mins = parseInt(customMinutes) || 0
    return days * 86400 + hours * 3600 + mins * 60
  }

  function openTriggerDialog() {
    if (!nextPendingEvent && !activeEvent) {
      toast.error("Tous les evenements ont ete declenches")
      return
    }
    setShowDurationDialog(true)
  }

  async function triggerWithDuration() {
    const durationSeconds = getDurationSeconds()
    if (durationSeconds < 60) {
      toast.error("La duree doit etre d'au moins 1 minute")
      return
    }

    setShowDurationDialog(false)
    setLoading(true)
    const supabase = createClient()

    // If there's an active event, resolve it first
    if (activeEvent) {
      await supabase
        .from("session_events")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", activeEvent.id)

      // Record scores for validated decisions
      const activeDecisions = decisions.filter(
        (d) => d.session_event_id === activeEvent.id && d.status === "validated" && d.event_options
      )
      for (const decision of activeDecisions) {
        if (!decision.event_options) continue

        const { data: existingScores } = await supabase
          .from("team_scores")
          .select("*")
          .eq("team_id", decision.team_id)
          .eq("session_id", session.id)
          .order("created_at", { ascending: false })
          .limit(1)

        const prev = existingScores?.[0]
        await supabase.from("team_scores").insert({
          team_id: decision.team_id,
          session_id: session.id,
          session_event_id: activeEvent.id,
          points_social: (prev?.points_social || 0) + decision.event_options.points_social,
          points_commercial: (prev?.points_commercial || 0) + decision.event_options.points_commercial,
          points_tresorerie: (prev?.points_tresorerie || 0) + decision.event_options.points_tresorerie,
          points_production: (prev?.points_production || 0) + decision.event_options.points_production,
          points_reglementaire: (prev?.points_reglementaire || 0) + decision.event_options.points_reglementaire,
          points_moyenne:
            ((prev?.points_social || 0) + decision.event_options.points_social +
              (prev?.points_commercial || 0) + decision.event_options.points_commercial +
              (prev?.points_tresorerie || 0) + decision.event_options.points_tresorerie +
              (prev?.points_production || 0) + decision.event_options.points_production +
              (prev?.points_reglementaire || 0) + decision.event_options.points_reglementaire) / 5,
        })
      }
    }

    if (!nextPendingEvent) {
      toast.error("Tous les evenements ont ete declenches")
      setLoading(false)
      return
    }

    // Calculate expires_at
    const now = new Date()
    const expiresAt = new Date(now.getTime() + durationSeconds * 1000)

    // Activate the next event with timer
    await supabase
      .from("session_events")
      .update({
        status: "active",
        triggered_at: now.toISOString(),
        duration_seconds: durationSeconds,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", nextPendingEvent.id)

    // Update session current_event_order
    await supabase
      .from("game_sessions")
      .update({ current_event_order: nextPendingEvent.event_order })
      .eq("id", session.id)

    // Create empty decisions for all teams
    const teamDecisions = teams.map((t) => ({
      session_event_id: nextPendingEvent.id,
      team_id: t.id,
    }))
    if (teamDecisions.length > 0) {
      await supabase.from("decisions").insert(teamDecisions)
    }

    toast.success(`Evenement declenche - ${formatDuration(durationSeconds)}`)
    router.refresh()
    setLoading(false)
  }

  async function completeSession() {
    setLoading(true)
    const supabase = createClient()

    if (activeEvent) {
      await supabase
        .from("session_events")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", activeEvent.id)
    }

    await supabase
      .from("game_sessions")
      .update({ status: "completed" })
      .eq("id", session.id)

    toast.success("Session terminee")
    router.refresh()
    setLoading(false)
  }

  const statusIcon = (status: EventStatus) => {
    switch (status) {
      case "resolved": return <CheckCircle className="h-4 w-4 text-success" />
      case "active": return <Play className="h-4 w-4 text-primary" />
      default: return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

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
    const s = seconds % 60
    return s > 0 ? `${m}min ${s}s` : `${m}min`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{session.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <Badge
              variant={session.status === "active" ? "default" : "secondary"}
              className={session.status === "active" ? "bg-success text-success-foreground" : ""}
            >
              {SESSION_STATUS_LABELS[session.status as SessionStatus]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {resolvedCount} / {sessionEvents.length} evenements
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {session.status === "active" && (
            <>
              <Button onClick={openTriggerDialog} disabled={loading}>
                <ChevronRight className="mr-1 h-4 w-4" />
                {activeEvent ? "Evenement suivant" : "Declencher le premier evenement"}
              </Button>
              <Button variant="outline" onClick={completeSession} disabled={loading}>
                <Square className="mr-1 h-4 w-4" />
                Terminer
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Active Event */}
      {activeEvent && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Play className="h-4 w-4 text-primary" />
                Evenement en cours
              </CardTitle>
              {/* Timer display for admin */}
              {activeEvent.duration_seconds && (
                <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold font-mono ${
                  activeExpired
                    ? "bg-destructive/15 text-destructive"
                    : "bg-warning/15 text-warning"
                }`}>
                  <Timer className="h-3.5 w-3.5" />
                  {activeExpired
                    ? "Temps ecoule"
                    : activeTimeLeft !== null
                    ? formatDuration(activeTimeLeft)
                    : formatDuration(activeEvent.duration_seconds)
                  }
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <EventCard event={activeEvent.events as any}>
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Decisions des equipes :</p>
                {teams.map((team) => {
                  const decision = decisions.find(
                    (d) => d.team_id === team.id && d.session_event_id === activeEvent.id
                  )
                  return (
                    <div key={team.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <span className="text-sm font-medium text-foreground">{team.name}</span>
                      <div className="flex items-center gap-2">
                        {decision?.event_options && (
                          <span className="text-xs text-muted-foreground">{decision.event_options.label}</span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {decision ? DECISION_STATUS_LABELS[decision.status as DecisionStatus] : "En attente"}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </EventCard>
          </CardContent>
        </Card>
      )}

      {/* Events Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline des evenements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionEvents.map((se) => (
              <div
                key={se.id}
                className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                  se.status === "active" ? "border-primary/30 bg-primary/5" : "border-border"
                }`}
              >
                {statusIcon(se.status as EventStatus)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{se.events.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Evenement {se.event_order}</span>
                    {se.duration_seconds && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatDuration(se.duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
                {se.events.category && (
                  <CategoryBadge category={se.events.category as EventCategory} />
                )}
                <Badge variant="outline" className="text-xs">
                  {se.status === "resolved" ? "Termine" : se.status === "active" ? "En cours" : "A venir"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Duration Selection Dialog */}
      <Dialog open={showDurationDialog} onOpenChange={setShowDurationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Duree de reaction
            </DialogTitle>
            <DialogDescription>
              {nextPendingEvent
                ? `Definissez le temps alloue aux equipes pour reagir a "${nextPendingEvent.events.title}".`
                : "Definissez le temps alloue aux equipes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mode toggle */}
            <div className="flex gap-2">
              <Button
                variant={durationMode === "preset" ? "default" : "outline"}
                size="sm"
                onClick={() => setDurationMode("preset")}
                className="flex-1"
              >
                Presets
              </Button>
              <Button
                variant={durationMode === "custom" ? "default" : "outline"}
                size="sm"
                onClick={() => setDurationMode("custom")}
                className="flex-1"
              >
                Personnalise
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
                    className={selectedPreset === p.value ? "glow-primary" : ""}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="customDays" className="text-xs text-muted-foreground">Jours</Label>
                  <Input
                    id="customDays"
                    type="number"
                    min="0"
                    max="30"
                    placeholder="0"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="customHours" className="text-xs text-muted-foreground">Heures</Label>
                  <Input
                    id="customHours"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="0"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="customMin" className="text-xs text-muted-foreground">Minutes</Label>
                  <Input
                    id="customMin"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Timer className="h-4 w-4 text-primary" />
              <span className="font-mono text-lg font-bold text-foreground">
                {formatDuration(getDurationSeconds())}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDurationDialog(false)}>
              Annuler
            </Button>
            <Button onClick={triggerWithDuration} disabled={loading} className="glow-primary">
              <Play className="mr-2 h-4 w-4" />
              Declencher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
