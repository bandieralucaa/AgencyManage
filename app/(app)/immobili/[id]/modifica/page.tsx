import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaImmobile } from '../../actions'
import FormImmobile from '@/components/form-immobile'

export default async function ModificaImmobilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: immobile } = await supabase
    .from('immobili')
    .select('*')
    .eq('id', id)
    .single()

  if (!immobile) notFound()

  const aggiornaConId = aggiornaImmobile.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/immobili/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna all&apos;immobile
        </Link>
        <h1 className="text-3xl font-bold mt-2">
          Modifica {immobile.indirizzo} {immobile.civico}
        </h1>
      </div>

      <FormImmobile immobile={immobile} action={aggiornaConId} />
    </div>
  )
}