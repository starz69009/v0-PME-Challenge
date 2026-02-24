"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryBadge } from "@/components/category-badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, ShieldCheck, Clock, User, ThumbsUp, ThumbsDown, Timer, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"
import { COMPANY_ROLE_LABELS, DECISION_STATUS_LABELS, CATEGORY_SPECIALIST_ROLE } from "@/lib/constants"
import { proposeOptionAction, castVoteAction, validateDecisionAction } from "@/app/equipe/evenement/actions"
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
  expiresAt: string | null
  durationSeconds: number | null
}

function CountdownTimer({ expiresAt, onExpire, durationSeconds }: { expiresAt: string; onExpire: () => void; durationSeconds: number | null }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    if (timeLeft <= 0) { onExpire(); return }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) { onExpire(); clearInterval(interval) }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt, onExpire, timeLeft])

  const days = Math.floor(timeLeft / 86400)
  const hours = Math.floor((timeLeft % 86400) / 3600)
  const mins = Math.floor((timeLeft % 3600) / 60)
  const secs = timeLeft % 60
  const urgentThreshold = Math.max(30, Math.floor((durationSeconds || 300) * 0.10))
  const criticalThreshold = Math.max(10, Math.floor((durationSeconds || 300) * 0.03))
  const isUrgent = timeLeft <= urgentThreshold
  const isCritical = timeLeft <= criticalThreshold

  function formatCountdown() {
    if (days > 0) return `${days}j ${hours}h ${mins}min`
    if (hours > 0) return `${hours}h ${mins.toString().padStart(2, "0")}min ${secs.toString().padStart(2, "0")}s`
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-5 py-3 font-mono transition-all ${
      isCritical ? "border-destructive/50 bg-destructive/10 animate-pulse"
        : isUrgent ? "border-warning/50 bg-warning/10"
        : "border-primary/30 bg-primary/5"
    }`}>
      <Timer className={`h-5 w-5 ${isCritical ? "text-destructive" : isUrgent ? "text-warning" : "text-primary"}`} />
      <span className={`text-2xl font-bold tabular-nums ${isCritical ? "text-destructive" : isUrgent ? "text-warning" : "text-primary"}`}>
        {formatCountdown()}
      </span>
      {isUrgent && !isCritical && <span className="text-xs font-semibold text-warning">Depechez-vous !</span>}
      {isCritical && <span className="text-xs font-semibold text-destructive">Temps presque ecoule</span>}
    </div>
  )
}

export function DecisionFlow({
  sessionEvent,
  decision: initialDecision,
  votes: initialVotes,
  currentUserId,
  currentRole,
  teamId,
  teamMembers,
  expiresAt,
  durationSeconds,
}: Props) {
  const router = useRouter()
  const [decision, setDecision] = useState(initialDecision)
  const [votes, setVotes] = useState(initialVotes)
  const [loading, setLoading] = useState(false)

  console.log("[v0] DecisionFlow render - initialDecision:", initialDecision?.id || "NULL", "initialDecision status:", initialDecision?.status, "decision state:", decision?.id || "NULL", "decision status:", decision?.status, "currentRole:", currentRole, "teamId:", teamId)

  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [proposalSubmitted, setProposalSubmitted] = useState(false)
  // Specialist argumentaire (step 1)
  const [specAvantages, setSpecAvantages] = useState(initialDecision?.comment_avantages || "")
  const [specInconvenients, setSpecInconvenients] = useState(initialDecision?.comment_inconvenients || "")
  const [specJustification, setSpecJustification] = useState(initialDecision?.comment_justification || "")
  // Voter comment (step 2)
  const [voteComment, setVoteComment] = useState("")
  const [voteApproved, setVoteApproved] = useState<boolean | null>(null)
  // DG comment (step 3)
  const [dgComment, setDgComment] = useState("")
  const [dgOverride, setDgOverride] = useState(false)
  const [dgOverrideOption, setDgOverrideOption] = useState<string | null>(null)
  const [showVoteDetails, setShowVoteDetails] = useState(false)

  const [expired, setExpired] = useState(() => {
    if (!expiresAt) return false
    return new Date(expiresAt).getTime() <= Date.now()
  })

  const event = sessionEvent.events
  const options = event?.event_options?.sort((a: any, b: any) => a.sort_order - b.sort_order) || []
  const status: DecisionStatus = decision?.status || "pending"
  const userVote = votes.find((v: any) => v.user_id === currentUserId)

  const specialistRole = CATEGORY_SPECIALIST_ROLE[(event.category || "") as EventCategory] || "dg"
  const isSpecialist = currentRole === specialistRole
  const isDG = currentRole === "dg"
  const isLocked = expired && status !== "validated"

  // Get team member info by user_id
  const getMemberInfo = (userId: string) => {
    const member = teamMembers.find((m: any) => m.user_id === userId)
    return {
      name: member?.profiles?.display_name || member?.profiles?.email || "Joueur",
      role: member?.role_in_company as CompanyRole | undefined,
    }
  }

  // Count approvals/rejections
  const approvals = votes.filter((v: any) => v.approved === true).length
  const rejections = votes.filter((v: any) => v.approved === false).length
  const nonDGNonSpecMembers = teamMembers.filter((m: any) => m.role_in_company !== "dg" && m.role_in_company !== specialistRole)
  const allVotersVoted = nonDGNonSpecMembers.length > 0
    ? nonDGNonSpecMembers.every((m: any) => votes.some((v: any) => v.user_id === m.user_id))
    : votes.length > 0

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
    } else {
      // Decision doesn't exist yet -- poll for it (admin may have just triggered the event)
      const { data: foundDecision } = await supabase
        .from("decisions")
        .select("*, event_options(*)")
        .eq("session_event_id", sessionEvent.id)
        .eq("team_id", teamId)
        .single()
      if (foundDecision) {
        setDecision(foundDecision)
      }
    }
  }, [decision?.id, sessionEvent.id, teamId])

  useEffect(() => {
    const interval = setInterval(refreshData, 5000)
    return () => clearInterval(interval)
  }, [refreshData])

  // STEP 1: Specialist proposes an option with argumentaire (via Server Action)
  async function proposeOption(optionId: string) {
    if (isLocked) { toast.error("Le temps est ecoule"); return }
    if (!decision?.id) { toast.error("Decision non trouvee. Veuillez rafraichir la page."); return }
    if (!specAvantages.trim() || !specInconvenients.trim() || !specJustification.trim()) {
      toast.error("Veuillez remplir les 3 champs d'argumentaire avant de proposer")
      return
    }
    setLoading(true)
    setProposalSubmitted(true)
    const result = await proposeOptionAction(decision.id, optionId, specAvantages, specInconvenients, specJustification)
    if (result.error) {
      toast.error("Erreur: " + result.error)
      setProposalSubmitted(false)
    } else {
      toast.success("Option proposee. Les autres membres peuvent maintenant voter.")
      await refreshData()
    }
    setLoading(false)
  }

  // STEP 2: Other members approve/reject with role-specific comment (via Server Action)
  async function castVote() {
    if (isLocked) { toast.error("Le temps est ecoule"); return }
    if (!decision?.id) { toast.error("Decision non trouvee. Veuillez rafraichir la page."); return }
    if (voteApproved === null) { toast.error("Veuillez approuver ou rejeter la proposition"); return }
    if (!voteComment.trim()) { toast.error("Veuillez rediger un commentaire lie a votre role"); return }
    setLoading(true)
    const result = await castVoteAction(decision.id, decision.proposed_option_id, voteApproved, voteComment)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(voteApproved ? "Approbation enregistree" : "Opposition enregistree")
      await refreshData()
    }
    setLoading(false)
  }

  // STEP 3: DG validates (collegial) or overrides (unilateral) (via Server Action)
  async function dgValidate() {
    if (isLocked) { toast.error("Le temps est ecoule"); return }
    if (!decision?.id) { toast.error("Decision non trouvee. Veuillez rafraichir la page."); return }
    if (!dgComment.trim()) { toast.error("Veuillez argumenter votre decision"); return }
    setLoading(true)
    const overrideId = dgOverride && dgOverrideOption ? dgOverrideOption : null
    const result = await validateDecisionAction(decision.id, dgComment, overrideId)
    if (result.error) {
      toast.error("Erreur: " + result.error)
    } else {
      toast.success(dgOverride ? "Decision unilaterale enregistree" : "Decision collegiale validee")
      await refreshData()
    }
    setLoading(false)
  }

  const steps = [
    { label: "Proposition specialiste", icon: User, done: status !== "pending", active: status === "pending" },
    { label: "Votes equipe", icon: ThumbsUp, done: status === "validated" || allVotersVoted, active: status === "voting" && !allVotersVoted },
    { label: "Decision DG", icon: ShieldCheck, done: status === "validated", active: status === "voting" && allVotersVoted },
  ]

  const proposedOption = options.find((o: any) => o.id === decision?.proposed_option_id)

  return (
    <div className="space-y-6">
      {/* Countdown Timer */}
      {expiresAt && !expired && status !== "validated" && (
        <div className="flex justify-center">
          <CountdownTimer expiresAt={expiresAt} onExpire={() => setExpired(true)} durationSeconds={durationSeconds} />
        </div>
      )}

      {/* Expired Banner */}
      {isLocked && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-destructive">Temps ecoule</p>
              <p className="text-xs text-muted-foreground">{"Le delai de reaction est termine. L'administrateur va appliquer les scores."}</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Decision loading - waiting for admin to create decisions */}
      {!decision && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 animate-pulse">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Chargement de la decision en cours...</p>
              <p className="mt-1 text-xs text-muted-foreground">{"La decision de votre equipe est en cours de preparation. Veuillez patienter."}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!decision ? null : (<>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center">
            {idx > 0 && (
              <div className={`h-0.5 w-8 sm:w-12 transition-colors ${step.done || step.active ? "bg-primary" : "bg-border/60"}`} />
            )}
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] sm:text-xs font-semibold transition-all ${
              step.done ? "bg-success/15 text-success"
                : step.active ? "bg-primary/15 text-primary glow-primary"
                : "bg-muted/50 text-muted-foreground"
            }`}>
              {step.done ? <CheckCircle className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status Badge */}
      <div className="text-center">
        <Badge className={`px-4 py-1 text-xs font-semibold ${
          status === "validated" ? "bg-success/15 text-success border-success/30"
            : isLocked ? "bg-destructive/15 text-destructive border-destructive/30"
            : status === "voting" ? "bg-primary/15 text-primary border-primary/30"
            : "bg-muted text-muted-foreground"
        }`}>
          {isLocked ? "Temps ecoule" : DECISION_STATUS_LABELS[status]}
        </Badge>
      </div>

      {/* ===== VALIDATED RESULT ===== */}
      {status === "validated" && (
        <div className="gradient-border overflow-hidden rounded-xl">
          <div className="bg-card/80 p-6 text-center backdrop-blur-sm space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15">
              <CheckCircle className="h-7 w-7 text-success" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Decision validee</h3>
            <p className="text-muted-foreground">
              Option retenue : <span className="font-semibold text-foreground">{decision?.event_options?.label || proposedOption?.label}</span>
            </p>
            {decision?.dg_override_option_id && (
              <Badge variant="outline" className="border-warning/40 text-warning text-xs">Decision unilaterale du DG</Badge>
            )}
            {decision?.dg_comment && (
              <div className="mx-auto max-w-md rounded-lg bg-muted/20 p-3 text-left">
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Commentaire du DG</p>
                <p className="text-xs text-muted-foreground">{decision.dg_comment}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STEP 1: SPECIALIST PROPOSES ===== */}
      {status === "pending" && (
        <>
          {isSpecialist && !proposalSubmitted ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  {"C'est a vous de proposer une solution"}
                </CardTitle>
                <CardDescription className="text-xs">
                  En tant que <span className="font-semibold text-foreground">{COMPANY_ROLE_LABELS[specialistRole]}</span>, vous etes le specialiste de cet evenement. Selectionnez une option et argumentez votre choix. <span className="font-semibold text-foreground">Attention, votre choix sera definitif.</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Option selection */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {options.map((option: any) => (
                    <div
                      key={option.id}
                      onClick={() => !isLocked && !loading && setSelectedOption(option.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-all ${
                        selectedOption === option.id
                          ? "border-primary/50 bg-primary/10 ring-2 ring-primary/20"
                          : "border-border/40 bg-card/60 hover:border-primary/25"
                      }`}
                    >
                      <p className="text-sm font-bold">{option.label}</p>
                      {option.description && <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>}
                    </div>
                  ))}
                </div>

                {/* Argumentaire fields */}
                {selectedOption && (
                  <div className="space-y-3 rounded-lg border border-border/30 bg-muted/10 p-4">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Argumentaire obligatoire</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-success">Avantages de ce choix</Label>
                      <Textarea
                        placeholder="Quels sont les points positifs de cette decision ?"
                        value={specAvantages}
                        onChange={(e) => setSpecAvantages(e.target.value)}
                        rows={2}
                        className="bg-secondary/50 border-border/40 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-destructive">Inconvenients de ce choix</Label>
                      <Textarea
                        placeholder="Quels risques ou points negatifs voyez-vous ?"
                        value={specInconvenients}
                        onChange={(e) => setSpecInconvenients(e.target.value)}
                        rows={2}
                        className="bg-secondary/50 border-border/40 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-primary">{"Qu'est-ce qui justifie finalement cette decision ?"}</Label>
                      <Textarea
                        placeholder="Expliquez pourquoi cette option est la meilleure pour l'entreprise..."
                        value={specJustification}
                        onChange={(e) => setSpecJustification(e.target.value)}
                        rows={2}
                        className="bg-secondary/50 border-border/40 text-sm"
                      />
                    </div>
                    <Button
                      className="w-full glow-primary"
                      onClick={() => proposeOption(selectedOption)}
                      disabled={loading || isLocked}
                    >
                      Proposer cette option
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : isSpecialist && proposalSubmitted ? (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Proposition envoyee</p>
                  <p className="text-xs text-muted-foreground">{"Votre choix est definitif. L'equipe va maintenant voter sur votre proposition."}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-border/40 bg-card/40">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Clock className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  En attente de la proposition du <span className="font-semibold text-foreground">{COMPANY_ROLE_LABELS[specialistRole]}</span>
                </p>
                <p className="text-xs text-muted-foreground/60">Le specialiste analyse les options et redige son argumentaire...</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ===== STEP 2: VOTING PHASE ===== */}
      {status === "voting" && (
        <>
          {/* Show the specialist proposal */}
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Proposition du {COMPANY_ROLE_LABELS[specialistRole]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposedOption && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="text-sm font-bold text-foreground">{proposedOption.label}</p>
                  {proposedOption.description && <p className="mt-1 text-xs text-muted-foreground">{proposedOption.description}</p>}
                </div>
              )}
              {/* Show specialist argumentaire */}
              {(decision?.comment_avantages || decision?.comment_inconvenients || decision?.comment_justification) && (
                <div className="space-y-2 rounded-lg border border-border/30 bg-muted/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Argumentaire du specialiste</p>
                  {decision.comment_avantages && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-success">Avantages</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{decision.comment_avantages}</p>
                    </div>
                  )}
                  {decision.comment_inconvenients && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-destructive">Inconvenients</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{decision.comment_inconvenients}</p>
                    </div>
                  )}
                  {decision.comment_justification && (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold text-primary">Justification</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{decision.comment_justification}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vote status summary */}
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Votes de l{"'"}equipe</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-success border-success/30 text-[10px]">{approvals} pour</Badge>
                  <Badge variant="outline" className="text-destructive border-destructive/30 text-[10px]">{rejections} contre</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{votes.length} vote(s)</span>
                  <span>{nonDGNonSpecMembers.length} votant(s) attendu(s)</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${nonDGNonSpecMembers.length > 0 ? (votes.length / nonDGNonSpecMembers.length) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Toggle vote details */}
              {votes.length > 0 && (
                <button
                  onClick={() => setShowVoteDetails(!showVoteDetails)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showVoteDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {showVoteDetails ? "Masquer les details" : "Voir les details des votes"}
                </button>
              )}

              {showVoteDetails && votes.map((v: any) => {
                const info = getMemberInfo(v.user_id)
                return (
                  <div key={v.id} className="rounded-lg border border-border/20 bg-muted/10 p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{info.name}</span>
                        {info.role && <Badge variant="outline" className="text-[9px] border-border/30">{COMPANY_ROLE_LABELS[info.role]}</Badge>}
                      </div>
                      {v.approved === true
                        ? <Badge className="bg-success/15 text-success text-[10px] border-success/30"><ThumbsUp className="h-2.5 w-2.5 mr-1" />Pour</Badge>
                        : <Badge className="bg-destructive/15 text-destructive text-[10px] border-destructive/30"><ThumbsDown className="h-2.5 w-2.5 mr-1" />Contre</Badge>
                      }
                    </div>
                    {v.comment && (
                      <div className="flex items-start gap-1.5">
                        <MessageSquare className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground italic">{v.comment}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Voter form (for non-specialist, non-DG members who haven't voted yet) */}
          {!isDG && !isSpecialist && !userVote && !isLocked && (
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">Votre avis en tant que {COMPANY_ROLE_LABELS[currentRole]}</CardTitle>
                <CardDescription className="text-xs">
                  Approuvez-vous cette proposition ? Redigez un commentaire en lien avec votre role dans l{"'"}entreprise.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    variant={voteApproved === true ? "default" : "outline"}
                    className={`flex-1 ${voteApproved === true ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}
                    onClick={() => setVoteApproved(true)}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4" />
                    Approuver
                  </Button>
                  <Button
                    variant={voteApproved === false ? "default" : "outline"}
                    className={`flex-1 ${voteApproved === false ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                    onClick={() => setVoteApproved(false)}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4" />
                    {"S'opposer"}
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Commentaire (du point de vue de votre role : {COMPANY_ROLE_LABELS[currentRole]})
                  </Label>
                  <Textarea
                    placeholder={`En tant que ${COMPANY_ROLE_LABELS[currentRole]}, je pense que...`}
                    value={voteComment}
                    onChange={(e) => setVoteComment(e.target.value)}
                    rows={3}
                    className="bg-secondary/50 border-border/40 text-sm"
                  />
                </div>
                <Button onClick={castVote} disabled={loading || voteApproved === null} className="w-full glow-primary">
                  Soumettre mon vote
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Already voted confirmation */}
          {!isDG && userVote && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Vote enregistre</p>
                  <p className="text-xs text-muted-foreground">
                    Vous avez {userVote.approved ? "approuve" : "rejete"} la proposition. En attente de la decision du DG.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specialist waiting message */}
          {isSpecialist && !isDG && (
            <Card className="border-border/30 bg-card/40">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                  <Clock className="h-5 w-5 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Votre proposition a ete soumise</p>
                  <p className="text-xs text-muted-foreground">{"L'equipe vote et le DG prendra la decision finale."}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== STEP 3: DG DECISION ===== */}
          {isDG && !isLocked && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-warning" />
                  Decision du Directeur General
                </CardTitle>
                <CardDescription className="text-xs">
                  {allVotersVoted
                    ? "Tous les membres ont vote. Vous pouvez prendre votre decision."
                    : `En attente des votes (${votes.length}/${nonDGNonSpecMembers.length}). Vous pouvez decider a tout moment.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Toggle: collegial vs unilateral */}
                <div className="flex gap-3">
                  <Button
                    variant={!dgOverride ? "default" : "outline"}
                    className={`flex-1 text-xs ${!dgOverride ? "bg-success hover:bg-success/90 text-success-foreground" : ""}`}
                    onClick={() => { setDgOverride(false); setDgOverrideOption(null) }}
                  >
                    <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                    Valider la proposition
                  </Button>
                  <Button
                    variant={dgOverride ? "default" : "outline"}
                    className={`flex-1 text-xs ${dgOverride ? "bg-warning hover:bg-warning/90 text-warning-foreground" : ""}`}
                    onClick={() => setDgOverride(true)}
                  >
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                    Decision unilaterale
                  </Button>
                </div>

                {/* Override: select different option */}
                {dgOverride && (
                  <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <p className="text-xs font-semibold text-warning">Choisir une autre option :</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {options.map((option: any) => (
                        <div
                          key={option.id}
                          onClick={() => setDgOverrideOption(option.id)}
                          className={`cursor-pointer rounded-lg border p-2.5 transition-all text-xs ${
                            dgOverrideOption === option.id
                              ? "border-warning/50 bg-warning/10 ring-1 ring-warning/30"
                              : "border-border/40 bg-card/60 hover:border-warning/25"
                          }`}
                        >
                          <p className="font-bold">{option.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DG comment */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {dgOverride ? "Justification de la decision unilaterale" : "Commentaire de validation"}
                  </Label>
                  <Textarea
                    placeholder={dgOverride
                      ? "Expliquez pourquoi vous prenez une decision differente de la proposition de l'equipe..."
                      : "Commentaire sur la validation de cette decision collegiale..."
                    }
                    value={dgComment}
                    onChange={(e) => setDgComment(e.target.value)}
                    rows={3}
                    className="bg-secondary/50 border-border/40 text-sm"
                  />
                </div>

                <Button
                  onClick={dgValidate}
                  disabled={loading || (dgOverride && !dgOverrideOption)}
                  className="w-full glow-primary"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {dgOverride ? "Imposer cette decision" : "Valider la decision collegiale"}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
      </>)}
    </div>
  )
}
