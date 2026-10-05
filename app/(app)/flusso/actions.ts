'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * NOTIZIA → VALUTAZIONE
 * Copia immobile_id, cliente_id, indirizzo dalla notizia
 */
export async function notiziaToValutazione(notiziaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { data: notizia } = await supabase
    .from('notizie')
    .select('*')
    .eq('id', notiziaId)
    .single()

  if (!notizia) throw new Error('Notizia non trovata')

  const { data: nuovaValutazione, error } = await supabase
    .from('valutazioni')
    .insert({
      notizia_id: notiziaId,
      immobile_id: notizia.immobile_id,
      cliente_id: notizia.cliente_id,
      agente_id: user.id,
      indirizzo: notizia.indirizzo || '',
      civico: notizia.civico,
      frazione: notizia.frazione,
      comune: notizia.comune,
      data_valutazione: new Date().toISOString().split('T')[0],
      stato: 'da_fare',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('notizie')
    .update({ stato: 'in_lavorazione' })
    .eq('id', notiziaId)

  redirect(`/valutazioni/${nuovaValutazione.id}`)
}

/**
 * VALUTAZIONE → INCARICO
 * Copia immobile_id e cliente_id dalla valutazione
 */
export async function valutazioneToIncarico(valutazioneId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select('*')
    .eq('id', valutazioneId)
    .single()

  if (!valutazione) throw new Error('Valutazione non trovata')

  const oggi = new Date()
  const scadenza = new Date(oggi)
  scadenza.setFullYear(scadenza.getFullYear() + 1)

  const { data: nuovoIncarico, error } = await supabase
    .from('incarichi')
    .insert({
      valutazione_id: valutazioneId,
      immobile_id: valutazione.immobile_id,
      cliente_id: valutazione.cliente_id,
      agente_id: user.id,
      tipo: 'vendita',
      data_inizio: oggi.toISOString().split('T')[0],
      data_scadenza: scadenza.toISOString().split('T')[0],
      prezzo: valutazione.prezzo_richiesto || valutazione.prezzo_valutato || null,
      esclusivo: false,
      stato: 'attivo',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await supabase
    .from('valutazioni')
    .update({ stato: 'seguita' })
    .eq('id', valutazioneId)

  redirect(`/incarichi/${nuovoIncarico.id}`)
}