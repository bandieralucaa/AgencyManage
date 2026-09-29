import Link from 'next/link'
import { creaNotizia } from '../actions'
import FormNotizia from '@/components/form-notizia'

export default function NuovaNotiziaPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/notizie" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle notizie
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuova notizia</h1>
        <p className="text-slate-400 mt-1">
          Registra una segnalazione: come sei venuto a conoscenza di un cliente o di un immobile.
        </p>
      </div>

      <FormNotizia action={creaNotizia} />
    </div>
  )
}