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
  "#22d3ee",
  "#84cc16",
  "#a78bfa",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
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
          <PolarGrid stroke="#312e81" strokeOpacity={0.6} />
          <PolarAngleAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} />
          <PolarRadiusAxis angle={90} domain={[-50, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
          {props.data.map((team, idx) => (
            <Radar
              key={team.teamName}
              name={team.teamName}
              dataKey={team.teamName}
              stroke={TEAM_COLORS[idx % TEAM_COLORS.length]}
              fill={TEAM_COLORS[idx % TEAM_COLORS.length]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    )
  }

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
        <PolarGrid stroke="#312e81" strokeOpacity={0.6} />
        <PolarAngleAxis dataKey="category" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} />
        <PolarRadiusAxis angle={90} domain={[-50, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#22d3ee"
          fill="#22d3ee"
          fillOpacity={0.2}
          strokeWidth={2.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}
