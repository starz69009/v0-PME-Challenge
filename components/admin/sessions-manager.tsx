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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Play, Eye, Trash2, Zap } from "lucide-react"
import { SESSION_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { GameSession, GameEvent, Team, SessionStatus } from "@/lib/types"

const STATUS_STYLES: Record<string, string> = {
  setup: "border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground",
  active: "border-[#22d3ee]/40 bg-[#22d3ee]/10 text-[#22d3ee]",
  completed: "border-[#84cc16]/40 bg-[#84cc16]/10 text-[#84cc16]",
}

export function SessionsManager({
  initialSessions,
  events,
  teams,
}: {
  initialSessions: GameSession[]
  events: GameEvent[]
  teams: Team[]
}) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [sessionName, setSessionName] = useState("")
  const [loading, setLoading] = useState(false)

  async function createSession() {
    if (!sessionName.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({ name: sessionName, created_by: user?.id })
      .select()
      .single()

    if (error || !session) {
      toast.error("Erreur lors de la creation")
      setLoading(false)
      return
    }

    const sessionEvents = events
      .filter((e) => e.is_active)
      .map((e) => ({
        session_id: session.id,
        event_id: e.id,
        event_order: e.sort_order,
      }))

    await supabase.from("session_events").insert(sessionEvents)

    toast.success("Session creee avec succes")
    setSessionName("")
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
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle session
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/40 bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Creer une session</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="session-name" className="text-muted-foreground">Nom de la session</Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ex: Session Janvier 2026"
                  className="bg-secondary/50 border-border/40"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {events.filter((e) => e.is_active).length} evenements seront inclus dans cette session.
                {teams.length > 0 && ` ${teams.length} equipe(s) participeront.`}
              </p>
              <Button onClick={createSession} disabled={loading || !sessionName.trim()} className="w-full">
                Creer la session
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
          {initialSessions.map((session) => (
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
                <p className="text-xs text-muted-foreground">
                  Creee le {new Date(session.created_at).toLocaleDateString("fr-FR")}
                </p>
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
          ))}
        </div>
      )}
    </div>
  )
}
