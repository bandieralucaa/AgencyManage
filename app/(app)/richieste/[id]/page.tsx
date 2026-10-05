import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaRichiestaButton from './elimina-button'
import SezioneProposteVisita from '@/components/sezione-proposte-visita'
import SezioneVisite from '@/components/sezione-visite'

const STATI: Record<string, { label: string; colore: string }> = {
  nuova: { label: 'Nuova', colore: 'bg-blue-500/20 text-blue-400' },
  in_corso: { label: 'In corso', colore: 'bg-amber-500/20 text-amber-400' },
  sospesa: { label: 'Sospesa', colore: 'bg-slate-500/20 text-slate-400' },
  chiusa_trovato: { label: 'Chiusa · Trovato', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_comprato_altri: { label: 'Chiusa · Comprato altri', colore: 'bg-purple-500/20 text-purple-400' },
  chiusa_non_cerca_piu: { label: 'Chiusa · Non cerca più', colore: 'bg-slate-700 text-slate-400' },
}

const CERCA_LABEL: Record<string, string> = {
  vendita: 'Vendita',
  locazione: 'Locazione',
  nuda_proprieta: 'Nuda proprietà',
}

const STATI_IMMOBILE: Record<string, string> = {
  nuovo: 'Nuovo',
  qualche_lavoro: 'Qualche lavoro',
  buono: 'Buono',
  da_ristrutturare: 'Da ristrutturare',
  rudere: 'Rudere',
  ristrutturato: 'Ristrutturato',
}

const TIPI: Record<string, string> = {
  appartamento: 'Appartamento',
  villa: 'Villa',
  villetta: 'Villetta',
  terreno: 'Terreno',
  ufficio: 'Ufficio',
  negozio: 'Negozio',
  garage: 'Garage',
  box: 'Box',
  magazzino: 'Magazzino',
  rustico: 'Rustico',
  altro: 'Altro',
}

function calcolaMatch(richiesta: any, immobile: any) {
  const criteri: { nome: string; ok: boolean }[] = []

  if (richiesta.frazioni_cercate && richiesta.frazioni_cercate.length > 0) {
    const ok = richiesta.frazioni_cercate.some(
      (f: string) =>
        f.toLowerCase().trim() === (immobile.frazione || '').toLowerCase().trim()
    )
    criteri.push({ nome: 'Frazione', ok })
  }

  if (richiesta.tipologia && richiesta.tipologia.length > 0) {
    criteri.push({ nome: 'Tipologia', ok: richiesta.tipologia.includes(immobile.tipo) })
  }

  if (richiesta.locali_min) {
    criteri.push({
      nome: 'Locali min',
      ok: (immobile.vani || 0) >= richiesta.locali_min,
    })
  }
  if (richiesta.locali_max) {
    criteri.push({
      nome: 'Locali max',
      ok: (immobile.vani || 0) <= richiesta.locali_max,
    })
  }

  if (richiesta.bagni_min) {
    criteri.push({
      nome: 'Bagni min',
      ok: (immobile.bagni || 0) >= richiesta.bagni_min,
    })
  }

  if (richiesta.mq_min) {
    criteri.push({
      nome: 'Mq min',
      ok: (immobile.metri_quadrati || 0) >= richiesta.mq_min,
    })
  }
  if (richiesta.mq_max) {
    criteri.push({
      nome: 'Mq max',
      ok: (immobile.metri_quadrati || 0) <= richiesta.mq_max,
    })
  }

  if (richiesta.stato_immobile) {
    criteri.push({ nome: 'Stato', ok: immobile.stato === richiesta.stato_immobile })
  }

  if (richiesta.riscaldamento) {
    criteri.push({
      nome: 'Riscaldamento',
      ok: (immobile.riscaldamento || '').toLowerCase() === richiesta.riscaldamento.toLowerCase(),
    })
  }

  if (richiesta.prezzo_min || richiesta.prezzo_max) {
    const prezzo =
      richiesta.cerca === 'vendita' || richiesta.cerca === 'nuda_proprieta'
        ? immobile.prezzo
        : immobile.prezzo_affitto
    if (prezzo) {
      let ok = true
      if (richiesta.prezzo_min && prezzo < richiesta.prezzo_min) ok = false
      if (richiesta.prezzo_max && prezzo > richiesta.prezzo_max) ok = false
      criteri.push({ nome: 'Budget', ok })
    } else {
      criteri.push({ nome: 'Budget', ok: false })
    }
  }

  if (criteri.length === 0) {
    return { punteggio: 0, dettagli: [], totale: 0 }
  }

  const soddisfatti = criteri.filter((c) => c.ok).length
  const punteggio = Math.round((soddisfatti / criteri.length) * 100)

  return { punteggio, dettagli: criteri, totale: criteri.length }
}

function colorePunteggio(p: number) {
  if (p >= 80) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
  if (p >= 60) return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
  if (p >= 40) return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
  return 'bg-slate-700 text-slate-400 border-slate-600'
}

export default async function RichiestaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: richiesta } = await supabase
    .from('richieste')
    .select(`*, clienti (id, nome, cognome, telefono, email)`)
    .eq('id', id)
    .single()

  if (!richiesta) notFound()

  // Proposte di visita
  const { data: proposteVisita } = await supabase
    .from('proposte_visita')
    .select('id, stato, data_proposta, data_risposta, motivo_rifiuto, immobile_id, immobili (indirizzo, civico, comune)')
    .eq('richiesta_id', id)
    .order('created_at', { ascending: false })

  const proposteVisitaNormalizzate = (proposteVisita || []).map((p: any) => {
    const immobile = Array.isArray(p.immobili) ? p.immobili[0] ?? null : p.immobili ?? null

    return {
      ...p,
      immobili: immobile
        ? {
            indirizzo: immobile.indirizzo ?? '',
            civico: immobile.civico ?? null,
            comune: immobile.comune ?? '',
          }
        : {
            indirizzo: '',
            civico: null,
            comune: '',
          },
    }
  })

  // Visite effettuate per questa richiesta
  const { data: visite } = await supabase
    .from('visite')
    .select('id, data_visita, note, immobili (indirizzo, civico, comune), clienti (nome, cognome)')
    .eq('richiesta_id', id)
    .order('data_visita', { ascending: false })

  const { data: proposte } = await supabase
    .from('proposte')
    .select(`
      id, stato, data_visita, data_proposta, importo_proposto,
      immobili (id, indirizzo, civico, comune)
    `)
    .eq('richiesta_id', id)
    .order('created_at', { ascending: false })

  const cli = Array.isArray(richiesta.clienti) ? richiesta.clienti[0] : richiesta.clienti
  const stato = STATI[richiesta.stato] || {
    label: richiesta.stato,
    colore: 'bg-slate-700 text-slate-300',
  }

  // 1. Prendi solo gli immobili che hanno un incarico ATTIVO
  const { data: incarichiAttivi } = await supabase
    .from('incarichi')
    .select('immobile_id')
    .eq('stato', 'attivo')
    .not('immobile_id', 'is', null)

  const immobiliIds = (incarichiAttivi || [])
    .map((i) => i.immobile_id)
    .filter(Boolean) as string[]

  // 2. Carica solo quegli immobili
  const { data: immobili } =
    immobiliIds.length > 0
      ? await supabase
          .from('immobili')
          .select(
            'id, indirizzo, civico, frazione, comune, tipo, categoria, metri_quadrati, vani, camere, bagni, stato, riscaldamento, prezzo, prezzo_affitto'
          )
          .eq('attivo', true)
          .in('id', immobiliIds)
      : { data: [] }

  const matches = (immobili || [])
    .map((imm) => ({ immobile: imm, ...calcolaMatch(richiesta, imm) }))
    .filter((m) => m.totale > 0 && m.punteggio >= 30)
    .sort((a, b) => b.punteggio - a.punteggio)
    .slice(0, 20)

  function localiRange() {
    if (richiesta.locali_min && richiesta.locali_max)
      return `${richiesta.locali_min} - ${richiesta.locali_max} locali`
    if (richiesta.locali_min) return `da ${richiesta.locali_min} locali`
    if (richiesta.locali_max) return `fino a ${richiesta.locali_max} locali`
    return null
  }

  function mqRange() {
    if (richiesta.mq_min && richiesta.mq_max)
      return `${richiesta.mq_min} - ${richiesta.mq_max} mq`
    if (richiesta.mq_min) return `da ${richiesta.mq_min} mq`
    if (richiesta.mq_max) return `fino a ${richiesta.mq_max} mq`
    return null
  }

  const locali = localiRange()
  const mq = mqRange()

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/richieste" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle richieste
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {cli ? `${cli.cognome} ${cli.nome}` : 'Richiesta'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span>{CERCA_LABEL[richiesta.cerca] || richiesta.cerca || '—'}</span>
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
              {richiesta.data_chiusura && (
                <>
                  <span>·</span>
                  <span>
                    Chiusa il {new Date(richiesta.data_chiusura).toLocaleDateString('it-IT')}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/richieste/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaRichiestaButton
              id={id}
              nome={cli ? `${cli.cognome} ${cli.nome}` : 'questa richiesta'}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {cli && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
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
          <h2 className="text-lg font-semibold mb-4">Cosa cerca</h2>
          <dl className="space-y-3 text-sm">
                        {richiesta.frazioni_cercate && richiesta.frazioni_cercate.length > 0 && (
              <div>
                <dt className="text-slate-400">Località</dt>
                <dd className="text-white mt-0.5">{richiesta.frazioni_cercate.join(', ')}</dd>
              </div>
            )}
            {richiesta.tipologia && richiesta.tipologia.length > 0 && (
              <div>
                <dt className="text-slate-400">Tipologia</dt>
                <dd className="text-white mt-0.5">
                  {richiesta.tipologia.map((t: string) => TIPI[t] || t).join(', ')}
                </dd>
              </div>
            )}
            {locali && (
              <div>
                <dt className="text-slate-400">N. locali</dt>
                <dd className="text-white mt-0.5">{locali}</dd>
              </div>
            )}
            {mq && (
              <div>
                <dt className="text-slate-400">Superficie</dt>
                <dd className="text-white mt-0.5">{mq}</dd>
              </div>
            )}
                        {richiesta.bagni_min && (
              <div>
                <dt className="text-slate-400">Bagni minimi</dt>
                <dd className="text-white mt-0.5">{richiesta.bagni_min}</dd>
              </div>
            )}
            {(richiesta.prezzo_min || richiesta.prezzo_max) && (
              <div>
                <dt className="text-slate-400">Budget</dt>
                <dd className="text-white mt-0.5">
                  {richiesta.prezzo_min &&
                    `€ ${Number(richiesta.prezzo_min).toLocaleString('it-IT')}`}
                  {richiesta.prezzo_min && richiesta.prezzo_max && ' - '}
                  {richiesta.prezzo_max &&
                    `€ ${Number(richiesta.prezzo_max).toLocaleString('it-IT')}`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Caratteristiche stabile</h2>
          <dl className="space-y-3 text-sm">
            {richiesta.stato_immobile && (
              <div>
                <dt className="text-slate-400">Stato</dt>
                <dd className="text-white mt-0.5">
                  {STATI_IMMOBILE[richiesta.stato_immobile] || richiesta.stato_immobile}
                </dd>
              </div>
            )}
            {richiesta.tipo_stabile && (
              <div>
                <dt className="text-slate-400">Tipo stabile</dt>
                <dd className="text-white mt-0.5 capitalize">{richiesta.tipo_stabile}</dd>
              </div>
            )}
            {richiesta.riscaldamento && (
              <div>
                <dt className="text-slate-400">Riscaldamento</dt>
                <dd className="text-white mt-0.5 capitalize">{richiesta.riscaldamento}</dd>
              </div>
            )}
            {richiesta.accessori && richiesta.accessori.length > 0 && (
              <div>
                <dt className="text-slate-400">Accessori e pertinenze</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {richiesta.accessori.map((a: string) => (
                    <span
                      key={a}
                      className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-300"
                    >
                      {a}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Mutuo</h2>
          <div className="text-sm">
            <div className="text-white mb-2">
              {richiesta.mutuo ? '✅ Sì, il cliente ha bisogno di mutuo' : '❌ No'}
            </div>
            {richiesta.mutuo_note && (
              <div className="text-slate-300 text-xs mt-2">{richiesta.mutuo_note}</div>
            )}
          </div>
        </div>

        {richiesta.motivo_chiusura && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Motivo chiusura</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {richiesta.motivo_chiusura}
            </p>
          </div>
        )}

        {richiesta.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Note</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{richiesta.note}</p>
          </div>
        )}
      </div>


      {/* PROPOSTE COLLEGATE */}
      {proposte && proposte.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-2xl font-bold">🤝 Proposte</h2>
            <Link
              href={`/proposte/nuovo?richiesta_id=${id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Registra proposta
            </Link>
          </div>
          <div className="space-y-3">
            {proposte.map((p: any) => {
              const pImm = Array.isArray(p.immobili) ? p.immobili[0] : p.immobili
              const statop = {
                in_corso: 'In corso',
                accettata: '✅ Accettata',
                rifiutata: '❌ Rifiutata',
                controproposta: '↔️ Controproposta',
                ritirata: 'Ritirata',
              }[p.stato as string] || p.stato
              const colorip = {
                in_corso: 'bg-amber-500/20 text-amber-400',
                accettata: 'bg-emerald-500/20 text-emerald-400',
                rifiutata: 'bg-red-500/20 text-red-400',
                controproposta: 'bg-blue-500/20 text-blue-400',
                ritirata: 'bg-slate-700 text-slate-400',
              }[p.stato as string] || 'bg-slate-700 text-slate-300'
              return (
                <Link
                  key={p.id}
                  href={`/proposte/${p.id}`}
                  className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">
                        {pImm ? `${pImm.indirizzo} ${pImm.civico}, ${pImm.comune}` : '—'}
                      </div>
                      <div className="text-sm text-slate-400 mt-1 flex gap-3 flex-wrap">
                        {p.data_visita && (
                          <span>
                            Visita: {new Date(p.data_visita).toLocaleDateString('it-IT')}
                          </span>
                        )}
                        {p.importo_proposto && (
                          <span className="text-emerald-400 font-medium">
                            € {Number(p.importo_proposto).toLocaleString('it-IT')}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${colorip}`}>
                      {statop}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Pulsante per registrare una proposta anche se non ce ne sono ancora */}
      {(!proposte || proposte.length === 0) && matches.length > 0 && (
        <div className="mt-10">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-lg font-semibold">🤝 Nessuna proposta registrata</h3>
              <p className="text-sm text-slate-400 mt-1">
                Quando un cliente visita un immobile e fa un&apos;offerta, registrala qui.
              </p>
            </div>
            <Link
              href={`/proposte/nuovo?richiesta_id=${id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              + Registra proposta
            </Link>
          </div>
        </div>
      )}

      {/* IMMOBILI COMPATIBILI */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-2xl font-bold">🏠 Immobili compatibili</h2>
          <span className="text-sm text-slate-400">
            {matches.length > 0
              ? `${matches.length} ${matches.length === 1 ? 'risultato' : 'risultati'} (match ≥ 30%)`
              : 'Nessun match'}
          </span>
        </div>

        {matches.length > 0 ? (
          <div className="space-y-3">
            {matches.map((m) => {
              const imm = m.immobile
              const prezzo =
                richiesta.cerca === 'vendita' || richiesta.cerca === 'nuda_proprieta'
                  ? imm.prezzo
                  : imm.prezzo_affitto
              return (
                <div
                  key={imm.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Link
                          href={`/immobili/${imm.id}`}
                          className="font-semibold text-white hover:text-blue-400 transition-colors"
                        >
                          {imm.indirizzo} {imm.civico}
                        </Link>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colorePunteggio(m.punteggio)}`}>
                          {m.punteggio}% match
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 flex items-center gap-3 flex-wrap">
                        <span>
                          {imm.frazione && `${imm.frazione}, `}
                          {imm.comune}
                        </span>
                        <span>·</span>
                        <span>{TIPI[imm.tipo] || imm.tipo}</span>
                        {imm.metri_quadrati && (
                          <>
                            <span>·</span>
                            <span>{imm.metri_quadrati} mq</span>
                          </>
                        )}
                        {imm.vani && (
                          <>
                            <span>·</span>
                            <span>{imm.vani} locali</span>
                          </>
                        )}
                        {prezzo && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 font-medium">
                              € {Number(prezzo).toLocaleString('it-IT')}
                              {richiesta.cerca === 'locazione' && '/mese'}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {m.dettagli.map((d) => (
                          <span
                            key={d.nome}
                            className={`text-[11px] px-2 py-0.5 rounded ${
                              d.ok
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {d.ok ? '✓' : '✗'} {d.nome}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link
                      href={`/immobili/${imm.id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700 px-2.5 py-1.5 rounded transition-colors whitespace-nowrap"
                    >
                      Vedi immobile
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400">
              {richiesta.frazioni_cercate?.length ||
              richiesta.tipologia?.length ||
              richiesta.locali_min ||
              richiesta.locali_max ||
              richiesta.mq_min ||
              richiesta.mq_max ||
              richiesta.prezzo_min ||
              richiesta.prezzo_max ||
              richiesta.stato_immobile ||
              richiesta.riscaldamento
                ? 'Nessun immobile in portafoglio corrisponde ai criteri (almeno 30%).'
                : 'Aggiungi criteri di ricerca alla richiesta (frazioni, tipologia, budget, ecc.) per vedere i match.'}
            </p>
          </div>
        )}
      </div>

      <SezioneProposteVisita
        richiestaId={id}
        clienteId={richiesta.cliente_id}
        proposte={proposteVisitaNormalizzate}
      />

      <SezioneVisite
        visite={visite || []}
        contesto={{
          richiesta_id: id,
          cliente_id: richiesta.cliente_id,
        }}
        mostraFormImmobile={true}
        mostraFormCliente={false}
      />
    </div>
  )
}