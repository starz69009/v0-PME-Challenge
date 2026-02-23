"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface RankingBarChartProps {
  data: { name: string; score: number }[]
}

const COLORS = [
  "oklch(0.75 0.15 85)",
  "oklch(0.50 0.15 255)",
  "oklch(0.60 0.15 175)",
  "oklch(0.55 0.20 25)",
  "oklch(0.65 0.12 320)",
  "oklch(0.70 0.10 140)",
]

export function RankingBarChart({ data }: RankingBarChartProps) {
  const sorted = [...data].sort((a, b) => b.score - a.score)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 240)" />
        <XAxis type="number" tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 12 }} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "oklch(0.50 0.02 255)", fontSize: 12 }}
          width={120}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(1 0 0)",
            border: "1px solid oklch(0.90 0.01 240)",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        />
        <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={28}>
          {sorted.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
