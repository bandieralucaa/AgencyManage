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
    .select(
      'id, tipo_notizia, tipo, stato, immobile_id, indirizzo, civico, frazione, comune, created_at, agente_id'
    )
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`indirizzo.ilike.%${params.q}%,comune.ilike.%${params.q}%`)
  }

  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.stato) query = query.eq('stato', params.stato)

  const { data: notizie } = await query

  // Recupera gli agenti
  const agenteIds = [
    ...new Set((notizie || []).map((n) => n.agente_id).filter(Boolean)),
  ]

  // Recupera le relazioni proprietari
  const notiziaIds = (notizie || []).map((n) => n.id)

  const [agentiRes, proprietariRes] = await Promise.all([
    agenteIds.length > 0
      ? supabase
          .from('agenti')
          .select('id, nome, cognome')
          .in('id', agenteIds)
      : Promise.resolve({ data: [] }),

    notiziaIds.length > 0
      ? supabase
          .from('notizie_proprietari')
          .select('notizia_id, cliente_id')
          .in('notizia_id', notiziaIds)
      : Promise.resolve({ data: [] }),
  ])

  const agentiMap = new Map(
    (agentiRes.data || []).map((a) => [a.id, a])
  )

  // Tutti gli ID cliente dei proprietari
  const proprietarioClienteIds = [
    ...new Set(
      (proprietariRes.data || [])
        .map((p) => p.cliente_id)
        .filter(Boolean)
    ),
  ]

  const { data: clientiProprietari } =
    proprietarioClienteIds.length > 0
      ? await supabase
          .from('clienti')
          .select('id, nome, cognome')
          .in('id', proprietarioClienteIds)
      : { data: [] }

  const clientiMap = new Map(
    (clientiProprietari || []).map((c) => [c.id, c])
  )

  // Raggruppa i proprietari per notizia
  const proprietariMap = new Map<
    string,
    { id: string; nome: string; cognome: string }[]
  >()

  for (const relazione of proprietariRes.data || []) {
    const cliente = clientiMap.get(relazione.cliente_id)

    if (!cliente) continue

    const lista = proprietariMap.get(relazione.notizia_id) || []
    lista.push(cliente)
    proprietariMap.set(relazione.notizia_id, lista)
  }

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
                <th className="px-5 py-3 font-medium">Proprietari</th>
                <th className="px-5 py-3 font-medium w-44">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>

            <tbody>
              {notizie.map((n: any) => {
                const ag = agentiMap.get(n.agente_id)

                const proprietari = proprietariMap.get(n.id) || []

                const stato = STATI[n.stato] || {
                  label: n.stato,
                  colore: 'bg-slate-700 text-slate-300',
                }

                const isImmobileVuoto =
                  n.tipo_notizia === 'immobile_vuoto'

                return (
                  <tr
                    key={n.id}
                    className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                  >
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

                    <td className="px-5 py-3 align-top">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            isImmobileVuoto
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {isImmobileVuoto
                            ? '🏚️ Immobile vuoto'
                            : '🏠 Immobile da vendere'}
                        </span>

                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {TIPI[n.tipo] || n.tipo || '—'}
                        </span>
                      </div>

                      {n.indirizzo && (
                        <div className="text-sm text-white">
                          {n.indirizzo} {n.civico}
                        </div>
                      )}

                      {n.indirizzo && (n.frazione || n.comune) && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {n.frazione && `${n.frazione}, `}
                          {n.comune}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3 align-top">
                      {proprietari.length > 0 ? (
                        <div className="space-y-1">
                          {proprietari.map((proprietario) => (
                            <div
                              key={proprietario.id}
                              className="text-sm"
                            >
                              <Link
                                href={`/clienti/${proprietario.id}`}
                                className="text-blue-400 hover:underline"
                              >
                                {proprietario.cognome}{' '}
                                {proprietario.nome}
                              </Link>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3 align-top">
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stato.colore}`}
                      >
                        {stato.label}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-right align-top">
                      <Link
                        href={`/notizie/${n.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700 px-2.5 py-1.5 rounded transition-colors"
                      >
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