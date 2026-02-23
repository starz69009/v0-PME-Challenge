"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import { ScoreRadarChart } from "@/components/charts/score-radar-chart"
import { RankingBarChart } from "@/components/charts/ranking-bar-chart"
import { SCORE_FIELDS } from "@/lib/constants"
import type { Team, TeamScore } from "@/lib/types"

interface TeamScoreWithTeam extends TeamScore {
  teams: Team
}

export function RankingsView({
  teamScores,
  teams,
  sessionName,
}: {
  teamScores: TeamScoreWithTeam[]
  teams: Team[]
  sessionName?: string
}) {
  // Sort by moyenne descending
  const ranked = [...teamScores].sort(
    (a, b) => Number(b.points_moyenne) - Number(a.points_moyenne)
  )

  if (ranked.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold text-foreground">Aucun score enregistre</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Les scores apparaitront ici une fois que les equipes auront pris des decisions.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const radarData = ranked.map((s) => ({
    teamName: s.teams?.name || "?",
    social: s.points_social,
    commercial: s.points_commercial,
    tresorerie: s.points_tresorerie,
    production: s.points_production,
    reglementaire: s.points_reglementaire,
  }))

  const barData = ranked.map((s, idx) => ({
    name: s.teams?.name || "?",
    moyenne: Number(s.points_moyenne),
    rank: idx + 1,
  }))

  return (
    <div className="space-y-6">
      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Classement general
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead>Entreprise</TableHead>
                {SCORE_FIELDS.map((f) => (
                  <TableHead key={f.key} className="text-center text-xs">{f.label}</TableHead>
                ))}
                <TableHead className="text-center font-bold">Moyenne</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((score, idx) => (
                <TableRow key={score.id} className={idx === 0 ? "bg-primary/5" : ""}>
                  <TableCell className="text-center">
                    {idx === 0 ? (
                      <Badge className="bg-warning text-warning-foreground">1er</Badge>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{idx + 1}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{score.teams?.name}</TableCell>
                  {SCORE_FIELDS.map((f) => {
                    const val = score[f.key as keyof typeof score] as number
                    return (
                      <TableCell key={f.key} className="text-center">
                        <span className={`text-sm font-mono ${val > 0 ? "text-success" : val < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                          {val > 0 ? "+" : ""}{val}
                        </span>
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center">
                    <span className="text-sm font-bold">{Number(score.points_moyenne).toFixed(2)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Radar des competences</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreRadarChart data={radarData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classement par moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingBarChart data={barData} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
