import { createClient } from '@/lib/supabase/server'
import { getStatoCalendario } from '@/lib/google-calendar'
import ConnettiGoogleCalendar from '@/components/connetti-google-calendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: agente } = await supabase
    .from('agenti')
    .select('nome')
    .eq('id', user.id)
    .single()

  // Google Calendar
  const calendario = await getStatoCalendario(user.id)

  // Cose da fare (attività con scadenza, non completate)
  const { data: coseDaFare } = await supabase
    .from('attivita')
    .select(`
      id, descrizione, scadenza, tipo, motivo,
      incarico_id, richiesta_id, valutazione_id, notizia_id, immobile_id, cliente_id,
      incarichi (immobili (indirizzo, civico, comune)),
      richieste (clienti (nome, cognome)),
      valutazioni (indirizzo, civico),
      notizie (indirizzo, civico),
      immobili (indirizzo, civico),
      clienti (nome, cognome)
    `)
    .eq('completata', false)
    .not('scadenza', 'is', null)
    .order('scadenza', { ascending: true })
    .limit(10)

  // Scadenze incarichi (prossimi 90 giorni)
  const oggi = new Date()
  const novantaGiorni = new Date(oggi.getTime() + 90 * 24 * 60 * 60 * 1000)
  const { data: scadenze } = await supabase
    .from('incarichi')
    .select('id, tipo, data_scadenza, prezzo, esclusivo, immobili(indirizzo, civico, comune)')
    .eq('stato', 'attivo')
    .gte('data_scadenza', oggi.toISOString().split('T')[0])
    .lte('data_scadenza', novantaGiorni.toISOString().split('T')[0])
    .order('data_scadenza', { ascending: true })
    .limit(10)

  // Compleanni (prossimi 30 giorni)
  const { data: tuttiClienti } = await supabase
    .from('clienti')
    .select('id, nome, cognome, data_nascita, telefono')
    .eq('attivo', true)
    .not('data_nascita', 'is', null)

  const compleanni = (tuttiClienti || [])
    .map((c) => {
      const bd = new Date(c.data_nascita!)
      const questoAnno = new Date(oggi.getFullYear(), bd.getMonth(), bd.getDate())
      if (questoAnno < oggi) questoAnno.setFullYear(oggi.getFullYear() + 1)
      const giorni = Math.ceil((questoAnno.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24))
      return { ...c, giorni }
    })
    .filter((c) => c.giorni <= 30)
    .sort((a, b) => a.giorni - b.giorni)

  function formatData(data: string) {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function giorniLabel(giorni: number) {
    if (giorni === 0) return 'Oggi'
    if (giorni === 1) return 'Domani'
    return `Tra ${giorni} gg`
  }

  function giorniAllaScadenza(dataStr: string) {
    const d = new Date(dataStr)
    const o = new Date()
    o.setHours(0, 0, 0, 0)
    d.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - o.getTime()) / (1000 * 60 * 60 * 24))
  }

  function linkEntita(a: any) {
    if (a.incarico_id) return `/incarichi/${a.incarico_id}`
    if (a.richiesta_id) return `/richieste/${a.richiesta_id}`
    if (a.valutazione_id) return `/valutazioni/${a.valutazione_id}`
    if (a.notizia_id) return `/notizie/${a.notizia_id}`
    if (a.immobile_id) return `/immobili/${a.immobile_id}`
    if (a.cliente_id) return `/clienti/${a.cliente_id}`
    return null
  }

  function etichettaAttivita(a: any) {
    if (a.incarichi) {
      const i = Array.isArray(a.incarichi) ? a.incarichi[0] : a.incarichi
      const imm = i?.immobili
      const im = Array.isArray(imm) ? imm[0] : imm
      return im ? `${im.indirizzo} ${im.civico || ''}, ${im.comune}` : 'Incarico'
    }
    if (a.richieste) {
      const r = Array.isArray(a.richieste) ? a.richieste[0] : a.richieste
      const c = r?.clienti
      const cli = Array.isArray(c) ? c[0] : c
      return cli ? `Richiesta di ${cli.cognome} ${cli.nome}` : 'Richiesta'
    }
    if (a.valutazioni) {
      const v = Array.isArray(a.valutazioni) ? a.valutazioni[0] : a.valutazioni
      return v ? `Valutazione ${v.indirizzo} ${v.civico || ''}` : 'Valutazione'
    }
    if (a.notizie) {
      const n = Array.isArray(a.notizie) ? a.notizie[0] : a.notizie
      return n?.indirizzo ? `Notizia ${n.indirizzo} ${n.civico || ''}` : 'Notizia'
    }
    if (a.immobili) {
      const i = Array.isArray(a.immobili) ? a.immobili[0] : a.immobili
      return i ? `${i.indirizzo} ${i.civico || ''}` : 'Immobile'
    }
    if (a.clienti) {
      const c = Array.isArray(a.clienti) ? a.clienti[0] : a.clienti
      return c ? `${c.cognome} ${c.nome}` : 'Cliente'
    }
    return ''
  }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-bold mb-2">Ciao, {agente?.nome} 👋</h1>
      <p className="text-slate-400 mb-8">Panoramica del tuo lavoro di oggi.</p>

      {/* COSE DA FARE */}
      {coseDaFare && coseDaFare.length > 0 && (
        <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ⚡ Cose da fare
            <span className="text-xs text-slate-500 font-normal">
              ({coseDaFare.length})
            </span>
          </h3>
          <ul className="space-y-2">
            {coseDaFare.map((a: any) => {
              const giorni = giorniAllaScadenza(a.scadenza)
              const scaduta = giorni < 0
              const oggi = giorni === 0
              const link = linkEntita(a)
              const etichetta = etichettaAttivita(a)

              const contenuto = (
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white">{a.descrizione}</div>
                    {etichetta && (
                      <div className="text-xs text-slate-500 mt-0.5">{etichetta}</div>
                    )}
                  </div>
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                      scaduta
                        ? 'bg-red-500/20 text-red-400'
                        : oggi
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {scaduta
                      ? `Scaduta ${Math.abs(giorni)} gg fa`
                      : oggi
                      ? 'Oggi'
                      : `Entro ${formatData(a.scadenza)}`}
                  </div>
                </div>
              )

              return (
                <li
                  key={a.id}
                  className="border-b border-slate-700 last:border-0 pb-2 last:pb-0"
                >
                  {link ? (
                    <a
                      href={link}
                      className="flex items-start gap-3 hover:bg-slate-700/40 -mx-2 px-2 py-2 rounded transition-colors"
                    >
                      {contenuto}
                    </a>
                  ) : (
                    <div className="flex items-start gap-3 py-2">{contenuto}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* GOOGLE CALENDAR */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            📅 Impegni di oggi
          </h3>
          {!calendario.connesso && <ConnettiGoogleCalendar />}
        </div>
        {calendario.eventi.length > 0 ? (
          <ul className="space-y-3">
            {calendario.eventi.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-4 pb-3 border-b border-slate-700 last:border-0 last:pb-0"
              >
                <div className="text-sm text-blue-400 font-medium w-24 shrink-0 pt-0.5">
                  {e.tuttoIlGiorno
                    ? 'Tutto il giorno'
                    : new Date(e.inizio).toLocaleTimeString('it-IT', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{e.titolo}</div>
                  {e.luogo && (
                    <div className="text-xs text-slate-400 mt-1">📍 {e.luogo}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : calendario.connesso ? (
          <p className="text-sm text-slate-500">Nessun impegno oggi. 🎉</p>
        ) : (
          <p className="text-sm text-slate-500">
            Collega il tuo Google Calendar per vedere gli impegni di oggi.
          </p>
        )}
      </div>

      {/* SCADENZE E COMPLEANNI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            ⏰ Scadenze incarichi
            <span className="text-xs text-slate-500 font-normal">(prossimi 90 gg)</span>
          </h3>
          {scadenze && scadenze.length > 0 ? (
            <ul className="space-y-3">
              {scadenze.map((s) => {
                const imm = Array.isArray(s.immobili) ? s.immobili[0] : s.immobili
                const giorni = Math.ceil(
                  (new Date(s.data_scadenza).getTime() - oggi.getTime()) /
                    (1000 * 60 * 60 * 24)
                )
                const urgente = giorni <= 30
                return (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {imm?.indirizzo} {imm?.civico}, {imm?.comune}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {s.tipo === 'vendita' ? 'Vendita' : 'Affitto'}
                        {s.esclusivo && ' · Esclusiva'}
                        {s.prezzo && ` · € ${Number(s.prezzo).toLocaleString('it-IT')}`}
                      </div>
                    </div>
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                        urgente
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {formatData(s.data_scadenza)}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Nessuna scadenza nei prossimi 90 giorni.
            </p>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎂 Compleanni
            <span className="text-xs text-slate-500 font-normal">(prossimi 30 gg)</span>
          </h3>
          {compleanni.length > 0 ? (
            <ul className="space-y-3">
              {compleanni.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 pb-3 border-b border-slate-700 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {c.nome} {c.cognome}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatData(c.data_nascita!)}
                      {c.telefono && ` · ${c.telefono}`}
                    </div>
                  </div>
                  <div
                    className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${
                      c.giorni === 0
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {giorniLabel(c.giorni)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Nessun compleanno nei prossimi 30 giorni.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}