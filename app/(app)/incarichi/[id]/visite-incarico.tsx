import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const ESITI: Record<string, { label: string; colore: string }> = {
  piace: {
    label: '👍 Piace',
    colore: 'bg-emerald-500/20 text-emerald-400',
  },
  non_piace: {
    label: '👎 Non piace',
    colore: 'bg-red-500/20 text-red-400',
  },
}

export default async function VisiteIncarico({
  immobileId,
}: {
  immobileId: string
}) {
  const supabase = await createClient()

  const { data: visite } = await supabase
    .from('visite')
    .select(`
  id,
  data_visita,
  ora_visita,
  esito,
  motivo_rifiuto,
  note,
  clienti (nome, cognome),
  richieste (id)
`)
    .eq('immobile_id', immobileId)
    .order('data_visita', { ascending: false })

  if (!visite || visite.length === 0) return null

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🚶 Visite su questo immobile
        <span className="text-sm text-slate-500 font-normal">
          ({visite.length})
        </span>
      </h2>

      <div className="space-y-2">
        {visite.map((v: any) => {
          const cli = Array.isArray(v.clienti)
            ? v.clienti[0]
            : v.clienti

          const ric = Array.isArray(v.richieste)
            ? v.richieste[0]
            : v.richieste

          const esito = ESITI[v.esito] || {
            label: 'Esito non specificato',
            colore: 'bg-slate-700 text-slate-300',
          }

          return (
            <div
              key={v.id}
              className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm text-white font-medium">
                      {new Date(v.data_visita).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {v.ora_visita && ` · ore ${v.ora_visita.slice(0, 5)}`}
                    </span>

                    <span
                      className={`text-xs px-2 py-0.5 rounded ${esito.colore}`}
                    >
                      {esito.label}
                    </span>
                  </div>

                  {cli && (
                    <div className="text-xs text-slate-400 mt-1">
                      Cliente: {cli.cognome} {cli.nome}
                    </div>
                  )}

                  {v.motivo_rifiuto && (
  <div className="text-xs text-slate-400 mt-1">
    ❌ Motivo: {v.motivo_rifiuto}
  </div>
)}

                  {v.note && (
                    <div className="text-xs text-slate-500 mt-1">
                      {v.note}
                    </div>
                  )}

                  {ric && (
                    <Link
                      href={`/richieste/${ric.id}`}
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                    >
                      Vai alla richiesta →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}