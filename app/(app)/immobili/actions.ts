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

/**
 * Se la via non esiste in `vie` per quella frazione, la aggiunge.
 */
async function salvaViaSeNonEsiste(
  supabase: any,
  nomeVia: string,
  frazioneId: string
) {
  if (!nomeVia || !frazioneId) return

  const { data: esistente } = await supabase
    .from('vie')
    .select('id')
    .eq('nome', nomeVia.trim())
    .eq('frazione_id', frazioneId)
    .maybeSingle()

  if (!esistente) {
    await supabase.from('vie').insert({
      nome: nomeVia.trim(),
      frazione_id: frazioneId,
    })
  }
}

export async function creaImmobile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const tipo = formData.get('tipo') as string
  const indirizzo = formData.get('indirizzo') as string
  const frazioneId = formData.get('frazione_id') as string

  // Aggiungi la via se non esiste
  if (indirizzo && frazioneId) {
    await salvaViaSeNonEsiste(supabase, indirizzo, frazioneId)
  }

  const { error } = await supabase.from('immobili').insert({
    tipo,
    categoria: categoriaDaTipo(tipo),
    indirizzo,
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
  const indirizzo = formData.get('indirizzo') as string
  const frazioneId = formData.get('frazione_id') as string

  // Aggiungi la via se non esiste
  if (indirizzo && frazioneId) {
    await salvaViaSeNonEsiste(supabase, indirizzo, frazioneId)
  }

  const { error } = await supabase
    .from('immobili')
    .update({
      tipo,
      categoria: categoriaDaTipo(tipo),
      indirizzo,
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