"use client"

import { SCORE_FIELDS } from "@/lib/constants"
import type { TeamScore } from "@/lib/types"

interface ScoreDisplayProps {
  score: TeamScore | null
  compact?: boolean
}

export function ScoreDisplay({ score, compact = false }: ScoreDisplayProps) {
  const fields = SCORE_FIELDS

  const moyenne = score ? Number(score.points_moyenne).toFixed(2) : "0.00"

  return (
    <div className={`grid ${compact ? "grid-cols-3 gap-2" : "grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"}`}>
      {fields.map((f) => {
        const value = score ? (score[f.key as keyof TeamScore] as number) : 0
        return (
          <div
            key={f.key}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-border"
          >
            <div className={compact ? "p-2.5" : "p-3.5"}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: f.color }} />
                <p className="text-xs font-medium text-muted-foreground">{f.label}</p>
              </div>
              <p className="text-xl font-bold tracking-tight" style={{ color: f.color }}>
                {value > 0 ? "+" : ""}{value}
              </p>
            </div>
            {/* Glow line at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40"
              style={{ backgroundColor: f.color }}
            />
          </div>
        )
      })}
      {/* Moyenne card - special styling */}
      <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm">
        <div className={compact ? "p-2.5" : "p-3.5"}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Moyenne</p>
          <p className="text-xl font-bold tracking-tight text-primary">
            {moyenne}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary opacity-50" />
      </div>
    </div>
  )
}
