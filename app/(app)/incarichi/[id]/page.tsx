import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaIncaricoButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'
import SezioneVisite from '@/components/sezione-visite'
import TimelineFlusso from '@/components/timeline-flusso'
import BreadcrumbFlusso from '@/components/breadcrumb-flusso'
import VisiteIncarico from './visite-incarico'

const STATI: Record<string, { label: string; colore: string }> = {
  attivo: {
    label: '🟢 Attivo',
    colore: 'bg-emerald-500/20 text-emerald-400',
  },
  in_trattativa: {
    label: '🟡 In trattativa',
    colore: 'bg-amber-500/20 text-amber-400',
  },
  concluso_bene: {
    label: '✅ Concluso bene',
    colore: 'bg-blue-500/20 text-blue-400',
  },
  concluso_male: {
    label: '❌ Concluso male',
    colore: 'bg-red-500/20 text-red-400',
  },
}

const MOTIVI_CHIUSURA: Record<string, string> = {
  venduto_altrove: '🔄 Venduto/Affittato altrove',
  ritirato_cliente: '🚫 Ritirato dal cliente',
  scaduto: '⏰ Scaduto senza rinnovo',
  altro: '📝 Altro',
}

export default async function IncaricoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: incarico } = await supabase
    .from('incarichi')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!incarico) notFound()

  // Letture separate
  let immobile = null
  let cliente = null
  let valutazione = null
  let notizia = null

  if (incarico.immobile_id) {
    const { data } = await supabase
      .from('immobili')
      .select('id, indirizzo, civico, frazione, comune')
      .eq('id', incarico.immobile_id)
      .maybeSingle()
    immobile = data
  }

  if (incarico.cliente_id) {
    const { data } = await supabase
      .from('clienti')
      .select('id, nome, cognome, telefono, email')
      .eq('id', incarico.cliente_id)
      .maybeSingle()
    cliente = data
  }

  if (incarico.valutazione_id) {
    const { data: v } = await supabase
      .from('valutazioni')
      .select('id, data_valutazione, notizia_id')
      .eq('id', incarico.valutazione_id)
      .maybeSingle()
    valutazione = v

    if (v?.notizia_id) {
      const { data: n } = await supabase
        .from('notizie')
        .select('id, created_at')
        .eq('id', v.notizia_id)
        .maybeSingle()
      notizia = n
    }
  }

  const { data: attivita } = await supabase
    .from('attivita')
    .select('*, agenti (nome, cognome)')
    .eq('incarico_id', id)
    .order('data_attivita', { ascending: false })

      // Visite effettuate su questo incarico
const { data: visite } = await supabase
  .from('visite')
  .select(`
  id,
  immobile_id,
  data_visita,
  ora_visita,
  esito,
  motivo_rifiuto,
  note,
  immobili (indirizzo, civico, comune)
`)
  .eq('incarico_id', id)
  .order('data_visita', { ascending: false })

    // Visite ricevute su questo immobile (da qualsiasi richiesta)
  let visiteRicevute: any[] = []
  if (incarico.immobile_id) {
    const { data: v } = await supabase
      .from('proposte_immobili')
      .select(`
        id, data_proposta, esito, motivo_rifiuto,
        data_visita, ora_visita, stato_visita, note_visita,
        richieste (id, clienti (nome, cognome))
      `)
      .eq('immobile_id', incarico.immobile_id)
      .not('data_visita', 'is', null)
      .order('data_visita', { ascending: false })
    visiteRicevute = v || []
  }

  const stato = STATI[incarico.stato] || {
    label: incarico.stato,
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
    ...(valutazione
      ? [
          {
            label: 'Valutazione',
            icona: '📋',
            stato: 'completato' as const,
            link: `/valutazioni/${valutazione.id}`,
            data: new Date(valutazione.data_valutazione).toLocaleDateString('it-IT'),
          },
        ]
      : []),
    {
      label: 'Incarico',
      icona: '📝',
      stato: 'completato' as const,
      data: new Date(incarico.data_inizio).toLocaleDateString('it-IT'),
    },
  ]

  const isAttivo = incarico.stato === 'attivo'

  function formatData(data: string) {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  function giorniAllaScadenza(dataScadenza: string) {
    const oggi = new Date()
    oggi.setHours(0, 0, 0, 0)
    const scad = new Date(dataScadenza)
    scad.setHours(0, 0, 0, 0)
    return Math.ceil((scad.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24))
  }

  const giorni = giorniAllaScadenza(incarico.data_scadenza)

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/incarichi" className="text-sm text-slate-400 hover:text-white">
          ← Torna agli incarichi
        </Link>

        <div className="mt-3">
          <BreadcrumbFlusso step={timeline} />
        </div>

        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {immobile ? `${immobile.indirizzo} ${immobile.civico || ''}` : 'Incarico'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              {immobile && (
                <>
                  <span>
                    {immobile.frazione && `${immobile.frazione}, `}
                    {immobile.comune}
                  </span>
                  <span>·</span>
                </>
              )}
              <span className="capitalize">{incarico.tipo}</span>
              {incarico.esclusivo && (
                <>
                  <span>·</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    Esclusiva
                  </span>
                </>
              )}
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/incarichi/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaIncaricoButton
              id={id}
              nome={immobile ? `${immobile.indirizzo} ${immobile.civico || ''}` : 'questo incarico'}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TimelineFlusso step={timeline} />
      </div>
      
      {/* VISITE SULL'IMMOBILE */}
      {immobile && (
        <VisiteIncarico immobileId={immobile.id} />
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
            <h2 className="text-lg font-semibold mb-4">Cliente venditore</h2>
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
              {cliente.email && (
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="text-white mt-0.5">{cliente.email}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Dettagli incarico</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Data inizio</dt>
              <dd className="text-white mt-0.5">{formatData(incarico.data_inizio)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Data scadenza</dt>
              <dd className="text-white mt-0.5">
                {formatData(incarico.data_scadenza)}
                {isAttivo && giorni >= 0 && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({giorni} giorni rimanenti)
                  </span>
                )}
                {isAttivo && giorni < 0 && (
                  <span className="ml-2 text-xs text-red-400">
                    (scaduto da {Math.abs(giorni)} giorni)
                  </span>
                )}
              </dd>
            </div>
            {incarico.prezzo && (
              <div>
                <dt className="text-slate-400">Prezzo richiesto</dt>
                <dd className="text-white mt-0.5 text-lg font-semibold">
                  € {Number(incarico.prezzo).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
                        {incarico.prezzo_pubblicita && (
              <div>
                <dt className="text-slate-400">Prezzo in pubblicità</dt>
                <dd className="text-white mt-0.5 text-lg font-semibold">
                  € {Number(incarico.prezzo_pubblicita).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
                        {incarico.spese_condominiali && (
              <div>
                <dt className="text-slate-400">Spese condominiali</dt>
                <dd className="text-white mt-0.5">
                  € {Number(incarico.spese_condominiali).toLocaleString('it-IT')}/mese
                </dd>
              </div>
            )}
            <div>
              <dt className="text-slate-400">Esclusiva</dt>
              <dd className="text-white mt-0.5">
                {incarico.esclusivo ? '✅ Sì' : '❌ No'}
              </dd>
            </div>
          </dl>
        </div>

        {(incarico.stato === 'concluso_bene' ||
          incarico.stato === 'concluso_male') && (
          <div
            className={`border rounded-xl p-6 ${
              incarico.stato === 'concluso_bene'
                ? 'bg-blue-500/5 border-blue-500/30'
                : 'bg-red-500/5 border-red-500/30'
            }`}
          >
            <h2 className="text-lg font-semibold mb-4">
              {incarico.stato === 'concluso_bene' ? '🎉 Chiusura positiva' : '❌ Chiusura negativa'}
            </h2>
            <dl className="space-y-3 text-sm">
              {incarico.data_chiusura && (
                <div>
                  <dt className="text-slate-400">Data chiusura</dt>
                  <dd className="text-white mt-0.5">{formatData(incarico.data_chiusura)}</dd>
                </div>
              )}
              {incarico.motivo_chiusura && (
                <div>
                  <dt className="text-slate-400">Motivo</dt>
                  <dd className="text-white mt-0.5">
                    {MOTIVI_CHIUSURA[incarico.motivo_chiusura] || incarico.motivo_chiusura}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {incarico.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Note</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{incarico.note}</p>
          </div>
        )}
      </div>

      {/* VISITE RICEVUTE */}
      {visiteRicevute.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🚶 Visite ricevute su questo immobile
            <span className="text-sm text-slate-500 font-normal">
              ({visiteRicevute.length})
            </span>
          </h2>
          <div className="space-y-2">
            {visiteRicevute.map((v: any) => {
              const ric = Array.isArray(v.richieste) ? v.richieste[0] : v.richieste
              const cli = ric
                ? Array.isArray(ric.clienti)
                  ? ric.clienti[0]
                  : ric.clienti
                : null
              const statovisita = {
                da_fare: 'Da fare',
                fatta: '✅ Fatta',
                annullata: 'Annullata',
              }[v.stato_visita as string] || v.stato_visita
              const colorevisita = {
                da_fare: 'bg-amber-500/20 text-amber-400',
                fatta: 'bg-emerald-500/20 text-emerald-400',
                annullata: 'bg-slate-700 text-slate-400',
              }[v.stato_visita as string] || 'bg-slate-700 text-slate-300'
              return (
                <Link
                  key={v.id}
                  href={ric ? `/richieste/${ric.id}` : '#'}
                  className="block border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white">
                        {new Date(v.data_visita).toLocaleDateString('it-IT')}
                        {v.ora_visita && ` · ore ${v.ora_visita}`}
                        {cli && (
                          <span className="ml-3 text-slate-400">
                            Cliente: {cli.cognome} {cli.nome}
                          </span>
                        )}
                      </div>
                      {v.note_visita && (
                        <div className="text-xs text-slate-500 mt-1">
                          {v.note_visita}
                        </div>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded whitespace-nowrap ${colorevisita}`}
                    >
                      {statovisita}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}


      <SezioneVisite
  richiestaId=""
  clienteId={incarico.cliente_id || null}
  visite={visite || []}
/>

      <SezioneAttivita
        entita="incarico"
        entitaId={id}
        attivita={attivita || []}
      />
    </div>
  )
}