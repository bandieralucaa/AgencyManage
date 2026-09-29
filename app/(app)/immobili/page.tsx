import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RicercaImmobili from '@/components/ricerca-immobili'

const TIPI: Record<string, string> = {
  appartamento: 'Appartamento',
  villa: 'Villa',
  villetta: 'Villetta',
  terreno: 'Terreno',
  ufficio: 'Ufficio',
  negozio: 'Negozio',
  garage: 'Garage',
  box: 'Box',
  magazzino: 'Magazzino',
  rustico: 'Rustico',
  altro: 'Altro',
}

export default async function ImmobiliPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    categoria?: string
    tipo?: string
    frazione?: string
    archiviati?: string
  }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('immobili')
    .select('id, tipo, categoria, indirizzo, civico, frazione, comune, prezzo, metri_quadrati, attivo')
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`indirizzo.ilike.%${params.q}%,comune.ilike.%${params.q}%`)
  }
  if (params.categoria) query = query.eq('categoria', params.categoria)
  if (params.tipo) query = query.eq('tipo', params.tipo)
  if (params.frazione) query = query.eq('frazione', params.frazione)
  if (params.archiviati !== '1') query = query.eq('attivo', true)

  const { data: immobili } = await query

  function prezzoLabel(i: any) {
    if (i.prezzo) return `€ ${Number(i.prezzo).toLocaleString('it-IT')}`
    return '—'
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Immobili</h1>
          <p className="text-slate-400 mt-1">
            {immobili?.length || 0} {immobili?.length === 1 ? 'immobile' : 'immobili'} trovati
          </p>
        </div>
        <Link
          href="/immobili/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuovo immobile
        </Link>
      </div>

      <RicercaImmobili />

      {immobili && immobili.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Indirizzo</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Frazione</th>
                <th className="px-5 py-3 font-medium">Mq</th>
                <th className="px-5 py-3 font-medium">Prezzo</th>
                <th className="px-5 py-3 font-medium w-32">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {immobili.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {i.indirizzo} {i.civico}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {TIPI[i.tipo] || i.tipo}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {i.frazione || '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {i.metri_quadrati || '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {prezzoLabel(i)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        i.attivo
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {i.attivo ? 'Attivo' : 'Archiviato'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/immobili/${i.id}`}
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-xl font-semibold mb-2">
            {params.q || params.categoria || params.tipo || params.frazione
              ? 'Nessun immobile trovato'
              : 'Nessun immobile'}
          </h2>
          <p className="text-slate-400 mb-6">
            {params.q || params.categoria || params.tipo || params.frazione
              ? 'Prova a modificare i filtri di ricerca.'
              : 'Inizia aggiungendo il tuo primo immobile.'}
          </p>
          {!params.q && !params.categoria && !params.tipo && !params.frazione && (
            <Link
              href="/immobili/nuovo"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
            >
              + Aggiungi immobile
            </Link>
          )}
        </div>
      )}
    </div>
  )
}