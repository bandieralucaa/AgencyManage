import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaValutazione } from '../../actions'
import FormValutazione from '@/components/form-valutazione'

export default async function ModificaValutazionePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select('*')
    .eq('id', id)
    .single()

  if (!valutazione) notFound()

  const aggiornaConId = aggiornaValutazione.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/valutazioni/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna alla valutazione
        </Link>
        <h1 className="text-3xl font-bold mt-2">
          Modifica {valutazione.indirizzo} {valutazione.civico}
        </h1>
      </div>

      <FormValutazione valutazione={valutazione} action={aggiornaConId} />
    </div>
  )
}