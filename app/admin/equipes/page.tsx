import { createClient } from "@/lib/supabase/server"
import { TeamsManager } from "@/components/admin/teams-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Equipes",
}

export default async function EquipesPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from("teams")
    .select("*, team_members(*, profiles(*))")
    .order("created_at", { ascending: false })

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "team_member")

  const { data: sessionTeams } = await supabase
    .from("session_teams")
    .select("*, game_sessions(id, name, status)")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Equipes</h1>
        <p className="mt-1 text-muted-foreground">Creez des equipes, assignez des joueurs et definissez leurs postes</p>
      </div>
      <TeamsManager initialTeams={teams || []} allProfiles={allProfiles || []} sessionTeams={sessionTeams || []} />
    </div>
  )
}
