'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * NOTIZIA → VALUTAZIONE
 * Crea una nuova valutazione a partire da una notizia,
 * copiando indirizzo, cliente, comune, ecc.
 */
export async function notiziaToValutazione(notiziaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  // Leggi la notizia
  const { data: notizia } = await supabase
    .from('notizie')
    .select('*')
    .eq('id', notiziaId)
    .single()

  if (!notizia) throw new Error('Notizia non trovata')

  // Crea la valutazione
  const { data: nuovaValutazione, error } = await supabase
    .from('valutazioni')
    .insert({
      notizia_id: notiziaId,
      cliente_id: notizia.cliente_id,
      agente_id: user.id,
      indirizzo: notizia.indirizzo || '',
      civico: notizia.civico,
      frazione: notizia.frazione,
      comune: notizia.comune,
      cap: null,
      data_valutazione: new Date().toISOString().split('T')[0],
      stato: 'da_fare',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Aggiorna lo stato della notizia
  await supabase
    .from('notizie')
    .update({ stato: 'in_lavorazione' })
    .eq('id', notiziaId)

  revalidatePath('/notizie')
  revalidatePath('/valutazioni')
  redirect(`/valutazioni/${nuovaValutazione.id}`)
}

/**
 * VALUTAZIONE → INCARICO
 * Crea un nuovo incarico a partire da una valutazione.
 */
export async function valutazioneToIncarico(valutazioneId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  // Leggi la valutazione
  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select('*')
    .eq('id', valutazioneId)
    .single()

  if (!valutazione) throw new Error('Valutazione non trovata')

  // Calcola scadenza a +1 anno
  const oggi = new Date()
  const scadenza = new Date(oggi)
  scadenza.setFullYear(scadenza.getFullYear() + 1)

  // Crea l'incarico
  const { data: nuovoIncarico, error } = await supabase
    .from('incarichi')
    .insert({
      valutazione_id: valutazioneId,
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

  // Aggiorna lo stato della valutazione
  await supabase
    .from('valutazioni')
    .update({ stato: 'seguita' })
    .eq('id', valutazioneId)

  revalidatePath('/valutazioni')
  revalidatePath('/incarichi')
  redirect(`/incarichi/${nuovoIncarico.id}`)
}

/**
 * INCARICO → IMMOBILE
 * Porta in portafoglio: crea un immobile a partire da un incarico.
 */
export async function incaricoToImmobile(incaricoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  // Leggi l'incarico con la valutazione collegata
  const { data: incarico } = await supabase
    .from('incarichi')
    .select(`
      *,
      valutazioni (*)
    `)
    .eq('id', incaricoId)
    .single()

  if (!incarico) throw new Error('Incarico non trovato')

  const val = Array.isArray(incarico.valutazioni)
    ? incarico.valutazioni[0]
    : incarico.valutazioni

  if (!val) throw new Error('Impossibile creare l\'immobile: manca la valutazione collegata')

  // Crea l'immobile
  const { data: nuovoImmobile, error } = await supabase
    .from('immobili')
    .insert({
      incarico_id: incaricoId,
      tipo: 'appartamento',
      categoria: 'casa',
      indirizzo: val.indirizzo,
      civico: val.civico,
      frazione: val.frazione,
      comune: val.comune,
      cap: val.cap,
      metri_quadrati: val.metratura,
      prezzo: incarico.prezzo,
      agente_id: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/incarichi')
  revalidatePath('/immobili')
  redirect(`/immobili/${nuovoImmobile.id}/modifica`)
}