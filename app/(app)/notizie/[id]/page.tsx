import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaNotiziaButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'
import PulsanteConverti from '@/components/pulsante-converti'
import TimelineFlusso from '@/components/timeline-flusso'
import { notiziaToValutazione } from '@/app/(app)/flusso/actions'

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
    .select(`
      *,
      agenti (nome, cognome),
      clienti (id, nome, cognome, telefono)
    `)
    .eq('id', id)
    .single()

  if (!notizia) notFound()

  const { data: attivita } = await supabase
    .from('attivita')
    .select('*, agenti (nome, cognome)')
    .eq('notizia_id', id)
    .order('data_attivita', { ascending: false })

  // Cerca la valutazione collegata (se esiste)
  const { data: valutazione } = await supabase
    .from('valutazioni')
    .select('id, data_valutazione, stato')
    .eq('notizia_id', id)
    .maybeSingle()

  // Cerca l'incarico (se la valutazione è stata convertita)
  let incarico = null
  if (valutazione) {
    const { data: inc } = await supabase
      .from('incarichi')
      .select('id, data_inizio, stato')
      .eq('valutazione_id', valutazione.id)
      .maybeSingle()
    incarico = inc
  }

  // Cerca l'immobile (se l'incarico è stato convertito)
  let immobile = null
  if (incarico) {
    const { data: imm } = await supabase
      .from('immobili')
      .select('id, indirizzo, civico')
      .eq('incarico_id', incarico.id)
      .maybeSingle()
    immobile = imm
  }

  const ag = Array.isArray(notizia.agenti) ? notizia.agenti[0] : notizia.agenti
  const cli = Array.isArray(notizia.clienti) ? notizia.clienti[0] : notizia.clienti
  const stato = STATI[notizia.stato] || {
    label: notizia.stato,
    colore: 'bg-slate-700 text-slate-300',
  }
  const isClienteCerca = notizia.tipo_notizia === 'cliente_cerca'
  const isImmobileVendesi = notizia.tipo_notizia === 'immobile_vendesi'

  // Timeline
  const timeline = [
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

  // Mostra pulsante converti solo se è immobile_vendesi e non ha ancora la valutazione
  const mostraPulsanteValutazione = isImmobileVendesi && !valutazione

  // Mostra pulsante incarico se la valutazione esiste ma non l'incarico
  const mostraPulsanteIncarico =
    isImmobileVendesi && valutazione && !incarico

  // Mostra pulsante immobile se l'incarico esiste ma non l'immobile
  const mostraPulsanteImmobile = isImmobileVendesi && incarico && !immobile

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/notizie" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle notizie
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {notizia.indirizzo
                ? `${notizia.indirizzo} ${notizia.civico || ''}`
                : isClienteCerca
                ? 'Cliente cerca casa'
                : 'Immobile da vendere'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isClienteCerca
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isClienteCerca ? '🔍 Cliente cerca casa' : '🏠 Immobile da vendere'}
              </span>
              <span>·</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                {TIPI[notizia.tipo] || notizia.tipo || '—'}
              </span>
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
              {ag && (
                <>
                  <span>·</span>
                  <span>
                    Registrata da {ag.nome} {ag.cognome} il{' '}
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
              nome={
                notizia.indirizzo
                  ? `${notizia.indirizzo} ${notizia.civico || ''}`
                  : 'questa notizia'
              }
            />
          </div>
        </div>
      </div>

      {/* TIMELINE FLUSSO (solo se è immobile da vendere) */}
      {isImmobileVendesi && (
        <div className="mb-6">
          <TimelineFlusso step={timeline} />
        </div>
      )}

      {/* PULSANTE CONVERTI */}
      {mostraPulsanteValutazione && (
        <div className="mb-6">
          <PulsanteConverti
            label="Crea valutazione"
            descrizione="Fissa un appuntamento per andare a vedere l'immobile e crea una valutazione."
            azione={notiziaToValutazione}
            id={id}
            colore="blue"
            icona="📋"
          />
        </div>
      )}

      {mostraPulsanteIncarico && (
        <div className="mb-6">
          <div className="bg-slate-800 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Crea incarico
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Il proprietario ti ha dato il mandato? Crea l&apos;incarico e collegalo alla valutazione.
                </p>
              </div>
              <Link
                href={`/valutazioni/${valutazione!.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Vai alla valutazione →
              </Link>
            </div>
          </div>
        </div>
      )}

      {mostraPulsanteImmobile && (
        <div className="mb-6">
          <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">🏠</span>
                  Porta in portafoglio
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  L&apos;incarico è firmato! Crea l&apos;immobile e inizia a lavorarlo.
                </p>
              </div>
              <Link
                href={`/incarichi/${incarico!.id}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Vai all&apos;incarico →
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {notizia.indirizzo && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Indirizzo</h2>
            <p className="text-white text-sm">
              {notizia.indirizzo} {notizia.civico}
              <br />
              {notizia.frazione && `${notizia.frazione}, `}
              {notizia.comune}
            </p>
          </div>
        )}

        {cli && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente collegato</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Nome</dt>
                <dd className="text-white mt-0.5">
                  <Link
                    href={`/clienti/${cli.id}`}
                    className="text-blue-400 hover:underline"
                  >
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

      {/* ATTIVITÀ */}
      <SezioneAttivita
        entita="notizia"
        entitaId={id}
        attivita={attivita || []}
      />
    </div>
  )
}