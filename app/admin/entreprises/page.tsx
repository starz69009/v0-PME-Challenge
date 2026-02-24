import { createClient } from "@/lib/supabase/server"
import { EntreprisesManager } from "@/components/admin/entreprises-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Entreprises",
}

export default async function EntreprisesPage() {
  const supabase = await createClient()

  const { data: entreprises } = await supabase
    .from("entreprises")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: sessions } = await supabase
    .from("game_sessions")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Entreprises</h1>
        <p className="mt-1 text-muted-foreground">
          Les entreprises sont les societes fictives utilisees dans les sessions de jeu.
        </p>
      </div>
      <EntreprisesManager initialEntreprises={entreprises || []} sessions={sessions || []} />
    </div>
  )
}
