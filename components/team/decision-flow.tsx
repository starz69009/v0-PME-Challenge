"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/category-badge"
import { CheckCircle, Vote, ShieldCheck, Clock, User, ThumbsUp } from "lucide-react"
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

  // Determine the category responsible role
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

  // Poll for updates
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

  // Step 1: Responsible proposes an option
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
      // Move directly to voting
      await supabase
        .from("decisions")
        .update({ status: "voting" })
        .eq("id", decision.id)
      await refreshData()
    }
    setLoading(false)
  }

  // Step 2: Team votes
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

  // Step 3: DG validates
  async function validateDecision() {
    setLoading(true)
    const supabase = createClient()

    // Find most voted option
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

  // Current step indicator
  const steps = [
    { label: "Proposition", icon: User, done: status !== "pending" },
    { label: "Vote", icon: Vote, done: status === "validated" || status === "rejected", active: status === "voting" },
    { label: "Validation DG", icon: ShieldCheck, done: status === "validated", active: false },
  ]

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">{event.title}</CardTitle>
              <CardDescription className="mt-1 leading-relaxed">{event.description}</CardDescription>
            </div>
            {event.category && <CategoryBadge category={event.category as EventCategory} />}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center gap-2">
            {idx > 0 && <div className={`h-0.5 w-8 ${step.done || step.active ? "bg-primary" : "bg-border"}`} />}
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              step.done
                ? "bg-success/10 text-success"
                : step.active
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
              {step.label}
            </div>
          </div>
        ))}
      </div>

      {/* Status Badge */}
      <div className="text-center">
        <Badge variant={status === "validated" ? "default" : "outline"} className={status === "validated" ? "bg-success text-success-foreground" : ""}>
          {DECISION_STATUS_LABELS[status]}
        </Badge>
      </div>

      {/* Decision validated result */}
      {status === "validated" && decision?.event_options && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-10 w-10 text-success" />
            <h3 className="text-lg font-semibold text-foreground">Decision validee</h3>
            <p className="mt-1 text-muted-foreground">
              Option choisie : <span className="font-medium text-foreground">{decision.event_options.label}</span>
            </p>
          </CardContent>
        </Card>
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
                className={`cursor-pointer transition-all ${
                  isProposed
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
                    : isSelected
                    ? "border-primary/30 ring-1 ring-primary/10"
                    : "border-border hover:border-primary/20"
                }`}
                onClick={() => {
                  if (status === "pending" && isResponsible) setSelectedOption(option.id)
                  if (status === "voting" && !userVote) setSelectedOption(option.id)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{option.label}</CardTitle>
                    {isProposed && <Badge className="bg-primary text-primary-foreground text-[10px]">Proposee</Badge>}
                  </div>
                  {option.description && (
                    <CardDescription className="text-xs">{option.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Impact Preview */}
                  <div className="mb-3 space-y-1">
                    {SCORE_FIELDS.map((f) => {
                      const val = option[f.key]
                      if (val === 0) return null
                      return (
                        <div key={f.key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{f.label}</span>
                          <span className={`font-mono font-medium ${val > 0 ? "text-success" : "text-destructive"}`}>
                            {val > 0 ? "+" : ""}{val}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Vote count during voting */}
                  {status === "voting" && (
                    <div className="flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                      <span className="text-muted-foreground">Votes</span>
                      <span className="font-medium text-foreground">{voteCount}</span>
                    </div>
                  )}

                  {/* Vote check */}
                  {hasVotedThis && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <ThumbsUp className="h-3 w-3" />
                      Votre vote
                    </div>
                  )}

                  {/* Action buttons */}
                  {status === "pending" && isResponsible && isSelected && (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
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
                      className="mt-3 w-full"
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
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              En attente de la proposition du {COMPANY_ROLE_LABELS[responsibleRole]}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* DG Validation */}
      {status === "voting" && isDG && votes.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Validation du Directeur General</p>
              <p className="text-xs text-muted-foreground">{votes.length} vote(s) enregistre(s) sur {teamMembers.length} membres</p>
            </div>
            <Button onClick={validateDecision} disabled={loading}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Valider la decision
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vote List */}
      {(status === "voting" || status === "validated") && votes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Votes de l{"'"}equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {votes.map((v: any) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border border-border p-2 text-xs">
                  <span className="font-medium text-foreground">{v.profiles?.display_name || "—"}</span>
                  <Badge variant="outline" className="text-[10px]">{v.event_options?.label || "—"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
