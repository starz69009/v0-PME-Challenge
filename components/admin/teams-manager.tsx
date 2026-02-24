"use client"

import { useState } from "react"
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
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { Profile, CompanyRole } from "@/lib/types"

const ROLE_ICONS: Record<CompanyRole, React.ElementType> = {
  dg: Crown,
  commercial: Briefcase,
  rh: Users,
  production: Factory,
  finance: HandCoins,
}

const ROLE_ORDER: CompanyRole[] = ["dg", "commercial", "rh", "production", "finance"]

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

export function TeamsManager({ initialTeams, allProfiles }: { initialTeams: TeamWithMembers[]; allProfiles: Profile[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Create / Edit form
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [teamSlogan, setTeamSlogan] = useState("")

  // Add member form
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedRole, setSelectedRole] = useState<CompanyRole>("dg")

  const assignedUserIds = new Set(initialTeams.flatMap((t) => t.team_members.map((m) => m.user_id)))
  const unassignedPlayers = allProfiles.filter((p) => !assignedUserIds.has(p.id))

  function openEdit(team: TeamWithMembers) {
    setTeamName(team.name)
    setTeamDescription(team.description || "")
    setTeamSlogan(team.slogan || "")
    setEditOpen(team.id)
  }

  function resetForm() {
    setTeamName("")
    setTeamDescription("")
    setTeamSlogan("")
  }

  async function createTeam() {
    if (!teamName.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from("teams").insert({
      name: teamName,
      description: teamDescription || null,
      slogan: teamSlogan || null,
      created_by: user?.id,
    })
    if (error) {
      toast.error("Erreur lors de la creation")
    } else {
      toast.success("Equipe creee")
      resetForm()
      setCreateOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function updateTeam(teamId: string) {
    if (!teamName.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("teams").update({
      name: teamName,
      description: teamDescription || null,
      slogan: teamSlogan || null,
    }).eq("id", teamId)
    if (error) {
      toast.error("Erreur lors de la mise a jour")
    } else {
      toast.success("Equipe mise a jour")
      resetForm()
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

  const teamFormFields = (
    <>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Nom de l{"'"}equipe</Label>
        <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ex: Alpha Corp" className="bg-secondary/50 border-border/40" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Description</Label>
        <Textarea value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} placeholder="Activite, secteur..." rows={2} className="bg-secondary/50 border-border/40" />
      </div>
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Slogan</Label>
        <Input value={teamSlogan} onChange={(e) => setTeamSlogan(e.target.value)} placeholder="Optionnel" className="bg-secondary/50 border-border/40" />
      </div>
    </>
  )

  return (
    <div className="space-y-6">
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
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle equipe
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/40 bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Creer une equipe</DialogTitle>
              <DialogDescription className="text-muted-foreground">Definissez le nom et les informations de la nouvelle equipe.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {teamFormFields}
              <Button onClick={createTeam} disabled={loading || !teamName.trim()} className="w-full">
                {loading ? "..." : "Creer l'equipe"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                      <Dialog open={editOpen === team.id} onOpenChange={(open) => { if (open) openEdit(team); else { setEditOpen(null); resetForm() } }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-border/40 bg-card">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Modifier {team.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            {teamFormFields}
                            <Button onClick={() => updateTeam(team.id)} disabled={loading || !teamName.trim()} className="w-full">
                              {loading ? "..." : "Sauvegarder"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
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
