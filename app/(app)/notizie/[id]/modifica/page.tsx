import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaNotizia } from '../../actions'
import FormNotizia from '@/components/form-notizia'

export default async function ModificaNotiziaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: notizia } = await supabase
    .from('notizie')
    .select('*')
    .eq('id', id)
    .single()

  if (!notizia) notFound()

  const aggiornaConId = aggiornaNotizia.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/notizie/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna alla notizia
        </Link>
        <h1 className="text-3xl font-bold mt-2">Modifica notizia</h1>
      </div>

      <FormNotizia notizia={notizia} action={aggiornaConId} />
    </div>
  )
}