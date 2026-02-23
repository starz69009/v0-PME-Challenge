"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CategoryBadge } from "@/components/category-badge"
import type { GameEvent, EventCategory } from "@/lib/types"

interface EventCardProps {
  event: GameEvent
  compact?: boolean
  children?: React.ReactNode
}

export function EventCard({ event, compact = false, children }: EventCardProps) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className={compact ? "p-4 pb-2" : "pb-3"}>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className={compact ? "text-base" : "text-lg"}>
            {event.title}
          </CardTitle>
          {event.category && (
            <CategoryBadge category={event.category as EventCategory} />
          )}
        </div>
        <CardDescription className="leading-relaxed">
          {event.description}
        </CardDescription>
      </CardHeader>
      {children && (
        <CardContent className={compact ? "p-4 pt-0" : undefined}>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
