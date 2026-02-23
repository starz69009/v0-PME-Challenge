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
            <Card className="overflow-hidden">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <Badge variant="outline" className="font-mono text-xs">
                      {event.sort_order}
                    </Badge>
                    <CardTitle className="flex-1 text-base">{event.title}</CardTitle>
                    {event.category && <CategoryBadge category={event.category as EventCategory} />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{event.description}</p>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Option</TableHead>
                        {SCORE_FIELDS.map((f) => (
                          <TableHead key={f.key} className="text-center text-xs">
                            {f.label}
                          </TableHead>
                        ))}
                        <TableHead className="text-center text-xs font-bold">Moy.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {event.event_options
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((option) => (
                          <TableRow key={option.id}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium text-foreground">{option.label}</p>
                                {option.description && (
                                  <p className="text-xs text-muted-foreground">{option.description}</p>
                                )}
                              </div>
                            </TableCell>
                            {SCORE_FIELDS.map((f) => {
                              const val = option[f.key as keyof typeof option] as number
                              return (
                                <TableCell key={f.key} className="text-center">
                                  <span
                                    className={`text-sm font-mono ${
                                      val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground"
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
                                  option.points_moyenne > 0 ? "text-success" : option.points_moyenne < 0 ? "text-destructive" : "text-muted-foreground"
                                }`}
                              >
                                {option.points_moyenne > 0 ? "+" : ""}{Number(option.points_moyenne).toFixed(2)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )
      })}
    </div>
  )
}
