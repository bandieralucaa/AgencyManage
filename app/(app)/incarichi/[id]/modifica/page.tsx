import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaIncarico } from '../../actions'
import FormIncarico from '@/components/form-incarico'

export default async function ModificaIncaricoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: incarico } = await supabase
    .from('incarichi')
    .select('*')
    .eq('id', id)
    .single()

  if (!incarico) notFound()

  const { data: proprietari } = await supabase
  .from('incarichi_proprietari')
  .select('cliente_id')
  .eq('incarico_id', id)

  const aggiornaConId = aggiornaIncarico.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/incarichi/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna all&apos;incarico
        </Link>
        <h1 className="text-3xl font-bold mt-2">Modifica incarico</h1>
      </div>

      <FormIncarico
        incarico={incarico}
        proprietari={proprietari || []}
        action={aggiornaConId}
      />
    </div>
  )
}