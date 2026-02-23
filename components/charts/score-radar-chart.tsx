"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"
import { CATEGORY_CONFIG } from "@/lib/constants"

interface ScoreRadarChartProps {
  scores: {
    social: number
    commercial: number
    tresorerie: number
    production: number
    reglementaire: number
  }
  size?: "sm" | "md" | "lg"
}

export function ScoreRadarChart({ scores, size = "md" }: ScoreRadarChartProps) {
  const data = [
    { category: "Social", value: scores.social, fullMark: 100 },
    { category: "Commercial", value: scores.commercial, fullMark: 100 },
    { category: "Tresorerie", value: scores.tresorerie, fullMark: 100 },
    { category: "Production", value: scores.production, fullMark: 100 },
    { category: "Reglement.", value: scores.reglementaire, fullMark: 100 },
  ]

  const heights = { sm: 200, md: 300, lg: 400 }

  return (
    <ResponsiveContainer width="100%" height={heights[size]}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="oklch(0.90 0.01 240)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[-50, 100]}
          tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 10 }}
        />
        <Radar
          name="Score"
          dataKey="value"
          stroke="oklch(0.35 0.08 255)"
          fill="oklch(0.50 0.15 255)"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]
  if (!config) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${config.color}20`, color: config.color }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  )
}
