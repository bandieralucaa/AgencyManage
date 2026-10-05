'use client'

import { useState, useEffect } from 'react'

type Evento = {
  id: string
  titolo: string
  inizio: string
  fine: string
  tuttoIlGiorno: boolean
  luogo?: string
  descrizione?: string
  calendario?: string
  calendarioId?: string
  colore?: string
}

type Modale = {
  aperta: boolean
  id?: string
  calendarId?: string
  titolo: string
  dataInizio: string
  oraInizio: string
  dataFine: string
  oraFine: string
  tuttoIlGiorno: boolean
  luogo: string
  descrizione: string
}

const MODALE_VUOTA: Modale = {
  aperta: false,
  titolo: '',
  dataInizio: '',
  oraInizio: '09:00',
  dataFine: '',
  oraFine: '10:00',
  tuttoIlGiorno: false,
  luogo: '',
  descrizione: '',
}

const GIORNI_SETTIMANA = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

const MESI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

function formatDataInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const g = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${g}`
}

function formatOraInput(d: Date) {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function stessoGiorno(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function AgendaCalendario() {
  const [dataCorrente, setDataCorrente] = useState(new Date())
  const [eventi, setEventi] = useState<Evento[]>([])
  const [loading, setLoading] = useState(false)
  const [calendari, setCalendari] = useState<{ id: string; summary: string; colore?: string; primary: boolean }[]>([])
  const [modale, setModale] = useState<Modale>(MODALE_VUOTA)
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')

  const oggi = new Date()

  // Carica la lista dei calendari (una volta sola)
  useEffect(() => {
    async function caricaCalendari() {
      try {
        const res = await fetch('/api/google/calendars')
        const data = await res.json()
        if (data.calendari) setCalendari(data.calendari)
      } catch (err) {
        console.error(err)
      }
    }
    caricaCalendari()
  }, [])

  useEffect(() => {
    async function carica() {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/google/events?anno=${dataCorrente.getFullYear()}&mese=${dataCorrente.getMonth()}`
        )
        const data = await res.json()
        if (data.eventi) setEventi(data.eventi)
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    carica()
  }, [dataCorrente])

  function mesePrecedente() {
    setDataCorrente(new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() - 1, 1))
  }

  function meseSuccessivo() {
    setDataCorrente(new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() + 1, 1))
  }

  function vaiAOggi() {
    setDataCorrente(new Date())
  }

  function generaGiorni(): Date[] {
    const primoDelMese = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth(), 1)
    let giornoSettimana = primoDelMese.getDay()
    giornoSettimana = giornoSettimana === 0 ? 6 : giornoSettimana - 1

    const inizio = new Date(primoDelMese)
    inizio.setDate(inizio.getDate() - giornoSettimana)

    const giorni: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(inizio)
      d.setDate(d.getDate() + i)
      giorni.push(d)
    }
    return giorni
  }

  function eventiDelGiorno(giorno: Date): Evento[] {
    return eventi.filter((e) => {
      const inizioEvento = new Date(e.inizio)
      return stessoGiorno(inizioEvento, giorno)
    })
  }

  function apriNuovoEvento(giorno: Date) {
    const dataStr = formatDataInput(giorno)
    setModale({
      aperta: true,
      titolo: '',
      dataInizio: dataStr,
      oraInizio: '09:00',
      dataFine: dataStr,
      oraFine: '10:00',
      tuttoIlGiorno: false,
      luogo: '',
      descrizione: '',
    })
    setErrore('')
  }

  function apriModificaEvento(evento: Evento) {
    const inizio = new Date(evento.inizio)
    const fine = new Date(evento.fine)

    setModale({
      aperta: true,
      id: evento.id,
      calendarId: evento.calendarioId || 'primary',
      titolo: evento.titolo,
      dataInizio: formatDataInput(inizio),
      oraInizio: formatOraInput(inizio),
      dataFine: formatDataInput(fine),
      oraFine: formatOraInput(fine),
      tuttoIlGiorno: evento.tuttoIlGiorno,
      luogo: evento.luogo || '',
      descrizione: evento.descrizione || '',
    })
    setErrore('')
  }

  async function salva() {
    setErrore('')
    if (!modale.titolo.trim()) {
      setErrore('Inserisci un titolo')
      return
    }

    let inizio: string
    let fine: string

    if (modale.tuttoIlGiorno) {
      inizio = modale.dataInizio
      const d = new Date(modale.dataFine + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      fine = formatDataInput(d)
    } else {
      inizio = `${modale.dataInizio}T${modale.oraInizio}:00`
      fine = `${modale.dataFine}T${modale.oraFine}:00`
    }

    setSalvando(true)

    const url = modale.id
      ? `/api/google/events/${modale.id}`
      : '/api/google/events'
    const method = modale.id ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titolo: modale.titolo,
        inizio,
        fine,
        tuttoIlGiorno: modale.tuttoIlGiorno,
        luogo: modale.luogo,
        descrizione: modale.descrizione,
        calendarId: modale.calendarId || 'primary',
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrore(data.errore || 'Errore nel salvataggio')
      setSalvando(false)
      return
    }

    if (modale.id && data.evento) {
      setEventi((prev) =>
        prev.map((e) => (e.id === modale.id ? data.evento : e))
      )
    } else if (data.evento) {
      setEventi((prev) => [...prev, data.evento])
    }

    setModale(MODALE_VUOTA)
    setSalvando(false)
  }

  async function elimina() {
    if (!modale.id) return
    if (!confirm('Eliminare questo evento?')) return

    setSalvando(true)

    const calendarId = modale.calendarId || 'primary'
    const url = `/api/google/events/${modale.id}?calendarId=${encodeURIComponent(calendarId)}`

    const res = await fetch(url, { method: 'DELETE' })
    const data = await res.json()

    if (!res.ok) {
      setErrore(data.errore || 'Errore nella cancellazione')
      setSalvando(false)
      return
    }

    setEventi((prev) => prev.filter((e) => e.id !== modale.id))
    setModale(MODALE_VUOTA)
    setSalvando(false)
  }

  const giorni = generaGiorni()

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={mesePrecedente}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              ‹
            </button>
            <button
              onClick={meseSuccessivo}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              ›
            </button>
            <button
              onClick={vaiAOggi}
              className="px-4 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              Oggi
            </button>
          </div>
          <h2 className="text-xl font-semibold text-white">
            {MESI[dataCorrente.getMonth()]} {dataCorrente.getFullYear()}
          </h2>
          <div className="text-sm text-slate-400">
            {loading ? 'Caricamento...' : `${eventi.length} eventi`}
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-700 bg-slate-900">
          {GIORNI_SETTIMANA.map((g) => (
            <div
              key={g}
              className="px-2 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider"
            >
              {g}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {giorni.map((giorno, i) => {
            const eventiGiorno = eventiDelGiorno(giorno)
            const isOggi = stessoGiorno(giorno, oggi)
            const isMeseCorrente = giorno.getMonth() === dataCorrente.getMonth()
            const isWeekend = giorno.getDay() === 0 || giorno.getDay() === 6

            return (
              <div
                key={i}
                onClick={() => apriNuovoEvento(giorno)}
                className={`
                  border-b border-r border-slate-700 min-h-[110px] p-1.5 cursor-pointer transition-colors
                  ${isMeseCorrente ? 'bg-slate-800 hover:bg-slate-700/60' : 'bg-slate-900/50 hover:bg-slate-800/60'}
                  ${isWeekend && isMeseCorrente ? 'bg-slate-800/70' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`
                      text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                      ${isOggi ? 'bg-blue-600 text-white' : isMeseCorrente ? 'text-slate-200' : 'text-slate-500'}
                    `}
                  >
                    {giorno.getDate()}
                  </span>
                  {eventiGiorno.length > 3 && (
                    <span className="text-[10px] text-slate-500">
                      +{eventiGiorno.length - 3}
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                                    {eventiGiorno.slice(0, 3).map((ev) => {
                    const inizio = new Date(ev.inizio)
                    const orario = ev.tuttoIlGiorno
                      ? ''
                      : `${String(inizio.getHours()).padStart(2, '0')}:${String(inizio.getMinutes()).padStart(2, '0')} `
                    const colore = ev.colore || '#3b82f6'
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          apriModificaEvento(ev)
                        }}
                        className="text-[11px] px-1.5 py-0.5 rounded hover:opacity-80 text-white truncate cursor-pointer flex items-center gap-1"
                        style={{ backgroundColor: colore }}
                        title={`${orario}${ev.titolo}${ev.calendario ? ` (${ev.calendario})` : ''}`}
                      >
                        {orario}
                        {ev.titolo}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modale.aperta && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setModale(MODALE_VUOTA)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {modale.id ? 'Modifica evento' : 'Nuovo evento'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={modale.titolo}
                  onChange={(e) => setModale({ ...modale, titolo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              {!modale.id && calendari.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Calendario
                  </label>
                  <select
                    value={modale.calendarId || 'primary'}
                    onChange={(e) =>
                      setModale({ ...modale, calendarId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {calendari.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary}
                        {c.primary ? ' (principale)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modale.id && modale.calendarId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Calendario
                  </label>
                  <div className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-400 text-sm">
                    {calendari.find((c) => c.id === modale.calendarId)?.summary || 'Calendario'}
                  </div>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modale.tuttoIlGiorno}
                  onChange={(e) =>
                    setModale({ ...modale, tuttoIlGiorno: e.target.checked })
                  }
                  className="w-4 h-4 accent-blue-600"
                />
                Tutto il giorno
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Data inizio
                  </label>
                  <input
                    type="date"
                    value={modale.dataInizio}
                    onChange={(e) =>
                      setModale({ ...modale, dataInizio: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!modale.tuttoIlGiorno && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Ora inizio
                    </label>
                    <input
                      type="time"
                      value={modale.oraInizio}
                      onChange={(e) =>
                        setModale({ ...modale, oraInizio: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Data fine
                  </label>
                  <input
                    type="date"
                    value={modale.dataFine}
                    onChange={(e) =>
                      setModale({ ...modale, dataFine: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {!modale.tuttoIlGiorno && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Ora fine
                    </label>
                    <input
                      type="time"
                      value={modale.oraFine}
                      onChange={(e) =>
                        setModale({ ...modale, oraFine: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Luogo
                </label>
                <input
                  type="text"
                  value={modale.luogo}
                  onChange={(e) => setModale({ ...modale, luogo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descrizione
                </label>
                <textarea
                  rows={3}
                  value={modale.descrizione}
                  onChange={(e) =>
                    setModale({ ...modale, descrizione: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errore && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-3 py-2">
                  {errore}
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 mt-6">
              <div>
                {modale.id && (
                  <button
                    onClick={elimina}
                    disabled={salvando}
                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 rounded-lg transition-colors"
                  >
                    Elimina
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setModale(MODALE_VUOTA)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={salva}
                  disabled={salvando}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {salvando ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}