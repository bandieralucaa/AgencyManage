'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function numOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function stringOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  return v as string
}

export async function creaProposta(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string
  if (!immobileId) throw new Error('Immobile obbligatorio')

  // Recupera l'incarico collegato all'immobile (per collegarlo alla proposta)
  const { data: immobile } = await supabase
    .from('immobili')
    .select('incarico_id')
    .eq('id', immobileId)
    .single()

  const { data: nuova, error } = await supabase
    .from('proposte')
    .insert({
      immobile_id: immobileId,
      incarico_id: immobile?.incarico_id || null,
      richiesta_id: stringOrNull(formData.get('richiesta_id')),
      cliente_id: stringOrNull(formData.get('cliente_id')),
      agente_id: user.id,
      data_visita: stringOrNull(formData.get('data_visita')),
      data_proposta: stringOrNull(formData.get('data_proposta')),
      importo_proposto: numOrNull(formData.get('importo_proposto')),
      stato: (formData.get('stato') as string) || 'in_corso',
      note: stringOrNull(formData.get('note')),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/proposte')
  revalidatePath(`/immobili/${immobileId}`)
  if (formData.get('richiesta_id')) {
    revalidatePath(`/richieste/${formData.get('richiesta_id')}`)
  }

  redirect(`/proposte/${nuova.id}`)
}

export async function aggiornaProposta(id: string, formData: FormData) {
  const supabase = await createClient()

  const stato = formData.get('stato') as string

  const { error } = await supabase
    .from('proposte')
    .update({
      data_visita: stringOrNull(formData.get('data_visita')),
      data_proposta: stringOrNull(formData.get('data_proposta')),
      importo_proposto: numOrNull(formData.get('importo_proposto')),
      stato,
      note: stringOrNull(formData.get('note')),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/proposte')
  revalidatePath(`/proposte/${id}`)
  redirect(`/proposte/${id}`)
}

export async function eliminaProposta(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('proposte').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/proposte')
  redirect('/proposte')
}

/**
 * Chiude la trattativa: proposta accettata.
 * Segna la proposta come accettata, chiude la richiesta e chiude l'incarico come "concluso_bene".
 */
export async function accettaProposta(id: string) {
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('proposte')
    .select('*')
    .eq('id', id)
    .single()

  if (!proposta) throw new Error('Proposta non trovata')

  // 1. Segna proposta come accettata
  await supabase
    .from('proposte')
    .update({ stato: 'accettata' })
    .eq('id', id)

  // 2. Chiudi la richiesta (se collegata)
  if (proposta.richiesta_id) {
    await supabase
      .from('richieste')
      .update({
        stato: 'chiusa_trovato',
        data_chiusura: new Date().toISOString().split('T')[0],
        motivo_chiusura: 'Trovato immobile tramite agenzia',
      })
      .eq('id', proposta.richiesta_id)
  }

  // 3. Chiudi l'incarico (se collegato)
  if (proposta.incarico_id) {
    await supabase
      .from('incarichi')
      .update({
        stato: 'concluso_bene',
        data_chiusura: new Date().toISOString().split('T')[0],
      })
      .eq('id', proposta.incarico_id)
  }

  revalidatePath('/proposte')
  revalidatePath(`/proposte/${id}`)
  revalidatePath('/richieste')
  revalidatePath('/incarichi')
  redirect(`/proposte/${id}`)
}