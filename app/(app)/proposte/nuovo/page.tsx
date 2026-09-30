import Link from 'next/link'
import { creaProposta } from '../actions'
import FormProposta from '@/components/form-proposta'

export default async function NuovaPropostaPage({
  searchParams,
}: {
  searchParams: Promise<{ immobile_id?: string; richiesta_id?: string }>
}) {
  const params = await searchParams

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/proposte" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle proposte
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuova proposta</h1>
        <p className="text-slate-400 mt-1">
          Registra una visita o una proposta di un cliente su un immobile.
        </p>
      </div>

      <FormProposta
        immobilePreselezionato={params.immobile_id}
        richiestaPreselezionata={params.richiesta_id}
        action={creaProposta}
      />
    </div>
  )
}