"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, LayoutDashboard, History, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import type { Profile, Team, CompanyRole } from "@/lib/types"

const navItems = [
  { href: "/equipe", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/equipe/evenement", label: "Evenement", icon: Zap },
  { href: "/equipe/historique", label: "Historique", icon: History },
]

export function TeamHeader({
  profile,
  team,
  role,
}: {
  profile: Profile
  team: Team | null
  role: CompanyRole | null
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
            style={{
              backgroundColor: team?.colors_primary ? `${team.colors_primary}20` : 'oklch(0.72 0.19 195 / 0.15)',
              color: team?.colors_primary || 'oklch(0.72 0.19 195)',
            }}
          >
            {team ? team.name[0]?.toUpperCase() : <Zap className="h-5 w-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-foreground">{team?.name || "PME Challenge"}</span>
            {team?.slogan && <span className="text-[11px] text-muted-foreground">{team.slogan}</span>}
          </div>
        </div>

        {/* Nav - Pill style */}
        <nav className="hidden items-center gap-1 rounded-full border border-border/40 bg-card/50 p-1 md:flex">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {profile.display_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{profile.display_name}</span>
              {role && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary/70">
                  {COMPANY_ROLE_LABELS[role]}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Se deconnecter</span>
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex overflow-x-auto border-t border-border/30 px-2 md:hidden">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
