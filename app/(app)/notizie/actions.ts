'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function creaNotizia(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const clienteId = formData.get('cliente_id') as string

  const { error } = await supabase.from('notizie').insert({
    tipo_notizia: (formData.get('tipo_notizia') as string) || 'cliente_cerca',
    agente_id: user.id,
    cliente_id: clienteId || null,
    indirizzo: formData.get('indirizzo') || null,
    civico: formData.get('civico') || null,
    frazione: formData.get('frazione') || null,
    comune: formData.get('comune') || null,
    cap: formData.get('cap') || null,
    tipo: formData.get('tipo') as string,
    stato: (formData.get('stato') as string) || 'aperta',
    motivo_chiusura: formData.get('motivo_chiusura') || null,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/notizie')
  redirect('/notizie')
}

export async function aggiornaNotizia(id: string, formData: FormData) {
  const supabase = await createClient()

  const clienteId = formData.get('cliente_id') as string
  const stato = formData.get('stato') as string

  const update: any = {
    tipo_notizia: (formData.get('tipo_notizia') as string) || 'cliente_cerca',
    cliente_id: clienteId || null,
    indirizzo: formData.get('indirizzo') || null,
    civico: formData.get('civico') || null,
    frazione: formData.get('frazione') || null,
    comune: formData.get('comune') || null,
    cap: formData.get('cap') || null,
    tipo: formData.get('tipo') as string,
    stato,
  }

  if (stato.startsWith('chiusa_')) {
    update.motivo_chiusura = formData.get('motivo_chiusura') || null
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