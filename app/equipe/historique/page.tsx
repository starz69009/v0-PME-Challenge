import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/category-badge"
import { ScoreEvolutionChart } from "@/components/charts/score-evolution-chart"
import { CheckCircle, Clock, History } from "lucide-react"
import { SCORE_FIELDS, DECISION_STATUS_LABELS } from "@/lib/constants"
import type { DecisionStatus, EventCategory } from "@/lib/types"

export const metadata = {
  title: "Historique",
}

export default async function HistoriquePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: membership } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .single()

  if (!membership?.teams) redirect("/equipe")

  const team = membership.teams

  // Get active or recent session
  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <History className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-xl font-semibold text-foreground">Aucun historique</h2>
        <p className="mt-2 text-muted-foreground">L{"'"}historique apparaitra une fois la session commencee.</p>
      </div>
    )
  }

  // Get resolved session events with decisions
  const { data: sessionEvents } = await supabase
    .from("session_events")
    .select("*, events(*, event_options(*))")
    .eq("session_id", session.id)
    .in("status", ["resolved", "active"])
    .order("event_order")

  // Get team decisions
  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, event_options(*)")
    .eq("team_id", team.id)
    .in("session_event_id", (sessionEvents || []).map((se) => se.id))

  // Get score evolution
  const { data: scores } = await supabase
    .from("team_scores")
    .select("*, session_events!inner(event_order, events(title))")
    .eq("team_id", team.id)
    .eq("session_id", session.id)
    .order("created_at")

  // Build evolution chart data
  const evolutionData = (scores || []).map((s: any) => ({
    event: `Ev.${s.session_events?.event_order || "?"}`,
    social: s.points_social,
    commercial: s.points_commercial,
    tresorerie: s.points_tresorerie,
    production: s.points_production,
    reglementaire: s.points_reglementaire,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Historique des decisions</h2>
        <p className="text-sm text-muted-foreground">Session : {session.name}</p>
      </div>

      {/* Score Evolution Chart */}
      {evolutionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolution des scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreEvolutionChart data={evolutionData} />
          </CardContent>
        </Card>
      )}

      {/* Decision Timeline */}
      <div className="space-y-4">
        {(sessionEvents || []).map((se: any) => {
          const decision = decisions?.find((d) => d.session_event_id === se.id)
          const event = se.events

          return (
            <Card key={se.id} className={se.status === "active" ? "border-primary/30" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {se.status === "resolved" ? (
                      <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                    ) : (
                      <Clock className="h-4 w-4 shrink-0 text-primary" />
                    )}
                    <div>
                      <CardTitle className="text-sm">
                        Evenement {se.event_order}: {event.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.category && <CategoryBadge category={event.category as EventCategory} />}
                  </div>
                </div>
              </CardHeader>
              {decision && (
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Decision</p>
                      <p className="text-sm font-medium text-foreground">
                        {decision.event_options?.label || "Pas encore de decision"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {decision.event_options && (
                        <div className="flex gap-2">
                          {SCORE_FIELDS.map((f) => {
                            const val = decision.event_options?.[f.key as keyof typeof decision.event_options] as number
                            if (!val || val === 0) return null
                            return (
                              <span
                                key={f.key}
                                className={`text-xs font-mono ${val > 0 ? "text-success" : "text-destructive"}`}
                                title={f.label}
                              >
                                {val > 0 ? "+" : ""}{val}
                              </span>
                            )
                          })}
                        </div>
                      )}
                      <Badge
                        variant={decision.status === "validated" ? "default" : "outline"}
                        className={decision.status === "validated" ? "bg-success text-success-foreground" : ""}
                      >
                        {DECISION_STATUS_LABELS[decision.status as DecisionStatus]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {(!sessionEvents || sessionEvents.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <History className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground">Aucun evenement passe</h3>
            <p className="mt-1 text-sm text-muted-foreground">Les evenements resolus apparaitront ici.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
