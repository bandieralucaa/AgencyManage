import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaClienteButton from './elimina-button'
import ToggleAttivoButton from './toggle-attivo-button'

const TIPI: Record<string, string> = {
  venditore: 'Venditore',
  acquirente: 'Acquirente',
  inquilino: 'Inquilino',
  locatore: 'Locatore',
  entrambi: 'Entrambi',
}

export default async function ClientePage({
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

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/clienti" className="text-sm text-slate-400 hover:text-white">
          ← Torna ai clienti
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {cliente.cognome} {cliente.nome}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span>
                {cliente.tipologia === 'persona_giuridica'
                  ? 'Persona giuridica'
                  : 'Persona fisica'}
              </span>
              <span>·</span>
              <span>{TIPI[cliente.tipo] || cliente.tipo}</span>
              <span>·</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  cliente.attivo
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {cliente.attivo ? 'Attivo' : 'Archiviato'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/clienti/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <ToggleAttivoButton id={id} attivo={cliente.attivo} />
            <EliminaClienteButton id={id} nome={`${cliente.cognome} ${cliente.nome}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CONTATTI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Contatti</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Telefono</dt>
              <dd className="text-white mt-0.5">{cliente.telefono || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="text-white mt-0.5">{cliente.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">PEC</dt>
              <dd className="text-white mt-0.5">{cliente.pec || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* INDIRIZZO */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Indirizzo</h2>
          <p className="text-white">
            {cliente.indirizzo || '—'} {cliente.civico}
            <br />
            {cliente.cap} {cliente.comune} {cliente.provincia && `(${cliente.provincia})`}
          </p>
        </div>

        {/* DATI FISCALI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Dati fiscali</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Codice fiscale</dt>
              <dd className="text-white mt-0.5">{cliente.codice_fiscale || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Partita IVA</dt>
              <dd className="text-white mt-0.5">{cliente.partita_iva || '—'}</dd>
            </div>
          </dl>
        </div>

        {/* NOTE */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Note</h2>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {cliente.note || 'Nessuna nota.'}
          </p>
        </div>
      </div>
    </div>
  )
}