"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { EventCard } from "@/components/event-card"
import { CategoryBadge } from "@/components/category-badge"
import { Play, CheckCircle, Clock, ChevronRight, Square } from "lucide-react"
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

  const resolvedCount = sessionEvents.filter((se) => se.status === "resolved").length
  const activeEvent = sessionEvents.find((se) => se.status === "active")
  const progress = sessionEvents.length > 0 ? (resolvedCount / sessionEvents.length) * 100 : 0

  async function triggerNextEvent() {
    setLoading(true)
    const supabase = createClient()

    // Find next pending event
    const nextEvent = sessionEvents
      .filter((se) => se.status === "pending")
      .sort((a, b) => a.event_order - b.event_order)[0]

    if (!nextEvent) {
      toast.error("Tous les evenements ont ete declenches")
      setLoading(false)
      return
    }

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

        // Get current team score
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

    // Activate the next event
    await supabase
      .from("session_events")
      .update({ status: "active", triggered_at: new Date().toISOString() })
      .eq("id", nextEvent.id)

    // Update session current_event_order
    await supabase
      .from("game_sessions")
      .update({ current_event_order: nextEvent.event_order })
      .eq("id", session.id)

    // Create empty decisions for all teams
    const teamDecisions = teams.map((t) => ({
      session_event_id: nextEvent.id,
      team_id: t.id,
    }))
    if (teamDecisions.length > 0) {
      await supabase.from("decisions").insert(teamDecisions)
    }

    toast.success("Evenement suivant declenche")
    router.refresh()
    setLoading(false)
  }

  async function completeSession() {
    setLoading(true)
    const supabase = createClient()

    // Resolve active event if any
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
              <Button onClick={triggerNextEvent} disabled={loading}>
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
            <CardTitle className="flex items-center gap-2 text-base">
              <Play className="h-4 w-4 text-primary" />
              Evenement en cours
            </CardTitle>
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
                  <p className="text-xs text-muted-foreground">Evenement {se.event_order}</p>
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
    </div>
  )
}
