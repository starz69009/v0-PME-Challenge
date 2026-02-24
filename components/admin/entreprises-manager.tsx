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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Building2, Pencil, Link2 } from "lucide-react"
import { toast } from "sonner"
import type { Entreprise } from "@/lib/types"

interface TeamRef {
  id: string
  name: string
  colors_primary: string
  entreprise_id: string | null
}

// Separate form dialog to avoid re-render focus loss
function EntrepriseFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialName,
  initialDescription,
  initialSecteur,
  onSubmit,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  submitLabel: string
  initialName: string
  initialDescription: string
  initialSecteur: string
  onSubmit: (data: { name: string; description: string; secteur: string }) => void
  loading: boolean
}) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [secteur, setSecteur] = useState(initialSecteur)

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setName(initialName)
      setDescription(initialDescription)
      setSecteur(initialSecteur)
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/40 bg-card">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ent-name" className="text-sm text-muted-foreground">Nom de l{"'"}entreprise</Label>
            <Input
              id="ent-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: TechVision SAS"
              className="bg-secondary/50 border-border/40"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ent-secteur" className="text-sm text-muted-foreground">Secteur d{"'"}activite</Label>
            <Input
              id="ent-secteur"
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              placeholder="Ex: Technologie, Agroalimentaire..."
              className="bg-secondary/50 border-border/40"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ent-desc" className="text-sm text-muted-foreground">Description</Label>
            <Textarea
              id="ent-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'entreprise..."
              rows={3}
              className="bg-secondary/50 border-border/40"
            />
          </div>
          <Button
            onClick={() => onSubmit({ name, description, secteur })}
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

export function EntreprisesManager({ initialEntreprises, teams }: { initialEntreprises: Entreprise[]; teams: TeamRef[] }) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState("")
  const [loading, setLoading] = useState(false)

  async function createEntreprise(data: { name: string; description: string; secteur: string }) {
    if (!data.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("entreprises").insert({
      name: data.name,
      description: data.description || null,
      secteur: data.secteur || null,
    })
    if (error) {
      toast.error("Erreur lors de la creation")
    } else {
      toast.success("Entreprise creee")
      setCreateOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  async function updateEntreprise(id: string, data: { name: string; description: string; secteur: string }) {
    if (!data.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("entreprises").update({
      name: data.name,
      description: data.description || null,
      secteur: data.secteur || null,
    }).eq("id", id)
    if (error) {
      toast.error("Erreur lors de la mise a jour")
    } else {
      toast.success("Entreprise mise a jour")
      setEditOpen(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function deleteEntreprise(id: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("entreprises").delete().eq("id", id)
    if (error) {
      toast.error("Erreur lors de la suppression")
    } else {
      toast.success("Entreprise supprimee")
      setDeleteConfirm(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function linkTeam(entrepriseId: string) {
    if (!selectedTeamId) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("teams").update({ entreprise_id: entrepriseId }).eq("id", selectedTeamId)
    if (error) {
      toast.error("Erreur lors de la liaison")
    } else {
      toast.success("Equipe liee a l'entreprise")
      setSelectedTeamId("")
      setLinkOpen(null)
      router.refresh()
    }
    setLoading(false)
  }

  async function unlinkTeam(teamId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("teams").update({ entreprise_id: null }).eq("id", teamId)
    if (error) {
      toast.error("Erreur")
    } else {
      toast.success("Equipe deliee")
      router.refresh()
    }
  }

  const editingEntreprise = editOpen ? initialEntreprises.find((e) => e.id === editOpen) : null
  const unlinkedTeams = teams.filter((t) => !t.entreprise_id)

  return (
    <div className="space-y-6">
      {/* Create dialog */}
      <EntrepriseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Creer une entreprise"
        submitLabel="Creer l'entreprise"
        initialName=""
        initialDescription=""
        initialSecteur=""
        onSubmit={createEntreprise}
        loading={loading}
      />

      {/* Edit dialog */}
      {editingEntreprise && (
        <EntrepriseFormDialog
          open={true}
          onOpenChange={(open) => { if (!open) setEditOpen(null) }}
          title={`Modifier ${editingEntreprise.name}`}
          submitLabel="Sauvegarder"
          initialName={editingEntreprise.name}
          initialDescription={editingEntreprise.description || ""}
          initialSecteur={editingEntreprise.secteur || ""}
          onSubmit={(data) => updateEntreprise(editingEntreprise.id, data)}
          loading={loading}
        />
      )}

      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-border/40 text-muted-foreground">
            {initialEntreprises.length} entreprise{initialEntreprises.length !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="border-border/40 text-muted-foreground">
            {unlinkedTeams.length} equipe{unlinkedTeams.length !== 1 ? "s" : ""} non liee{unlinkedTeams.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle entreprise
        </Button>
      </div>

      {/* Empty state */}
      {initialEntreprises.length === 0 ? (
        <Card className="border-dashed border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center p-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Building2 className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Aucune entreprise</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Creez des entreprises fictives, puis liez-les a des equipes de joueurs.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {initialEntreprises.map((entreprise) => {
            const linkedTeams = teams.filter((t) => t.entreprise_id === entreprise.id)

            return (
              <Card key={entreprise.id} className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary border border-primary/20">
                        {entreprise.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-foreground">{entreprise.name}</CardTitle>
                        {entreprise.secteur && (
                          <Badge variant="outline" className="mt-0.5 text-[10px] border-border/30 text-muted-foreground">
                            {entreprise.secteur}
                          </Badge>
                        )}
                        {entreprise.description && <p className="mt-1 text-xs text-muted-foreground/60">{entreprise.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" onClick={() => setEditOpen(entreprise.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Dialog open={deleteConfirm === entreprise.id} onOpenChange={(open) => setDeleteConfirm(open ? entreprise.id : null)}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive/60 hover:text-destructive" onClick={() => setDeleteConfirm(entreprise.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <DialogContent className="border-border/40 bg-card">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Supprimer {entreprise.name} ?</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              Les equipes liees seront deliees mais pas supprimees.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="border-border/40">Annuler</Button>
                            <Button variant="destructive" onClick={() => deleteEntreprise(entreprise.id)} disabled={loading}>Supprimer</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Linked teams */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Equipes liees ({linkedTeams.length})
                    </p>
                    {linkedTeams.length > 0 ? (
                      <div className="space-y-1.5">
                        {linkedTeams.map((t) => (
                          <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/20 bg-secondary/20 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: t.colors_primary }} />
                              <span className="text-sm font-medium text-foreground">{t.name}</span>
                            </div>
                            <button
                              onClick={() => unlinkTeam(t.id)}
                              className="text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
                            >
                              Delier
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/40 rounded-md bg-muted/20 px-3 py-2">Aucune equipe liee</p>
                    )}
                  </div>

                  {/* Link team button */}
                  {unlinkedTeams.length > 0 && (
                    <Dialog open={linkOpen === entreprise.id} onOpenChange={(open) => { setLinkOpen(open ? entreprise.id : null); if (!open) setSelectedTeamId("") }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed border-border/30 text-muted-foreground hover:border-primary/40 hover:text-primary"
                        onClick={() => setLinkOpen(entreprise.id)}
                      >
                        <Link2 className="mr-2 h-3.5 w-3.5" />
                        Lier une equipe
                      </Button>
                      <DialogContent className="border-border/40 bg-card">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Lier une equipe a {entreprise.name}</DialogTitle>
                          <DialogDescription className="text-muted-foreground">
                            {unlinkedTeams.length} equipe(s) disponible(s)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Equipe</Label>
                            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                              <SelectTrigger className="bg-secondary/50 border-border/40">
                                <SelectValue placeholder="Selectionner une equipe" />
                              </SelectTrigger>
                              <SelectContent className="border-border/40 bg-card">
                                {unlinkedTeams.map((t) => (
                                  <SelectItem key={t.id} value={t.id}>
                                    <div className="flex items-center gap-2">
                                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: t.colors_primary }} />
                                      {t.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={() => linkTeam(entreprise.id)} disabled={loading || !selectedTeamId} className="w-full">
                            {loading ? "..." : "Confirmer"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
