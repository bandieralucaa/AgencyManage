'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type DatiVisita = {
  richiesta_id: string
  immobile_id?: string
  cliente_id?: string
  data_visita: string
  ora_visita?: string
  esito: 'piace' | 'non_piace'
  motivo_rifiuto?: string
  note?: string
}

type Risultato = {
  ok: boolean
  errore?: string
}

export async function creaVisita(data: DatiVisita): Promise<Risultato> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, errore: 'Non autenticato' }
  }

  if (!data.data_visita) {
    return { ok: false, errore: 'La data della visita è obbligatoria' }
  }

  if (!['piace', 'non_piace'].includes(data.esito)) {
    return { ok: false, errore: 'Esito della visita non valido' }
  }

  // Se è presente un immobile, recupera l'incarico collegato.
  let incaricoId: string | null = null

  if (data.immobile_id) {
    const { data: incarico } = await supabase
      .from('incarichi')
      .select('id')
      .eq('immobile_id', data.immobile_id)
      .in('stato', ['attivo', 'in_trattativa'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    incaricoId = incarico?.id || null
  }

  const { error } = await supabase.from('visite').insert({
    richiesta_id: data.richiesta_id,
    immobile_id: data.immobile_id || null,
    incarico_id: incaricoId,
    cliente_id: data.cliente_id || null,
    agente_id: user.id,
    data_visita: data.data_visita,
    ora_visita: data.ora_visita || null,
    esito: data.esito,
    motivo_rifiuto:
      data.esito === 'non_piace'
        ? data.motivo_rifiuto?.trim() || null
        : null,
    note: data.note?.trim() || null,
  })

  if (error) {
    return { ok: false, errore: error.message }
  }

  revalidatePath(`/richieste/${data.richiesta_id}`)

  if (data.immobile_id) {
    revalidatePath(`/immobili/${data.immobile_id}`)
  }

  if (incaricoId) {
    revalidatePath(`/incarichi/${incaricoId}`)
  }

  return { ok: true }
}

export async function aggiornaVisita(
  id: string,
  richiestaId: string,
  data: {
    immobile_id?: string
    data_visita: string
    ora_visita?: string
    esito: 'piace' | 'non_piace'
    motivo_rifiuto?: string
    note?: string
  }
): Promise<Risultato> {
  const supabase = await createClient()

  if (!data.data_visita) {
    return { ok: false, errore: 'La data della visita è obbligatoria' }
  }

  if (!['piace', 'non_piace'].includes(data.esito)) {
    return { ok: false, errore: 'Esito della visita non valido' }
  }

  // Recupera i dati attuali prima dell'aggiornamento
  // per poter ricaricare correttamente le pagine coinvolte.
  const { data: visitaEsistente, error: erroreLettura } = await supabase
    .from('visite')
    .select('immobile_id, incarico_id')
    .eq('id', id)
    .maybeSingle()

  if (erroreLettura) {
    return { ok: false, errore: erroreLettura.message }
  }

  const { error } = await supabase
    .from('visite')
    .update({
      immobile_id: data.immobile_id || null,
      data_visita: data.data_visita,
      ora_visita: data.ora_visita || null,
      esito: data.esito,
      motivo_rifiuto:
        data.esito === 'non_piace'
          ? data.motivo_rifiuto?.trim() || null
          : null,
      note: data.note?.trim() || null,
    })
    .eq('id', id)

  if (error) {
    return { ok: false, errore: error.message }
  }

  revalidatePath(`/richieste/${richiestaId}`)

  if (data.immobile_id) {
    revalidatePath(`/immobili/${data.immobile_id}`)
  }

  if (visitaEsistente?.immobile_id) {
    revalidatePath(`/immobili/${visitaEsistente.immobile_id}`)
  }

  if (visitaEsistente?.incarico_id) {
    revalidatePath(`/incarichi/${visitaEsistente.incarico_id}`)
  }

  return { ok: true }
}

export async function eliminaVisita(
  id: string,
  richiestaId: string
): Promise<Risultato> {
  const supabase = await createClient()

  const { data, error: erroreLettura } = await supabase
    .from('visite')
    .select('immobile_id, incarico_id')
    .eq('id', id)
    .maybeSingle()

  if (erroreLettura) {
    return { ok: false, errore: erroreLettura.message }
  }

  const { error } = await supabase
    .from('visite')
    .delete()
    .eq('id', id)

  if (error) {
    return { ok: false, errore: error.message }
  }

  revalidatePath(`/richieste/${richiestaId}`)

  if (data?.immobile_id) {
    revalidatePath(`/immobili/${data.immobile_id}`)
  }

  if (data?.incarico_id) {
    revalidatePath(`/incarichi/${data.incarico_id}`)
  }

  return { ok: true }
}