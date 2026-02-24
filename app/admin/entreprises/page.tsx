import { createClient } from "@/lib/supabase/server"
import { TeamsManager } from "@/components/admin/teams-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Entreprises",
}

export default async function EntreprisesPage() {
  const supabase = await createClient()

  const { data: teams } = await supabase
    .from("teams")
    .select("*, team_members(*, profiles(*))")
    .order("created_at", { ascending: false })

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "team_member")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Entreprises</h1>
        <p className="mt-1 text-muted-foreground">Gerez les equipes et leurs membres</p>
      </div>
      <TeamsManager initialTeams={teams || []} allProfiles={allProfiles || []} />
    </div>
  )
}
