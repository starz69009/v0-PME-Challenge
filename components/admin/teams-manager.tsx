"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Building2, UserPlus, UserMinus, Pencil, Users, Crown, Briefcase, HandCoins, Factory } from "lucide-react"
import { COMPANY_ROLE_LABELS, SESSION_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { Profile, CompanyRole, SessionStatus } from "@/lib/types"

interface SessionTeamRef {
  id: string
  session_id: string
  team_id: string
  game_sessions: { id: string; name: string; status: string } | null
}

const ROLE_ICONS: Record<CompanyRole, React.ElementType> = {
  dg: Crown,
  commercial: Briefcase,
  rh: Users,
  production: Factory,
  finance: HandCoins,
}

const ROLE_ORDER: CompanyRole[] = ["dg", "commercial", "rh", "production", "finance"]

// ── Separate component with its OWN state so typing never causes parent re-render ──
function TeamFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  initialName,
  initialDescription,
  initialSlogan,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  submitLabel: string
  initialName: string
  initialDescription: string
  initialSlogan: string
  onSubmit: (data: { name: string; description: string; slogan: string }) => void
  loading: boolean
}) {
  const [name, setName] = useState(initialName)
  const [desc, setDesc] = useState(initialDescription)
  const [slogan, setSlogan] = useState(initialSlogan)

  // Reset local state when dialog opens with new values
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(initialName)
      setDesc(initialDescription)
      setSlogan(initialSlogan)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/40 bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && <DialogDescription className="text-muted-foreground">{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="team-name" className="text-sm text-muted-foreground">Nom de l{"'"}equipe</Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alpha Corp"
              className="bg-secondary/50 border-border/40"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-desc" className="text-sm text-muted-foreground">Description</Label>
            <Textarea
              id="team-desc"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Activite, secteur..."
              rows={2}
              className="bg-secondary/50 border-border/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-slogan" className="text-sm text-muted-foreground">Slogan</Label>
            <Input
              id="team-slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Optionnel"
              className="bg-secondary/50 border-border/40"
            />
          </div>
          <Button
            onClick={() => onSubmit({ name, description: desc, slogan })}
            disabled={loading || !name.trim()}
            className="w-full"
          >
            {loading ? "..." : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main component ──────────────────────────────────────────────────────────────

interface TeamWithMembers {
  id: string
  name: string
  description: string | null
  slogan: string | null
  colors_primary: string
  colors_secondary: string
  created_at: string
  team_members: Array<{
    id: string
    user_id: string
    role_in_company: CompanyRole
    profiles: Profile
  }>
}

export function TeamsManager({ initialTeams, allProfiles, sessionTeams = [] }: { initialTeams: TeamWithMembers[]; allProfiles: Profile[]; sessionTeams?: SessionTeamRef[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Add member form
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedRole, setSelectedRole] = useState<CompanyRole>("dg")

  const assignedUserIds = new Set(initialTeams.flatMap((t) => t.team_members.map((m) => m.user_id)))
  const unassignedPlayers = allProfiles.filter((p) => !assignedUserIds.has(p.id))

  async function createTeam(data: { name: string; description: string; slogan: string }) {
    if (!data.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from("teams").insert({
      name: data.name,
      description: data.description || null,
      slogan: data.slogan || null,
      created_by: user?.id,
    })
    if (error) {
      toast.error("Erreur lors de la creation")
    } else {
      toast.success("Equipe creee")
      setCreateOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function updateTeam(teamId: string, data: { name: string; description: string; slogan: string }) {
    if (!data.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("teams").update({
      name: data.name,
      description: data.description || null,
      slogan: data.slogan || null,
    }).eq("id", teamId)
    if (error) {
      toast.error("Erreur lors de la mise a jour")
    } else {
      toast.success("Equipe mise a jour")
      setEditOpen(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function deleteTeam(teamId: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("teams").delete().eq("id", teamId)
    if (error) {
      toast.error("Erreur: supprimez d'abord les membres")
    } else {
      toast.success("Equipe supprimee")
      setDeleteConfirm(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function addMember(teamId: string) {
    if (!selectedUser) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: selectedUser,
      role_in_company: selectedRole,
    })
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Ce joueur est deja dans une equipe" : "Erreur lors de l'ajout")
    } else {
      toast.success("Joueur ajoute a l'equipe")
      setSelectedUser("")
      setSelectedRole("dg")
      setAddMemberOpen(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function removeMember(memberId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("team_members").delete().eq("id", memberId)
    if (error) {
      toast.error("Erreur lors du retrait")
    } else {
      toast.success("Joueur retire de l'equipe")
      router.refresh()
    }
  }

  async function changeRole(memberId: string, newRole: CompanyRole) {
    const supabase = createClient()
    const { error } = await supabase.from("team_members").update({ role_in_company: newRole }).eq("id", memberId)
    if (error) {
      toast.error("Erreur lors du changement de poste")
    } else {
      toast.success("Poste mis a jour")
      router.refresh()
    }
  }

  const editingTeam = editOpen ? initialTeams.find((t) => t.id === editOpen) : null

  return (
    <div className="space-y-6">
      {/* Create dialog */}
      <TeamFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Creer une equipe"
        description="Definissez le nom et les informations de la nouvelle equipe."
        submitLabel="Creer l'equipe"
        initialName=""
        initialDescription=""
        initialSlogan=""
        onSubmit={createTeam}
        loading={loading}
      />

      {/* Edit dialog */}
      {editingTeam && (
        <TeamFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditOpen(null) }}
          title={`Modifier ${editingTeam.name}`}
          submitLabel="Sauvegarder"
          initialName={editingTeam.name}
          initialDescription={editingTeam.description || ""}
          initialSlogan={editingTeam.slogan || ""}
          onSubmit={(data) => updateTeam(editingTeam.id, data)}
          loading={loading}
        />
      )}

      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-border/40 text-muted-foreground">
            {initialTeams.length} equipe{initialTeams.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="border-border/40 text-muted-foreground">
            {unassignedPlayers.length} joueur{unassignedPlayers.length !== 1 ? "s" : ""} non assigne{unassignedPlayers.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle equipe
        </Button>
      </div>

      {/* Empty state */}
      {initialTeams.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aucune equipe</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Creez votre premiere equipe, puis ajoutez-y des joueurs avec leurs postes.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {initialTeams.map((team) => {
            const membersByRole = new Map<CompanyRole, typeof team.team_members>()
            for (const role of ROLE_ORDER) {
              membersByRole.set(role, team.team_members.filter((m) => m.role_in_company === role))
            }

            return (
              <Card key={team.id} className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${team.colors_primary}, ${team.colors_secondary})` }} />

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                        style={{ backgroundColor: `${team.colors_primary}20`, color: team.colors_primary, border: `1px solid ${team.colors_primary}40` }}
                      >
                        {team.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{team.name}</CardTitle>
                        {team.slogan && <p className="text-xs text-muted-foreground">{team.slogan}</p>}
                        {team.description && <p className="mt-0.5 text-xs text-muted-foreground/60">{team.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="border-border/40 text-muted-foreground tabular-nums">
                        {team.team_members.length} joueur{team.team_members.length !== 1 ? "s" : ""}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" onClick={() => setEditOpen(team.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Dialog open={deleteConfirm === team.id} onOpenChange={(open) => setDeleteConfirm(open ? team.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-border/40 bg-card">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Supprimer {team.name} ?</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Cette action est irreversible. Tous les membres seront retires.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-border/40">Annuler</Button>
                            <Button variant="destructive" onClick={() => deleteTeam(team.id)} disabled={loading}>Supprimer</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Sessions this team participates in */}
                  {(() => {
                    const teamSessions = sessionTeams.filter((st) => st.team_id === team.id && st.game_sessions)
                    if (teamSessions.length === 0) return null
                    return (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {teamSessions.map((st) => (
                          <Badge key={st.id} variant="outline" className="text-[10px] border-border/30 text-muted-foreground gap-1">
                            {st.game_sessions!.name}
                            <span className="text-muted-foreground/50">
                              ({SESSION_STATUS_LABELS[st.game_sessions!.status as SessionStatus]})
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Role slots */}
                  <div className="space-y-1.5">
                    {ROLE_ORDER.map((role) => {
                      const members = membersByRole.get(role) || []
                      const RoleIcon = ROLE_ICONS[role]
                      return (
                        <div key={role} className="group flex items-center gap-3 rounded-lg border border-border/20 bg-secondary/20 px-3 py-2 transition-colors hover:border-border/40 hover:bg-secondary/40">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted/40">
                            <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-muted-foreground">{COMPANY_ROLE_LABELS[role]}</p>
                            {members.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-0.5">
                                {members.map((m) => (
                                  <div key={m.id} className="flex items-center gap-1.5 rounded-full bg-primary/10 pl-2 pr-1 py-0.5">
                                    <span className="text-xs font-medium text-foreground">{m.profiles?.display_name || m.profiles?.email || "---"}</span>
                                    <div className="flex items-center gap-0.5">
                                      <Select defaultValue={m.role_in_company} onValueChange={(v) => changeRole(m.id, v as CompanyRole)}>
                                        <SelectTrigger className="h-5 w-5 border-0 bg-transparent p-0 shadow-none [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground">
                                          <span className="sr-only">Changer poste</span>
                                        </SelectTrigger>
                                        <SelectContent className="border-border/40 bg-card">
                                          {Object.entries(COMPANY_ROLE_LABELS).map(([k, l]) => (
                                            <SelectItem key={k} value={k} className="text-xs">{l}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <button
                                        onClick={() => removeMember(m.id)}
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/50 transition-colors hover:bg-destructive/20 hover:text-destructive"
                                      >
                                        <UserMinus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground/40 mt-0.5">Poste vacant</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Add member button */}
                  <Dialog open={addMemberOpen === team.id} onOpenChange={(open) => { setAddMemberOpen(open ? team.id : null); if (!open) { setSelectedUser(""); setSelectedRole("dg") } }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full border-dashed border-border/30 text-muted-foreground hover:border-primary/40 hover:text-primary">
                        <UserPlus className="mr-2 h-3.5 w-3.5" />
                        Ajouter un joueur
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border/40 bg-card">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Ajouter un joueur a {team.name}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          {unassignedPlayers.length > 0
                            ? `${unassignedPlayers.length} joueur(s) disponible(s)`
                            : "Tous les joueurs sont deja assignes. Creez-en de nouveaux dans la page Joueurs."}
                        </DialogDescription>
                      </DialogHeader>
                      {unassignedPlayers.length > 0 ? (
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Joueur</Label>
                            <Select value={selectedUser} onValueChange={setSelectedUser}>
                              <SelectTrigger className="bg-secondary/50 border-border/40">
                                <SelectValue placeholder="Selectionner un joueur" />
                              </SelectTrigger>
                              <SelectContent className="border-border/40 bg-card">
                                {unassignedPlayers.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.display_name || p.email}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Poste</Label>
                            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as CompanyRole)}>
                              <SelectTrigger className="bg-secondary/50 border-border/40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="border-border/40 bg-card">
                                {Object.entries(COMPANY_ROLE_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={() => addMember(team.id)} disabled={loading || !selectedUser} className="w-full">
                            Ajouter
                          </Button>
                        </div>
                      ) : (
                        <p className="py-4 text-center text-sm text-muted-foreground">Creez des joueurs depuis la page Joueurs.</p>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
