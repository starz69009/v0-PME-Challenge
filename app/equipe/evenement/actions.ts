"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function proposeOptionAction(
  decisionId: string,
  optionId: string,
  avantages: string,
  inconvenients: string,
  justification: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifie" }

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

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Mise a jour refusee - verifiez vos droits" }

  revalidatePath("/equipe/evenement")
  return { success: true }
}

export async function castVoteAction(
  decisionId: string,
  optionId: string,
  approved: boolean,
  comment: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifie" }

  // Check if vote already exists
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("decision_id", decisionId)
    .eq("user_id", user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: "Vous avez deja vote" }
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

  if (error) return { error: error.message }

  revalidatePath("/equipe/evenement")
  return { success: true }
}

export async function validateDecisionAction(
  decisionId: string,
  dgComment: string,
  overrideOptionId: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifie" }

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

  if (error) return { error: error.message }
  if (!data || data.length === 0) return { error: "Mise a jour refusee - verifiez vos droits" }

  revalidatePath("/equipe/evenement")
  return { success: true }
}
