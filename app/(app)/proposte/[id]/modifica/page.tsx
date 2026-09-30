import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaProposta } from '../../actions'
import FormProposta from '@/components/form-proposta'

export default async function ModificaPropostaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('proposte')
    .select('*')
    .eq('id', id)
    .single()

  if (!proposta) notFound()

  const aggiornaConId = aggiornaProposta.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/proposte/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna alla proposta
        </Link>
        <h1 className="text-3xl font-bold mt-2">Modifica proposta</h1>
      </div>

      <FormProposta proposta={proposta} action={aggiornaConId} />
    </div>
  )
}