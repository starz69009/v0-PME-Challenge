export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/category-badge"
import { ScoreEvolutionChart } from "@/components/charts/score-evolution-chart"
import { CheckCircle2, Clock, History, TrendingUp } from "lucide-react"
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
        <div className="mb-6 rounded-2xl bg-muted/30 p-5">
          <History className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Aucun historique</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {"L'historique apparaitra une fois la session commencee."}
        </p>
      </div>
    )
  }

  const { data: sessionEvents } = await supabase
    .from("session_events")
    .select("*, events(*, event_options(*))")
    .eq("session_id", session.id)
    .in("status", ["resolved", "active"])
    .order("event_order")

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, event_options(*)")
    .eq("team_id", team.id)
    .in("session_event_id", (sessionEvents || []).map((se: any) => se.id))

  const { data: scores } = await supabase
    .from("team_scores")
    .select("*, session_events!inner(event_order, events(title))")
    .eq("team_id", team.id)
    .eq("session_id", session.id)
    .order("created_at")

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
        <h2 className="text-xl font-bold text-foreground">Historique des decisions</h2>
        <p className="text-sm text-muted-foreground">Session : {session.name}</p>
      </div>

      {/* Score Evolution Chart */}
      {evolutionData.length > 0 && (
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Evolution des scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreEvolutionChart data={evolutionData} />
          </CardContent>
        </Card>
      )}

      {/* Decision Timeline */}
      <div className="space-y-3">
        {(sessionEvents || []).map((se: any, idx: number) => {
          const decision = decisions?.find((d: any) => d.session_event_id === se.id)
          const event = se.events

          return (
            <Card
              key={se.id}
              className={`relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm transition-all ${se.status === "active" ? "border-primary/30 glow-primary" : ""}`}
            >
              {/* Left accent line */}
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${se.status === "active" ? "bg-primary" : "bg-muted-foreground/20"}`} />

              <CardHeader className="pb-3 pl-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${se.status === "resolved" ? "bg-[#22d3ee]/15 text-[#22d3ee]" : "bg-primary/15 text-primary"}`}>
                      {se.status === "resolved" ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Ev. {se.event_order}: {event.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground/70">{event.description}</p>
                    </div>
                  </div>
                  {event.category && <CategoryBadge category={event.category as EventCategory} />}
                </div>
              </CardHeader>
              {decision && (
                <CardContent className="pt-0 pl-5">
                  <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Decision</p>
                        <p className="text-sm font-semibold text-foreground">
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
                                  className={`text-xs font-mono font-bold ${val > 0 ? "text-[#22d3ee]" : "text-[#f43f5e]"}`}
                                  title={f.label}
                                >
                                  {val > 0 ? "+" : ""}{val}
                                </span>
                              )
                            })}
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className={
                            decision.status === "validated"
                              ? "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]"
                              : "border-border/40 text-muted-foreground"
                          }
                        >
                          {DECISION_STATUS_LABELS[decision.status as DecisionStatus]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {(!sessionEvents || sessionEvents.length === 0) && (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <History className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aucun evenement passe</h3>
            <p className="mt-1 text-sm text-muted-foreground">Les evenements resolus apparaitront ici.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
