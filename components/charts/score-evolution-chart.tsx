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

const LINE_COLORS: Record<string, string> = {
  social: "#22d3ee",
  commercial: "#84cc16",
  tresorerie: "#f59e0b",
  production: "#a78bfa",
  reglementaire: "#f43f5e",
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
        <CartesianGrid strokeDasharray="3 3" stroke="#312e81" strokeOpacity={0.4} />
        <XAxis dataKey="event" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#312e81" }} />
        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={{ stroke: "#312e81" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1e1b4b",
            border: "1px solid #312e81",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#e2e8f0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
          labelStyle={{ color: "#c7d2fe", fontWeight: 600 }}
        />
        <Legend
          formatter={(value: string) => LABELS[value] || value}
          wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
        />
        {Object.entries(LINE_COLORS).map(([key, color]) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={color}
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#1e1b4b", stroke: color, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
