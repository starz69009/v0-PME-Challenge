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
    <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <CardHeader className={compact ? "p-4 pb-2" : "pb-3"}>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className={`${compact ? "text-base" : "text-lg"} text-foreground`}>
            {event.title}
          </CardTitle>
          {event.category && (
            <CategoryBadge category={event.category as EventCategory} />
          )}
        </div>
        <CardDescription className="leading-relaxed text-muted-foreground/80">
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
