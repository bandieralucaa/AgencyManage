import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaPropostaButton from './elimina-button'
import AccettaPropostaButton from './accetta-button'

const STATI: Record<string, { label: string; colore: string }> = {
  in_corso: { label: 'In corso', colore: 'bg-amber-500/20 text-amber-400' },
  accettata: { label: '✅ Accettata', colore: 'bg-emerald-500/20 text-emerald-400' },
  rifiutata: { label: '❌ Rifiutata', colore: 'bg-red-500/20 text-red-400' },
  controproposta: { label: '↔️ Controproposta', colore: 'bg-blue-500/20 text-blue-400' },
  ritirata: { label: 'Ritirata', colore: 'bg-slate-700 text-slate-400' },
}

export default async function PropostaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('proposte')
    .select(`
      *,
      immobili (id, indirizzo, civico, frazione, comune),
      clienti (id, nome, cognome, telefono, email),
      richieste (id, cerca),
      incarichi (id, data_inizio, stato)
    `)
    .eq('id', id)
    .single()

  if (!proposta) notFound()

  const imm = Array.isArray(proposta.immobili) ? proposta.immobili[0] : proposta.immobili
  const cli = Array.isArray(proposta.clienti) ? proposta.clienti[0] : proposta.clienti
  const ric = Array.isArray(proposta.richieste) ? proposta.richieste[0] : proposta.richieste
  const inc = Array.isArray(proposta.incarichi) ? proposta.incarichi[0] : proposta.incarichi
  const stato = STATI[proposta.stato] || {
    label: proposta.stato,
    colore: 'bg-slate-700 text-slate-300',
  }

  function formatData(data: string | null) {
    if (!data) return '—'
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const isInCorso = proposta.stato === 'in_corso'

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/proposte" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle proposte
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {imm ? `${imm.indirizzo} ${imm.civico || ''}` : 'Proposta'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              {imm && (
                <>
                  <span>
                    {imm.frazione && `${imm.frazione}, `}
                    {imm.comune}
                  </span>
                  <span>·</span>
                </>
              )}
              {cli && (
                <>
                  <span>
                    {cli.cognome} {cli.nome}
                  </span>
                  <span>·</span>
                </>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/proposte/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaPropostaButton id={id} nome={imm ? `${imm.indirizzo} ${imm.civico || ''}` : 'questa proposta'} />
          </div>
        </div>
      </div>

      {/* PULSANTE ACCETTA (solo se in corso) */}
      {isInCorso && (
        <div className="mb-6">
          <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">🎉</span>
                  Proposta accettata?
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Se il venditore ha accettato, chiudi la trattativa: la richiesta sarà segnata come
                  &quot;trovato&quot; e l&apos;incarico come &quot;concluso bene&quot;.
                </p>
              </div>
              <AccettaPropostaButton id={id} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {imm && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Immobile</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Indirizzo</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/immobili/${imm.id}`} className="text-blue-400 hover:underline">
                    {imm.indirizzo} {imm.civico}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Comune</dt>
                <dd className="text-white mt-0.5">
                  {imm.frazione && `${imm.frazione}, `}
                  {imm.comune}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {cli && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente acquirente</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Nome</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/clienti/${cli.id}`} className="text-blue-400 hover:underline">
                    {cli.cognome} {cli.nome}
                  </Link>
                </dd>
              </div>
              {cli.telefono && (
                <div>
                  <dt className="text-slate-400">Telefono</dt>
                  <dd className="text-white mt-0.5">{cli.telefono}</dd>
                </div>
              )}
              {cli.email && (
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="text-white mt-0.5">{cli.email}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Dettagli proposta</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Data visita</dt>
              <dd className="text-white mt-0.5">{formatData(proposta.data_visita)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Data proposta</dt>
              <dd className="text-white mt-0.5">{formatData(proposta.data_proposta)}</dd>
            </div>
            {proposta.importo_proposto && (
              <div>
                <dt className="text-slate-400">Importo proposto</dt>
                <dd className="text-white mt-0.5 text-lg font-semibold">
                  € {Number(proposta.importo_proposto).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {(ric || inc) && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Collegamenti</h2>
            <dl className="space-y-3 text-sm">
              {ric && (
                <div>
                  <dt className="text-slate-400">Richiesta</dt>
                  <dd className="text-white mt-0.5">
                    <Link href={`/richieste/${ric.id}`} className="text-blue-400 hover:underline">
                      Richiesta ({ric.cerca})
                    </Link>
                  </dd>
                </div>
              )}
              {inc && (
                <div>
                  <dt className="text-slate-400">Incarico</dt>
                  <dd className="text-white mt-0.5">
                    <Link href={`/incarichi/${inc.id}`} className="text-blue-400 hover:underline">
                      Incarico del {formatData(inc.data_inizio)}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {proposta.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Note</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{proposta.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}