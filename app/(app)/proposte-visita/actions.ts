'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function stringOrNull(v: FormDataEntryValue | null) {
  if (!v || v === '') return null
  return v as string
}

export async function creaPropostaVisita(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autenticato')

  const richiestaId = formData.get('richiesta_id') as string
  const immobileId = formData.get('immobile_id') as string

  if (!richiestaId || !immobileId) {
    throw new Error('Richiesta e immobile obbligatori')
  }

  const { error } = await supabase.from('proposte_visita').insert({
    richiesta_id: richiestaId,
    immobile_id: immobileId,
    cliente_id: stringOrNull(formData.get('cliente_id')),
    agente_id: user.id,
    stato: 'proposta',
    data_proposta: new Date().toISOString().split('T')[0],
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/richieste/${richiestaId}`)
  revalidatePath(`/immobili/${immobileId}`)
}

export async function rispondiPropostaVisita(
  id: string,
  stato: 'accettata' | 'rifiutata',
  motivoRifiuto?: string
) {
  const supabase = await createClient()

  const update: any = {
    stato,
    data_risposta: new Date().toISOString().split('T')[0],
  }

  if (stato === 'rifiutata') {
    if (!motivoRifiuto || motivoRifiuto.trim() === '') {
      throw new Error('Devi indicare un motivo per il rifiuto')
    }
    update.motivo_rifiuto = motivoRifiuto.trim()
  } else {
    update.motivo_rifiuto = null
  }

  const { data, error } = await supabase
    .from('proposte_visita')
    .update(update)
    .eq('id', id)
    .select('richiesta_id, immobile_id')
    .single()

  if (error) throw new Error(error.message)

  if (data?.richiesta_id) revalidatePath(`/richieste/${data.richiesta_id}`)
  if (data?.immobile_id) revalidatePath(`/immobili/${data.immobile_id}`)
}

export async function eliminaPropostaVisita(id: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('proposte_visita')
    .select('richiesta_id, immobile_id')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('proposte_visita').delete().eq('id', id)
  if (error) throw new Error(error.message)

  if (data?.richiesta_id) revalidatePath(`/richieste/${data.richiesta_id}`)
  if (data?.immobile_id) revalidatePath(`/immobili/${data.immobile_id}`)
}