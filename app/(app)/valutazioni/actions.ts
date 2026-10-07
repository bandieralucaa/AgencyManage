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

export async function creaValutazione(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string

  if (!immobileId) {
    throw new Error('Immobile obbligatorio')
  }

  // Recupera i dati dell'immobile per copiare l'indirizzo
  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune, cap')
    .eq('id', immobileId)
    .maybeSingle()

  const { data: nuovaValutazione, error } = await supabase
    .from('valutazioni')
    .insert({
      immobile_id: immobileId,
      agente_id: user.id,
      indirizzo: immobile?.indirizzo || '',
      civico: immobile?.civico,
      frazione: immobile?.frazione,
      comune: immobile?.comune,
      cap: immobile?.cap,
      data_valutazione: formData.get('data_valutazione') as string,
      prezzo_valutato: numOrNull(formData.get('prezzo_valutato')),
      prezzo_richiesto: numOrNull(formData.get('prezzo_richiesto')),
      prezzo_minimo: numOrNull(formData.get('prezzo_minimo')),
      metratura: numOrNull(formData.get('metratura')),
      stato: (formData.get('stato') as string) || 'da_fare',
      note: stringOrNull(formData.get('note')),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Salva i proprietari associati alla valutazione
  const proprietari = formData.getAll('proprietari')

  const proprietariValidi = [
    ...new Set(
      proprietari
        .map((clienteId) => String(clienteId))
        .filter(Boolean)
    ),
  ].slice(0, 2)

  if (proprietariValidi.length > 0) {
    const { error: proprietariError } = await supabase
      .from('valutazioni_proprietari')
      .insert(
        proprietariValidi.map((clienteId) => ({
          valutazione_id: nuovaValutazione.id,
          cliente_id: clienteId,
        }))
      )

    if (proprietariError) {
      throw new Error(proprietariError.message)
    }
  }

  revalidatePath('/valutazioni')
  redirect('/valutazioni')
}

export async function aggiornaValutazione(
  id: string,
  formData: FormData
) {
  const supabase = await createClient()

  const immobileId = formData.get('immobile_id') as string

  if (!immobileId) {
    throw new Error('Immobile obbligatorio')
  }

  // Recupera l'indirizzo aggiornato dall'immobile
  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune, cap')
    .eq('id', immobileId)
    .maybeSingle()

  const { error } = await supabase
    .from('valutazioni')
    .update({
      immobile_id: immobileId,
      indirizzo: immobile?.indirizzo || '',
      civico: immobile?.civico,
      frazione: immobile?.frazione,
      comune: immobile?.comune,
      cap: immobile?.cap,
      data_valutazione: formData.get('data_valutazione') as string,
      prezzo_valutato: numOrNull(formData.get('prezzo_valutato')),
      prezzo_richiesto: numOrNull(formData.get('prezzo_richiesto')),
      prezzo_minimo: numOrNull(formData.get('prezzo_minimo')),
      metratura: numOrNull(formData.get('metratura')),
      stato: formData.get('stato') as string,
      note: stringOrNull(formData.get('note')),
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Legge i proprietari selezionati dal form
  const proprietari = formData.getAll('proprietari')

  const proprietariValidi = [
    ...new Set(
      proprietari
        .map((clienteId) => String(clienteId))
        .filter(Boolean)
    ),
  ].slice(0, 2)

  // Elimina i vecchi proprietari
  const { error: deleteProprietariError } = await supabase
    .from('valutazioni_proprietari')
    .delete()
    .eq('valutazione_id', id)

  if (deleteProprietariError) {
    throw new Error(deleteProprietariError.message)
  }

  // Inserisce i nuovi proprietari
  if (proprietariValidi.length > 0) {
    const { error: insertProprietariError } = await supabase
      .from('valutazioni_proprietari')
      .insert(
        proprietariValidi.map((clienteId) => ({
          valutazione_id: id,
          cliente_id: clienteId,
        }))
      )

    if (insertProprietariError) {
      throw new Error(insertProprietariError.message)
    }
  }

  revalidatePath('/valutazioni')
  revalidatePath(`/valutazioni/${id}`)
  redirect(`/valutazioni/${id}`)
}

export async function eliminaValutazione(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('valutazioni')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/valutazioni')
  redirect('/valutazioni')
}