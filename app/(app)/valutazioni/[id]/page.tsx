import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaValutazioneButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'
import PulsanteConverti from '@/components/pulsante-converti'
import TimelineFlusso from '@/components/timeline-flusso'
import BreadcrumbFlusso from '@/components/breadcrumb-flusso'
import { valutazioneToIncarico } from '@/app/(app)/flusso/actions'

const STATI: Record<string, { label: string; colore: string }> = {
  da_fare: { label: 'Da fare', colore: 'bg-amber-500/20 text-amber-400' },
  fatta: { label: 'Fatta', colore: 'bg-blue-500/20 text-blue-400' },
  annullata: { label: 'Annullata', colore: 'bg-red-500/20 text-red-400' },
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
    .select('*')
    .eq('id', id)
    .single()

  if (!valutazione) notFound()

  // Letture separate
  let immobile = null
  let cliente = null
  let notizia = null

  if (valutazione.immobile_id) {
    const { data } = await supabase
      .from('immobili')
      .select('id, indirizzo, civico, frazione, comune')
      .eq('id', valutazione.immobile_id)
      .maybeSingle()
    immobile = data
  }

  if (valutazione.cliente_id) {
    const { data } = await supabase
      .from('clienti')
      .select('id, nome, cognome, telefono, email')
      .eq('id', valutazione.cliente_id)
      .maybeSingle()
    cliente = data
  }

  if (valutazione.notizia_id) {
    const { data } = await supabase
      .from('notizie')
      .select('id, created_at')
      .eq('id', valutazione.notizia_id)
      .maybeSingle()
    notizia = data
  }

  const { data: attivita } = await supabase
    .from('attivita')
    .select('*, agenti (nome, cognome)')
    .eq('valutazione_id', id)
    .order('data_attivita', { ascending: false })

  // Cerca incarico
  const { data: incarico } = await supabase
    .from('incarichi')
    .select('id, data_inizio, stato')
    .eq('valutazione_id', id)
    .maybeSingle()

  const stato = STATI[valutazione.stato] || {
    label: valutazione.stato,
    colore: 'bg-slate-700 text-slate-300',
  }

  // Timeline
  const timeline = [
    ...(immobile
      ? [
          {
            label: 'Immobile',
            icona: '🏠',
            stato: 'completato' as const,
            link: `/immobili/${immobile.id}`,
          },
        ]
      : []),
    ...(notizia
      ? [
          {
            label: 'Notizia',
            icona: '📰',
            stato: 'completato' as const,
            link: `/notizie/${notizia.id}`,
            data: new Date(notizia.created_at).toLocaleDateString('it-IT'),
          },
        ]
      : []),
    {
      label: 'Valutazione',
      icona: '📋',
      stato: 'completato' as const,
      data: new Date(valutazione.data_valutazione).toLocaleDateString('it-IT'),
    },
    {
      label: 'Incarico',
      icona: '📝',
      stato: incarico ? ('completato' as const) : ('attivo' as const),
      link: incarico ? `/incarichi/${incarico.id}` : undefined,
      data: incarico
        ? new Date(incarico.data_inizio).toLocaleDateString('it-IT')
        : undefined,
    },
  ]

  const mostraPulsanteIncarico = !incarico

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/valutazioni" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle valutazioni
        </Link>

        <div className="mt-3">
          <BreadcrumbFlusso step={timeline} />
        </div>

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

      <div className="mb-6">
        <TimelineFlusso step={timeline} />
      </div>

      {mostraPulsanteIncarico && (
        <div className="mb-6">
          <PulsanteConverti
            label="Crea incarico"
            descrizione="Il proprietario ti ha dato il mandato? Crea l'incarico."
            azione={valutazioneToIncarico}
            id={id}
            colore="blue"
            icona="📝"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {immobile && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">🏠 Immobile</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Indirizzo</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/immobili/${immobile.id}`} className="text-blue-400 hover:underline">
                    {immobile.indirizzo} {immobile.civico}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Comune</dt>
                <dd className="text-white mt-0.5">
                  {immobile.frazione && `${immobile.frazione}, `}
                  {immobile.comune}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {cliente && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Nome</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/clienti/${cliente.id}`} className="text-blue-400 hover:underline">
                    {cliente.cognome} {cliente.nome}
                  </Link>
                </dd>
              </div>
              {cliente.telefono && (
                <div>
                  <dt className="text-slate-400">Telefono</dt>
                  <dd className="text-white mt-0.5">{cliente.telefono}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

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
                <dt className="text-slate-400">Prezzo in pubblicità</dt>
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

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
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