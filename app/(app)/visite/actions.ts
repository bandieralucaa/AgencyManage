'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function stringOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  return v as string
}

export async function creaVisita(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const immobileId = formData.get('immobile_id') as string
  if (!immobileId) throw new Error('Immobile obbligatorio')

  // Recupera l'incarico attivo collegato all'immobile (se esiste)
  const { data: incarico } = await supabase
    .from('incarichi')
    .select('id')
    .eq('immobile_id', immobileId)
    .eq('stato', 'attivo')
    .maybeSingle()

  const { error } = await supabase.from('visite').insert({
    richiesta_id: stringOrNull(formData.get('richiesta_id')),
    immobile_id: immobileId,
    incarico_id: incarico?.id || null,
    cliente_id: stringOrNull(formData.get('cliente_id')),
    agente_id: user.id,
    data_visita: (formData.get('data_visita') as string) || new Date().toISOString().split('T')[0],
    note: stringOrNull(formData.get('note')),
  })

  if (error) throw new Error(error.message)

  const richiestaId = formData.get('richiesta_id') as string
  if (richiestaId) revalidatePath(`/richieste/${richiestaId}`)
  revalidatePath(`/immobili/${immobileId}`)
  if (incarico?.id) revalidatePath(`/incarichi/${incarico.id}`)
}

export async function aggiornaVisita(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('visite')
    .update({
      data_visita: formData.get('data_visita') as string,
      note: stringOrNull(formData.get('note')),
    })
    .eq('id', id)
    .select('richiesta_id, immobile_id, incarico_id')
    .single()

  if (error) throw new Error(error.message)

  if (data?.richiesta_id) revalidatePath(`/richieste/${data.richiesta_id}`)
  if (data?.immobile_id) revalidatePath(`/immobili/${data.immobile_id}`)
  if (data?.incarico_id) revalidatePath(`/incarichi/${data.incarico_id}`)
}

export async function eliminaVisita(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('visite')
    .select('richiesta_id, immobile_id, incarico_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('visite').delete().eq('id', id)
  if (error) throw new Error(error.message)

  if (data?.richiesta_id) revalidatePath(`/richieste/${data.richiesta_id}`)
  if (data?.immobile_id) revalidatePath(`/immobili/${data.immobile_id}`)
  if (data?.incarico_id) revalidatePath(`/incarichi/${data.incarico_id}`)
}