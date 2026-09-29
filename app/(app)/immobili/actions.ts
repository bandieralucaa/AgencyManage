'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function numOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function categoriaDaTipo(tipo: string): string {
  const tipiCasa = ['appartamento', 'villa', 'villetta', 'rustico']
  return tipiCasa.includes(tipo) ? 'casa' : 'non_casa'
}

export async function creaImmobile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const tipo = formData.get('tipo') as string

  const { error } = await supabase.from('immobili').insert({
    tipo,
    categoria: categoriaDaTipo(tipo),
    indirizzo: formData.get('indirizzo') as string,
    civico: formData.get('civico') || null,
    frazione: formData.get('frazione') || null,
    comune: formData.get('comune') as string,
    cap: formData.get('cap') || null,
    provincia: formData.get('provincia') || null,
    piano: formData.get('piano') || null,
    interno: formData.get('interno') || null,
    scala: formData.get('scala') || null,
    metri_quadrati: numOrNull(formData.get('metri_quadrati')),
    vani: numOrNull(formData.get('vani')),
    camere: numOrNull(formData.get('camere')),
    bagni: numOrNull(formData.get('bagni')),
    stato: formData.get('stato') || null,
    classe_energetica: formData.get('classe_energetica') || null,
    riscaldamento: formData.get('riscaldamento') || null,
    anno_costruzione: numOrNull(formData.get('anno_costruzione')),
    prezzo: numOrNull(formData.get('prezzo')),
    spese_condominiali: numOrNull(formData.get('spese_condominiali')),
    descrizione: formData.get('descrizione') || null,
    note: formData.get('note') || null,
    agente_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath('/immobili')
  redirect('/immobili')
}

export async function aggiornaImmobile(id: string, formData: FormData) {
  const supabase = await createClient()

  const tipo = formData.get('tipo') as string

  const { error } = await supabase
    .from('immobili')
    .update({
      tipo,
      categoria: categoriaDaTipo(tipo),
      indirizzo: formData.get('indirizzo') as string,
      civico: formData.get('civico') || null,
      frazione: formData.get('frazione') || null,
      comune: formData.get('comune') as string,
      cap: formData.get('cap') || null,
      provincia: formData.get('provincia') || null,
      piano: formData.get('piano') || null,
      interno: formData.get('interno') || null,
      scala: formData.get('scala') || null,
      metri_quadrati: numOrNull(formData.get('metri_quadrati')),
      vani: numOrNull(formData.get('vani')),
      camere: numOrNull(formData.get('camere')),
      bagni: numOrNull(formData.get('bagni')),
      stato: formData.get('stato') || null,
      classe_energetica: formData.get('classe_energetica') || null,
      riscaldamento: formData.get('riscaldamento') || null,
      anno_costruzione: numOrNull(formData.get('anno_costruzione')),
      prezzo: numOrNull(formData.get('prezzo')),
      spese_condominiali: numOrNull(formData.get('spese_condominiali')),
      descrizione: formData.get('descrizione') || null,
      note: formData.get('note') || null,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/immobili')
  revalidatePath(`/immobili/${id}`)
  redirect(`/immobili/${id}`)
}

export async function eliminaImmobile(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('immobili').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/immobili')
  redirect('/immobili')
}

export async function toggleAttivoImmobile(id: string, attivo: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('immobili')
    .update({ attivo: !attivo })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/immobili')
}