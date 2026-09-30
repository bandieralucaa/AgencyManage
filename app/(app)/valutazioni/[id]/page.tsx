import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaValutazioneButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'
import PulsanteConverti from '@/components/pulsante-converti'
import TimelineFlusso from '@/components/timeline-flusso'
import { valutazioneToIncarico } from '@/app/(app)/flusso/actions'

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
      immobili (id, indirizzo, civico, comune),
      notizie (id, tipo_notizia, created_at)
    `)
    .eq('id', id)
    .single()

  if (!valutazione) notFound()

  const { data: attivita } = await supabase
    .from('attivita')
    .select('*, agenti (nome, cognome)')
    .eq('valutazione_id', id)
    .order('data_attivita', { ascending: false })

  // Cerca l'incarico collegato
  const { data: incarico } = await supabase
    .from('incarichi')
    .select('id, data_inizio, stato')
    .eq('valutazione_id', id)
    .maybeSingle()

  // Cerca l'immobile collegato all'incarico
  let immobile = null
  if (incarico) {
    const { data: imm } = await supabase
      .from('immobili')
      .select('id, indirizzo, civico')
      .eq('incarico_id', incarico.id)
      .maybeSingle()
    immobile = imm
  }

  const cli = Array.isArray(valutazione.clienti) ? valutazione.clienti[0] : valutazione.clienti
  const imm = Array.isArray(valutazione.immobili) ? valutazione.immobili[0] : valutazione.immobili
  const not = Array.isArray(valutazione.notizie) ? valutazione.notizie[0] : valutazione.notizie
  const stato = STATI[valutazione.stato] || {
    label: valutazione.stato,
    colore: 'bg-slate-700 text-slate-300',
  }

  // Timeline (solo se è nata da una notizia)
  const timeline = not
    ? [
        {
          label: 'Notizia',
          icona: '📰',
          stato: 'completato' as const,
          link: `/notizie/${not.id}`,
          data: new Date(not.created_at).toLocaleDateString('it-IT'),
        },
        {
          label: 'Valutazione',
          icona: '📋',
          stato: 'completato' as const,
          data: new Date(valutazione.data_valutazione).toLocaleDateString('it-IT'),
        },
        {
          label: 'Incarico',
          icona: '📝',
          stato: incarico
            ? ('completato' as const)
            : ('attivo' as const),
          link: incarico ? `/incarichi/${incarico.id}` : undefined,
          data: incarico
            ? new Date(incarico.data_inizio).toLocaleDateString('it-IT')
            : undefined,
        },
        {
          label: 'Immobile in portafoglio',
          icona: '🏠',
          stato: immobile
            ? ('completato' as const)
            : incarico
            ? ('attivo' as const)
            : ('futuro' as const),
          link: immobile ? `/immobili/${immobile.id}` : undefined,
        },
      ]
    : null

  const mostraPulsanteIncarico = not && !incarico

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

      {/* TIMELINE */}
      {timeline && (
        <div className="mb-6">
          <TimelineFlusso step={timeline} />
        </div>
      )}

      {/* PULSANTE CREA INCARICO */}
      {mostraPulsanteIncarico && (
        <div className="mb-6">
          <PulsanteConverti
            label="Crea incarico"
            descrizione="Il proprietario ti ha dato il mandato? Crea l'incarico e portalo in portafoglio."
            azione={valutazioneToIncarico}
            id={id}
            colore="blue"
            icona="📝"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Indirizzo</h2>
          <p className="text-white text-sm">
            {valutazione.indirizzo} {valutazione.civico}
            <br />
            {valutazione.frazione && `${valutazione.frazione}, `}
            {valutazione.cap} {valutazione.comune}
          </p>
        </div>

        {valutazione.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Note</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{valutazione.note}</p>
          </div>
        )}
      </div>

      <SezioneAttivita
        entita="valutazione"
        entitaId={id}
        attivita={attivita || []}
      />
    </div>
  )
}