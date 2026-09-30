'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DOMINIO_FINTO = 'casamanager.local'

export async function aggiornaProfilo(
  nome: string,
  cognome: string
): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, errore: 'Non autenticato' }

  const { error } = await supabase
    .from('agenti')
    .update({ nome, cognome })
    .eq('id', user.id)

  if (error) return { ok: false, errore: error.message }

  revalidatePath('/impostazioni')
  return { ok: true }
}

export async function cambiaPassword(
  username: string,
  vecchiaPassword: string,
  nuovaPassword: string
): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()

  if (nuovaPassword.length < 6) {
    return { ok: false, errore: 'La nuova password deve avere almeno 6 caratteri' }
  }

  const emailFinta = `${username.toLowerCase().trim()}@${DOMINIO_FINTO}`

  // 1. Verifica la vecchia password facendo un nuovo signIn
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: emailFinta,
    password: vecchiaPassword,
  })

  if (signInError) {
    return { ok: false, errore: 'Password attuale non corretta' }
  }

  // 2. Aggiorna la password
  const { error: updateError } = await supabase.auth.updateUser({
    password: nuovaPassword,
  })

  if (updateError) return { ok: false, errore: updateError.message }

  return { ok: true }
}