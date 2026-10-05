'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function creaVisita(data: {
  richiesta_id: string
  immobile_id?: string
  cliente_id?: string
  data_visita: string
  ora_visita?: string
  esito: string
  motivo_rifiuto?: string
  note?: string
}): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, errore: 'Non autenticato' }

  const { error } = await supabase.from('visite').insert({
    richiesta_id: data.richiesta_id,
    immobile_id: data.immobile_id || null,
    cliente_id: data.cliente_id || null,
    agente_id: user.id,
    data_visita: data.data_visita,
    ora_visita: data.ora_visita || null,
    esito: data.esito,
    motivo_rifiuto: data.motivo_rifiuto || null,
    note: data.note || null,
  })

  if (error) return { ok: false, errore: error.message }

  revalidatePath(`/richieste/${data.richiesta_id}`)
  return { ok: true }
}

export async function aggiornaVisita(
  id: string,
  richiestaId: string,
  data: {
    immobile_id?: string
    data_visita: string
    ora_visita?: string
    esito: string
    motivo_rifiuto?: string
    note?: string
  }
): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('visite')
    .update({
      immobile_id: data.immobile_id || null,
      data_visita: data.data_visita,
      ora_visita: data.ora_visita || null,
      esito: data.esito,
      motivo_rifiuto: data.motivo_rifiuto || null,
      note: data.note || null,
    })
    .eq('id', id)

  if (error) return { ok: false, errore: error.message }

  revalidatePath(`/richieste/${richiestaId}`)
  return { ok: true }
}

export async function eliminaVisita(
  id: string,
  richiestaId: string
): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('visite').delete().eq('id', id)
  if (error) return { ok: false, errore: error.message }
  revalidatePath(`/richieste/${richiestaId}`)
  return { ok: true }
}