"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { CategoryBadge } from "@/components/category-badge"
import { CATEGORY_LABELS, CATEGORY_COLORS, SCORE_FIELDS } from "@/lib/constants"
import type { GameEvent, EventOption, EventCategory } from "@/lib/types"
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, GripVertical, X } from "lucide-react"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface EventWithOptions extends GameEvent {
  event_options: EventOption[]
}

const emptyOption = (): Partial<EventOption> => ({
  label: "",
  description: "",
  points_social: 0,
  points_commercial: 0,
  points_tresorerie: 0,
  points_production: 0,
  points_reglementaire: 0,
  points_moyenne: 0,
  sort_order: 0,
})

export function EventsEditor({ events: initialEvents }: { events: EventWithOptions[] }) {
  const router = useRouter()
  const [events, setEvents] = useState(initialEvents)
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<EventCategory>("social")
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [options, setOptions] = useState<Partial<EventOption>[]>([emptyOption(), emptyOption(), emptyOption()])

  function resetForm() {
    setTitle("")
    setDescription("")
    setCategory("social")
    setSortOrder(0)
    setIsActive(true)
    setOptions([emptyOption(), emptyOption(), emptyOption()])
    setCreating(false)
    setEditing(null)
  }

  function loadEventForEdit(event: EventWithOptions) {
    setTitle(event.title)
    setDescription(event.description)
    setCategory((event.category as EventCategory) || "social")
    setSortOrder(event.sort_order)
    setIsActive(event.is_active)
    setOptions(
      event.event_options
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ ...o }))
    )
    setEditing(event.id)
    setCreating(true)
  }

  function updateOption(index: number, field: string, value: string | number) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, [field]: value } : o))
    )
  }

  function addOption() {
    setOptions((prev) => [...prev, { ...emptyOption(), sort_order: prev.length }])
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      toast.error("Un evenement doit avoir au moins 2 options")
      return
    }
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  async function refetchEvents() {
    const { data } = await supabase
      .from("events")
      .select("*, event_options(*)")
      .order("sort_order", { ascending: true })
    if (data) setEvents(data)
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Le titre est requis"); return }
    if (!description.trim()) { toast.error("La description est requise"); return }
    if (options.length < 2) { toast.error("Au moins 2 options requises"); return }
    if (options.some((o) => !o.label?.trim())) { toast.error("Chaque option doit avoir un libelle"); return }

    setSaving(true)

    try {
      if (editing) {
        const { error: eventError } = await supabase
          .from("events")
          .update({ title, description, category, sort_order: sortOrder, is_active: isActive })
          .eq("id", editing)
        if (eventError) throw eventError

        await supabase.from("event_options").delete().eq("event_id", editing)

        const optionsToInsert = options.map((o, i) => ({
          event_id: editing,
          label: o.label!,
          description: o.description || "",
          points_social: Number(o.points_social) || 0,
          points_commercial: Number(o.points_commercial) || 0,
          points_tresorerie: Number(o.points_tresorerie) || 0,
          points_production: Number(o.points_production) || 0,
          points_reglementaire: Number(o.points_reglementaire) || 0,
          points_moyenne: Number(o.points_moyenne) || 0,
          sort_order: i,
        }))
        const { error: insertError } = await supabase.from("event_options").insert(optionsToInsert)
        if (insertError) throw insertError

        toast.success("Evenement mis a jour")
      } else {
        const { data: newEvent, error: eventError } = await supabase
          .from("events")
          .insert({ title, description, category, sort_order: sortOrder, is_active: isActive })
          .select()
          .single()
        if (eventError) throw eventError

        const optionsToInsert = options.map((o, i) => ({
          event_id: newEvent.id,
          label: o.label!,
          description: o.description || "",
          points_social: Number(o.points_social) || 0,
          points_commercial: Number(o.points_commercial) || 0,
          points_tresorerie: Number(o.points_tresorerie) || 0,
          points_production: Number(o.points_production) || 0,
          points_reglementaire: Number(o.points_reglementaire) || 0,
          points_moyenne: Number(o.points_moyenne) || 0,
          sort_order: i,
        }))
        const { error: insertError } = await supabase.from("event_options").insert(optionsToInsert)
        if (insertError) throw insertError

        toast.success("Evenement cree")
      }

      resetForm()
      router.refresh()
      await refetchEvents()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(eventId: string) {
    await supabase.from("event_options").delete().eq("event_id", eventId)
    const { error } = await supabase.from("events").delete().eq("id", eventId)
    if (error) { toast.error(error.message); return }
    toast.success("Evenement supprime")
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
    setExpandedEvent(null)
  }

  async function toggleActive(eventId: string, current: boolean) {
    const { error } = await supabase.from("events").update({ is_active: !current }).eq("id", eventId)
    if (error) { toast.error(error.message); return }
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, is_active: !current } : e)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evenements</h1>
          <p className="text-sm text-muted-foreground">{events.length} evenement(s) configures</p>
        </div>
        {!creating && (
          <Button className="glow-primary" onClick={() => { resetForm(); setCreating(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Creer un evenement
          </Button>
        )}
      </div>

      {/* Create / Edit Form */}
      {creating && (
        <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editing ? "Modifier l'evenement" : "Nouvel evenement"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Event info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Conflit social dans l'entreprise"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as EventCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ordre</Label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Decrivez la situation a laquelle les equipes doivent reagir..."
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-sm">Evenement actif</Label>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Options de decision ({options.length})</Label>
                <Button variant="outline" size="sm" onClick={addOption}>
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter une option
                </Button>
              </div>

              {options.map((opt, idx) => (
                <Card key={idx} className="border-border/40 bg-muted/20">
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                        Option {idx + 1}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/70 hover:text-destructive"
                        onClick={() => removeOption(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Libelle</Label>
                        <Input
                          value={opt.label || ""}
                          onChange={(e) => updateOption(idx, "label", e.target.value)}
                          placeholder="Ex: Negocier avec les syndicats"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Description (optionnel)</Label>
                        <Input
                          value={opt.description || ""}
                          onChange={(e) => updateOption(idx, "description", e.target.value)}
                          placeholder="Details sur cette option..."
                        />
                      </div>
                    </div>

                    {/* Points grid */}
                    <div>
                      <Label className="mb-2 block text-xs text-muted-foreground">Impact sur les scores</Label>
                      <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                        {SCORE_FIELDS.map((field) => (
                          <div key={field.key} className="space-y-1">
                            <Label className="text-xs" style={{ color: field.color }}>{field.label}</Label>
                            <Input
                              type="number"
                              className="h-8 text-center text-sm"
                              value={opt[field.key as keyof typeof opt] as number || 0}
                              onChange={(e) => updateOption(idx, field.key, parseInt(e.target.value) || 0)}
                            />
                          </div>
                        ))}
                        <div className="space-y-1">
                          <Label className="text-xs text-foreground/70">Moyenne</Label>
                          <Input
                            type="number"
                            step="0.1"
                            className="h-8 text-center text-sm"
                            value={opt.points_moyenne || 0}
                            onChange={(e) => updateOption(idx, "points_moyenne", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-border/30 pt-4">
              <Button variant="outline" onClick={resetForm}>Annuler</Button>
              <Button className="glow-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : editing ? "Mettre a jour" : "Creer l'evenement"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events list */}
      <div className="space-y-3">
        {events
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((event) => {
            const isExpanded = expandedEvent === event.id
            const opts = event.event_options?.sort((a, b) => a.sort_order - b.sort_order) || []
            const catColor = CATEGORY_COLORS[(event.category as EventCategory) || "social"]

            return (
              <Card
                key={event.id}
                className={`border-border/40 bg-card/60 backdrop-blur-sm transition-all ${
                  !event.is_active ? "opacity-50" : ""
                }`}
              >
                <CardContent className="p-0">
                  {/* Event header row */}
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-5 py-4 text-left"
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                  >
                    <div className="h-8 w-1 shrink-0 rounded-full" style={{ backgroundColor: catColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">#{event.sort_order}</span>
                        <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <CategoryBadge category={(event.category as EventCategory) || "social"} />
                      <Badge variant={event.is_active ? "default" : "secondary"} className="text-xs">
                        {event.is_active ? "Actif" : "Inactif"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{opts.length} opt.</span>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border/30 px-5 py-4 space-y-4">
                      <p className="text-sm text-muted-foreground">{event.description}</p>

                      <div className="rounded-lg border border-border/30 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/20">
                              <TableHead className="text-xs">Option</TableHead>
                              {SCORE_FIELDS.map((f) => (
                                <TableHead key={f.key} className="text-center text-xs" style={{ color: f.color }}>
                                  {f.label.slice(0, 4)}.
                                </TableHead>
                              ))}
                              <TableHead className="text-center text-xs">Moy.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {opts.map((opt) => (
                              <TableRow key={opt.id}>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                                    {opt.description && (
                                      <p className="text-xs text-muted-foreground">{opt.description}</p>
                                    )}
                                  </div>
                                </TableCell>
                                {SCORE_FIELDS.map((f) => {
                                  const val = opt[f.key as keyof EventOption] as number
                                  return (
                                    <TableCell key={f.key} className="text-center">
                                      <span className={`text-sm font-mono font-semibold ${
                                        val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground"
                                      }`}>
                                        {val > 0 ? `+${val}` : val}
                                      </span>
                                    </TableCell>
                                  )
                                })}
                                <TableCell className="text-center">
                                  <span className={`text-sm font-mono font-bold ${
                                    Number(opt.points_moyenne) > 0 ? "text-success" : Number(opt.points_moyenne) < 0 ? "text-destructive" : "text-muted-foreground"
                                  }`}>
                                    {Number(opt.points_moyenne) > 0 ? "+" : ""}{Number(opt.points_moyenne).toFixed(1)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={event.is_active}
                            onCheckedChange={() => toggleActive(event.id, event.is_active)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {event.is_active ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              loadEventForEdit(event)
                              window.scrollTo({ top: 0, behavior: "smooth" })
                            }}
                          >
                            <Pencil className="mr-1.5 h-3 w-3" />
                            Modifier
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                                <Trash2 className="mr-1.5 h-3 w-3" />
                                Supprimer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Supprimer cet evenement ?</DialogTitle>
                              </DialogHeader>
                              <p className="text-sm text-muted-foreground">
                                L{"'"}evenement <strong>{event.title}</strong> et ses {opts.length} options seront definitivement supprimes.
                              </p>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Annuler</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button variant="destructive" onClick={() => handleDelete(event.id)}>
                                    Supprimer
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* Empty state */}
      {events.length === 0 && !creating && (
        <Card className="border-border/30 bg-card/40">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-2xl bg-muted/30 p-4">
              <Plus className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-foreground">Aucun evenement</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Creez votre premier evenement pour commencer a construire votre scenario de jeu.
            </p>
            <Button className="mt-4 glow-primary" onClick={() => { resetForm(); setCreating(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Creer un evenement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
