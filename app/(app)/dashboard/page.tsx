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

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-bold mb-2">Ciao, {agente?.nome} 👋</h1>
      <p className="text-slate-400 mb-8">Panoramica del tuo lavoro di oggi.</p>

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
        {/* SCADENZE */}
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

        {/* COMPLEANNI */}
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