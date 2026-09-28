import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RicercaClienti from '@/components/ricerca-clienti'

const TIPI: Record<string, string> = {
venditore: 'Venditore',
acquirente: 'Acquirente',
inquilino: 'Inquilino',
locatore: 'Locatore',
entrambi: 'Entrambi',
}

export default async function ClientiPage({
searchParams,
}: {
searchParams: Promise<{ q?: string; tipo?: string; comune?: string }>
}) {
const params = await searchParams
const supabase = await createClient()

let query = supabase
  .from('clienti')
  .select('id, tipo, nome, cognome, telefono, comune, attivo')
  .order('cognome', { ascending: true })

if (params.q) {
  query = query.or(
    `nome.ilike.%${params.q}%,cognome.ilike.%${params.q}%,telefono.ilike.%${params.q}%`
  )
}
if (params.tipo) {
  query = query.eq('tipo', params.tipo)
}
if (params.comune) {
  query = query.ilike('comune', `%${params.comune}%`)
}

const { data: clienti } = await query

return (
  <div className="p-6 lg:p-10">
    <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-3xl font-bold">Clienti</h1>
        <p className="text-slate-400 mt-1">
          {clienti?.length || 0} {clienti?.length === 1 ? 'cliente' : 'clienti'} trovati
        </p>
      </div>
      <Link
        href="/clienti/nuovo"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        + Nuovo cliente
      </Link>
    </div>

    <RicercaClienti />

    {clienti && clienti.length > 0 ? (
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Cognome e nome</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Telefono</th>
                <th className="px-5 py-3 font-medium">Comune</th>
                <th className="px-5 py-3 font-medium w-32">Stato</th>
              </tr>
            </thead>
            <tbody>
              {clienti.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
href={`/clienti/${c.id}`}
className="font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors"
>
{c.cognome} {c.nome}
</Link>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {TIPI[c.tipo] || c.tipo}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {c.telefono || '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {c.comune || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        c.attivo
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {c.attivo ? 'Attivo' : 'Archiviato'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="text-xl font-semibold mb-2">
          {params.q || params.tipo || params.comune
            ? 'Nessun cliente trovato'
            : 'Nessun cliente'}
        </h2>
        <p className="text-slate-400 mb-6">
          {params.q || params.tipo || params.comune
            ? 'Prova a modificare i filtri di ricerca.'
            : 'Inizia aggiungendo il tuo primo cliente.'}
        </p>
        {!params.q && !params.tipo && !params.comune && (
          <Link
            href="/clienti/nuovo"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Aggiungi cliente
          </Link>
        )}
      </div>
    )}
  </div>
)
}