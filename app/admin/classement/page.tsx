import { createClient } from "@/lib/supabase/server"
import { RankingsView } from "@/components/admin/rankings-view"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Classement",
}

export default async function ClassementPage() {
  const supabase = await createClient()

  // Get the most recent active or completed session
  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  let teamScores: any[] = []
  if (session) {
    // Get latest score for each team in this session
    const { data: teams } = await supabase.from("teams").select("*")
    const scores = []
    for (const team of teams || []) {
      const { data: score } = await supabase
        .from("team_scores")
        .select("*, teams(*)")
        .eq("team_id", team.id)
        .eq("session_id", session.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (score) scores.push(score)
    }
    teamScores = scores
  }

  const { data: teams } = await supabase.from("teams").select("*")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Classement</h1>
        <p className="mt-1 text-muted-foreground">
          {session ? `Session : ${session.name}` : "Aucune session active"}
        </p>
      </div>
      <RankingsView teamScores={teamScores} teams={teams || []} sessionName={session?.name} />
    </div>
  )
}
