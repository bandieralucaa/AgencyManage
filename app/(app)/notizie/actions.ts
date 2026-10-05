'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function stringOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  return v as string
}

export async function creaNotizia(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const immobileId = stringOrNull(formData.get('immobile_id'))
  if (!immobileId) throw new Error('Immobile obbligatorio')

  // Copia indirizzo dall'immobile
  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune')
    .eq('id', immobileId)
    .maybeSingle()

  if (!immobile) throw new Error('Immobile non trovato')

  const { error } = await supabase.from('notizie').insert({
    tipo_notizia: formData.get('tipo_notizia') as string,
    immobile_id: immobileId,
    agente_id: user.id,
    cliente_id: stringOrNull(formData.get('cliente_id')),
    indirizzo: immobile.indirizzo,
    civico: immobile.civico,
    frazione: immobile.frazione,
    comune: immobile.comune,
    tipo: formData.get('tipo') as string,
    stato: (formData.get('stato') as string) || 'aperta',
    motivo_chiusura: stringOrNull(formData.get('motivo_chiusura')),
  })

  if (error) throw new Error(error.message)
  revalidatePath('/notizie')
  redirect('/notizie')
}

export async function aggiornaNotizia(id: string, formData: FormData) {
  const supabase = await createClient()

  const stato = formData.get('stato') as string
  const immobileId = stringOrNull(formData.get('immobile_id'))
  if (!immobileId) throw new Error('Immobile obbligatorio')

  // Copia indirizzo dall'immobile
  const { data: immobile } = await supabase
    .from('immobili')
    .select('indirizzo, civico, frazione, comune')
    .eq('id', immobileId)
    .maybeSingle()

  const update: any = {
    immobile_id: immobileId,
    cliente_id: stringOrNull(formData.get('cliente_id')),
    indirizzo: immobile?.indirizzo || null,
    civico: immobile?.civico || null,
    frazione: immobile?.frazione || null,
    comune: immobile?.comune || null,
    tipo: formData.get('tipo') as string,
    stato,
  }

  if (stato.startsWith('chiusa_')) {
    update.motivo_chiusura = stringOrNull(formData.get('motivo_chiusura'))
  } else {
    update.motivo_chiusura = null
  }

  const { error } = await supabase.from('notizie').update(update).eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/notizie')
  revalidatePath(`/notizie/${id}`)
  redirect(`/notizie/${id}`)
}

export async function eliminaNotizia(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('notizie').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/notizie')
  redirect('/notizie')
}