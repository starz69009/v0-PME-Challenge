import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Play, CalendarDays, Trophy } from "lucide-react"
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
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="mt-1 text-muted-foreground">Vue d{"'"}ensemble du jeu PME Challenge</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Entreprises"
          value={teamCount || 0}
          color="#3b82f6"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Participants"
          value={memberCount || 0}
          color="#10b981"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Evenements"
          value={eventCount || 0}
          color="#f59e0b"
        />
        <StatCard
          icon={<Play className="h-5 w-5" />}
          label="Sessions"
          value={sessions?.length || 0}
          color="#8b5cf6"
        />
      </div>

      {/* Active Session */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Play className="h-5 w-5 text-primary" />
              Session active
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSession ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{activeSession.name}</span>
                  <Badge className="bg-success text-success-foreground">En cours</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Evenement actuel : {activeSession.current_event_order} / 12
                </p>
                <Button asChild size="sm">
                  <Link href={`/admin/sessions/${activeSession.id}`}>Gerer la session</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Aucune session active pour le moment.</p>
                <Button asChild size="sm">
                  <Link href="/admin/sessions">Creer une session</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Sessions recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{session.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <Badge variant={session.status === "active" ? "default" : "secondary"}>
                      {SESSION_STATUS_LABELS[session.status as SessionStatus]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune session creee.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
