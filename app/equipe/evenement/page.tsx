import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DecisionFlow } from "@/components/team/decision-flow"

export const metadata = {
  title: "Evenement actif",
}

export default async function EvenementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get team
  const { data: membership } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .single()

  if (!membership?.teams) redirect("/equipe")

  // Get active session
  const { data: activeSession } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .single()

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-foreground">Aucune session active</h2>
        <p className="mt-2 text-muted-foreground">
          Attendez que l{"'"}administrateur demarre une session de jeu.
        </p>
      </div>
    )
  }

  // Get active event
  const { data: sessionEvent } = await supabase
    .from("session_events")
    .select("*, events(*, event_options(*))")
    .eq("session_id", activeSession.id)
    .eq("status", "active")
    .limit(1)
    .single()

  if (!sessionEvent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-xl font-semibold text-foreground">Aucun evenement en cours</h2>
        <p className="mt-2 text-muted-foreground">
          Attendez que l{"'"}administrateur declenche le prochain evenement.
        </p>
      </div>
    )
  }

  // Get decision for this team
  const { data: decision } = await supabase
    .from("decisions")
    .select("*, event_options(*)")
    .eq("session_event_id", sessionEvent.id)
    .eq("team_id", membership.teams.id)
    .single()

  // Get votes for this decision
  const { data: votes } = decision
    ? await supabase
        .from("votes")
        .select("*, event_options(*), profiles(*)")
        .eq("decision_id", decision.id)
    : { data: [] }

  // Get team members to know who can do what
  const { data: teamMembers } = await supabase
    .from("team_members")
    .select("*, profiles(*)")
    .eq("team_id", membership.teams.id)

  return (
    <DecisionFlow
      sessionEvent={sessionEvent}
      decision={decision}
      votes={votes || []}
      currentUserId={user.id}
      currentRole={membership.role_in_company}
      teamId={membership.teams.id}
      teamMembers={teamMembers || []}
    />
  )
}
