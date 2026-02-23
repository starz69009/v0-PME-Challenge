import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TeamHeader } from "@/components/team/team-header"

export const metadata = {
  title: "Mon entreprise",
}

export default async function TeamLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  // If admin, redirect to admin panel
  if (profile.role === "admin") {
    redirect("/admin")
  }

  // Get user's team membership
  const { data: membership } = await supabase
    .from("team_members")
    .select("*, teams(*)")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <TeamHeader
        profile={profile}
        team={membership?.teams || null}
        role={membership?.role_in_company || null}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
        {membership?.teams ? (
          children
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6">
              <div className="rounded-2xl bg-muted/30 p-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">Aucune equipe assignee</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Contactez votre administrateur pour etre assigne a une entreprise.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
