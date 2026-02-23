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
  data: { name: string; moyenne: number }[]
}

const COLORS = [
  "#22d3ee",
  "#84cc16",
  "#a78bfa",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
]

export function RankingBarChart({ data }: RankingBarChartProps) {
  const sorted = [...data].sort((a, b) => b.moyenne - a.moyenne)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#312e81" strokeOpacity={0.4} />
        <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#312e81" }} />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#c7d2fe", fontSize: 12, fontWeight: 500 }}
          width={120}
          axisLine={{ stroke: "#312e81" }}
        />
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
        <Bar dataKey="moyenne" radius={[0, 6, 6, 0]} barSize={28}>
          {sorted.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
