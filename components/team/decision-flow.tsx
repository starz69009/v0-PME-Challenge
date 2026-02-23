"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/category-badge"
import { CheckCircle, Vote, ShieldCheck, Clock, User, ThumbsUp, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { SCORE_FIELDS, COMPANY_ROLE_LABELS, DECISION_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import type { CompanyRole, DecisionStatus, EventCategory } from "@/lib/types"

interface Props {
  sessionEvent: any
  decision: any
  votes: any[]
  currentUserId: string
  currentRole: CompanyRole
  teamId: string
  teamMembers: any[]
}

export function DecisionFlow({
  sessionEvent,
  decision: initialDecision,
  votes: initialVotes,
  currentUserId,
  currentRole,
  teamId,
  teamMembers,
}: Props) {
  const router = useRouter()
  const [decision, setDecision] = useState(initialDecision)
  const [votes, setVotes] = useState(initialVotes)
  const [loading, setLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)

  const event = sessionEvent.events
  const options = event?.event_options?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
  const status: DecisionStatus = decision?.status || "pending"
  const userVote = votes.find((v: any) => v.user_id === currentUserId)

  const categoryToRole: Record<string, CompanyRole> = {
    social: "rh",
    commercial: "commercial",
    tresorerie: "finance",
    production: "production",
    reglementaire: "dg",
  }
  const responsibleRole = categoryToRole[event.category || ""] || "dg"
  const isResponsible = currentRole === responsibleRole || currentRole === "dg"
  const isDG = currentRole === "dg"

  const refreshData = useCallback(async () => {
    const supabase = createClient()
    if (decision?.id) {
      const { data: updatedDecision } = await supabase
        .from("decisions")
        .select("*, event_options(*)")
        .eq("id", decision.id)
        .single()
      if (updatedDecision) setDecision(updatedDecision)

      const { data: updatedVotes } = await supabase
        .from("votes")
        .select("*, event_options(*), profiles(*)")
        .eq("decision_id", decision.id)
      if (updatedVotes) setVotes(updatedVotes)
    }
  }, [decision?.id])

  useEffect(() => {
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [refreshData])

  async function proposeOption(optionId: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("decisions")
      .update({
        proposed_option_id: optionId,
        proposed_by: currentUserId,
        status: "proposed",
      })
      .eq("id", decision.id)

    if (error) {
      toast.error("Erreur lors de la proposition")
    } else {
      toast.success("Option proposee avec succes")
      await supabase
        .from("decisions")
        .update({ status: "voting" })
        .eq("id", decision.id)
      await refreshData()
    }
    setLoading(false)
  }

  async function castVote(optionId: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from("votes").insert({
      decision_id: decision.id,
      user_id: currentUserId,
      option_id: optionId,
    })
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Vous avez deja vote" : "Erreur lors du vote")
    } else {
      toast.success("Vote enregistre")
      await refreshData()
    }
    setLoading(false)
  }

  async function validateDecision() {
    setLoading(true)
    const supabase = createClient()
    const voteCounts: Record<string, number> = {}
    votes.forEach((v: any) => {
      voteCounts[v.option_id] = (voteCounts[v.option_id] || 0) + 1
    })
    const winningOptionId = Object.entries(voteCounts).sort(([, a], [, b]) => b - a)[0]?.[0]
      || decision.proposed_option_id

    const { error } = await supabase
      .from("decisions")
      .update({
        status: "validated",
        proposed_option_id: winningOptionId,
        dg_validated: true,
        dg_validated_by: currentUserId,
        dg_validated_at: new Date().toISOString(),
      })
      .eq("id", decision.id)

    if (error) {
      toast.error("Erreur lors de la validation")
    } else {
      toast.success("Decision validee par le DG")
      await refreshData()
    }
    setLoading(false)
  }

  const steps = [
    { label: "Proposition", icon: User, done: status !== "pending", active: status === "pending" },
    { label: "Vote", icon: Vote, done: status === "validated" || status === "rejected", active: status === "voting" },
    { label: "Validation", icon: ShieldCheck, done: status === "validated", active: false },
  ]

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-xl font-bold">{event.title}</CardTitle>
              <CardDescription className="mt-2 leading-relaxed">{event.description}</CardDescription>
            </div>
            {event.category && <CategoryBadge category={event.category as EventCategory} />}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Steps - Gamified style */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center">
            {idx > 0 && (
              <div className={`h-0.5 w-10 sm:w-16 transition-colors ${step.done || step.active ? "bg-primary" : "bg-border/60"}`} />
            )}
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              step.done
                ? "bg-success/15 text-success"
                : step.active
                ? "bg-primary/15 text-primary glow-primary"
                : "bg-muted/50 text-muted-foreground"
            }`}>
              {step.done ? <CheckCircle className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-center">
        <Badge
          className={`px-4 py-1 text-xs font-semibold ${
            status === "validated"
              ? "bg-success/15 text-success border-success/30"
              : status === "voting"
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {DECISION_STATUS_LABELS[status]}
        </Badge>
      </div>

      {/* Decision validated result */}
      {status === "validated" && decision?.event_options && (
        <div className="gradient-border overflow-hidden rounded-xl">
          <div className="bg-card/80 p-6 text-center backdrop-blur-sm">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Decision validee</h3>
            <p className="mt-1 text-muted-foreground">
              Option choisie : <span className="font-semibold text-foreground">{decision.event_options.label}</span>
            </p>
          </div>
        </div>
      )}

      {/* Option Cards */}
      {status !== "validated" && (
        <div className="grid gap-4 md:grid-cols-3">
          {options.map((option: any) => {
            const isProposed = decision?.proposed_option_id === option.id
            const isSelected = selectedOption === option.id
            const voteCount = votes.filter((v: any) => v.option_id === option.id).length
            const hasVotedThis = userVote?.option_id === option.id

            return (
              <Card
                key={option.id}
                className={`cursor-pointer transition-all duration-200 ${
                  isProposed
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20 glow-primary"
                    : isSelected
                    ? "border-primary/40 bg-card ring-1 ring-primary/15"
                    : "border-border/40 bg-card/60 hover:border-primary/25 hover:bg-card/80"
                }`}
                onClick={() => {
                  if (status === "pending" && isResponsible) setSelectedOption(option.id)
                  if (status === "voting" && !userVote) setSelectedOption(option.id)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-bold">{option.label}</CardTitle>
                    {isProposed && (
                      <Badge className="bg-primary/15 text-primary text-[10px] font-semibold border-primary/30">Proposee</Badge>
                    )}
                  </div>
                  {option.description && (
                    <CardDescription className="text-xs">{option.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Impact Preview */}
                  <div className="mb-3 space-y-1.5 rounded-lg border border-border/30 bg-background/50 p-2.5">
                    {SCORE_FIELDS.map((f) => {
                      const val = option[f.key]
                      if (val === 0) return null
                      return (
                        <div key={f.key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{f.label}</span>
                          <span className={`flex items-center gap-1 font-mono font-semibold ${
                            val > 0 ? "text-success" : "text-destructive"
                          }`}>
                            {val > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {val > 0 ? "+" : ""}{val}
                          </span>
                        </div>
                      )
                    })}
                    {SCORE_FIELDS.every(f => option[f.key] === 0) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Minus className="h-3 w-3" />
                        Aucun impact
                      </div>
                    )}
                  </div>

                  {/* Vote count during voting */}
                  {status === "voting" && (
                    <div className="mb-2 overflow-hidden rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between px-3 py-2 text-xs">
                        <span className="font-medium text-muted-foreground">Votes</span>
                        <span className="font-bold text-foreground">{voteCount}</span>
                      </div>
                      {teamMembers.length > 0 && (
                        <div className="h-1 bg-muted/50">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(voteCount / teamMembers.length) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {hasVotedThis && (
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <ThumbsUp className="h-3 w-3" />
                      Votre vote
                    </div>
                  )}

                  {/* Action buttons */}
                  {status === "pending" && isResponsible && isSelected && (
                    <Button
                      size="sm"
                      className="mt-2 w-full glow-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        proposeOption(option.id)
                      }}
                      disabled={loading}
                    >
                      Proposer cette option
                    </Button>
                  )}
                  {status === "voting" && !userVote && isSelected && (
                    <Button
                      size="sm"
                      className="mt-2 w-full glow-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        castVote(option.id)
                      }}
                      disabled={loading}
                    >
                      Voter pour cette option
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pending message for non-responsible */}
      {status === "pending" && !isResponsible && (
        <Card className="border-dashed border-border/40 bg-card/40">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
              <Clock className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              En attente de la proposition du <span className="font-semibold text-foreground">{COMPANY_ROLE_LABELS[responsibleRole]}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* DG Validation */}
      {status === "voting" && isDG && votes.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm font-bold text-foreground">Validation du Directeur General</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {votes.length} vote(s) sur {teamMembers.length} membres
              </p>
            </div>
            <Button onClick={validateDecision} disabled={loading} className="glow-primary">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Valider la decision
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vote List */}
      {(status === "voting" || status === "validated") && votes.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold">Votes de l{"'"}equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {votes.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-background/50 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                      {v.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-sm font-medium text-foreground">{v.profiles?.display_name || "-"}</span>
                  </div>
                  <Badge variant="outline" className="border-border/60 text-[10px] font-medium">
                    {v.event_options?.label || "-"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
