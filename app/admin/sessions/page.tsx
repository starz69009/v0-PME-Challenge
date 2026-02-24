import { createClient } from "@/lib/supabase/server"
import { SessionsManager } from "@/components/admin/sessions-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Sessions",
}

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("game_sessions")
    .select("*, entreprises(*)")
    .order("created_at", { ascending: false })

  const { data: events } = await supabase
    .from("events")
    .select("*, event_options(*)")
    .order("sort_order")

  const { data: teams } = await supabase
    .from("teams")
    .select("*")

  const { data: entreprises } = await supabase
    .from("entreprises")
    .select("*")
    .order("name")

  const { data: sessionTeams } = await supabase
    .from("session_teams")
    .select("*, teams(*)")

  const { data: sessionEvents } = await supabase
    .from("session_events")
    .select("*, events(*, event_options(*))")
    .order("event_order", { ascending: true })

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, teams(*), event_options(*)")

  const { data: teamScores } = await supabase
    .from("team_scores")
    .select("*")

  const { data: votes } = await supabase
    .from("votes")
    .select("*, profiles(*), event_options(*)")

  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*, profiles(*)")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Sessions de jeu</h1>
        <p className="mt-1 text-muted-foreground">Creez et gerez les sessions de jeu</p>
      </div>
      <SessionsManager
        initialSessions={sessions || []}
        events={events || []}
        teams={teams || []}
        entreprises={entreprises || []}
        sessionTeams={sessionTeams || []}
        sessionEvents={sessionEvents || []}
        decisions={decisions || []}
        teamScores={teamScores || []}
        votes={votes || []}
        teamMembers={teamMembers || []}
      />
    </div>
  )
}
