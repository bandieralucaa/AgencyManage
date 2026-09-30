'use client'

import { useState } from 'react'
import {
  creaAttivita,
  aggiornaAttivita,
  eliminaAttivita,
  toggleCompletata,
} from '@/app/(app)/attivita/actions'

type Attivita = {
  id: string
  tipo: string
  motivo: string | null
  descrizione: string
  data_attivita: string
  scadenza: string | null
  completata: boolean
  agente_id: string
  agenti?:
    | { nome: string; cognome: string }
    | { nome: string; cognome: string }[]
    | null
}

const TIPI_ATTIVITA = [
  { value: 'chiamata', label: '📞 Chiamata' },
  { value: 'email', label: '✉️ Email' },
  { value: 'incontro', label: '🤝 Incontro' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'contatto_diretto', label: '👤 Contatto diretto' },
  { value: 'altro', label: '📌 Altro' },
]

const MOTIVI = [
  { value: 'aggiornamento', label: 'Aggiornamento' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'richiesta_info', label: 'Richiesta info' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'altro', label: 'Altro' },
]

const TIPI_LABEL: Record<string, string> = {
  chiamata: '📞 Chiamata',
  email: '✉️ Email',
  incontro: '🤝 Incontro',
  whatsapp: '💬 WhatsApp',
  contatto_diretto: '👤 Contatto diretto',
  altro: '📌 Altro',
}

const MOTIVI_LABEL: Record<string, string> = {
  aggiornamento: 'Aggiornamento',
  proposta: 'Proposta',
  richiesta_info: 'Richiesta info',
  follow_up: 'Follow-up',
  altro: 'Altro',
}

type Props = {
  entita: 'incarico' | 'richiesta' | 'valutazione' | 'notizia' | 'immobile' | 'cliente'
  entitaId: string
  attivita: Attivita[]
}

type Modale = {
  aperta: boolean
  id?: string
  tipo: string
  motivo: string
  descrizione: string
  data_attivita: string
  scadenza: string
}

export default function SezioneAttivita({ entita, entitaId, attivita }: Props) {
  const oggi = new Date().toISOString().split('T')[0]

  const modaleVuota: Modale = {
    aperta: false,
    tipo: 'chiamata',
    motivo: 'aggiornamento',
    descrizione: '',
    data_attivita: oggi,
    scadenza: '',
  }

  const [modale, setModale] = useState<Modale>(modaleVuota)
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')

  function apriNuova() {
    setModale({ ...modaleVuota, aperta: true })
    setErrore('')
  }

  function apriModifica(a: Attivita) {
    setModale({
      aperta: true,
      id: a.id,
      tipo: a.tipo,
      motivo: a.motivo || '',
      descrizione: a.descrizione,
      data_attivita: a.data_attivita.split('T')[0],
      scadenza: a.scadenza ? a.scadenza.split('T')[0] : '',
    })
    setErrore('')
  }

  function chiudiModale() {
    setModale(modaleVuota)
    setErrore('')
  }

  async function salva() {
    if (!modale.descrizione.trim()) {
      setErrore('Inserisci una descrizione')
      return
    }

    setSalvando(true)
    setErrore('')

    try {
      if (modale.id) {
        const attivitaOriginale = attivita.find((a) => a.id === modale.id)
        await aggiornaAttivita(modale.id, {
          tipo: modale.tipo,
          motivo: modale.motivo,
          descrizione: modale.descrizione,
          data_attivita: modale.data_attivita,
          scadenza: modale.scadenza,
          completata: attivitaOriginale?.completata ?? false,
          entita,
          entita_id: entitaId,
        })
      } else {
        await creaAttivita({
          tipo: modale.tipo,
          motivo: modale.motivo,
          descrizione: modale.descrizione,
          data_attivita: modale.data_attivita,
          scadenza: modale.scadenza,
          entita,
          entita_id: entitaId,
        })
      }
      chiudiModale()
      window.location.reload()
    } catch (err: any) {
      setErrore(err?.message || 'Errore nel salvataggio')
      setSalvando(false)
    }
  }

  async function handleElimina(id: string) {
    if (!confirm('Eliminare questa attività?')) return
    await eliminaAttivita(id)
    window.location.reload()
  }

  async function handleToggle(a: Attivita) {
    await toggleCompletata(a.id, a.completata)
    window.location.reload()
  }

  function formatData(data: string) {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function isScaduta(s: string | null) {
    if (!s) return false
    return new Date(s) < new Date(new Date().setHours(0, 0, 0, 0))
  }

  function isOggi(s: string | null) {
    if (!s) return false
    const d = new Date(s)
    const o = new Date()
    return (
      d.getDate() === o.getDate() &&
      d.getMonth() === o.getMonth() &&
      d.getFullYear() === o.getFullYear()
    )
  }

  const attivitaOrdinate = [...attivita].sort(
    (a, b) =>
      new Date(b.data_attivita).getTime() - new Date(a.data_attivita).getTime()
  )

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            📋 Attività
            <span className="text-sm text-slate-500 font-normal">
              ({attivita.length})
            </span>
          </h2>
          <button
            onClick={apriNuova}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Aggiungi attività
          </button>
        </div>

        {attivitaOrdinate.length > 0 ? (
          <div className="space-y-3">
            {attivitaOrdinate.map((a) => {
              const ag = Array.isArray(a.agenti) ? a.agenti[0] : a.agenti
              const scaduta = isScaduta(a.scadenza) && !a.completata
              const scadeOggi = isOggi(a.scadenza) && !a.completata

              return (
                <div
                  key={a.id}
                  className={`border rounded-lg p-4 ${
                    a.completata
                      ? 'bg-slate-900/50 border-slate-700/50 opacity-60'
                      : scaduta
                      ? 'bg-red-500/5 border-red-500/30'
                      : scadeOggi
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-slate-900 border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(a)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        a.completata
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-slate-500 hover:border-slate-400'
                      }`}
                      title={
                        a.completata ? 'Segna come da fare' : 'Segna come completata'
                      }
                    >
                      {a.completata && '✓'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {TIPI_LABEL[a.tipo] || a.tipo}
                        </span>
                        {a.motivo && (
                          <span className="text-xs text-slate-500">
                            {MOTIVI_LABEL[a.motivo] || a.motivo}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {formatData(a.data_attivita)}
                        </span>
                        {a.scadenza && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              a.completata
                                ? 'bg-slate-700 text-slate-400'
                                : scaduta
                                ? 'bg-red-500/20 text-red-400'
                                : scadeOggi
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            ⏰ {scaduta ? 'Scaduta il ' : 'Entro il '}
                            {formatData(a.scadenza)}
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-sm whitespace-pre-wrap ${
                          a.completata
                            ? 'text-slate-500 line-through'
                            : 'text-slate-200'
                        }`}
                      >
                        {a.descrizione}
                      </div>
                      {ag && (
                        <div className="text-xs text-slate-500 mt-1.5">
                          da {ag.nome} {ag.cognome}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => apriModifica(a)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                        title="Modifica"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleElimina(a.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                        title="Elimina"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Nessuna attività registrata. Clicca &quot;+ Aggiungi attività&quot; per iniziare.
          </p>
        )}
      </div>

      {/* MODALE */}
      {modale.aperta && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={chiudiModale}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {modale.id ? 'Modifica attività' : 'Nuova attività'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Tipo *
                  </label>
                  <select
                    value={modale.tipo}
                    onChange={(e) => setModale({ ...modale, tipo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIPI_ATTIVITA.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Motivo
                  </label>
                  <select
                    value={modale.motivo}
                    onChange={(e) => setModale({ ...modale, motivo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">—</option>
                    {MOTIVI.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Data (quando l&apos;hai fatta) *
                  </label>
                  <input
                    type="date"
                    value={modale.data_attivita}
                    onChange={(e) =>
                      setModale({ ...modale, data_attivita: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Scadenza / Da fare entro
                  </label>
                  <input
                    type="date"
                    value={modale.scadenza}
                    onChange={(e) =>
                      setModale({ ...modale, scadenza: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descrizione *
                </label>
                <textarea
                  rows={4}
                  value={modale.descrizione}
                  onChange={(e) =>
                    setModale({ ...modale, descrizione: e.target.value })
                  }
                  autoFocus
                  placeholder="Es. Chiamato proprietario, d'accordo ad abbassare il prezzo a 180.000 €"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errore && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-3 py-2">
                  {errore}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={chiudiModale}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={salva}
                disabled={salvando}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvataggio...' : modale.id ? 'Salva modifiche' : 'Aggiungi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}