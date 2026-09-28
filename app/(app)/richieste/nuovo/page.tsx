import Link from 'next/link'
import { creaRichiesta } from '../actions'
import FormRichiesta from '@/components/form-richiesta'

export default function NuovaRichiestaPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/richieste" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle richieste
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuova richiesta</h1>
        <p className="text-slate-400 mt-1">Compila i dati della richiesta.</p>
      </div>

      <FormRichiesta action={creaRichiesta} />
    </div>
  )
}