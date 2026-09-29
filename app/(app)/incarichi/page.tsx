import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RicercaIncarichi from '@/components/ricerca-incarichi'

const STATI: Record<string, { label: string; colore: string }> = {
  attivo: { label: '🟢 Attivo', colore: 'bg-emerald-500/20 text-emerald-400' },
  concluso_bene: { label: '✅ Concluso bene', colore: 'bg-blue-500/20 text-blue-400' },
  concluso_male: { label: '❌ Concluso male', colore: 'bg-red-500/20 text-red-400' },
}

const MOTIVI_CHIUSURA: Record<string, string> = {
  venduto_altrove: 'Venduto altrove',
  ritirato_cliente: 'Ritirato dal cliente',
  scaduto: 'Scaduto',
  altro: 'Altro',
}

export default async function IncarichiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; stato?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('incarichi')
    .select(`
      id, tipo, stato, data_inizio, data_scadenza, prezzo, esclusivo,
      data_chiusura, motivo_chiusura,
      immobili (id, indirizzo, civico, comune, frazione),
      clienti (id, nome, cognome)
    `)
    .order('data_scadenza', { ascending: true })

  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.stato) query = query.eq('stato', params.stato)

  const { data: incarichi } = await query

  function formatData(data: string) {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function giorniAllaScadenza(dataScadenza: string) {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const scad = new Date(dataScadenza)
    scad.setHours(0, 0, 0, 0)
    return Math.ceil((scad.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24))
  }

  function coloreScadenza(giorni: number) {
    if (giorni < 0) return 'bg-red-500/20 text-red-400'
    if (giorni <= 30) return 'bg-amber-500/20 text-amber-400'
    if (giorni <= 90) return 'bg-blue-500/20 text-blue-400'
    return 'bg-slate-700 text-slate-300'
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Incarichi</h1>
          <p className="text-slate-400 mt-1">
            {incarichi?.length || 0} {incarichi?.length === 1 ? 'incarico' : 'incarichi'} trovati
          </p>
        </div>
        <Link
          href="/incarichi/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuovo incarico
        </Link>
      </div>

      <RicercaIncarichi />

      {incarichi && incarichi.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Immobile</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Prezzo</th>
                <th className="px-5 py-3 font-medium">Scadenza / Chiusura</th>
                <th className="px-5 py-3 font-medium w-44">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {incarichi.map((i: any) => {
                const imm = Array.isArray(i.immobili) ? i.immobili[0] : i.immobili
                const cli = Array.isArray(i.clienti) ? i.clienti[0] : i.clienti
                const stato = STATI[i.stato] || { label: i.stato, colore: 'bg-slate-700 text-slate-300' }
                const giorni = giorniAllaScadenza(i.data_scadenza)
                const isAttivo = i.stato === 'attivo'

                return (
                  <tr
                    key={i.id}
                    className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">
                        {imm ? `${imm.indirizzo} ${imm.civico || ''}` : '—'}
                      </div>
                      {imm && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {imm.frazione && `${imm.frazione}, `}
                          {imm.comune}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {cli ? `${cli.cognome} ${cli.nome}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300 capitalize">
                      {i.tipo}
                      {i.esclusivo && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                          Esclusiva
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {i.prezzo
                        ? `€ ${Number(i.prezzo).toLocaleString('it-IT')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {isAttivo ? (
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${coloreScadenza(giorni)}`}
                        >
                          {formatData(i.data_scadenza)}
                          {giorni >= 0 && giorni <= 90 && (
                            <span className="ml-1">({giorni}gg)</span>
                          )}
                          {giorni < 0 && <span className="ml-1">(scaduto)</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {i.data_chiusura ? formatData(i.data_chiusura) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stato.colore}`}>
                          {stato.label}
                        </span>
                        {i.stato === 'concluso_male' && i.motivo_chiusura && (
                          <span className="text-[11px] text-slate-500">
                            {MOTIVI_CHIUSURA[i.motivo_chiusura] || i.motivo_chiusura}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/incarichi/${i.id}`}
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
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-semibold mb-2">
            {params.tipo || params.stato ? 'Nessun incarico trovato' : 'Nessun incarico'}
          </h2>
          <p className="text-slate-400 mb-6">
            {params.tipo || params.stato
              ? 'Prova a modificare i filtri di ricerca.'
              : 'Inizia aggiungendo il tuo primo incarico.'}
          </p>
          {!params.tipo && !params.stato && (
            <Link
              href="/incarichi/nuovo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + Aggiungi incarico
            </Link>
          )}
        </div>
      )}
    </div>
  )
}