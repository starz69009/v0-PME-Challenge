import { createClient } from "@/lib/supabase/server"
import { EventsEditor } from "@/components/admin/events-editor"

export const metadata = {
  title: "Evenements",
}

export default async function EvenementsPage() {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from("events")
    .select("*, event_options(*)")
    .order("sort_order")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Evenements</h1>
        <p className="mt-1 text-muted-foreground">Consultez et modifiez les 12 evenements du jeu</p>
      </div>
      <EventsEditor events={events || []} />
    </div>
  )
}
