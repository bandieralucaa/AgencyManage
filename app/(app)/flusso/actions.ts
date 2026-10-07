'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function numOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

/**
 * NOTIZIA → VALUTAZIONE
 * Copia immobile_id e i proprietari dalla notizia
 */
export async function notiziaToValutazione(
  notiziaId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autenticato')

  const { data: notizia } = await supabase
    .from('notizie')
    .select('*')
    .eq('id', notiziaId)
    .single()

  if (!notizia) throw new Error('Notizia non trovata')

  // Recupera i proprietari della notizia
  const { data: proprietari, error: proprietariError } = await supabase
    .from('notizie_proprietari')
    .select('cliente_id')
    .eq('notizia_id', notiziaId)

  if (proprietariError) {
    throw new Error(proprietariError.message)
  }

  // Crea la valutazione
  const { data: nuovaValutazione, error } = await supabase
    .from('valutazioni')
    .insert({
      notizia_id: notiziaId,
      immobile_id: notizia.immobile_id,
      agente_id: user.id,
      indirizzo: notizia.indirizzo || '',
      civico: notizia.civico,
      frazione: notizia.frazione,
      comune: notizia.comune,
      data_valutazione:
        (formData.get('data_valutazione') as string) ||
        new Date().toISOString().split('T')[0],
      prezzo_valutato: numOrNull(
        formData.get('prezzo_valutato')
      ),
      prezzo_richiesto: numOrNull(
        formData.get('prezzo_richiesto')
      ),
      prezzo_minimo: numOrNull(
        formData.get('prezzo_pubblicita')
      ),
      metratura: numOrNull(formData.get('metratura')),
      stato: (formData.get('stato') as string) || 'da_fare',
      note: formData.get('note') || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Copia i proprietari nella valutazione
  if (proprietari && proprietari.length > 0) {
    const { error: inserimentoProprietariError } = await supabase
      .from('valutazioni_proprietari')
      .insert(
        proprietari.map((proprietario) => ({
          valutazione_id: nuovaValutazione.id,
          cliente_id: proprietario.cliente_id,
        }))
      )

    if (inserimentoProprietariError) {
      throw new Error(inserimentoProprietariError.message)
    }
  }

  await supabase
    .from('notizie')
    .update({ stato: 'in_lavorazione' })
    .eq('id', notiziaId)

  redirect(`/valutazioni/${nuovaValutazione.id}`)
}

/**
 * VALUTAZIONE → INCARICO
 * Copia immobile_id e i proprietari dalla valutazione
 */
export async function valutazioneToIncarico(
  valutazioneId: string,
  formData: FormData
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autenticato')

  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select('*')
    .eq('id', valutazioneId)
    .single()

  if (!valutazione) throw new Error('Valutazione non trovata')

  // Recupera i proprietari della valutazione
  const { data: proprietari, error: proprietariError } = await supabase
    .from('valutazioni_proprietari')
    .select('cliente_id')
    .eq('valutazione_id', valutazioneId)

  if (proprietariError) {
    throw new Error(proprietariError.message)
  }

  // Crea l'incarico
  const { data: nuovoIncarico, error } = await supabase
    .from('incarichi')
    .insert({
      valutazione_id: valutazioneId,
      immobile_id: valutazione.immobile_id,
      agente_id: user.id,
      tipo: (formData.get('tipo') as string) || 'vendita',
      data_inizio:
        (formData.get('data_inizio') as string) ||
        new Date().toISOString().split('T')[0],
      data_scadenza: formData.get('data_scadenza') as string,
      prezzo: numOrNull(formData.get('prezzo')),
      prezzo_pubblicita: numOrNull(
        formData.get('prezzo_pubblicita')
      ),
      esclusivo: formData.get('esclusivo') === 'on',
      stato: (formData.get('stato') as string) || 'attivo',
      note: formData.get('note') || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Copia i proprietari nell'incarico
  if (proprietari && proprietari.length > 0) {
    const { error: inserimentoProprietariError } = await supabase
      .from('incarichi_proprietari')
      .insert(
        proprietari.map((proprietario) => ({
          incarico_id: nuovoIncarico.id,
          cliente_id: proprietario.cliente_id,
        }))
      )

    if (inserimentoProprietariError) {
      throw new Error(inserimentoProprietariError.message)
    }
  }

  await supabase
    .from('valutazioni')
    .update({ stato: 'fatta' })
    .eq('id', valutazioneId)

  redirect(`/incarichi/${nuovoIncarico.id}`)
}