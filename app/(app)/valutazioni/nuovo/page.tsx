import Link from 'next/link'
import { creaValutazione } from '../actions'
import FormValutazione from '@/components/form-valutazione'

export default function NuovaValutazionePage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/valutazioni" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle valutazioni
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuova valutazione</h1>
        <p className="text-slate-400 mt-1">Compila i dati della valutazione.</p>
      </div>

      <FormValutazione action={creaValutazione} />
    </div>
  )
}