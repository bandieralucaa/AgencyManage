import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaIncaricoButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'
import PulsanteConverti from '@/components/pulsante-converti'
import TimelineFlusso from '@/components/timeline-flusso'
import { incaricoToImmobile } from '@/app/(app)/flusso/actions'
import BreadcrumbFlusso from '@/components/breadcrumb-flusso'

const STATI: Record<string, { label: string; colore: string }> = {
attivo: { label: '🟢 Attivo', colore: 'bg-emerald-500/20 text-emerald-400' },
concluso_bene: { label: '✅ Concluso bene', colore: 'bg-blue-500/20 text-blue-400' },
concluso_male: { label: '❌ Concluso male', colore: 'bg-red-500/20 text-red-400' },
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

// 1. Leggi l'incarico (query semplice)
const { data: incarico } = await supabase
  .from('incarichi')
  .select('*')
  .eq('id', id)
  .maybeSingle()

if (!incarico) notFound()

// 2. Leggi immobile (se collegato)
let immobile = null
if (incarico.immobile_id) {
  const { data } = await supabase
    .from('immobili')
    .select('id, indirizzo, civico, frazione, comune')
    .eq('id', incarico.immobile_id)
    .maybeSingle()
  immobile = data
}

// 3. Leggi cliente (se collegato)
let cliente = null
if (incarico.cliente_id) {
  const { data } = await supabase
    .from('clienti')
    .select('id, nome, cognome, telefono, email')
    .eq('id', incarico.cliente_id)
    .maybeSingle()
  cliente = data
}

// 4. Leggi valutazione (se collegata)
let valutazione = null
let notizia = null
if (incarico.valutazione_id) {
  const { data: val } = await supabase
    .from('valutazioni')
    .select('id, data_valutazione, notizia_id')
    .eq('id', incarico.valutazione_id)
    .maybeSingle()
  valutazione = val

  // 5. Leggi notizia (se collegata alla valutazione)
  if (val?.notizia_id) {
    const { data: not } = await supabase
      .from('notizie')
      .select('id, created_at')
      .eq('id', val.notizia_id)
      .maybeSingle()
    notizia = not
  }
}

// 6. Leggi immobile in portafoglio (nato da questo incarico)
const { data: immobilePortafoglio } = await supabase
  .from('immobili')
  .select('id, indirizzo, civico')
  .eq('incarico_id', id)
  .maybeSingle()

// 7. Leggi attività
const { data: attivita } = await supabase
  .from('attivita')
  .select('*, agenti (nome, cognome)')
  .eq('incarico_id', id)
  .order('data_attivita', { ascending: false })

const imm = immobile
const cli = cliente
const val = valutazione
const not = notizia
const stato = STATI[incarico.stato] || {
  label: incarico.stato,
  colore: 'bg-slate-700 text-slate-300',
}

// Timeline
const timeline = val
  ? [
      ...(not
        ? [
            {
              label: 'Notizia',
              icona: '📰',
              stato: 'completato' as const,
              link: `/notizie/${not.id}`,
            },
          ]
        : []),
      {
        label: 'Valutazione',
        icona: '📋',
        stato: 'completato' as const,
        link: `/valutazioni/${val.id}`,
        data: new Date(val.data_valutazione).toLocaleDateString('it-IT'),
      },
      {
        label: 'Incarico',
        icona: '📝',
        stato: 'completato' as const,
        data: new Date(incarico.data_inizio).toLocaleDateString('it-IT'),
      },
      {
        label: 'Immobile in portafoglio',
        icona: '🏠',
        stato: immobilePortafoglio
          ? ('completato' as const)
          : ('attivo' as const),
        link: immobilePortafoglio ? `/immobili/${immobilePortafoglio.id}` : undefined,
      },
    ]
  : null

const mostraPulsanteImmobile = val && !immobilePortafoglio
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

      {/* BREADCRUMB FLUSSO */}
      {val && (
        <div className="mt-3">
          <BreadcrumbFlusso
            step={[
              ...(not
                ? [
                    {
                      label: 'Notizia',
                      icona: '📰',
                      link: `/notizie/${not.id}`,
                    },
                  ]
                : []),
              {
                label: 'Valutazione',
                icona: '📋',
                link: `/valutazioni/${val.id}`,
              },
              { label: 'Incarico', icona: '📝', attivo: true },
              ...(immobilePortafoglio
                ? [
                    {
                      label: 'Immobile',
                      icona: '🏠',
                      link: `/immobili/${immobilePortafoglio.id}`,
                    },
                  ]
                : []),
            ]}
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">
            {imm
              ? `${imm.indirizzo} ${imm.civico || ''}`
              : immobilePortafoglio
              ? `${immobilePortafoglio.indirizzo} ${immobilePortafoglio.civico || ''}`
              : 'Incarico'}
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
            nome={imm ? `${imm.indirizzo} ${imm.civico || ''}` : 'questo incarico'}
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

    {/* PULSANTE PORTA IN PORTAFOGLIO */}
    {mostraPulsanteImmobile && (
      <div className="mb-6">
        <PulsanteConverti
          label="Porta in portafoglio"
          descrizione="Crea l'immobile dai dati della valutazione. Potrai poi completare le info (foto, descrizione, classe energetica...)."
          azione={incaricoToImmobile}
          id={id}
          colore="emerald"
          icona="🏠"
        />
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

      {immobilePortafoglio && (
        <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">🏠 In portafoglio</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-400">Immobile creato</dt>
              <dd className="text-white mt-0.5">
                <Link
                  href={`/immobili/${immobilePortafoglio.id}`}
                  className="text-blue-400 hover:underline"
                >
                  {immobilePortafoglio.indirizzo} {immobilePortafoglio.civico}
                </Link>
              </dd>
            </div>
            <Link
              href={`/immobili/${immobilePortafoglio.id}/modifica`}
              className="inline-block text-xs text-slate-400 hover:text-blue-400 underline"
            >
              Completa i dati dell&apos;immobile →
            </Link>
          </dl>
        </div>
      )}

      {cli && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Cliente venditore</h2>
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
          <div>
            <dt className="text-slate-400">Esclusiva</dt>
            <dd className="text-white mt-0.5">
              {incarico.esclusivo ? '✅ Sì' : '❌ No'}
            </dd>
          </div>
        </dl>
      </div>

      {!isAttivo && (
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

    <SezioneAttivita
      entita="incarico"
      entitaId={id}
      attivita={attivita || []}
    />
  </div>
)
}