'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function numOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

export async function creaIncarico(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Non autenticato')

  const stato = (formData.get('stato') as string) || 'attivo'

  const proprietari = formData.getAll('proprietari')

  const proprietariValidi = [
    ...new Set(
      proprietari
        .map((clienteId) => String(clienteId))
        .filter(Boolean)
    ),
  ].slice(0, 2)

  const insertData: any = {
    agente_id: user.id,
    tipo: formData.get('tipo') as string,
    data_inizio: formData.get('data_inizio') as string,
    data_scadenza: formData.get('data_scadenza') as string,
    seconda_data_scadenza:
      formData.get('seconda_data_scadenza') || null,
    prezzo: numOrNull(formData.get('prezzo')),
    prezzo_pubblicita: numOrNull(
      formData.get('prezzo_pubblicita')
    ),
    spese_condominiali: numOrNull(
      formData.get('spese_condominiali')
    ),
    esclusivo: formData.get('esclusivo') === 'si',
    stato,
    note: formData.get('note') || null,
  }

  if (stato !== 'attivo') {
    insertData.data_chiusura =
      formData.get('data_chiusura') ||
      new Date().toISOString().split('T')[0]

    insertData.motivo_chiusura =
      formData.get('motivo_chiusura') || null
  }

  const { data: nuovoIncarico, error } = await supabase
    .from('incarichi')
    .insert(insertData)
    .select('id')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (proprietariValidi.length > 0) {
    const { error: proprietariError } = await supabase
      .from('incarichi_proprietari')
      .insert(
        proprietariValidi.map((clienteId) => ({
          incarico_id: nuovoIncarico.id,
          cliente_id: clienteId,
        }))
      )

    if (proprietariError) {
      throw new Error(proprietariError.message)
    }
  }

  revalidatePath('/incarichi')
  redirect('/incarichi')
}

export async function aggiornaIncarico(
  id: string,
  formData: FormData
) {
  const supabase = await createClient()

  const stato = formData.get('stato') as string

  const proprietari = formData.getAll('proprietari')

  const proprietariValidi = [
    ...new Set(
      proprietari
        .map((clienteId) => String(clienteId))
        .filter(Boolean)
    ),
  ].slice(0, 2)

  const update: any = {
    tipo: formData.get('tipo') as string,
    data_inizio: formData.get('data_inizio') as string,
    data_scadenza: formData.get('data_scadenza') as string,
    seconda_data_scadenza:
      formData.get('seconda_data_scadenza') || null,
    prezzo: numOrNull(formData.get('prezzo')),
    prezzo_pubblicita: numOrNull(
      formData.get('prezzo_pubblicita')
    ),
    spese_condominiali: numOrNull(
      formData.get('spese_condominiali')
    ),
    esclusivo: formData.get('esclusivo') === 'si',
    stato,
    note: formData.get('note') || null,
  }

  if (stato !== 'attivo') {
    update.data_chiusura =
      formData.get('data_chiusura') ||
      new Date().toISOString().split('T')[0]

    update.motivo_chiusura =
      formData.get('motivo_chiusura') || null
  } else {
    update.data_chiusura = null
    update.motivo_chiusura = null
  }

  const { error } = await supabase
    .from('incarichi')
    .update(update)
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  // Elimina i vecchi proprietari
  const { error: deleteProprietariError } = await supabase
    .from('incarichi_proprietari')
    .delete()
    .eq('incarico_id', id)

  if (deleteProprietariError) {
    throw new Error(deleteProprietariError.message)
  }

  // Inserisce i nuovi proprietari
  if (proprietariValidi.length > 0) {
    const { error: insertProprietariError } = await supabase
      .from('incarichi_proprietari')
      .insert(
        proprietariValidi.map((clienteId) => ({
          incarico_id: id,
          cliente_id: clienteId,
        }))
      )

    if (insertProprietariError) {
      throw new Error(insertProprietariError.message)
    }
  }

  revalidatePath('/incarichi')
  revalidatePath(`/incarichi/${id}`)
  redirect(`/incarichi/${id}`)
}

export async function eliminaIncarico(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('incarichi')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/incarichi')
  redirect('/incarichi')
}