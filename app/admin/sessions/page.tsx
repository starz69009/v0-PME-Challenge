import { createClient } from "@/lib/supabase/server"
import { SessionsManager } from "@/components/admin/sessions-manager"

export const metadata = {
  title: "Sessions",
}

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from("game_sessions")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: events } = await supabase
    .from("events")
    .select("*, event_options(*)")
    .order("sort_order")

  const { data: teams } = await supabase
    .from("teams")
    .select("*")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Sessions de jeu</h1>
        <p className="mt-1 text-muted-foreground">Creez et gerez les sessions de jeu</p>
      </div>
      <SessionsManager initialSessions={sessions || []} events={events || []} teams={teams || []} />
    </div>
  )
}
