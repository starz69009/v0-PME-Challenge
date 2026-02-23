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
    <div className="min-h-screen bg-background">
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
            <h2 className="text-xl font-semibold text-foreground">Aucune equipe assignee</h2>
            <p className="mt-2 text-muted-foreground">
              Contactez votre administrateur pour etre assigne a une entreprise.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
