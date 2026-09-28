import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaRichiesta } from '../../actions'
import FormRichiesta from '@/components/form-richiesta'

export default async function ModificaRichiestaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: richiesta } = await supabase
    .from('richieste')
    .select('*')
    .eq('id', id)
    .single()

  if (!richiesta) notFound()

  const aggiornaConId = aggiornaRichiesta.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/richieste/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna alla richiesta
        </Link>
        <h1 className="text-3xl font-bold mt-2">Modifica richiesta</h1>
      </div>

      <FormRichiesta richiesta={richiesta} action={aggiornaConId} />
    </div>
  )
}