'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function creaImmobileProposto(data: {
  richiesta_id: string
  immobile_id: string
  cliente_id?: string
  esito: string
  motivo_rifiuto?: string
  data_proposta: string
}): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, errore: 'Non autenticato' }

  const { error } = await supabase.from('immobili_proposti').insert({
    richiesta_id: data.richiesta_id,
    immobile_id: data.immobile_id,
    cliente_id: data.cliente_id || null,
    agente_id: user.id,
    esito: data.esito,
    motivo_rifiuto: data.motivo_rifiuto || null,
    data_proposta: data.data_proposta,
  })

  if (error) return { ok: false, errore: error.message }
  revalidatePath(`/richieste/${data.richiesta_id}`)
  return { ok: true }
}

export async function aggiornaImmobileProposto(
  id: string,
  richiestaId: string,
  data: {
    esito: string
    motivo_rifiuto?: string
    data_proposta: string
  }
): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('immobili_proposti')
    .update({
      esito: data.esito,
      motivo_rifiuto: data.motivo_rifiuto || null,
      data_proposta: data.data_proposta,
    })
    .eq('id', id)

  if (error) return { ok: false, errore: error.message }
  revalidatePath(`/richieste/${richiestaId}`)
  return { ok: true }
}

export async function eliminaImmobileProposto(
  id: string,
  richiestaId: string
): Promise<{ ok: boolean; errore?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('immobili_proposti').delete().eq('id', id)
  if (error) return { ok: false, errore: error.message }
  revalidatePath(`/richieste/${richiestaId}`)
  return { ok: true }
}