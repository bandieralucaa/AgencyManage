import Link from 'next/link'
import { creaCliente } from '../actions'
import FormCliente from '@/components/form-cliente'

export default function NuovoClientePage() {
  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/clienti" className="text-sm text-slate-400 hover:text-white">
          ← Torna ai clienti
        </Link>
        <h1 className="text-3xl font-bold mt-2">Nuovo cliente</h1>
        <p className="text-slate-400 mt-1">Compila i dati del nuovo cliente.</p>
      </div>

      <FormCliente action={creaCliente} />
    </div>
  )
}