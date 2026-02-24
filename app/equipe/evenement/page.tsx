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
  // Auth via cookie client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // All DB reads via admin client (bypasses RLS for reliability)
  let db: ReturnType<typeof createAdminClient>
  try {
    db = createAdminClient()
  } catch {
    // Fallback to cookie client
    db = supabase as any
  }

  // Get user's team membership
  const { data: memberships } = await db
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .limit(1)

  const membership = memberships?.[0]
  if (!membership?.teams) redirect("/equipe")

  // Get active game session
  const { data: activeSessions } = await db
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

  // Get active session event
  const { data: sessionEvents } = await db
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

  // Get team members for role display
  const { data: teamMembers } = await db
    .from("team_members")
    .select("*, profiles(id, email, display_name)")
    .eq("team_id", membership.teams.id)

  // Pass minimal props -- component handles its own data fetching via API
  return (
    <DecisionFlow
      sessionEvent={sessionEvent}
      currentUserId={user.id}
      currentRole={membership.role_in_company}
      teamId={membership.teams.id}
      teamMembers={teamMembers || []}
      expiresAt={sessionEvent.expires_at}
      durationSeconds={sessionEvent.duration_seconds}
    />
  )
}
