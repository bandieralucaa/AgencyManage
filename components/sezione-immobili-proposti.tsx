'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  creaImmobileProposto,
  aggiornaImmobileProposto,
  eliminaImmobileProposto,
} from '@/app/(app)/immobili-proposti/actions'

type Opzione = { id: string; label: string }

type ImmobileProposto = {
  id: string
  immobile_id: string
  esito: string
  motivo_rifiuto: string | null
  data_proposta: string | null
  immobili?:
    | { indirizzo: string; civico: string | null; comune: string }
    | { indirizzo: string; civico: string | null; comune: string }[]
    | null
}

const ESITI: Record<string, { label: string; colore: string }> = {
  piace: { label: '👍 Piace, vuole vederlo', colore: 'bg-emerald-500/20 text-emerald-400' },
  non_piace: { label: '👎 Non piace', colore: 'bg-red-500/20 text-red-400' },
}

export default function SezioneImmobiliProposti({
  richiestaId,
  clienteId,
  proposti,
}: {
  richiestaId: string
  clienteId: string | null
  proposti: ImmobileProposto[]
}) {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [immobili, setImmobili] = useState<Opzione[]>([])
  const [modaleAperta, setModaleAperta] = useState(false)
  const [modificaId, setModificaId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [errore, setErrore] = useState('')

  const [form, setForm] = useState({
    immobile_id: '',
    esito: 'piace',
    motivo_rifiuto: '',
    data_proposta: '',
  })

  useEffect(() => {
    async function carica() {
      // Solo immobili in portafoglio (con incarico attivo o in trattativa)
      const { data: incarichi } = await supabase
        .from('incarichi')
        .select('immobile_id')
        .eq('stato', 'attivo')
        .not('immobile_id', 'is', null)

      const ids = (incarichi || []).map((i) => i.immobile_id).filter(Boolean) as string[]

      if (ids.length === 0) {
        setImmobili([])
        return
      }

      const { data } = await supabase
        .from('immobili')
        .select('id, indirizzo, civico, comune')
        .in('id', ids)
        .eq('attivo', true)
        .order('indirizzo', { ascending: true })

      if (data) {
        setImmobili(
          data.map((x) => ({
            id: x.id,
            label: `${x.indirizzo} ${x.civico || ''}, ${x.comune}`,
          }))
        )
      }
    }
    carica()
  }, [supabase])

  function resetForm() {
    setForm({
      immobile_id: '',
      esito: 'piace',
      motivo_rifiuto: '',
      data_proposta: '',
    })
    setModificaId(null)
    setErrore('')
  }

  function apriNuova() {
    resetForm()
    setModaleAperta(true)
  }

  function apriModifica(p: ImmobileProposto) {
    setForm({
      immobile_id: p.immobile_id,
      esito: p.esito,
      motivo_rifiuto: p.motivo_rifiuto || '',
     data_proposta: p.data_proposta || '',
    })
    setModificaId(p.id)
    setModaleAperta(true)
  }

  function chiudi() {
    setModaleAperta(false)
    resetForm()
  }

  async function salva() {
    if (!form.immobile_id) {
      setErrore('Seleziona un immobile')
      return
    }
    if (!form.data_proposta) {
  setErrore('Inserisci la data della proposta')
  return
}
    if (form.esito === 'non_piace' && !form.motivo_rifiuto.trim()) {
      setErrore('Inserisci il motivo per cui non piace')
      return
    }

    setSalvando(true)
    setErrore('')

    const result = modificaId
      ? await aggiornaImmobileProposto(modificaId, richiestaId, {
          esito: form.esito,
          motivo_rifiuto: form.motivo_rifiuto,
          data_proposta: form.data_proposta,
        })
      : await creaImmobileProposto({
          richiesta_id: richiestaId,
          immobile_id: form.immobile_id,
          cliente_id: clienteId || undefined,
          esito: form.esito,
          motivo_rifiuto: form.motivo_rifiuto,
          data_proposta: form.data_proposta,
        })

    setSalvando(false)

    if (!result.ok) {
      setErrore(result.errore || 'Errore nel salvataggio')
      return
    }

    chiudi()
    router.refresh()
  }

  async function handleElimina(id: string) {
    if (!confirm('Eliminare questa proposta?')) return
    const result = await eliminaImmobileProposto(id, richiestaId)
    if (result.ok) router.refresh()
    else alert(result.errore)
  }

  function getImmobileLabel(p: ImmobileProposto): string {
    const imm = Array.isArray(p.immobili) ? p.immobili[0] : p.immobili
    if (!imm) return '—'
    return `${imm.indirizzo} ${imm.civico || ''}, ${imm.comune}`
  }

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🏠 Immobili proposti
            <span className="text-sm text-slate-500 font-normal">
              ({proposti.length})
            </span>
          </h2>
          <button
            onClick={apriNuova}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Proponi immobile
          </button>
        </div>

        {proposti.length > 0 ? (
          <div className="space-y-2">
            {proposti.map((p) => {
              const esito = ESITI[p.esito] || { label: p.esito, colore: 'bg-slate-700' }
              return (
                <div
                  key={p.id}
                  className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm text-white font-medium">
                          {getImmobileLabel(p)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${esito.colore}`}>
                          {esito.label}
                        </span>
                        {p.data_proposta && (
  <span className="text-xs text-slate-400">
    📅 {new Date(p.data_proposta + 'T00:00:00').toLocaleDateString('it-IT')}
  </span>
)}
                      </div>
                      {p.motivo_rifiuto && (
                        <div className="text-xs text-slate-400 mt-1">
                          ❌ Motivo: {p.motivo_rifiuto}
                        </div>
                      )}

                      {/* Pulsanti contestuali per esito = piace */}
                      {p.esito === 'piace' && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <button
                            onClick={() => {
                              const url = new URL(window.location.href)
                              url.searchParams.set('fissa_visita', p.immobile_id)
                              router.push(url.pathname + url.search)
                            }}
                            className="text-xs bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-600/50 px-2.5 py-1 rounded transition-colors"
                          >
                            📅 Fissa appuntamento
                          </button>
                          <a
                            href={`/proposte/nuovo?richiesta_id=${richiestaId}&immobile_id=${p.immobile_id}`}
                            className="text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 px-2.5 py-1 rounded transition-colors"
                          >
                            ✍️ Vuole fare una proposta
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => apriModifica(p)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                        title="Modifica"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleElimina(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                        title="Elimina"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Nessun immobile proposto al cliente.
          </p>
        )}
      </div>

      {/* MODALE */}
      {modaleAperta && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={chiudi}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">
              {modificaId ? 'Modifica proposta' : 'Proponi immobile'}
            </h3>

            <div className="space-y-4">
              {!modificaId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Immobile *
                  </label>
                  <select
                    value={form.immobile_id}
                    onChange={(e) => setForm({ ...form, immobile_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Seleziona immobile —</option>
                    {immobili.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
  <label className="block text-sm font-medium text-slate-300 mb-1">
    Data proposta *
  </label>
  <input
    type="date"
    value={form.data_proposta}
    onChange={(e) => setForm({ ...form, data_proposta: e.target.value })}
    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Esito *
                </label>
                <select
                  value={form.esito}
                  onChange={(e) => setForm({ ...form, esito: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="piace">👍 Piace, vuole vederlo</option>
                  <option value="non_piace">👎 Non piace</option>
                </select>
              </div>

              {form.esito === 'non_piace' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Motivo per cui non piace *
                  </label>
                  <textarea
                    rows={3}
                    value={form.motivo_rifiuto}
                    onChange={(e) => setForm({ ...form, motivo_rifiuto: e.target.value })}
                    placeholder="Es. troppo caro, zona non gradita, manca garage..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {errore && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-3 py-2">
                  ⚠️ {errore}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={chiudi}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={salva}
                disabled={salvando}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {salvando ? 'Salvataggio...' : modificaId ? 'Salva modifiche' : 'Proponi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}