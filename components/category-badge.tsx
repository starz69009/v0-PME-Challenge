"use client"

import { Badge } from "@/components/ui/badge"
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/constants"
import type { EventCategory } from "@/lib/types"

export function CategoryBadge({ category }: { category: EventCategory }) {
  const color = CATEGORY_COLORS[category]
  return (
    <Badge
      variant="outline"
      className="font-medium border-current"
      style={{ color, borderColor: color, backgroundColor: `${color}15` }}
    >
      {CATEGORY_LABELS[category]}
    </Badge>
  )
}
