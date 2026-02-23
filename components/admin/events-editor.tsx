"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CategoryBadge } from "@/components/category-badge"
import { ChevronDown, ChevronRight } from "lucide-react"
import { SCORE_FIELDS } from "@/lib/constants"
import type { GameEvent, EventCategory } from "@/lib/types"

interface EventWithOptions extends GameEvent {
  event_options: Array<{
    id: string
    label: string
    description: string | null
    points_social: number
    points_commercial: number
    points_tresorerie: number
    points_production: number
    points_reglementaire: number
    points_moyenne: number
    sort_order: number
  }>
}

export function EventsEditor({ events }: { events: EventWithOptions[] }) {
  const [openEvents, setOpenEvents] = useState<Set<string>>(new Set())

  function toggleEvent(id: string) {
    setOpenEvents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const isOpen = openEvents.has(event.id)
        return (
          <Collapsible key={event.id} open={isOpen} onOpenChange={() => toggleEvent(event.id)}>
            <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary font-mono">
                      {event.sort_order}
                    </span>
                    <CardTitle className="flex-1 text-base text-foreground">{event.title}</CardTitle>
                    {event.category && <CategoryBadge category={event.category as EventCategory} />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

                  <div className="rounded-lg border border-border/30 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/20 hover:bg-transparent">
                          <TableHead className="w-[200px] text-muted-foreground">Option</TableHead>
                          {SCORE_FIELDS.map((f) => (
                            <TableHead key={f.key} className="text-center text-xs text-muted-foreground">
                              {f.label}
                            </TableHead>
                          ))}
                          <TableHead className="text-center text-xs font-bold text-primary">Moy.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {event.event_options
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((option) => (
                            <TableRow key={option.id} className="border-border/15 hover:bg-muted/20">
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{option.label}</p>
                                  {option.description && (
                                    <p className="text-xs text-muted-foreground/70">{option.description}</p>
                                  )}
                                </div>
                              </TableCell>
                              {SCORE_FIELDS.map((f) => {
                                const val = option[f.key as keyof typeof option] as number
                                return (
                                  <TableCell key={f.key} className="text-center">
                                    <span
                                      className={`text-sm font-mono font-medium ${
                                        val > 0 ? "text-[#22d3ee]" : val < 0 ? "text-[#f43f5e]" : "text-muted-foreground/50"
                                      }`}
                                    >
                                      {val > 0 ? "+" : ""}{val}
                                    </span>
                                  </TableCell>
                                )
                              })}
                              <TableCell className="text-center">
                                <span
                                  className={`text-sm font-bold font-mono ${
                                    option.points_moyenne > 0 ? "text-[#22d3ee]" : option.points_moyenne < 0 ? "text-[#f43f5e]" : "text-muted-foreground/50"
                                  }`}
                                >
                                  {option.points_moyenne > 0 ? "+" : ""}{Number(option.points_moyenne).toFixed(1)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
    </div>
  )
}
