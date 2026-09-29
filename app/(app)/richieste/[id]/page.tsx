import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaRichiestaButton from './elimina-button'

const STATI: Record<string, { label: string; colore: string }> = {
  nuova: { label: 'Nuova', colore: 'bg-blue-500/20 text-blue-400' },
  in_corso: { label: 'In corso', colore: 'bg-amber-500/20 text-amber-400' },
  sospesa: { label: 'Sospesa', colore: 'bg-slate-500/20 text-slate-400' },
  chiusa_trovato: { label: 'Chiusa · Trovato', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_comprato_altri: { label: 'Chiusa · Comprato altri', colore: 'bg-purple-500/20 text-purple-400' },
  chiusa_non_cerca_piu: { label: 'Chiusa · Non cerca più', colore: 'bg-slate-700 text-slate-400' },
}

const STATI_IMMOBILE: Record<string, string> = {
  nuovo: 'Nuovo',
  ristrutturato: 'Ristrutturato',
  buono: 'Buono',
  da_ristrutturare: 'Da ristrutturare',
  rudere: 'Rudere',
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

  if (richiesta.comuni_cercati && richiesta.comuni_cercati.length > 0) {
    const ok = richiesta.comuni_cercati.some(
      (c: string) =>
        c.toLowerCase().trim() === (immobile.comune || '').toLowerCase().trim()
    )
    criteri.push({ nome: 'Comune', ok })
  }

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

  if (richiesta.grandezza_min) {
    criteri.push({
      nome: 'Mq min',
      ok: (immobile.metri_quadrati || 0) >= richiesta.grandezza_min,
    })
  }
  if (richiesta.grandezza_max) {
    criteri.push({
      nome: 'Mq max',
      ok: (immobile.metri_quadrati || 0) <= richiesta.grandezza_max,
    })
  }

  if (richiesta.camere_min) {
    criteri.push({ nome: 'Camere', ok: (immobile.camere || 0) >= richiesta.camere_min })
  }

  if (richiesta.bagni_min) {
    criteri.push({ nome: 'Bagni', ok: (immobile.bagni || 0) >= richiesta.bagni_min })
  }

  if (richiesta.stato_immobile) {
    criteri.push({ nome: 'Stato', ok: immobile.stato === richiesta.stato_immobile })
  }

  if (richiesta.prezzo_min || richiesta.prezzo_max) {
    const prezzo =
      richiesta.tipo === 'vendita' ? immobile.prezzo : immobile.prezzo_affitto
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

  const cli = Array.isArray(richiesta.clienti) ? richiesta.clienti[0] : richiesta.clienti
  const stato = STATI[richiesta.stato] || {
    label: richiesta.stato,
    colore: 'bg-slate-700 text-slate-300',
  }

  const { data: immobili } = await supabase
    .from('immobili')
    .select(
      'id, indirizzo, civico, frazione, comune, tipo, categoria, metri_quadrati, camere, bagni, stato, prezzo, prezzo_affitto'
    )
    .eq('attivo', true)

  const matches = (immobili || [])
    .map((imm) => ({ immobile: imm, ...calcolaMatch(richiesta, imm) }))
    .filter((m) => m.totale > 0 && m.punteggio >= 30)
    .sort((a, b) => b.punteggio - a.punteggio)
    .slice(0, 20)

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
              <span className="capitalize">{richiesta.tipo}</span>
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
            {richiesta.zona_cercata && (
              <div>
                <dt className="text-slate-400">Zona</dt>
                <dd className="text-white mt-0.5">{richiesta.zona_cercata}</dd>
              </div>
            )}
            {richiesta.comuni_cercati && richiesta.comuni_cercati.length > 0 && (
              <div>
                <dt className="text-slate-400">Comuni</dt>
                <dd className="text-white mt-0.5">{richiesta.comuni_cercati.join(', ')}</dd>
              </div>
            )}
            {richiesta.frazioni_cercate && richiesta.frazioni_cercate.length > 0 && (
              <div>
                <dt className="text-slate-400">Frazioni</dt>
                <dd className="text-white mt-0.5">
                  {richiesta.frazioni_cercate.join(', ')}
                </dd>
              </div>
            )}
            {richiesta.tipologia && richiesta.tipologia.length > 0 && (
              <div>
                <dt className="text-slate-400">Tipologia</dt>
                <dd className="text-white mt-0.5 capitalize">
                  {richiesta.tipologia.map((t: string) => TIPI[t] || t).join(', ')}
                </dd>
              </div>
            )}
            {(richiesta.grandezza_min || richiesta.grandezza_max) && (
              <div>
                <dt className="text-slate-400">Superficie</dt>
                <dd className="text-white mt-0.5">
                  {richiesta.grandezza_min && `${richiesta.grandezza_min} mq`}
                  {richiesta.grandezza_min && richiesta.grandezza_max && ' - '}
                  {richiesta.grandezza_max && `${richiesta.grandezza_max} mq`}
                </dd>
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
          <h2 className="text-lg font-semibold mb-4">Caratteristiche desiderate</h2>
          <dl className="space-y-3 text-sm">
            {richiesta.stato_immobile && (
              <div>
                <dt className="text-slate-400">Stato immobile</dt>
                <dd className="text-white mt-0.5">
                  {STATI_IMMOBILE[richiesta.stato_immobile] || richiesta.stato_immobile}
                </dd>
              </div>
            )}
            {richiesta.camere_min && (
              <div>
                <dt className="text-slate-400">Camere minime</dt>
                <dd className="text-white mt-0.5">{richiesta.camere_min}</dd>
              </div>
            )}
            {richiesta.bagni_min && (
              <div>
                <dt className="text-slate-400">Bagni minimi</dt>
                <dd className="text-white mt-0.5">{richiesta.bagni_min}</dd>
              </div>
            )}
            {richiesta.piano_preferito && (
              <div>
                <dt className="text-slate-400">Piano preferito</dt>
                <dd className="text-white mt-0.5">{richiesta.piano_preferito}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-400">Spazio esterno</dt>
              <dd className="text-white mt-0.5">
                {richiesta.spazio_esterno ? '✅ Sì' : '❌ No'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Box / Garage</dt>
              <dd className="text-white mt-0.5">
                {richiesta.box_garage ? '✅ Sì' : '❌ No'}
              </dd>
            </div>
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
                richiesta.tipo === 'vendita' ? imm.prezzo : imm.prezzo_affitto
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
                        {imm.camere && (
                          <>
                            <span>·</span>
                            <span>{imm.camere} camere</span>
                          </>
                        )}
                        {imm.bagni && (
                          <>
                            <span>·</span>
                            <span>{imm.bagni} bagni</span>
                          </>
                        )}
                        {prezzo && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400 font-medium">
                              € {Number(prezzo).toLocaleString('it-IT')}
                              {richiesta.tipo === 'affitto' && '/mese'}
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
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
              {richiesta.comuni_cercati?.length ||
              richiesta.frazioni_cercate?.length ||
              richiesta.tipologia?.length ||
              richiesta.grandezza_min ||
              richiesta.grandezza_max ||
              richiesta.prezzo_min ||
              richiesta.prezzo_max ||
              richiesta.camere_min ||
              richiesta.bagni_min ||
              richiesta.stato_immobile
                ? 'Nessun immobile in portafoglio corrisponde ai criteri (almeno 30%).'
                : 'Aggiungi criteri di ricerca alla richiesta (comuni, frazioni, tipologia, budget, ecc.) per vedere i match.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}