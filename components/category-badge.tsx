"use client"

import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/constants"
import type { EventCategory } from "@/lib/types"

export function CategoryBadge({ category }: { category: EventCategory }) {
  const color = CATEGORY_COLORS[category]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase"
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}35`,
        textShadow: `0 0 12px ${color}40`,
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}
