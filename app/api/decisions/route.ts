import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Helper: authenticate user via cookies, return user or error response
async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { user: null, error: NextResponse.json({ error: "Non authentifie" }, { status: 401 }) }
  return { user, error: null }
}

// GET: Fetch decision + votes for a team's active event
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionEventId = searchParams.get("sessionEventId")
  const teamId = searchParams.get("teamId")

  if (!sessionEventId || !teamId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const admin = createAdminClient()

  // Verify user is member of this team
  const { data: membership } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user!.id)
    .limit(1)

  if (!membership || membership.length === 0) {
    return NextResponse.json({ error: "Vous ne faites pas partie de cette equipe" }, { status: 403 })
  }

  // Fetch decision using admin client (bypasses RLS)
  const { data: decisions, error: decErr } = await admin
    .from("decisions")
    .select("*, event_options(*)")
    .eq("session_event_id", sessionEventId)
    .eq("team_id", teamId)
    .limit(1)

  if (decErr) {
    console.error("[decisions API] GET error:", decErr.message)
    return NextResponse.json({ error: decErr.message }, { status: 500 })
  }

  const decision = decisions?.[0] || null

  // Fetch votes if decision exists
  let votes: any[] = []
  if (decision) {
    const { data: voteData } = await admin
      .from("votes")
      .select("*, event_options(*), profiles(id, email, display_name)")
      .eq("decision_id", decision.id)
    votes = voteData || []
  }

  return NextResponse.json({ decision, votes })
}

// POST: Perform workflow actions (propose, vote, validate)
export async function POST(request: Request) {
  const { user, error: authError } = await getAuthUser()
  if (authError) return authError

  const admin = createAdminClient()
  const body = await request.json()
  const { action } = body

  // ===== PROPOSE =====
  if (action === "propose") {
    const { decisionId, optionId, avantages, inconvenients, justification } = body

    if (!decisionId || !optionId) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    // Verify decision exists and is pending
    const { data: existing } = await admin
      .from("decisions")
      .select("id, status, team_id")
      .eq("id", decisionId)
      .limit(1)

    const dec = existing?.[0]
    if (!dec) return NextResponse.json({ error: "Decision introuvable" }, { status: 404 })
    if (dec.status !== "pending") return NextResponse.json({ error: "Decision deja proposee" }, { status: 400 })

    // Verify user is a team member
    const { data: mem } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", dec.team_id)
      .eq("user_id", user!.id)
      .limit(1)

    if (!mem || mem.length === 0) {
      return NextResponse.json({ error: "Vous ne faites pas partie de cette equipe" }, { status: 403 })
    }

    // Update decision via admin client
    const { data, error } = await admin
      .from("decisions")
      .update({
        proposed_option_id: optionId,
        proposed_by: user!.id,
        status: "voting",
        comment_avantages: avantages || "",
        comment_inconvenients: inconvenients || "",
        comment_justification: justification || "",
      })
      .eq("id", decisionId)
      .select()

    if (error) {
      console.error("[decisions API] propose error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, decision: data?.[0] })
  }

  // ===== VOTE =====
  if (action === "vote") {
    const { decisionId, optionId, approved, comment } = body

    if (!decisionId || approved === undefined || !comment) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    // Check no existing vote
    const { data: existingVote } = await admin
      .from("votes")
      .select("id")
      .eq("decision_id", decisionId)
      .eq("user_id", user!.id)
      .limit(1)

    if (existingVote && existingVote.length > 0) {
      return NextResponse.json({ error: "Vous avez deja vote" }, { status: 400 })
    }

    const { error } = await admin
      .from("votes")
      .insert({
        decision_id: decisionId,
        user_id: user!.id,
        option_id: optionId,
        approved,
        comment,
      })

    if (error) {
      console.error("[decisions API] vote error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  // ===== VALIDATE (DG) =====
  if (action === "validate") {
    const { decisionId, dgComment, overrideOptionId } = body

    if (!decisionId || !dgComment) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      dg_validated: true,
      dg_validated_by: user!.id,
      dg_validated_at: new Date().toISOString(),
      dg_comment: dgComment,
      status: "validated",
    }

    if (overrideOptionId) {
      updateData.dg_override_option_id = overrideOptionId
      updateData.proposed_option_id = overrideOptionId
    }

    const { data, error } = await admin
      .from("decisions")
      .update(updateData)
      .eq("id", decisionId)
      .select()

    if (error) {
      console.error("[decisions API] validate error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, decision: data?.[0] })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
