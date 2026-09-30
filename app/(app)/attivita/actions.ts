'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function creaAttivita(data: {
  tipo: string
  motivo?: string
  descrizione: string
  data_attivita: string
  scadenza?: string
  entita?: string
  entita_id?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const insert: any = {
    agente_id: user.id,
    tipo: data.tipo,
    motivo: data.motivo || null,
    descrizione: data.descrizione,
    data_attivita: data.data_attivita,
    scadenza: data.scadenza || null,
    completata: false,
  }

  if (data.entita && data.entita_id) {
    if (data.entita === 'incarico') insert.incarico_id = data.entita_id
    if (data.entita === 'richiesta') insert.richiesta_id = data.entita_id
    if (data.entita === 'valutazione') insert.valutazione_id = data.entita_id
    if (data.entita === 'notizia') insert.notizia_id = data.entita_id
    if (data.entita === 'immobile') insert.immobile_id = data.entita_id
    if (data.entita === 'cliente') insert.cliente_id = data.entita_id
  }

  const { error } = await supabase.from('attivita').insert(insert)

  if (error) throw new Error(error.message)

  revalidatePath('/attivita')
  revalidatePath('/dashboard')
  if (data.entita && data.entita_id) {
    revalidatePath(`/${data.entita}s/${data.entita_id}`)
    revalidatePath(`/${data.entita}/${data.entita_id}`)
  }
}

export async function aggiornaAttivita(
  id: string,
  data: {
    tipo: string
    motivo?: string
    descrizione: string
    data_attivita: string
    scadenza?: string
    completata: boolean
    entita?: string
    entita_id?: string
  }
) {
  const supabase = await createClient()

  const update: any = {
    tipo: data.tipo,
    motivo: data.motivo || null,
    descrizione: data.descrizione,
    data_attivita: data.data_attivita,
    scadenza: data.scadenza || null,
    completata: data.completata,
  }

  const { error } = await supabase.from('attivita').update(update).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/attivita')
  revalidatePath('/dashboard')
  if (data.entita && data.entita_id) {
    revalidatePath(`/${data.entita}s/${data.entita_id}`)
    revalidatePath(`/${data.entita}/${data.entita_id}`)
  }
}

export async function toggleCompletata(id: string, completata: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('attivita')
    .update({ completata: !completata })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/attivita')
  revalidatePath('/dashboard')
}

export async function eliminaAttivita(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('attivita').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/attivita')
  revalidatePath('/dashboard')
}

export async function creaAttivitaEredirect(
  entita: string,
  entita_id: string,
  formData: FormData
) {
  await creaAttivita({
    tipo: formData.get('tipo') as string,
    motivo: formData.get('motivo') as string,
    descrizione: formData.get('descrizione') as string,
    data_attivita: formData.get('data_attivita') as string,
    scadenza: formData.get('scadenza') as string || undefined,
    entita,
    entita_id,
  })
  redirect(`/${entita}s/${entita_id}`)
}