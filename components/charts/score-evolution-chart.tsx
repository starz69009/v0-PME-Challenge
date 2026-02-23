"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface ScoreEvolutionChartProps {
  data: { event: string; social: number; commercial: number; tresorerie: number; production: number; reglementaire: number }[]
}

const LINE_COLORS = {
  social: "oklch(0.50 0.15 255)",
  commercial: "oklch(0.60 0.15 175)",
  tresorerie: "oklch(0.75 0.15 85)",
  production: "oklch(0.55 0.20 25)",
  reglementaire: "oklch(0.65 0.12 320)",
}

const LABELS: Record<string, string> = {
  social: "Social",
  commercial: "Commercial",
  tresorerie: "Tresorerie",
  production: "Production",
  reglementaire: "Reglementaire",
}

export function ScoreEvolutionChart({ data }: ScoreEvolutionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 240)" />
        <XAxis dataKey="event" tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 11 }} />
        <YAxis tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(1 0 0)",
            border: "1px solid oklch(0.90 0.01 240)",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        />
        <Legend formatter={(value: string) => LABELS[value] || value} />
        {Object.entries(LINE_COLORS).map(([key, color]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
