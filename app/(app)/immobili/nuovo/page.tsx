import Link from 'next/link'
import { creaImmobile } from '../actions'
import FormImmobile from '@/components/form-immobile'

export default function NuovoImmobilePage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/immobili" className="text-sm text-slate-400 hover:text-white">
          ← Torna agli immobili
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuovo immobile</h1>
        <p className="text-slate-400 mt-1">Compila i dati dell&apos;immobile.</p>
      </div>

      <FormImmobile action={creaImmobile} />
    </div>
  )
}