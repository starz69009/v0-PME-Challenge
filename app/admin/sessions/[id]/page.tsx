import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SessionDetail } from "@/components/admin/session-detail"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Detail de la session",
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("id", id)
    .single()

  if (!session) notFound()

  const { data: sessionEvents } = await supabase
    .from("session_events")
    .select("*, events(*, event_options(*))")
    .eq("session_id", id)
    .order("event_order")

  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, teams(*), event_options(*)")
    .in("session_event_id", (sessionEvents || []).map((se) => se.id))

  const { data: teams } = await supabase
    .from("teams")
    .select("*")

  return (
    <div className="flex-1 p-6 lg:p-8">
      <SessionDetail
        session={session}
        sessionEvents={sessionEvents || []}
        decisions={decisions || []}
        teams={teams || []}
      />
    </div>
  )
}
