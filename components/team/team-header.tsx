"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, LayoutDashboard, Zap, History, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import type { Profile, Team, CompanyRole } from "@/lib/types"

const navItems = [
  { href: "/equipe", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/equipe/evenement", label: "Evenement actif", icon: Zap },
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
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: team?.colors_primary || "oklch(0.35 0.08 255)" }}
          >
            {team ? team.name[0]?.toUpperCase() : <Building2 className="h-5 w-5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-foreground">{team?.name || "PME Challenge"}</span>
            {team?.slogan && <span className="text-xs text-muted-foreground">{team.slogan}</span>}
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href)
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-1.5 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </nav>

        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-right sm:flex">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{profile.display_name}</span>
              {role && (
                <Badge variant="outline" className="mt-0.5 text-[10px]">
                  {COMPANY_ROLE_LABELS[role]}
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Se deconnecter</span>
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="flex overflow-x-auto border-t border-border px-4 md:hidden">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors ${
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
