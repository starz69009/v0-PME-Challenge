export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { DecisionFlow } from "@/components/team/decision-flow"
import { Zap, Clock } from "lucide-react"

export const metadata = {
  title: "Evenement actif",
}

export default async function EvenementPage() {
  // Auth check via cookie-based client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // All reads via admin client (bypasses RLS for reliability)
  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0]

  if (!membership?.teams) redirect("/equipe")

  const { data: activeSessions } = await admin
    .from("game_sessions")
    .select("*")
    .eq("status", "active")
    .limit(1)

  const activeSession = activeSessions?.[0] || null

  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-6">
          <div className="rounded-2xl bg-muted/30 p-5">
            <Clock className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-border/20 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Aucune session active</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {"Attendez que l'administrateur demarre une session de jeu."}
        </p>
      </div>
    )
  }

  const { data: sessionEvents } = await admin
    .from("session_events")
    .select("*, events(*, event_options(*))")
    .eq("session_id", activeSession.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)

  const sessionEvent = sessionEvents?.[0] || null

  if (!sessionEvent) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="relative mb-6">
          <div className="rounded-2xl bg-primary/10 p-5">
            <Zap className="h-10 w-10 text-primary/60" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-primary/15 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Aucun evenement en cours</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {"Attendez que l'administrateur declenche le prochain evenement."}
        </p>
      </div>
    )
  }

  const { data: decisions } = await admin
    .from("decisions")
    .select("*, event_options(*)")
    .eq("session_event_id", sessionEvent.id)
    .eq("team_id", membership.teams.id)
    .limit(1)

  const decision = decisions?.[0] || null

  const { data: votes } = decision
    ? await admin
        .from("votes")
        .select("*, event_options(*), profiles(id, email, display_name)")
        .eq("decision_id", decision.id)
    : { data: [] }

  const { data: teamMembers } = await admin
    .from("team_members")
    .select("*, profiles(id, email, display_name)")
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
      expiresAt={sessionEvent.expires_at}
      durationSeconds={sessionEvent.duration_seconds}
    />
  )
}
