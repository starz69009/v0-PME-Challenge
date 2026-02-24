import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Fetch decision + votes for a team's active event
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionEventId = searchParams.get("sessionEventId")
  const teamId = searchParams.get("teamId")

  if (!sessionEventId || !teamId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  // Fetch decision
  const { data: decisions } = await supabase
    .from("decisions")
    .select("*, event_options(*)")
    .eq("session_event_id", sessionEventId)
    .eq("team_id", teamId)
    .limit(1)

  const decision = decisions?.[0] || null

  // Fetch votes if decision exists
  let votes: any[] = []
  if (decision) {
    const { data: voteData } = await supabase
      .from("votes")
      .select("*, event_options(*), profiles(*)")
      .eq("decision_id", decision.id)
    votes = voteData || []
  }

  return NextResponse.json({ decision, votes })
}

// POST: Perform workflow actions (propose, vote, validate)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const body = await request.json()
  const { action } = body

  if (action === "propose") {
    const { decisionId, optionId, avantages, inconvenients, justification } = body

    // First verify the decision exists and is pending
    const { data: existing } = await supabase
      .from("decisions")
      .select("id, status, team_id")
      .eq("id", decisionId)
      .single()

    if (!existing) return NextResponse.json({ error: "Decision introuvable" }, { status: 404 })
    if (existing.status !== "pending") return NextResponse.json({ error: "La decision a deja ete proposee" }, { status: 400 })

    // Verify user is a team member
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", existing.team_id)
      .eq("user_id", user.id)
      .single()

    if (!membership) return NextResponse.json({ error: "Vous ne faites pas partie de cette equipe" }, { status: 403 })

    const { data, error } = await supabase
      .from("decisions")
      .update({
        proposed_option_id: optionId,
        proposed_by: user.id,
        status: "voting",
        comment_avantages: avantages,
        comment_inconvenients: inconvenients,
        comment_justification: justification,
      })
      .eq("id", decisionId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) return NextResponse.json({ error: "Mise a jour impossible (droits insuffisants)" }, { status: 403 })

    return NextResponse.json({ success: true, decision: data[0] })
  }

  if (action === "vote") {
    const { decisionId, optionId, approved, comment } = body

    // Check for existing vote
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("decision_id", decisionId)
      .eq("user_id", user.id)
      .limit(1)

    if (existingVote && existingVote.length > 0) {
      return NextResponse.json({ error: "Vous avez deja vote" }, { status: 400 })
    }

    const { error } = await supabase
      .from("votes")
      .insert({
        decision_id: decisionId,
        user_id: user.id,
        option_id: optionId,
        approved,
        comment,
      })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "validate") {
    const { decisionId, dgComment, overrideOptionId } = body

    const updateData: Record<string, unknown> = {
      dg_validated: true,
      dg_validated_by: user.id,
      dg_validated_at: new Date().toISOString(),
      dg_comment: dgComment,
      status: "validated",
    }

    if (overrideOptionId) {
      updateData.dg_override_option_id = overrideOptionId
      updateData.proposed_option_id = overrideOptionId
    }

    const { data, error } = await supabase
      .from("decisions")
      .update(updateData)
      .eq("id", decisionId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) return NextResponse.json({ error: "Mise a jour impossible" }, { status: 403 })

    return NextResponse.json({ success: true, decision: data[0] })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
