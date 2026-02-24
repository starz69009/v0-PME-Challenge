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

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, colors_primary, entreprise_id")
    .order("name")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Entreprises</h1>
        <p className="mt-1 text-muted-foreground">Gerez les entreprises fictives de la simulation et liez-les aux equipes</p>
      </div>
      <EntreprisesManager initialEntreprises={entreprises || []} teams={teams || []} />
    </div>
  )
}
