import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaValutazioneButton from './elimina-button'

const STATI: Record<string, { label: string; colore: string }> = {
  da_fare: { label: 'Da fare', colore: 'bg-amber-500/20 text-amber-400' },
  fatta: { label: 'Fatta', colore: 'bg-blue-500/20 text-blue-400' },
  seguita: { label: 'Seguita', colore: 'bg-emerald-500/20 text-emerald-400' },
  persa: { label: 'Persa', colore: 'bg-red-500/20 text-red-400' },
}

export default async function ValutazionePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select(`
      *,
      clienti (id, nome, cognome, telefono, email),
      immobili (id, indirizzo, civico, comune)
    `)
    .eq('id', id)
    .single()

  if (!valutazione) notFound()

  const cli = Array.isArray(valutazione.clienti) ? valutazione.clienti[0] : valutazione.clienti
  const imm = Array.isArray(valutazione.immobili) ? valutazione.immobili[0] : valutazione.immobili
  const stato = STATI[valutazione.stato] || {
    label: valutazione.stato,
    colore: 'bg-slate-700 text-slate-300',
  }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/valutazioni" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle valutazioni
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {valutazione.indirizzo} {valutazione.civico}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span>
                {valutazione.frazione && `${valutazione.frazione} · `}
                {valutazione.comune} {valutazione.cap && `(${valutazione.cap})`}
              </span>
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
              <span>·</span>
              <span>
                {new Date(valutazione.data_valutazione).toLocaleDateString('it-IT')}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/valutazioni/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaValutazioneButton
              id={id}
              nome={`${valutazione.indirizzo} ${valutazione.civico || ''}`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLLEGAMENTI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Collegamenti</h2>
          <dl className="space-y-3 text-sm">
            {cli && (
              <div>
                <dt className="text-slate-400">Cliente</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/clienti/${cli.id}`} className="text-blue-400 hover:underline">
                    {cli.cognome} {cli.nome}
                  </Link>
                  {cli.telefono && <span className="text-slate-400"> · {cli.telefono}</span>}
                </dd>
              </div>
            )}
            {imm && (
              <div>
                <dt className="text-slate-400">Immobile collegato</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/immobili/${imm.id}`} className="text-blue-400 hover:underline">
                    {imm.indirizzo} {imm.civico}, {imm.comune}
                  </Link>
                </dd>
              </div>
            )}
            {!cli && !imm && (
              <p className="text-slate-500">Nessun collegamento.</p>
            )}
          </dl>
        </div>

        {/* PREZZI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Prezzi</h2>
          <dl className="space-y-3 text-sm">
            {valutazione.prezzo_valutato && (
              <div>
                <dt className="text-slate-400">Prezzo valutato</dt>
                <dd className="text-white mt-0.5 text-lg font-semibold">
                  € {Number(valutazione.prezzo_valutato).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
            {valutazione.prezzo_richiesto && (
              <div>
                <dt className="text-slate-400">Prezzo richiesto dal cliente</dt>
                <dd className="text-white mt-0.5">
                  € {Number(valutazione.prezzo_richiesto).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
            {valutazione.prezzo_minimo && (
              <div>
                <dt className="text-slate-400">Prezzo minimo accettabile</dt>
                <dd className="text-white mt-0.5">
                  € {Number(valutazione.prezzo_minimo).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
            {!valutazione.prezzo_valutato &&
              !valutazione.prezzo_richiesto &&
              !valutazione.prezzo_minimo && (
                <p className="text-slate-500">Nessun prezzo inserito.</p>
              )}
          </dl>
        </div>

        {/* DETTAGLI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Dettagli</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Data valutazione</dt>
              <dd className="text-white mt-0.5">
                {new Date(valutazione.data_valutazione).toLocaleDateString('it-IT')}
              </dd>
            </div>
            {valutazione.metratura && (
              <div>
                <dt className="text-slate-400">Metratura</dt>
                <dd className="text-white mt-0.5">{valutazione.metratura} mq</dd>
              </div>
            )}
            {valutazione.prezzo_valutato && valutazione.metratura && (
              <div>
                <dt className="text-slate-400">Prezzo al mq</dt>
                <dd className="text-white mt-0.5">
                  €{' '}
                  {Math.round(
                    valutazione.prezzo_valutato / valutazione.metratura
                  ).toLocaleString('it-IT')}
                  /mq
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* INDIRIZZO */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Indirizzo</h2>
          <p className="text-white text-sm">
            {valutazione.indirizzo} {valutazione.civico}
            <br />
            {valutazione.frazione && `${valutazione.frazione}, `}
            {valutazione.cap} {valutazione.comune}
          </p>
        </div>

        {/* NOTE */}
        {valutazione.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Note</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{valutazione.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}