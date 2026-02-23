"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trophy } from "lucide-react"
import { ScoreRadarChart } from "@/components/charts/score-radar-chart"
import { RankingBarChart } from "@/components/charts/ranking-bar-chart"
import { SCORE_FIELDS } from "@/lib/constants"
import type { Team, TeamScore } from "@/lib/types"

interface TeamScoreWithTeam extends TeamScore {
  teams: Team
}

const RANK_STYLES = [
  "bg-gradient-to-r from-[#f59e0b]/15 to-transparent border-l-2 border-l-[#f59e0b]",
  "bg-gradient-to-r from-[#94a3b8]/10 to-transparent border-l-2 border-l-[#94a3b8]",
  "bg-gradient-to-r from-[#b45309]/10 to-transparent border-l-2 border-l-[#b45309]",
]

const RANK_LABELS = ["1er", "2e", "3e"]

export function RankingsView({
  teamScores,
}: {
  teamScores: TeamScoreWithTeam[]
  teams: Team[]
  sessionName?: string
}) {
  const ranked = [...teamScores].sort(
    (a, b) => Number(b.points_moyenne) - Number(a.points_moyenne)
  )

  if (ranked.length === 0) {
    return (
      <Card className="border-dashed border-border/40 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center p-16 text-center">
          <div className="mb-4 rounded-2xl bg-muted/30 p-4">
            <Trophy className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Aucun score enregistre</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Les scores apparaitront ici une fois que les equipes auront pris des decisions.
          </p>
        </CardContent>
      </Card>
    )
  }

  const radarData = ranked.map((s) => ({
    teamName: s.teams?.name || "?",
    social: s.points_social,
    commercial: s.points_commercial,
    tresorerie: s.points_tresorerie,
    production: s.points_production,
    reglementaire: s.points_reglementaire,
  }))

  const barData = ranked.map((s) => ({
    name: s.teams?.name || "?",
    moyenne: Number(s.points_moyenne),
  }))

  return (
    <div className="space-y-6">
      {/* Podium Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {ranked.slice(0, 3).map((score, idx) => (
          <Card
            key={score.id}
            className={`relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm ${idx === 0 ? "glow-primary md:order-2 md:-mt-4" : idx === 1 ? "md:order-1" : "md:order-3"}`}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <CardContent className="p-5 text-center">
              <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${idx === 0 ? "bg-[#f59e0b]/20 text-[#f59e0b]" : idx === 1 ? "bg-[#94a3b8]/20 text-[#94a3b8]" : "bg-[#b45309]/20 text-[#b45309]"}`}>
                {RANK_LABELS[idx]}
              </div>
              <h3 className="text-base font-bold text-foreground">{score.teams?.name}</h3>
              <p className="mt-1 text-2xl font-bold text-primary">{Number(score.points_moyenne).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">points moyenne</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rankings Table */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Trophy className="h-5 w-5 text-primary" />
            Classement complet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead className="w-16 text-center text-muted-foreground">#</TableHead>
                <TableHead className="text-muted-foreground">Entreprise</TableHead>
                {SCORE_FIELDS.map((f) => (
                  <TableHead key={f.key} className="text-center text-xs text-muted-foreground">{f.label}</TableHead>
                ))}
                <TableHead className="text-center font-bold text-primary">Moyenne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((score, idx) => (
                <TableRow key={score.id} className={`border-border/20 ${idx < 3 ? RANK_STYLES[idx] : "hover:bg-muted/20"}`}>
                  <TableCell className="text-center">
                    {idx < 3 ? (
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${idx === 0 ? "bg-[#f59e0b]/20 text-[#f59e0b]" : idx === 1 ? "bg-[#94a3b8]/20 text-[#94a3b8]" : "bg-[#b45309]/20 text-[#b45309]"}`}>
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{idx + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{score.teams?.name}</TableCell>
                  {SCORE_FIELDS.map((f) => {
                    const val = score[f.key as keyof typeof score] as number
                    return (
                      <TableCell key={f.key} className="text-center">
                        <span className={`text-sm font-mono ${val > 0 ? "text-[#22d3ee]" : val < 0 ? "text-[#f43f5e]" : "text-muted-foreground"}`}>
                          {val > 0 ? "+" : ""}{val}
                        </span>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center">
                    <span className="text-sm font-bold text-primary">{Number(score.points_moyenne).toFixed(2)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Radar des competences</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadarChart data={radarData} />
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Classement par moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingBarChart data={barData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
