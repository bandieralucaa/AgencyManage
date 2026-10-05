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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string
  if (!immobileId) throw new Error('Immobile obbligatorio')

  // Recupera i dati dell'immobile per copiare l'indirizzo
  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune, cap')
    .eq('id', immobileId)
    .maybeSingle()

  const { error } = await supabase.from('valutazioni').insert({
    immobile_id: immobileId,
    cliente_id: stringOrNull(formData.get('cliente_id')),
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

  if (error) throw new Error(error.message)
  revalidatePath('/valutazioni')
  redirect('/valutazioni')
}

export async function aggiornaValutazione(id: string, formData: FormData) {
  const supabase = await createClient()

  const immobileId = formData.get('immobile_id') as string
  if (!immobileId) throw new Error('Immobile obbligatorio')

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
      cliente_id: stringOrNull(formData.get('cliente_id')),
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

  if (error) throw new Error(error.message)
  revalidatePath('/valutazioni')
  revalidatePath(`/valutazioni/${id}`)
  redirect(`/valutazioni/${id}`)
}

export async function eliminaValutazione(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('valutazioni').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/valutazioni')
  redirect('/valutazioni')
}