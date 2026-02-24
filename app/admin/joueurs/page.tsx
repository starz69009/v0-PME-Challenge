import { createClient } from "@/lib/supabase/server"
import { PlayersManager } from "@/components/admin/players-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Joueurs",
}

export default async function JoueursPage() {
  const supabase = await createClient()

  const { data: players } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "team_member")
    .order("created_at", { ascending: false })

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, colors_primary")
    .order("name")

  const { data: memberships } = await supabase
    .from("team_members")
    .select("*, teams(id, name, colors_primary)")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Joueurs</h1>
        <p className="mt-1 text-muted-foreground">Creez et gerez les comptes joueurs, leurs equipes et postes</p>
      </div>
      <PlayersManager
        initialPlayers={players || []}
        teams={teams || []}
        memberships={memberships || []}
      />
    </div>
  )
}
