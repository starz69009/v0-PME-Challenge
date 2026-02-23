import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreDisplay } from "@/components/score-display"
import { ScoreRadarChart } from "@/components/charts/score-radar-chart"
import { Users, Zap } from "lucide-react"
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import type { CompanyRole } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function TeamDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get team
  const { data: membership } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .single()

  if (!membership?.teams) redirect("/equipe")

  const team = membership.teams

  // Get team members
  const { data: members } = await supabase
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", team.id)

  // Get active session and latest score
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

    // Check for active event
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
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Evenement en cours</p>
                <p className="text-sm text-muted-foreground">{activeEvent.events?.title}</p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/equipe/evenement">Participer</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scores */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Scores actuels</h2>
        <ScoreDisplay score={latestScore} />
      </div>

      {/* Radar + Team */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radar des competences</CardTitle>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Equipe - {team.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.slogan && (
              <p className="mb-4 text-sm italic text-muted-foreground">{`"${team.slogan}"`}</p>
            )}
            <div className="space-y-3">
              {(members || []).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {m.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {m.profiles?.display_name || m.profiles?.email || "—"}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
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
