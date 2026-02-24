export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Play, CalendarDays, Trophy, ArrowRight, Zap } from "lucide-react"
import { SESSION_STATUS_LABELS } from "@/lib/constants"
import type { SessionStatus } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: teamCount },
    { data: sessions },
    { count: eventCount },
    { count: memberCount },
  ] = await Promise.all([
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("game_sessions").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("team_members").select("*", { count: "exact", head: true }),
  ])

  const activeSession = sessions?.find((s) => s.status === "active")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-sm text-muted-foreground">Vue d{"'"}ensemble de PME Challenge</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Entreprises"
          value={teamCount || 0}
          accentClass="bg-chart-1/10 text-chart-1"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Participants"
          value={memberCount || 0}
          accentClass="bg-chart-2/10 text-chart-2"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Evenements"
          value={eventCount || 0}
          accentClass="bg-chart-4/10 text-chart-4"
        />
        <StatCard
          icon={<Play className="h-5 w-5" />}
          label="Sessions"
          value={sessions?.length || 0}
          accentClass="bg-chart-3/10 text-chart-3"
        />
      </div>

      {/* Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Session */}
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              Session active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{activeSession.name}</span>
                  <Badge className="bg-success/15 text-success border-success/30">En cours</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${((activeSession.current_event_order || 0) / 12) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {activeSession.current_event_order}/12
                  </span>
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/admin/sessions/${activeSession.id}`}>
                    Gerer la session
                    <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <Play className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune session active</p>
                <Button asChild size="sm" variant="outline" className="border-border/60">
                  <Link href="/admin/sessions">Creer une session</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-chart-4/10">
                <Trophy className="h-4 w-4 text-chart-4" />
              </div>
              Sessions recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/admin/sessions/${session.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-3 transition-colors hover:border-primary/30 hover:bg-card"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge
                      variant={session.status === "active" ? "default" : "secondary"}
                      className={session.status === "active" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}
                    >
                      {SESSION_STATUS_LABELS[session.status as SessionStatus]}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Aucune session creee.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accentClass,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accentClass: string
}) {
  return (
    <Card className="border-border/40 bg-card/80">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accentClass}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
