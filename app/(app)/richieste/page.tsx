import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RicercaRichieste from '@/components/ricerca-richieste'

const STATI: Record<string, { label: string; colore: string }> = {
  nuova: { label: 'Nuova', colore: 'bg-blue-500/20 text-blue-400' },
  in_corso: { label: 'In corso', colore: 'bg-amber-500/20 text-amber-400' },
  sospesa: { label: 'Sospesa', colore: 'bg-slate-500/20 text-slate-400' },
  chiusa_trovato: { label: 'Chiusa · Trovato', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_comprato_altri: { label: 'Chiusa · Comprato altri', colore: 'bg-purple-500/20 text-purple-400' },
  chiusa_non_cerca_piu: { label: 'Chiusa · Non cerca più', colore: 'bg-slate-700 text-slate-400' },
}

const CERCA_LABEL: Record<string, string> = {
  vendita: 'Vendita',
  locazione: 'Locazione',
  nuda_proprieta: 'Nuda proprietà',
}

export default async function RichiestePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cerca?: string; stato?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('richieste')
    .select(`
      id, cerca, stato, zona_cercata, comuni_cercati, frazioni_cercate,
      locali_min, locali_max, mq_min, mq_max,
      prezzo_min, prezzo_max, data_inserimento,
      clienti (id, nome, cognome, telefono)
    `)
    .order('data_inserimento', { ascending: false })

  if (params.q) {
    query = query.or(`zona_cercata.ilike.%${params.q}%`)
  }
  if (params.cerca) query = query.eq('cerca', params.cerca)
  if (params.stato) query = query.eq('stato', params.stato)

  const { data: richieste } = await query

  function formatData(data: string) {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function prezzoRange(r: any) {
    const min = r.prezzo_min
    const max = r.prezzo_max
    if (min && max) {
      return `€ ${Number(min).toLocaleString('it-IT')} - € ${Number(max).toLocaleString('it-IT')}`
    }
    if (min) return `da € ${Number(min).toLocaleString('it-IT')}`
    if (max) return `fino a € ${Number(max).toLocaleString('it-IT')}`
    return 'Budget non specificato'
  }

  function localiRange(r: any) {
    if (r.locali_min && r.locali_max) return `${r.locali_min}-${r.locali_max} locali`
    if (r.locali_min) return `da ${r.locali_min} locali`
    if (r.locali_max) return `fino a ${r.locali_max} locali`
    return null
  }

  function mqRange(r: any) {
    if (r.mq_min && r.mq_max) return `${r.mq_min}-${r.mq_max} mq`
    if (r.mq_min) return `da ${r.mq_min} mq`
    if (r.mq_max) return `fino a ${r.mq_max} mq`
    return null
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Richieste</h1>
          <p className="text-slate-400 mt-1">
            {richieste?.length || 0} {richieste?.length === 1 ? 'richiesta' : 'richieste'} trovate
          </p>
        </div>
        <Link
          href="/richieste/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuova richiesta
        </Link>
      </div>

      <RicercaRichieste />

      {richieste && richieste.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Ricerca</th>
                <th className="px-5 py-3 font-medium w-44">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {richieste.map((r: any) => {
                const cli = Array.isArray(r.clienti) ? r.clienti[0] : r.clienti
                const stato = STATI[r.stato] || { label: r.stato, colore: 'bg-slate-700 text-slate-300' }
                const locali = localiRange(r)
                const mq = mqRange(r)
                return (
                  <tr
                    key={r.id}
                    className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="px-5 py-3 align-top">
                      <div className="font-medium">
                        {cli ? `${cli.cognome} ${cli.nome}` : '—'}
                      </div>
                      {cli?.telefono && (
                        <div className="text-xs text-slate-500 mt-0.5">{cli.telefono}</div>
                      )}
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatData(r.data_inserimento)}
                      </div>
                    </td>

                    <td className="px-5 py-3 align-top">
                      <div className="text-sm text-slate-300">
                        {CERCA_LABEL[r.cerca] || r.cerca || '—'}
                      </div>
                        {r.zona_cercata && (
                        <div className="text-xs text-slate-400 mt-0.5">{r.zona_cercata}</div>
                      )}
                      {r.frazioni_cercate && r.frazioni_cercate.length > 0 && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {r.frazioni_cercate.join(', ')}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 mt-1 flex gap-3 flex-wrap">
                        {locali && <span>{locali}</span>}
                        {mq && <span>{mq}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {prezzoRange(r)}
                      </div>
                    </td>

                    <td className="px-5 py-3 align-top">
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stato.colore}`}>
                        {stato.label}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-right align-top">
                      <Link
                        href={`/richieste/${r.id}`}
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
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">
            {params.q || params.cerca || params.stato
              ? 'Nessuna richiesta trovata'
              : 'Nessuna richiesta'}
          </h2>
          <p className="text-slate-400 mb-6">
            {params.q || params.cerca || params.stato
              ? 'Prova a modificare i filtri di ricerca.'
              : 'Inizia aggiungendo la prima richiesta.'}
          </p>
          {!params.q && !params.cerca && !params.stato && (
            <Link
              href="/richieste/nuovo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + Aggiungi richiesta
            </Link>
          )}
        </div>
      )}
    </div>
  )
}