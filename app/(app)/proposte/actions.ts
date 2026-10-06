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

/**
 * Crea una nuova proposta.
 *
 * La proposta viene collegata all'incarico tramite:
 * incarichi.immobile_id = proposta.immobile_id
 */
export async function creaProposta(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string

  if (!immobileId) {
    throw new Error('Immobile obbligatorio')
  }

  // Trova l'incarico collegato all'immobile.
  // Il collegamento corretto è incarichi.immobile_id.
  const { data: incarico, error: incaricoError } = await supabase
    .from('incarichi')
    .select('id')
    .eq('immobile_id', immobileId)
    .in('stato', ['attivo', 'in_trattativa'])
    .order('data_inizio', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (incaricoError) {
    throw new Error(incaricoError.message)
  }

  const richiestaId = stringOrNull(formData.get('richiesta_id'))
  const clienteId = stringOrNull(formData.get('cliente_id'))

  const { data: nuova, error } = await supabase
    .from('proposte')
    .insert({
      immobile_id: immobileId,
      incarico_id: incarico?.id || null,
      richiesta_id: richiestaId,
      cliente_id: clienteId,
      agente_id: user.id,
      data_proposta: stringOrNull(formData.get('data_proposta')),
      importo_proposto: numOrNull(formData.get('importo_proposto')),
      stato: (formData.get('stato') as string) || 'in_corso',
      note: stringOrNull(formData.get('note')),
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/proposte')
  revalidatePath(`/immobili/${immobileId}`)

  if (richiestaId) {
    revalidatePath(`/richieste/${richiestaId}`)
  }

  if (incarico?.id) {
    revalidatePath('/incarichi')
    revalidatePath(`/incarichi/${incarico.id}`)
  }

  redirect(`/proposte/${nuova.id}`)
}

/**
 * Aggiorna una proposta.
 */
export async function aggiornaProposta(id: string, formData: FormData) {
  const supabase = await createClient()

  const stato = formData.get('stato') as string

  const { error } = await supabase
    .from('proposte')
    .update({
      data_proposta: stringOrNull(formData.get('data_proposta')),
      importo_proposto: numOrNull(formData.get('importo_proposto')),
      stato,
      note: stringOrNull(formData.get('note')),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/proposte')
  revalidatePath(`/proposte/${id}`)

  redirect(`/proposte/${id}`)
}

/**
 * Elimina una proposta.
 */
export async function eliminaProposta(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('proposte')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/proposte')

  redirect('/proposte')
}

/**
 * Accetta una proposta.
 *
 * Risultato:
 * - proposta -> accettata
 * - richiesta -> chiusa_trovato
 * - incarico -> in_trattativa
 *
 * L'incarico viene recuperato direttamente tramite
 * proposta.incarico_id oppure, come fallback, tramite
 * incarichi.immobile_id.
 */
export async function accettaProposta(id: string) {
  const supabase = await createClient()

  // Recupera la proposta
  const { data: proposta, error: propostaError } = await supabase
    .from('proposte')
    .select('*')
    .eq('id', id)
    .single()

  if (propostaError) {
    throw new Error(propostaError.message)
  }

  if (!proposta) {
    throw new Error('Proposta non trovata')
  }

  // --------------------------------------------------
  // 1. PROPOSTA -> ACCETTATA
  // --------------------------------------------------

  const { error: aggiornaPropostaError } = await supabase
    .from('proposte')
    .update({
      stato: 'accettata',
    })
    .eq('id', id)

  if (aggiornaPropostaError) {
    throw new Error(aggiornaPropostaError.message)
  }

  // --------------------------------------------------
  // 2. RICHIESTA -> CHIUSA
  // --------------------------------------------------

  if (proposta.richiesta_id) {
    const { error: richiestaError } = await supabase
      .from('richieste')
      .update({
        stato: 'chiusa_trovato',
        data_chiusura: new Date().toISOString().split('T')[0],
        motivo_chiusura: 'Trovato immobile tramite agenzia',
      })
      .eq('id', proposta.richiesta_id)

    if (richiestaError) {
      throw new Error(richiestaError.message)
    }
  }

  // --------------------------------------------------
  // 3. TROVA L'INCARICO
  // --------------------------------------------------

  let incaricoId = proposta.incarico_id as string | null

  // Se la proposta non ha incarico_id, lo cerchiamo
  // usando il corretto collegamento:
  //
  // incarichi.immobile_id = proposta.immobile_id
  if (!incaricoId && proposta.immobile_id) {
    const { data: incarico, error: incaricoError } = await supabase
      .from('incarichi')
      .select('id')
      .eq('immobile_id', proposta.immobile_id)
      .in('stato', ['attivo', 'in_trattativa'])
      .order('data_inizio', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (incaricoError) {
      throw new Error(incaricoError.message)
    }

    incaricoId = incarico?.id || null
  }

  // --------------------------------------------------
  // 4. INCARICO -> IN TRATTATIVA
  // --------------------------------------------------

  if (incaricoId) {
    const { error: incaricoError } = await supabase
      .from('incarichi')
      .update({
        stato: 'in_trattativa',
        data_chiusura: null,
        motivo_chiusura: null,
      })
      .eq('id', incaricoId)

    if (incaricoError) {
      throw new Error(incaricoError.message)
    }

    revalidatePath(`/incarichi/${incaricoId}`)
  }

  // --------------------------------------------------
  // 5. AGGIORNA LE PAGINE
  // --------------------------------------------------

  revalidatePath('/proposte')
  revalidatePath(`/proposte/${id}`)
  revalidatePath('/richieste')
  revalidatePath('/incarichi')

  if (proposta.richiesta_id) {
    revalidatePath(`/richieste/${proposta.richiesta_id}`)
  }

  if (proposta.immobile_id) {
    revalidatePath(`/immobili/${proposta.immobile_id}`)
  }

  redirect(`/proposte/${id}`)
}