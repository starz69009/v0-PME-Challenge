import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Get the admin DB client (bypasses RLS) with fallback to auth client
async function getDbClient() {
  try {
    return { db: createAdminClient(), isAdmin: true }
  } catch {
    // Fallback to auth client if service role key is missing
    const supabase = await createClient()
    return { db: supabase, isAdmin: false }
  }
}

// Authenticate user via cookies
async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ============ GET: Fetch decision + votes for a team's active event ============
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionEventId = searchParams.get("sessionEventId")
  const teamId = searchParams.get("teamId")

  if (!sessionEventId || !teamId) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 })
  }

  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const { db } = await getDbClient()

  // Verify user is member of this team
  const { data: membership } = await db
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .limit(1)

  if (!membership || membership.length === 0) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 })
  }

  // Fetch decision
  const { data: decisions, error: decErr } = await db
    .from("decisions")
    .select("*, event_options(*)")
    .eq("session_event_id", sessionEventId)
    .eq("team_id", teamId)
    .limit(1)

  if (decErr) {
    return NextResponse.json({ error: decErr.message }, { status: 500 })
  }

  const decision = decisions?.[0] || null

  // Fetch votes
  let votes: any[] = []
  if (decision) {
    const { data: voteData } = await db
      .from("votes")
      .select("*, event_options(*), profiles(id, email, display_name)")
      .eq("decision_id", decision.id)
    votes = voteData || []
  }

  return NextResponse.json({ decision, votes })
}

// ============ POST: Workflow actions ============
export async function POST(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const { db } = await getDbClient()
  const body = await request.json()
  const { action } = body

  // ===== PROPOSE (Specialist step 1) =====
  if (action === "propose") {
    const { decisionId, optionId, avantages, inconvenients, justification } = body

    if (!decisionId || !optionId) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    // Verify decision exists and is pending
    const { data: decs } = await db.from("decisions").select("id, status, team_id").eq("id", decisionId).limit(1)
    const dec = decs?.[0]
    if (!dec) return NextResponse.json({ error: "Decision introuvable" }, { status: 404 })
    if (dec.status !== "pending") return NextResponse.json({ error: "La proposition a deja ete faite" }, { status: 400 })

    // Verify user is team member
    const { data: mem } = await db.from("team_members").select("id").eq("team_id", dec.team_id).eq("user_id", user.id).limit(1)
    if (!mem || mem.length === 0) return NextResponse.json({ error: "Acces refuse" }, { status: 403 })

    // Update decision
    const { data, error } = await db
      .from("decisions")
      .update({
        proposed_option_id: optionId,
        proposed_by: user.id,
        status: "voting",
        comment_avantages: avantages || "",
        comment_inconvenients: inconvenients || "",
        comment_justification: justification || "",
      })
      .eq("id", decisionId)
      .select("*, event_options(*)")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) return NextResponse.json({ error: "Mise a jour echouee (permission refusee)" }, { status: 403 })

    return NextResponse.json({ success: true, decision: data[0] })
  }

  // ===== VOTE (Team members step 2) =====
  if (action === "vote") {
    const { decisionId, optionId, approved, comment } = body

    if (!decisionId || approved === undefined || !comment) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    // Check no existing vote
    const { data: existing } = await db.from("votes").select("id").eq("decision_id", decisionId).eq("user_id", user.id).limit(1)
    if (existing && existing.length > 0) return NextResponse.json({ error: "Vous avez deja vote" }, { status: 400 })

    const { error } = await db.from("votes").insert({
      decision_id: decisionId,
      user_id: user.id,
      option_id: optionId || null,
      approved,
      comment,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ===== VALIDATE (DG step 3) =====
  if (action === "validate") {
    const { decisionId, dgComment, overrideOptionId } = body

    if (!decisionId || !dgComment) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

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

    const { data, error } = await db.from("decisions").update(updateData).eq("id", decisionId).select("*, event_options(*)")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data || data.length === 0) return NextResponse.json({ error: "Mise a jour echouee (permission refusee)" }, { status: 403 })

    return NextResponse.json({ success: true, decision: data[0] })
  }

  // ===== CREATE DECISIONS (Admin triggers event) =====
  if (action === "create_decisions") {
    const { sessionEventId, teamIds } = body
    if (!sessionEventId || !teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    // Check existing
    const { data: existingDecs } = await db.from("decisions").select("id, team_id").eq("session_event_id", sessionEventId)
    const existingTeamIds = new Set((existingDecs || []).map((d: any) => d.team_id))
    const newTeamIds = teamIds.filter((tid: string) => !existingTeamIds.has(tid))

    if (newTeamIds.length > 0) {
      const rows = newTeamIds.map((tid: string) => ({ session_event_id: sessionEventId, team_id: tid, status: "pending" }))
      const { error } = await db.from("decisions").insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, created: newTeamIds.length })
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
}
