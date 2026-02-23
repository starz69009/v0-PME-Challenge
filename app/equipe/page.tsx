import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreDisplay } from "@/components/score-display"
import { ScoreRadarChart } from "@/components/charts/score-radar-chart"
import { Users, Zap, ArrowRight } from "lucide-react"
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import type { CompanyRole } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TeamDashboard() {
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

  const { data: members } = await supabase
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", team.id)

  const { data: activeSession } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .single()

  let latestScore = null
  let activeEvent = null

  if (activeSession) {
    const { data: score } = await supabase
      .from("team_scores")
      .select("*")
      .eq("team_id", team.id)
      .eq("session_id", activeSession.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    latestScore = score

    const { data: se } = await supabase
      .from("session_events")
      .select("*, events(*)")
      .eq("session_id", activeSession.id)
      .eq("status", "active")
      .limit(1)
      .single()
    activeEvent = se
  }

  return (
    <div className="space-y-6">
      {/* Active Event Alert */}
      {activeEvent && (
        <div className="gradient-border overflow-hidden rounded-xl">
          <div className="flex items-center justify-between bg-card/80 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Evenement en cours</p>
                <p className="text-sm text-muted-foreground">{activeEvent.events?.title}</p>
              </div>
            </div>
            <Button asChild size="sm" className="glow-primary">
              <Link href="/equipe/evenement">
                Participer
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Scores */}
      <div>
        <h2 className="mb-3 text-lg font-bold tracking-tight text-foreground">Scores actuels</h2>
        <ScoreDisplay score={latestScore} />
      </div>

      {/* Radar + Team */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Radar des competences</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadarChart
              scores={{
                social: latestScore?.points_social || 0,
                commercial: latestScore?.points_commercial || 0,
                tresorerie: latestScore?.points_tresorerie || 0,
                production: latestScore?.points_production || 0,
                reglementaire: latestScore?.points_reglementaire || 0,
              }}
            />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="h-4 w-4 text-primary" />
              Equipe - {team.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.slogan && (
              <p className="mb-4 text-sm italic text-muted-foreground">{`"${team.slogan}"`}</p>
            )}
            <div className="space-y-2">
              {(members || []).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-3 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {m.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {m.profiles?.display_name || m.profiles?.email || "-"}
                    </span>
                  </div>
                  <Badge variant="outline" className="border-border/60 bg-muted/50 text-xs text-muted-foreground">
                    {COMPANY_ROLE_LABELS[m.role_in_company as CompanyRole]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
