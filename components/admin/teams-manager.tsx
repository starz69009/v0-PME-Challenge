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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, UserPlus, Trash2, Building2 } from "lucide-react"
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { Profile, CompanyRole } from "@/lib/types"

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
  const [addMemberOpen, setAddMemberOpen] = useState<string | null>(null)
  const [teamName, setTeamName] = useState("")
  const [teamDescription, setTeamDescription] = useState("")
  const [teamSlogan, setTeamSlogan] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedRole, setSelectedRole] = useState<CompanyRole>("collaborateur")
  const [loading, setLoading] = useState(false)

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
      toast.error("Erreur lors de la creation de l'equipe")
    } else {
      toast.success("Equipe creee avec succes")
      setTeamName("")
      setTeamDescription("")
      setTeamSlogan("")
      setCreateOpen(false)
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
      toast.error(error.message.includes("duplicate") ? "Ce membre fait deja partie de l'equipe" : "Erreur lors de l'ajout")
    } else {
      toast.success("Membre ajoute avec succes")
      setSelectedUser("")
      setSelectedRole("collaborateur")
      setAddMemberOpen(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function removeMember(memberId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("team_members").delete().eq("id", memberId)
    if (error) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Membre retire")
      router.refresh()
    }
  }

  async function deleteTeam(teamId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("teams").delete().eq("id", teamId)
    if (error) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Equipe supprimee")
      router.refresh()
    }
  }

  const assignedUserIds = new Set(initialTeams.flatMap((t) => t.team_members.map((m) => m.user_id)))

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle entreprise
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border/40 bg-card">
            <DialogHeader>
              <DialogTitle className="text-foreground">Creer une entreprise</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground">Nom de l{"'"}entreprise</Label>
                <Input id="name" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Ex: TechStart" className="bg-secondary/50 border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-muted-foreground">Description</Label>
                <Textarea id="description" value={teamDescription} onChange={(e) => setTeamDescription(e.target.value)} placeholder="Activite de l'entreprise..." rows={3} className="bg-secondary/50 border-border/40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slogan" className="text-muted-foreground">Slogan</Label>
                <Input id="slogan" value={teamSlogan} onChange={(e) => setTeamSlogan(e.target.value)} placeholder="Notre slogan..." className="bg-secondary/50 border-border/40" />
              </div>
              <Button onClick={createTeam} disabled={loading || !teamName.trim()} className="w-full">
                Creer l{"'"}entreprise
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {initialTeams.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aucune entreprise</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">Creez votre premiere entreprise pour commencer le jeu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {initialTeams.map((team) => (
            <Card key={team.id} className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold"
                    style={{ backgroundColor: `${team.colors_primary}25`, color: team.colors_primary, border: `1px solid ${team.colors_primary}40` }}
                  >
                    {team.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base text-foreground">{team.name}</CardTitle>
                    {team.slogan && <p className="text-xs text-muted-foreground">{team.slogan}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-border/40 text-muted-foreground">
                    {team.team_members.length} membre{team.team_members.length !== 1 ? "s" : ""}
                  </Badge>
                  <Dialog open={addMemberOpen === team.id} onOpenChange={(open) => setAddMemberOpen(open ? team.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-border/40">
                        <UserPlus className="mr-2 h-3 w-3" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="border-border/40 bg-card">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Ajouter un membre a {team.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Utilisateur</Label>
                          <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger className="bg-secondary/50 border-border/40">
                              <SelectValue placeholder="Selectionner un utilisateur" />
                            </SelectTrigger>
                            <SelectContent className="border-border/40 bg-card">
                              {allProfiles.filter((p) => !assignedUserIds.has(p.id)).map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.display_name || p.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Role dans l{"'"}entreprise</Label>
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
                          Ajouter le membre
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteTeam(team.id)}>
                    <Trash2 className="h-3 w-3" />
                    <span className="sr-only">Supprimer</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {team.team_members.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 text-center py-4">Aucun membre dans cette equipe.</p>
                ) : (
                  <div className="rounded-lg border border-border/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/20 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Nom</TableHead>
                          <TableHead className="text-muted-foreground">Email</TableHead>
                          <TableHead className="text-muted-foreground">Role</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {team.team_members.map((member) => (
                          <TableRow key={member.id} className="border-border/15 hover:bg-muted/20">
                            <TableCell className="font-medium text-foreground">{member.profiles?.display_name || "---"}</TableCell>
                            <TableCell className="text-muted-foreground">{member.profiles?.email || "---"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                                {COMPANY_ROLE_LABELS[member.role_in_company]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => removeMember(member.id)}>
                                <Trash2 className="h-3 w-3" />
                                <span className="sr-only">Retirer</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
