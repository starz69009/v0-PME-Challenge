"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts"

const TEAM_COLORS = [
  "oklch(0.50 0.15 255)",
  "oklch(0.60 0.15 175)",
  "oklch(0.75 0.15 85)",
  "oklch(0.55 0.20 25)",
  "oklch(0.65 0.12 320)",
  "oklch(0.70 0.10 140)",
]

interface SingleScoreData {
  social: number
  commercial: number
  tresorerie: number
  production: number
  reglementaire: number
}

interface MultiTeamData {
  teamName: string
  social: number
  commercial: number
  tresorerie: number
  production: number
  reglementaire: number
}

type ScoreRadarChartProps =
  | { scores: SingleScoreData; data?: never; size?: "sm" | "md" | "lg" }
  | { data: MultiTeamData[]; scores?: never; size?: "sm" | "md" | "lg" }

export function ScoreRadarChart(props: ScoreRadarChartProps) {
  const { size = "md" } = props
  const heights = { sm: 200, md: 300, lg: 400 }

  // Multi-team radar
  if (props.data) {
    const categories = ["Social", "Commercial", "Tresorerie", "Production", "Reglement."]
    const keys = ["social", "commercial", "tresorerie", "production", "reglementaire"] as const
    const chartData = categories.map((cat, i) => {
      const point: Record<string, string | number> = { category: cat }
      props.data.forEach((team) => {
        point[team.teamName] = team[keys[i]]
      })
      return point
    })

    return (
      <ResponsiveContainer width="100%" height={heights[size]}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="oklch(0.90 0.01 240)" />
          <PolarAngleAxis dataKey="category" tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={[-50, 100]} tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 10 }} />
          {props.data.map((team, idx) => (
            <Radar
              key={team.teamName}
              name={team.teamName}
              dataKey={team.teamName}
              stroke={TEAM_COLORS[idx % TEAM_COLORS.length]}
              fill={TEAM_COLORS[idx % TEAM_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    )
  }

  // Single team radar
  const { scores } = props
  const data = [
    { category: "Social", value: scores.social, fullMark: 100 },
    { category: "Commercial", value: scores.commercial, fullMark: 100 },
    { category: "Tresorerie", value: scores.tresorerie, fullMark: 100 },
    { category: "Production", value: scores.production, fullMark: 100 },
    { category: "Reglement.", value: scores.reglementaire, fullMark: 100 },
  ]

  return (
    <ResponsiveContainer width="100%" height={heights[size]}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="oklch(0.90 0.01 240)" />
        <PolarAngleAxis dataKey="category" tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 12 }} />
        <PolarRadiusAxis angle={90} domain={[-50, 100]} tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 10 }} />
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
