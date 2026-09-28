'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function numOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

export async function creaValutazione(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string
  const clienteId = formData.get('cliente_id') as string

  if (!immobileId) throw new Error('Immobile obbligatorio')

  // Recupera i dati dell'immobile per copiare l'indirizzo
  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune, cap')
    .eq('id', immobileId)
    .single()

  const { error } = await supabase.from('valutazioni').insert({
    immobile_id: immobileId,
    cliente_id: clienteId || null,
    agente_id: user.id,
    indirizzo: immobile?.indirizzo || '',
    civico: immobile?.civico || null,
    frazione: immobile?.frazione || null,
    comune: immobile?.comune || null,
    cap: immobile?.cap || null,
    data_valutazione: formData.get('data_valutazione') as string,
    prezzo_valutato: numOrNull(formData.get('prezzo_valutato')),
    prezzo_richiesto: numOrNull(formData.get('prezzo_richiesto')),
    prezzo_minimo: numOrNull(formData.get('prezzo_minimo')),
    metratura: numOrNull(formData.get('metratura')),
    stato: (formData.get('stato') as string) || 'da_fare',
    note: formData.get('note') || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/valutazioni')
  redirect('/valutazioni')
}

export async function aggiornaValutazione(id: string, formData: FormData) {
  const supabase = await createClient()

  const immobileId = formData.get('immobile_id') as string
  const clienteId = formData.get('cliente_id') as string

  if (!immobileId) throw new Error('Immobile obbligatorio')

  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune, cap')
    .eq('id', immobileId)
    .single()

  const { error } = await supabase
    .from('valutazioni')
    .update({
      immobile_id: immobileId,
      cliente_id: clienteId || null,
      indirizzo: immobile?.indirizzo || '',
      civico: immobile?.civico || null,
      frazione: immobile?.frazione || null,
      comune: immobile?.comune || null,
      cap: immobile?.cap || null,
      data_valutazione: formData.get('data_valutazione') as string,
      prezzo_valutato: numOrNull(formData.get('prezzo_valutato')),
      prezzo_richiesto: numOrNull(formData.get('prezzo_richiesto')),
      prezzo_minimo: numOrNull(formData.get('prezzo_minimo')),
      metratura: numOrNull(formData.get('metratura')),
      stato: formData.get('stato') as string,
      note: formData.get('note') || null,
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