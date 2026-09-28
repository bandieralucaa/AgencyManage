import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { aggiornaCliente } from '../../actions'
import FormCliente from '@/components/form-cliente'

export default async function ModificaClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cliente } = await supabase
    .from('clienti')
    .select('*')
    .eq('id', id)
    .single()

  if (!cliente) notFound()

  const aggiornaConId = aggiornaCliente.bind(null, id)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link
          href={`/clienti/${id}`}
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Torna al cliente
        </Link>
        <h1 className="text-3xl font-bold mt-2">
          Modifica {cliente.cognome} {cliente.nome}
        </h1>
      </div>

      <FormCliente cliente={cliente} action={aggiornaConId} />
    </div>
  )
}