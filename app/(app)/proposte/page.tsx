import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STATI: Record<string, { label: string; colore: string }> = {
  in_corso: { label: 'In corso', colore: 'bg-amber-500/20 text-amber-400' },
  accettata: { label: '✅ Accettata', colore: 'bg-emerald-500/20 text-emerald-400' },
  rifiutata: { label: '❌ Rifiutata', colore: 'bg-red-500/20 text-red-400' },
  controproposta: { label: '↔️ Controproposta', colore: 'bg-blue-500/20 text-blue-400' },
  ritirata: { label: 'Ritirata', colore: 'bg-slate-700 text-slate-400' },
}

export default async function PropostePage() {
  const supabase = await createClient()

  const { data: proposte } = await supabase
    .from('proposte')
    .select(`
      id, stato, data_visita, data_proposta, importo_proposto, created_at,
      immobili (id, indirizzo, civico, comune),
      clienti (id, nome, cognome)
    `)
    .order('created_at', { ascending: false })

  function formatData(data: string | null) {
    if (!data) return '—'
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
          <h1 className="text-3xl font-bold">Proposte</h1>
          <p className="text-slate-400 mt-1">
            {proposte?.length || 0} {proposte?.length === 1 ? 'proposta' : 'proposte'} trovate
          </p>
        </div>
        <Link
          href="/proposte/nuovo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuova proposta
        </Link>
      </div>

      {proposte && proposte.length > 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr className="text-left text-xs text-slate-400 uppercase">
                <th className="px-5 py-3 font-medium">Immobile</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Importo</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium w-44">Stato</th>
                <th className="px-5 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody>
              {proposte.map((p: any) => {
                const imm = Array.isArray(p.immobili) ? p.immobili[0] : p.immobili
                const cli = Array.isArray(p.clienti) ? p.clienti[0] : p.clienti
                const stato = STATI[p.stato] || {
                  label: p.stato,
                  colore: 'bg-slate-700 text-slate-300',
                }

                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-700 last:border-0 hover:bg-slate-700/40 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium">
                        {imm ? `${imm.indirizzo} ${imm.civico || ''}` : '—'}
                      </div>
                      {imm && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {imm.comune}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {cli ? `${cli.cognome} ${cli.nome}` : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {p.importo_proposto
                        ? `€ ${Number(p.importo_proposto).toLocaleString('it-IT')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {p.data_visita && (
                        <div>Visita: {formatData(p.data_visita)}</div>
                      )}
                      {p.data_proposta && (
                        <div>Proposta: {formatData(p.data_proposta)}</div>
                      )}
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
                        href={`/proposte/${p.id}`}
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
          <div className="text-5xl mb-4">🤝</div>
          <h2 className="text-xl font-semibold mb-2">Nessuna proposta</h2>
          <p className="text-slate-400 mb-6">
            Le proposte registrano visite e offerte dei clienti sugli immobili.
          </p>
          <Link
            href="/proposte/nuovo"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            + Aggiungi proposta
          </Link>
        </div>
      )}
    </div>
  )
}