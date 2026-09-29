import Link from 'next/link'
import { creaIncarico } from '../actions'
import FormIncarico from '@/components/form-incarico'

export default function NuovoIncaricoPage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/incarichi" className="text-sm text-slate-400 hover:text-white">
          ← Torna agli incarichi
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuovo incarico</h1>
        <p className="text-slate-400 mt-1">Compila i dati dell&apos;incarico.</p>
      </div>

      <FormIncarico action={creaIncarico} />
    </div>
  )
}