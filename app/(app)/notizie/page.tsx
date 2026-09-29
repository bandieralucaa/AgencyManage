import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RicercaNotizie from '@/components/ricerca-notizie'

const STATI: Record<string, { label: string; colore: string }> = {
  aperta: { label: 'Aperta', colore: 'bg-blue-500/20 text-blue-400' },
  in_lavorazione: { label: 'In lavorazione', colore: 'bg-amber-500/20 text-amber-400' },
  chiusa_positiva: { label: 'Chiusa +', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_negativa: { label: 'Chiusa -', colore: 'bg-slate-700 text-slate-400' },
}

const TIPI: Record<string, string> = {
  agenzia: 'Agenzia',
  passaparola: 'Passaparola',
  incontro: 'Incontro',
  telefono: 'Telefono',
  email: 'Email',
  social: 'Social',
  altro: 'Altro',
}

export default async function NotiziePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; stato?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('notizie')
    .select(`
      id, tipo, stato, indirizzo, civico, frazione, comune, created_at,
      agenti (nome, cognome),
      clienti (id, nome, cognome)
    `)
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(
      `indirizzo.ilike.%${params.q}%,comune.ilike.%${params.q}%`
    )
  }
  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.stato) query = query.eq('stato', params.stato)

  const { data: notizie } = await query

  function formatData(data: string) {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notizie</h1>
          <p className="text-slate-400 mt-1">
            {notizie?.length || 0}{' '}
            {notizie?.length === 1 ? 'notizia' : 'notizie'} trovate
          </p>
        </div>
        <Link
          href="/notizie/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuova notizia
        </Link>
      </div>

      <RicercaNotizie />

      {notizie && notizie.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Data / Agente</th>
                <th className="px-5 py-3 font-medium">Notizia</th>
                <th className="px-5 py-3 font-medium w-44">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {notizie.map((n: any) => {
                const ag = Array.isArray(n.agenti) ? n.agenti[0] : n.agenti
                const cli = Array.isArray(n.clienti) ? n.clienti[0] : n.clienti
                const stato = STATI[n.stato] || {
                  label: n.stato,
                  colore: 'bg-slate-700 text-slate-300',
                }
                return (
                  <tr
                    key={n.id}
                    className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                  >
                    {/* DATA + AGENTE */}
                    <td className="px-5 py-3 align-top">
                      <div className="text-sm text-white">
                        {formatData(n.created_at)}
                      </div>
                      {ag && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          da {ag.nome} {ag.cognome}
                        </div>
                      )}
                    </td>

                    {/* NOTIZIA: tipo + indirizzo + cliente + descrizione */}
                    <td className="px-5 py-3 align-top">
                      <div className="text-sm text-white">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 mr-2">
                          {TIPI[n.tipo] || n.tipo || '—'}
                        </span>
                        {n.indirizzo && (
                          <span className="font-medium">
                            {n.indirizzo} {n.civico}
                          </span>
                        )}
                      </div>
                      {n.indirizzo && (n.frazione || n.comune) && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {n.frazione && `${n.frazione}, `}
                          {n.comune}
                        </div>
                      )}
                      {cli && (
                        <div className="text-xs text-slate-400 mt-1">
                          Cliente:{' '}
                          <Link
                            href={`/clienti/${cli.id}`}
                            className="text-blue-400 hover:underline"
                          >
                            {cli.cognome} {cli.nome}
                          </Link>
                        </div>
                      )}
                    </td>

                    {/* STATO */}
                    <td className="px-5 py-3 align-top">
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stato.colore}`}
                      >
                        {stato.label}
                      </span>
                    </td>

                    {/* DETTAGLI */}
                    <td className="px-5 py-3 text-right align-top">
                      <Link
                        href={`/notizie/${n.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700 px-2.5 py-1.5 rounded transition-colors"
                        title="Apri dettaglio"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        Dettagli
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">📰</div>
          <h2 className="text-xl font-semibold mb-2">
            {params.q || params.tipo || params.stato
              ? 'Nessuna notizia trovata'
              : 'Nessuna notizia'}
          </h2>
          <p className="text-slate-400 mb-6">
            {params.q || params.tipo || params.stato
              ? 'Prova a modificare i filtri di ricerca.'
              : 'Inizia aggiungendo la tua prima segnalazione.'}
          </p>
          {!params.q && !params.tipo && !params.stato && (
            <Link
              href="/notizie/nuovo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + Aggiungi notizia
            </Link>
          )}
        </div>
      )}
    </div>
  )
}