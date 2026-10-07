import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RicercaValutazioni from '@/components/ricerca-valutazioni'

const STATI: Record<string, { label: string; colore: string }> = {
  da_fare: { label: 'Da fare', colore: 'bg-amber-500/20 text-amber-400' },
  fatta: { label: 'Fatta', colore: 'bg-blue-500/20 text-blue-400' },
  annullata: { label: 'Annullata', colore: 'bg-red-500/20 text-red-400' },
}

export default async function ValutazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stato?: string; frazione?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('valutazioni')
    .select(`
      id, indirizzo, civico, frazione, comune, data_valutazione,
      prezzo_valutato, prezzo_richiesto, metratura, stato
    `)
    .order('data_valutazione', { ascending: false })

  if (params.q) {
    query = query.or(`indirizzo.ilike.%${params.q}%`)
  }
  if (params.stato) query = query.eq('stato', params.stato)
  if (params.frazione) query = query.eq('frazione', params.frazione)

  const { data: valutazioni } = await query

  const valutazioneIds = (valutazioni || []).map((v) => v.id)

  const { data: proprietariRes } =
    valutazioneIds.length > 0
      ? await supabase
          .from('valutazioni_proprietari')
          .select('valutazione_id, cliente_id')
          .in('valutazione_id', valutazioneIds)
      : { data: [] }

  const proprietarioIds = [
    ...new Set(
      (proprietariRes || [])
        .map((p) => p.cliente_id)
        .filter(Boolean)
    ),
  ]

  const { data: clientiProprietari } =
    proprietarioIds.length > 0
      ? await supabase
          .from('clienti')
          .select('id, nome, cognome')
          .in('id', proprietarioIds)
      : { data: [] }

  const clientiMap = new Map(
    (clientiProprietari || []).map((c) => [c.id, c])
  )

  const proprietariMap = new Map<
    string,
    { id: string; nome: string; cognome: string }[]
  >()

  for (const relazione of proprietariRes || []) {
    const cliente = clientiMap.get(relazione.cliente_id)
    if (!cliente) continue

    const lista = proprietariMap.get(relazione.valutazione_id) || []
    lista.push(cliente)
    proprietariMap.set(relazione.valutazione_id, lista)
  }

  // Recupera gli ID delle valutazioni con incarico collegato
  const { data: incarichiCollegati } = await supabase
    .from('incarichi')
    .select('valutazione_id')
    .not('valutazione_id', 'is', null)

  const valutazioniConIncarico = new Set(
    (incarichiCollegati || []).map((i) => i.valutazione_id)
  )

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
          <h1 className="text-3xl font-bold">Valutazioni</h1>
          <p className="text-slate-400 mt-1">
            {valutazioni?.length || 0}{' '}
            {valutazioni?.length === 1 ? 'valutazione' : 'valutazioni'} trovate
          </p>
        </div>
        <Link
          href="/valutazioni/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuova valutazione
        </Link>
      </div>

      <RicercaValutazioni />

      {valutazioni && valutazioni.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Immobile</th>
                <th className="px-5 py-3 font-medium">Proprietari</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Prezzo valutato</th>
                <th className="px-5 py-3 font-medium w-32">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {valutazioni.map((v: any) => {
                const proprietari = proprietariMap.get(v.id) || []
                const stato = STATI[v.stato] || {
                  label: v.stato,
                  colore: 'bg-slate-700 text-slate-300',
                }
                const haIncarico = valutazioniConIncarico.has(v.id)

                return (
                  <tr
                    key={v.id}
                    className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">
                        {v.indirizzo} {v.civico}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {v.frazione && `${v.frazione}, `}
                        {v.comune}
                      </div>
                      {haIncarico && (
                        <div className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium mt-1 inline-block">
                          ✅ Incaricata
                        </div>
                      )}
                    </td>
                   <td className="px-5 py-3 text-sm text-slate-300">
                      {proprietari.length > 0 ? (
                        <div className="space-y-1">
                          {proprietari.map((p) => (
                            <Link
                              key={p.id}
                              href={`/clienti/${p.id}`}
                              className="block text-blue-400 hover:underline"
                            >
                              {p.cognome} {p.nome}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {formatData(v.data_valutazione)}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {v.prezzo_valutato
                        ? `€ ${Number(v.prezzo_valutato).toLocaleString('it-IT')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stato.colore}`}
                      >
                        {stato.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/valutazioni/${v.id}`}
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
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-xl font-semibold mb-2">
            {params.q || params.stato || params.frazione
              ? 'Nessuna valutazione trovata'
              : 'Nessuna valutazione'}
          </h2>
          <p className="text-slate-400 mb-6">
            {params.q || params.stato || params.frazione
              ? 'Prova a modificare i filtri di ricerca.'
              : 'Inizia aggiungendo la prima valutazione.'}
          </p>
          {!params.q && !params.stato && !params.frazione && (
            <Link
              href="/valutazioni/nuovo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + Aggiungi valutazione
            </Link>
          )}
        </div>
      )}
    </div>
  )
}