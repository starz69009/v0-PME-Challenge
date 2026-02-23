'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createBrowserClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function createPlayer(formData: FormData) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifie' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Acces refuse' }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string
  const teamId = formData.get('teamId') as string | null
  const roleInCompany = formData.get('roleInCompany') as string | null

  if (!email || !password || !displayName) {
    return { error: 'Email, mot de passe et nom sont requis.' }
  }

  // Create user with admin API (auto-confirmed)
  const adminClient = getAdminClient()
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      role: 'team_member',
    },
  })

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'Un compte avec cet email existe deja.' }
    }
    return { error: createError.message }
  }

  if (!newUser.user) return { error: 'Erreur lors de la creation du compte.' }

  // Store plain password in profile for admin retrieval
  await adminClient
    .from('profiles')
    .update({ plain_password: password })
    .eq('id', newUser.user.id)

  // If team + role specified, add to team
  if (teamId && roleInCompany) {
    const { error: memberError } = await adminClient.from('team_members').insert({
      team_id: teamId,
      user_id: newUser.user.id,
      role_in_company: roleInCompany,
    })
    if (memberError) {
      return { success: true, warning: `Joueur cree mais erreur assignation equipe: ${memberError.message}` }
    }
  }

  return { success: true }
}

export async function deletePlayer(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifie' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Acces refuse' }

  const adminClient = getAdminClient()

  // Remove from team_members first
  await adminClient.from('team_members').delete().eq('user_id', userId)

  // Delete the auth user (cascade will handle profile via trigger or we do it manually)
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  // Delete profile row
  await adminClient.from('profiles').delete().eq('id', userId)

  return { success: true }
}

export async function updatePlayerTeam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifie' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Acces refuse' }

  const userId = formData.get('userId') as string
  const teamId = formData.get('teamId') as string
  const roleInCompany = formData.get('roleInCompany') as string

  if (!userId || !teamId || !roleInCompany) {
    return { error: 'Tous les champs sont requis.' }
  }

  const adminClient = getAdminClient()

  // Remove existing team membership
  await adminClient.from('team_members').delete().eq('user_id', userId)

  // Insert new membership
  const { error } = await adminClient.from('team_members').insert({
    team_id: teamId,
    user_id: userId,
    role_in_company: roleInCompany,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function removePlayerFromTeam(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifie' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Acces refuse' }

  const adminClient = getAdminClient()
  const { error } = await adminClient.from('team_members').delete().eq('user_id', userId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function resetPlayerPassword(userId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifie' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Acces refuse' }

  const adminClient = getAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { error: error.message }

  // Update stored plain password
  await adminClient.from('profiles').update({ plain_password: newPassword }).eq('id', userId)

  return { success: true }
}
