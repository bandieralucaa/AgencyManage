import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaNotiziaButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'
import ConvertiNotiziaValutazione from '@/components/converti-notizia-valutazione'
import TimelineFlusso from '@/components/timeline-flusso'
import BreadcrumbFlusso from '@/components/breadcrumb-flusso'

const STATI: Record<string, { label: string; colore: string }> = {
  aperta: { label: 'Aperta', colore: 'bg-blue-500/20 text-blue-400' },
  in_lavorazione: { label: 'In lavorazione', colore: 'bg-amber-500/20 text-amber-400' },
  chiusa_positiva: { label: 'Chiusa positiva', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_negativa: { label: 'Chiusa negativa', colore: 'bg-slate-700 text-slate-400' },
}

const TIPI: Record<string, string> = {
  agenzia: 'In agenzia',
  passaparola: 'Passaparola',
  incontro: 'Incontro in giro',
  telefono: 'Telefono',
  email: 'Email',
  social: 'Social',
  altro: 'Altro',
}

export default async function NotiziaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: notizia } = await supabase
    .from('notizie')
    .select('*')
    .eq('id', id)
    .single()

  if (!notizia) notFound()

  // Letture separate
  let immobile = null
  let cliente = null
  let agente = null

  if (notizia.immobile_id) {
    const { data } = await supabase
      .from('immobili')
      .select('id, indirizzo, civico, frazione, comune')
      .eq('id', notizia.immobile_id)
      .maybeSingle()
    immobile = data
  }

  if (notizia.cliente_id) {
    const { data } = await supabase
      .from('clienti')
      .select('id, nome, cognome, telefono')
      .eq('id', notizia.cliente_id)
      .maybeSingle()
    cliente = data
  }

  if (notizia.agente_id) {
    const { data } = await supabase
      .from('agenti')
      .select('nome, cognome')
      .eq('id', notizia.agente_id)
      .maybeSingle()
    agente = data
  }

  const { data: attivita } = await supabase
    .from('attivita')
    .select('*, agenti (nome, cognome)')
    .eq('notizia_id', id)
    .order('data_attivita', { ascending: false })

  // Cerca la valutazione collegata
  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select('id, data_valutazione, stato')
    .eq('notizia_id', id)
    .maybeSingle()

  // Cerca l'incarico
  let incarico = null
  if (valutazione) {
    const { data: inc } = await supabase
      .from('incarichi')
      .select('id, data_inizio, stato')
      .eq('valutazione_id', valutazione.id)
      .maybeSingle()
    incarico = inc
  }

  const stato = STATI[notizia.stato] || {
    label: notizia.stato,
    colore: 'bg-slate-700 text-slate-300',
  }
  const isImmobileVuoto = notizia.tipo_notizia === 'immobile_vuoto'

  // Timeline (sempre mostrata, entrambi i tipi hanno immobile)
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
    {
      label: 'Notizia',
      icona: '📰',
      stato: 'completato' as const,
      data: new Date(notizia.created_at).toLocaleDateString('it-IT'),
    },
    {
      label: 'Valutazione',
      icona: '📋',
      stato: valutazione ? ('completato' as const) : ('attivo' as const),
      link: valutazione ? `/valutazioni/${valutazione.id}` : undefined,
      data: valutazione
        ? new Date(valutazione.data_valutazione).toLocaleDateString('it-IT')
        : undefined,
    },
    {
      label: 'Incarico',
      icona: '📝',
      stato: incarico
        ? ('completato' as const)
        : valutazione
        ? ('attivo' as const)
        : ('futuro' as const),
      link: incarico ? `/incarichi/${incarico.id}` : undefined,
      data: incarico
        ? new Date(incarico.data_inizio).toLocaleDateString('it-IT')
        : undefined,
    },
  ]

  const mostraPulsanteValutazione = !valutazione

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/notizie" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle notizie
        </Link>

        <div className="mt-3">
          <BreadcrumbFlusso step={timeline} />
        </div>

        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {immobile
                ? `${immobile.indirizzo} ${immobile.civico || ''}`
                : 'Notizia'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isImmobileVuoto
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isImmobileVuoto ? '🏚️ Immobile vuoto' : '🏠 Immobile da vendere'}
              </span>
              <span>·</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                {TIPI[notizia.tipo] || notizia.tipo || '—'}
              </span>
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
              {agente && (
                <>
                  <span>·</span>
                  <span>
                    Registrata da {agente.nome} {agente.cognome} il{' '}
                    {new Date(notizia.created_at).toLocaleDateString('it-IT')}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/notizie/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaNotiziaButton
              id={id}
              nome={immobile ? `${immobile.indirizzo} ${immobile.civico || ''}` : 'questa notizia'}
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <TimelineFlusso step={timeline} />
      </div>

      {mostraPulsanteValutazione && (
        <div className="mb-6">
          <ConvertiNotiziaValutazione
            notiziaId={id}
            indirizzoCompleto={
              immobile
                ? `${immobile.indirizzo} ${immobile.civico || ''}, ${immobile.comune}`
                : 'Immobile'
            }
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {immobile && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">🏠 Immobile collegato</h2>
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
            <h2 className="text-lg font-semibold mb-4">Cliente collegato</h2>
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

        {notizia.motivo_chiusura && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Motivo chiusura</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {notizia.motivo_chiusura}
            </p>
          </div>
        )}
      </div>

      <SezioneAttivita
        entita="notizia"
        entitaId={id}
        attivita={attivita || []}
      />
    </div>
  )
}