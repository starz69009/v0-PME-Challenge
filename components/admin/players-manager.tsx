"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Eye, EyeOff, UserPlus, Users, KeyRound, Building2, Search, RefreshCw } from "lucide-react"
import { COMPANY_ROLE_LABELS } from "@/lib/constants"
import { createPlayer, deletePlayer, updatePlayerTeam, removePlayerFromTeam, resetPlayerPassword } from "@/app/admin/joueurs/actions"
import { toast } from "sonner"
import type { CompanyRole } from "@/lib/types"

interface PlayerProfile {
  id: string
  email: string | null
  display_name: string | null
  role: string
  plain_password: string | null
  created_at: string
}

interface EntrepriseBasic {
  id: string
  name: string
  description: string | null
  secteur: string | null
}

interface TeamBasic {
  id: string
  name: string
  colors_primary: string
  entreprise_id: string | null
}

interface MembershipWithTeam {
  id: string
  team_id: string
  user_id: string
  role_in_company: CompanyRole
  teams: TeamBasic | null
}

interface Props {
  initialPlayers: PlayerProfile[]
  entreprises: EntrepriseBasic[]
  teams: TeamBasic[]
  memberships: MembershipWithTeam[]
}

export function PlayersManager({ initialPlayers, entreprises, teams, memberships }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  // Create form state
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [newEntrepriseId, setNewEntrepriseId] = useState("")
  const [newTeamId, setNewTeamId] = useState("")
  const [newRole, setNewRole] = useState<CompanyRole>("dg")

  // Assign form state
  const [assignEntrepriseId, setAssignEntrepriseId] = useState("")
  const [assignTeamId, setAssignTeamId] = useState("")
  const [assignRole, setAssignRole] = useState<CompanyRole>("dg")

  // Reset password state
  const [newResetPassword, setNewResetPassword] = useState("")

  function getMembership(userId: string) {
    return memberships.find((m) => m.user_id === userId)
  }

  function getEntrepriseName(entrepriseId: string | null) {
    if (!entrepriseId) return null
    return entreprises.find((e) => e.id === entrepriseId)?.name || null
  }

  function getTeamsForEntreprise(entrepriseId: string) {
    return teams.filter((t) => t.entreprise_id === entrepriseId)
  }

  function togglePassword(userId: string) {
    setShowPasswords((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const filteredPlayers = initialPlayers.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    )
  })

  async function handleCreate() {
    setLoading(true)
    const fd = new FormData()
    fd.set("email", newEmail)
    fd.set("password", newPassword)
    fd.set("displayName", newName)
    if (newTeamId) fd.set("teamId", newTeamId)
    if (newTeamId && newRole) fd.set("roleInCompany", newRole)

    const result = await createPlayer(fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(result.warning || "Joueur cree avec succes")
      setNewEmail("")
      setNewPassword("")
      setNewName("")
      setNewEntrepriseId("")
      setNewTeamId("")
      setNewRole("dg")
      setCreateOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(userId: string) {
    setLoading(true)
    const result = await deletePlayer(userId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Joueur supprime")
      setDeleteConfirm(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function handleAssign(userId: string) {
    setLoading(true)
    const fd = new FormData()
    fd.set("userId", userId)
    fd.set("teamId", assignTeamId)
    fd.set("roleInCompany", assignRole)
    const result = await updatePlayerTeam(fd)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Affectation mise a jour")
      setAssignOpen(null)
      setAssignEntrepriseId("")
      setAssignTeamId("")
      setAssignRole("dg")
      router.refresh()
    }
    setLoading(false)
  }

  async function handleRemoveFromTeam(userId: string) {
    setLoading(true)
    const result = await removePlayerFromTeam(userId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Joueur retire de l'equipe")
      router.refresh()
    }
    setLoading(false)
  }

  async function handleResetPassword(userId: string) {
    if (!newResetPassword || newResetPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caracteres")
      return
    }
    setLoading(true)
    const result = await resetPlayerPassword(userId, newResetPassword)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Mot de passe reinitialise")
      setResetOpen(null)
      setNewResetPassword("")
      router.refresh()
    }
    setLoading(false)
  }

  function generatePassword() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789"
    let pwd = ""
    for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
    return pwd
  }

  // Equipe + Poste selector (with optional Entreprise grouping)
  function TeamRoleSelector({
    entrepriseId,
    setEntrepriseId,
    teamId,
    setTeamId,
    role,
    setRole,
    optional = false,
  }: {
    entrepriseId: string
    setEntrepriseId: (v: string) => void
    teamId: string
    setTeamId: (v: string) => void
    role: CompanyRole
    setRole: (v: CompanyRole) => void
    optional?: boolean
  }) {
    const hasEntreprises = entreprises.length > 0
    // If entreprises exist, filter teams by selected entreprise. Otherwise show all teams.
    const availableTeams = hasEntreprises && entrepriseId
      ? getTeamsForEntreprise(entrepriseId)
      : !hasEntreprises
        ? teams
        : []

    return (
      <div className="rounded-lg border border-border/30 bg-muted/20 p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Affectation{optional ? " (optionnel)" : ""}
        </p>

        {/* Only show Entreprise select if entreprises exist */}
        {hasEntreprises && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Entreprise</Label>
            <Select value={entrepriseId} onValueChange={(v) => {
              setEntrepriseId(v)
              setTeamId("")
            }}>
              <SelectTrigger className="bg-secondary/50 border-border/40">
                <SelectValue placeholder={optional ? "Aucune pour le moment" : "Selectionner une entreprise"} />
              </SelectTrigger>
              <SelectContent className="border-border/40 bg-card">
                {entreprises.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                    {e.secteur && <span className="ml-1 text-muted-foreground">({e.secteur})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Show team select: always if no entreprises, or after entreprise selected */}
        {(!hasEntreprises || entrepriseId) && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Equipe</Label>
            {availableTeams.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 rounded-md bg-muted/30 px-3 py-2">
                {hasEntreprises
                  ? "Aucune equipe dans cette entreprise. Creez-en une dans la page Equipes."
                  : "Aucune equipe disponible. Creez-en une dans la page Equipes."}
              </p>
            ) : (
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="bg-secondary/50 border-border/40">
                  <SelectValue placeholder="Selectionner une equipe" />
                </SelectTrigger>
                <SelectContent className="border-border/40 bg-card">
                  {availableTeams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.colors_primary }} />
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {teamId && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Poste</Label>
            <Select value={role} onValueChange={(v) => setRole(v as CompanyRole)}>
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
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar: search + create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un joueur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50 border-border/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-border/40 text-muted-foreground">
            {initialPlayers.length} joueur{initialPlayers.length !== 1 ? "s" : ""}
          </Badge>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Creer un joueur
              </Button>
            </DialogTrigger>
            <DialogContent className="border-border/40 bg-card sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Creer un joueur
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Creez un compte joueur avec ses identifiants. Vous pourrez les retrouver plus tard.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Nom du joueur</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="bg-secondary/50 border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="jean.dupont@email.com"
                    className="bg-secondary/50 border-border/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Mot de passe</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 caracteres"
                      className="bg-secondary/50 border-border/40 font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-border/40"
                      onClick={() => setNewPassword(generatePassword())}
                      title="Generer un mot de passe"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <TeamRoleSelector
                  entrepriseId={newEntrepriseId}
                  setEntrepriseId={setNewEntrepriseId}
                  teamId={newTeamId}
                  setTeamId={setNewTeamId}
                  role={newRole}
                  setRole={setNewRole}
                  optional
                />

                <Button
                  onClick={handleCreate}
                  disabled={loading || !newEmail || !newPassword || !newName || newPassword.length < 6}
                  className="w-full"
                >
                  {loading ? "Creation..." : "Creer le joueur"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Players list */}
      {filteredPlayers.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Users className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {search ? "Aucun resultat" : "Aucun joueur"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {search
                ? "Essayez avec un autre terme de recherche."
                : "Creez votre premier joueur avec le bouton ci-dessus."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Tous les joueurs</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/20 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nom</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Mot de passe</TableHead>
                    <TableHead className="text-muted-foreground">Entreprise</TableHead>
                    <TableHead className="text-muted-foreground">Equipe</TableHead>
                    <TableHead className="text-muted-foreground">Poste</TableHead>
                    <TableHead className="w-28 text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => {
                    const membership = getMembership(player.id)
                    const isPasswordVisible = showPasswords.has(player.id)
                    const entrepriseName = membership?.teams ? getEntrepriseName(membership.teams.entreprise_id) : null

                    return (
                      <TableRow key={player.id} className="border-border/15 hover:bg-muted/20">
                        <TableCell className="font-medium text-foreground">
                          {player.display_name || "---"}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {player.email || "---"}
                        </TableCell>
                        <TableCell>
                          {player.plain_password ? (
                            <div className="flex items-center gap-1.5">
                              <code className="rounded bg-muted/30 px-2 py-0.5 font-mono text-xs text-foreground">
                                {isPasswordVisible ? player.plain_password : "--------"}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => togglePassword(player.id)}
                              >
                                {isPasswordVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">Non disponible</span>
                          )}
                        </TableCell>

                        {/* Entreprise */}
                        <TableCell>
                          {entrepriseName ? (
                            <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground">
                              {entrepriseName}
                            </Badge>
                          ) : membership?.teams ? (
                            <span className="text-xs text-muted-foreground/40 italic">Non definie</span>
                          ) : null}
                        </TableCell>

                        {/* Equipe */}
                        <TableCell>
                          {membership?.teams ? (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: `${membership.teams.colors_primary}40`,
                                color: membership.teams.colors_primary,
                                backgroundColor: `${membership.teams.colors_primary}10`,
                              }}
                            >
                              {membership.teams.name}
                            </Badge>
                          ) : null}
                        </TableCell>

                        {/* Poste */}
                        <TableCell>
                          {membership ? (
                            <Select
                              defaultValue={membership.role_in_company}
                              onValueChange={(role) => {
                                const fd = new FormData()
                                fd.set("userId", player.id)
                                fd.set("teamId", membership.team_id)
                                fd.set("roleInCompany", role)
                                updatePlayerTeam(fd).then((r) => {
                                  if (r.error) toast.error(r.error)
                                  else { toast.success("Poste mis a jour"); router.refresh() }
                                })
                              }}
                            >
                              <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs shadow-none hover:bg-muted/30">
                                <span className="text-xs text-muted-foreground">{COMPANY_ROLE_LABELS[membership.role_in_company]}</span>
                              </SelectTrigger>
                              <SelectContent className="border-border/40 bg-card">
                                {Object.entries(COMPANY_ROLE_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key} className="text-xs">{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : null}
                        </TableCell>

                        {/* Affectation button (if not assigned) + Actions */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {/* Assign to team */}
                            {!membership ? (
                              <Dialog open={assignOpen === player.id} onOpenChange={(open) => {
                                setAssignOpen(open ? player.id : null)
                                if (!open) { setAssignEntrepriseId(""); setAssignTeamId(""); setAssignRole("dg") }
                              }}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-7 gap-1.5 border-dashed border-primary/30 text-xs text-primary hover:bg-primary/10 hover:text-primary">
                                    <UserPlus className="h-3 w-3" />
                                    Affecter
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="border-border/40 bg-card">
                                  <DialogHeader>
                                    <DialogTitle className="text-foreground">
                                      Affecter {player.display_name || player.email}
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                      Choisissez l{"'"}entreprise, l{"'"}equipe et le poste du joueur.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <TeamRoleSelector
                                    entrepriseId={assignEntrepriseId}
                                    setEntrepriseId={setAssignEntrepriseId}
                                    teamId={assignTeamId}
                                    setTeamId={setAssignTeamId}
                                    role={assignRole}
                                    setRole={setAssignRole}
                                  />
                                  <Button
                                    onClick={() => handleAssign(player.id)}
                                    disabled={loading || !assignTeamId}
                                    className="w-full"
                                  >
                                    {loading ? "..." : "Confirmer l'affectation"}
                                  </Button>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Retirer de l'equipe"
                                onClick={() => handleRemoveFromTeam(player.id)}
                                disabled={loading}
                              >
                                <Building2 className="h-3.5 w-3.5" />
                              </Button>
                            )}

                            {/* Reset password */}
                            <Dialog open={resetOpen === player.id} onOpenChange={(open) => {
                              setResetOpen(open ? player.id : null)
                              if (!open) setNewResetPassword("")
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-warning" title="Reinitialiser le mot de passe">
                                  <KeyRound className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="border-border/40 bg-card">
                                <DialogHeader>
                                  <DialogTitle className="text-foreground">
                                    Reinitialiser le mot de passe
                                  </DialogTitle>
                                  <DialogDescription className="text-muted-foreground">
                                    Nouveau mot de passe pour {player.display_name || player.email}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                  <div className="flex gap-2">
                                    <Input
                                      value={newResetPassword}
                                      onChange={(e) => setNewResetPassword(e.target.value)}
                                      placeholder="Nouveau mot de passe"
                                      className="bg-secondary/50 border-border/40 font-mono"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="shrink-0 border-border/40"
                                      onClick={() => setNewResetPassword(generatePassword())}
                                      title="Generer"
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Button
                                    onClick={() => handleResetPassword(player.id)}
                                    disabled={loading || !newResetPassword || newResetPassword.length < 6}
                                    className="w-full"
                                  >
                                    {loading ? "..." : "Reinitialiser"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Delete */}
                            <Dialog open={deleteConfirm === player.id} onOpenChange={(open) => setDeleteConfirm(open ? player.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" title="Supprimer le joueur">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="border-border/40 bg-card">
                                <DialogHeader>
                                  <DialogTitle className="text-foreground">Supprimer ce joueur ?</DialogTitle>
                                  <DialogDescription className="text-muted-foreground">
                                    Cette action supprimera definitivement le compte de {player.display_name || player.email}. Cette action est irreversible.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-2">
                                  <Button variant="outline" className="border-border/40" onClick={() => setDeleteConfirm(null)}>
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDelete(player.id)}
                                    disabled={loading}
                                  >
                                    {loading ? "..." : "Supprimer"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
