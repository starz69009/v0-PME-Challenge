"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Play, Eye, Trash2, Zap, Building2, Users } from "lucide-react"
import { SESSION_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { GameSession, GameEvent, Team, Entreprise, SessionTeam, SessionStatus } from "@/lib/types"

const STATUS_STYLES: Record<string, string> = {
  setup: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
  active: "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]",
  completed: "border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16]",
}

export function SessionsManager({
  initialSessions,
  events,
  teams,
  entreprises,
  sessionTeams,
}: {
  initialSessions: GameSession[]
  events: GameEvent[]
  teams: Team[]
  entreprises: Entreprise[]
  sessionTeams: SessionTeam[]
}) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [selectedEntrepriseId, setSelectedEntrepriseId] = useState("")
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  function toggleTeam(teamId: string) {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev)
      if (next.has(teamId)) next.delete(teamId)
      else next.add(teamId)
      return next
    })
  }

  function getSessionTeams(sessionId: string) {
    return sessionTeams.filter((st) => st.session_id === sessionId)
  }

  async function createSession() {
    if (!sessionName.trim()) return
    if (!selectedEntrepriseId) {
      toast.error("Selectionnez une entreprise")
      return
    }
    if (selectedTeamIds.size === 0) {
      toast.error("Selectionnez au moins une equipe")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Create session with entreprise
    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        name: sessionName,
        created_by: user?.id,
        entreprise_id: selectedEntrepriseId,
      })
      .select()
      .single()

    if (error || !session) {
      toast.error("Erreur lors de la creation")
      setLoading(false)
      return
    }

    // Link selected teams to the session
    const teamLinks = Array.from(selectedTeamIds).map((teamId) => ({
      session_id: session.id,
      team_id: teamId,
    }))
    await supabase.from("session_teams").insert(teamLinks)

    // Create session events from active events
    const sessionEvents = events
      .filter((e) => e.is_active)
      .map((e) => ({
        session_id: session.id,
        event_id: e.id,
        event_order: e.sort_order,
      }))

    if (sessionEvents.length > 0) {
      await supabase.from("session_events").insert(sessionEvents)
    }

    toast.success("Session creee avec succes")
    setSessionName("")
    setSelectedEntrepriseId("")
    setSelectedTeamIds(new Set())
    setCreateOpen(false)
    router.refresh()
    setLoading(false)
  }

  async function deleteSession(id: string) {
    const supabase = createClient()
    await supabase.from("game_sessions").delete().eq("id", id)
    toast.success("Session supprimee")
    router.refresh()
  }

  async function startSession(id: string) {
    const supabase = createClient()
    await supabase
      .from("game_sessions")
      .update({ status: "active", current_event_order: 0 })
      .eq("id", id)
    toast.success("Session demarree")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) {
            setSessionName("")
            setSelectedEntrepriseId("")
            setSelectedTeamIds(new Set())
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle session
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/40 bg-card sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Creer une session</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Une session represente une classe. Choisissez l{"'"}entreprise simulee et les equipes participantes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Nom de la session</Label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ex: Classe BTS1 - Janvier 2026"
                  className="bg-secondary/50 border-border/40"
                />
              </div>

              {/* Entreprise selection */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Entreprise simulee</Label>
                {entreprises.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">
                    Aucune entreprise. Creez-en une dans la page Entreprises.
                  </p>
                ) : (
                  <Select value={selectedEntrepriseId} onValueChange={setSelectedEntrepriseId}>
                    <SelectTrigger className="bg-secondary/50 border-border/40">
                      <SelectValue placeholder="Selectionner une entreprise" />
                    </SelectTrigger>
                    <SelectContent className="border-border/40 bg-card">
                      {entreprises.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            {e.name}
                            {e.secteur && <span className="text-muted-foreground">- {e.secteur}</span>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Teams multi-select */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Equipes participantes
                  {selectedTeamIds.size > 0 && (
                    <span className="ml-2 text-primary">({selectedTeamIds.size} selectionnee{selectedTeamIds.size > 1 ? "s" : ""})</span>
                  )}
                </Label>
                {teams.length === 0 ? (
                  <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">
                    Aucune equipe. Creez-en dans la page Equipes.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/30 bg-secondary/20 p-2">
                    {teams.map((team) => (
                      <label
                        key={team.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/30"
                      >
                        <Checkbox
                          checked={selectedTeamIds.has(team.id)}
                          onCheckedChange={() => toggleTeam(team.id)}
                        />
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: team.colors_primary }}
                        />
                        <span className="text-sm text-foreground">{team.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {events.filter((e) => e.is_active).length} evenements actifs seront inclus.
              </p>

              <Button
                onClick={createSession}
                disabled={loading || !sessionName.trim() || !selectedEntrepriseId || selectedTeamIds.size === 0}
                className="w-full"
              >
                {loading ? "Creation..." : "Creer la session"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {initialSessions.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Zap className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aucune session</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Creez votre premiere session pour lancer le jeu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {initialSessions.map((session) => {
            const sTeams = getSessionTeams(session.id)
            return (
              <Card key={session.id} className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-foreground">{session.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[session.status as string] || STATUS_STYLES.setup}
                    >
                      {SESSION_STATUS_LABELS[session.status as SessionStatus]}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {session.entreprises && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1">
                        <Building2 className="h-3 w-3" />
                        {session.entreprises.name}
                      </Badge>
                    )}
                    {sTeams.length > 0 && (
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground gap-1">
                        <Users className="h-3 w-3" />
                        {sTeams.length} equipe{sTeams.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Creee le {new Date(session.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center gap-2 pt-0">
                  <Button asChild variant="outline" size="sm" className="border-border/40">
                    <Link href={`/admin/sessions/${session.id}`}>
                      <Eye className="mr-1 h-3 w-3" />
                      Details
                    </Link>
                  </Button>
                  {session.status === "setup" && (
                    <Button size="sm" variant="default" onClick={() => startSession(session.id)}>
                      <Play className="mr-1 h-3 w-3" />
                      Demarrer
                    </Button>
                  )}
                  {session.status === "setup" && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteSession(session.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
