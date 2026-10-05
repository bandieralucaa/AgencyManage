'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function numOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function arrayOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  return (v as string).split(',').map((s) => s.trim()).filter(Boolean)
}

function stringOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  return v as string
}

export async function creaRichiesta(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { error } = await supabase.from('richieste').insert({
    cliente_id: formData.get('cliente_id') as string,
    cerca: formData.get('cerca') as string,
    stato: (formData.get('stato') as string) || 'nuova',
    frazioni_cercate: arrayOrNull(formData.get('frazioni_cercate')),
    tipologia: arrayOrNull(formData.get('tipologia')),
    locali_min: numOrNull(formData.get('locali_min')),
    locali_max: numOrNull(formData.get('locali_max')),
    mq_min: numOrNull(formData.get('mq_min')),
    mq_max: numOrNull(formData.get('mq_max')),
    bagni_min: numOrNull(formData.get('bagni_min')),
    stato_immobile: formData.get('stato_immobile') || null,
    tipo_stabile: formData.get('tipo_stabile') || null,
    accessori: arrayOrNull(formData.get('accessori')),
    riscaldamento: formData.get('riscaldamento') || null,
    prezzo_min: numOrNull(formData.get('prezzo_min')),
    prezzo_max: numOrNull(formData.get('prezzo_max')),
    mutuo: formData.get('mutuo') === 'on',
    mutuo_note: formData.get('mutuo_note') || null,
    note: formData.get('note') || null,
    agente_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/richieste')
  redirect('/richieste')
}

export async function aggiornaRichiesta(id: string, formData: FormData) {
  const supabase = await createClient()

  const stato = formData.get('stato') as string
  const motivoChiusura = formData.get('motivo_chiusura') as string

  const update: any = {
    cliente_id: formData.get('cliente_id') as string,
    cerca: formData.get('cerca') as string,
    stato,
    frazioni_cercate: arrayOrNull(formData.get('frazioni_cercate')),
    tipologia: arrayOrNull(formData.get('tipologia')),
    locali_min: numOrNull(formData.get('locali_min')),
    locali_max: numOrNull(formData.get('locali_max')),
    mq_min: numOrNull(formData.get('mq_min')),
    mq_max: numOrNull(formData.get('mq_max')),
    bagni_min: numOrNull(formData.get('bagni_min')),
    stato_immobile: formData.get('stato_immobile') || null,
    tipo_stabile: formData.get('tipo_stabile') || null,
    accessori: arrayOrNull(formData.get('accessori')),
    riscaldamento: formData.get('riscaldamento') || null,
    prezzo_min: numOrNull(formData.get('prezzo_min')),
    prezzo_max: numOrNull(formData.get('prezzo_max')),
    mutuo: formData.get('mutuo') === 'on',
    mutuo_note: formData.get('mutuo_note') || null,
    note: formData.get('note') || null,
  }

  if (stato.startsWith('chiusa_')) {
    update.data_chiusura = new Date().toISOString().split('T')[0]
    update.motivo_chiusura = motivoChiusura || null
  } else {
    update.data_chiusura = null
    update.motivo_chiusura = null
  }

  const { error } = await supabase.from('richieste').update(update).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/richieste')
  revalidatePath(`/richieste/${id}`)
  redirect(`/richieste/${id}`)
}

export async function eliminaRichiesta(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('richieste').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/richieste')
  redirect('/richieste')
}