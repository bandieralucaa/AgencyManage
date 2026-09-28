'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function creaCliente(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const { error } = await supabase.from('clienti').insert({
    tipologia: formData.get('tipologia') as string,
    tipo: formData.get('tipo') as string,
    nome: formData.get('nome') as string,
    cognome: formData.get('cognome') as string,
    partita_iva: formData.get('partita_iva') || null,
    codice_fiscale: formData.get('codice_fiscale') || null,
    indirizzo: formData.get('indirizzo') || null,
    civico: formData.get('civico') || null,
    comune: formData.get('comune') || null,
    cap: formData.get('cap') || null,
    provincia: formData.get('provincia') || null,
    telefono: formData.get('telefono') || null,
    email: formData.get('email') || null,
    pec: formData.get('pec') || null,
    note: formData.get('note') || null,
    agente_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/clienti')
  redirect('/clienti')
}

export async function aggiornaCliente(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clienti')
    .update({
      tipologia: formData.get('tipologia') as string,
      tipo: formData.get('tipo') as string,
      nome: formData.get('nome') as string,
      cognome: formData.get('cognome') as string,
      partita_iva: formData.get('partita_iva') || null,
      codice_fiscale: formData.get('codice_fiscale') || null,
      indirizzo: formData.get('indirizzo') || null,
      civico: formData.get('civico') || null,
      comune: formData.get('comune') || null,
      cap: formData.get('cap') || null,
      provincia: formData.get('provincia') || null,
      telefono: formData.get('telefono') || null,
      email: formData.get('email') || null,
      pec: formData.get('pec') || null,
      note: formData.get('note') || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/clienti')
  revalidatePath(`/clienti/${id}`)
  redirect(`/clienti/${id}`)
}

export async function eliminaCliente(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clienti').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clienti')
  redirect('/clienti')
}

export async function toggleAttivoCliente(id: string, attivo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('clienti')
    .update({ attivo: !attivo })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/clienti')
}