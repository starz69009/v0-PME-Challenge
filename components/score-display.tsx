"use client"

import { Card, CardContent } from "@/components/ui/card"
import { SCORE_FIELDS } from "@/lib/constants"
import type { TeamScore } from "@/lib/types"

interface ScoreDisplayProps {
  score: TeamScore | null
  compact?: boolean
}

export function ScoreDisplay({ score, compact = false }: ScoreDisplayProps) {
  const fields = SCORE_FIELDS

  if (!score) {
    return (
      <div className={`grid ${compact ? "grid-cols-3 gap-2" : "grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"}`}>
        {fields.map((f) => (
          <Card key={f.key} className="border-border/50">
            <CardContent className={compact ? "p-2" : "p-3"}>
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-lg font-bold text-foreground" style={{ color: f.color }}>0</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-border/50">
          <CardContent className={compact ? "p-2" : "p-3"}>
            <p className="text-xs text-muted-foreground">Moyenne</p>
            <p className="text-lg font-bold text-foreground">0.00</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`grid ${compact ? "grid-cols-3 gap-2" : "grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"}`}>
      {fields.map((f) => {
        const value = score[f.key as keyof TeamScore] as number
        return (
          <Card key={f.key} className="border-border/50">
            <CardContent className={compact ? "p-2" : "p-3"}>
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-lg font-bold" style={{ color: f.color }}>
                {value > 0 ? "+" : ""}{value}
              </p>
            </CardContent>
          </Card>
        )
      })}
      <Card className="border-border/50">
        <CardContent className={compact ? "p-2" : "p-3"}>
          <p className="text-xs text-muted-foreground">Moyenne</p>
          <p className="text-lg font-bold text-foreground">
            {Number(score.points_moyenne).toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
