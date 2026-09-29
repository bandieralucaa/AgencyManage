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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string
  const clienteId = formData.get('cliente_id') as string

  if (!immobileId) throw new Error('Immobile obbligatorio')

  const { error } = await supabase.from('incarichi').insert({
    immobile_id: immobileId,
    cliente_id: clienteId || null,
    agente_id: user.id,
    tipo: formData.get('tipo') as string,
    data_inizio: formData.get('data_inizio') as string,
    data_scadenza: formData.get('data_scadenza') as string,
    prezzo: numOrNull(formData.get('prezzo')),
    esclusivo: formData.get('esclusivo') === 'on',
    stato: (formData.get('stato') as string) || 'attivo',
    note: formData.get('note') || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/incarichi')
  redirect('/incarichi')
}

export async function aggiornaIncarico(id: string, formData: FormData) {
  const supabase = await createClient()

  const immobileId = formData.get('immobile_id') as string
  const clienteId = formData.get('cliente_id') as string

  if (!immobileId) throw new Error('Immobile obbligatorio')

  const { error } = await supabase
    .from('incarichi')
    .update({
      immobile_id: immobileId,
      cliente_id: clienteId || null,
      tipo: formData.get('tipo') as string,
      data_inizio: formData.get('data_inizio') as string,
      data_scadenza: formData.get('data_scadenza') as string,
      prezzo: numOrNull(formData.get('prezzo')),
      esclusivo: formData.get('esclusivo') === 'on',
      stato: formData.get('stato') as string,
      note: formData.get('note') || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/incarichi')
  revalidatePath(`/incarichi/${id}`)
  redirect(`/incarichi/${id}`)
}

export async function eliminaIncarico(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('incarichi').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/incarichi')
  redirect('/incarichi')
}