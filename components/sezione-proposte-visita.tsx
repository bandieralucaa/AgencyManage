'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  creaPropostaVisita,
  rispondiPropostaVisita,
  eliminaPropostaVisita,
} from '@/app/(app)/proposte-visita/actions'

type Proposta = {
  id: string
  stato: string
  data_proposta: string
  data_risposta: string | null
  motivo_rifiuto: string | null
  immobile_id: string
  immobili: { indirizzo: string; civico: string | null; comune: string } | null
}

type Immobile = { id: string; label: string }

const STATI: Record<string, { label: string; colore: string }> = {
  proposta: { label: '⏳ In attesa', colore: 'bg-amber-500/20 text-amber-400' },
  accettata: { label: '✅ Accettata', colore: 'bg-emerald-500/20 text-emerald-400' },
  rifiutata: { label: '❌ Rifiutata', colore: 'bg-red-500/20 text-red-400' },
}

export default function SezioneProposteVisita({
  richiestaId,
  clienteId,
  proposte,
}: {
  richiestaId: string
  clienteId: string | null
  proposte: Proposta[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [immobili, setImmobili] = useState<Immobile[]>([])
  const [mostraForm, setMostraForm] = useState(false)
  const [immobileSelezionato, setImmobileSelezionato] = useState('')
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  // Modale risposta
  const [rispostaAperta, setRispostaAperta] = useState<string | null>(null)
  const [tipoRisposta, setTipoRisposta] = useState<'accettata' | 'rifiutata'>('accettata')
  const [motivoRifiuto, setMotivoRifiuto] = useState('')

  useEffect(() => {
    async function carica() {
      // Solo immobili con incarico attivo
      const { data: incarichi } = await supabase
        .from('incarichi')
        .select('immobile_id')
        .eq('stato', 'attivo')
        .not('immobile_id', 'is', null)

      const ids = (incarichi || []).map((i) => i.immobile_id).filter(Boolean) as string[]

      if (ids.length > 0) {
        const { data } = await supabase
          .from('immobili')
          .select('id, indirizzo, civico, comune')
          .in('id', ids)
          .eq('attivo', true)
          .order('indirizzo', { ascending: true })

        if (data) {
          setImmobili(
            data.map((i) => ({
              id: i.id,
              label: `${i.indirizzo} ${i.civico || ''}, ${i.comune}`,
            }))
          )
        }
      }
    }
    carica()
  }, [supabase])

  async function handleCrea() {
    if (!immobileSelezionato) {
      setErrore('Seleziona un immobile')
      return
    }

    setLoading(true)
    setErrore('')

    try {
      const formData = new FormData()
      formData.append('richiesta_id', richiestaId)
      formData.append('immobile_id', immobileSelezionato)
      if (clienteId) formData.append('cliente_id', clienteId)

      await creaPropostaVisita(formData)
      setMostraForm(false)
      setImmobileSelezionato('')
      router.refresh()
    } catch (err: any) {
      setErrore(err?.message || 'Errore')
    }
    setLoading(false)
  }

  async function handleRispondi(id: string) {
    setErrore('')
    if (tipoRisposta === 'rifiutata' && !motivoRifiuto.trim()) {
      setErrore('Devi indicare un motivo per il rifiuto')
      return
    }
    setLoading(true)
    try {
      await rispondiPropostaVisita(id, tipoRisposta, motivoRifiuto)
      setRispostaAperta(null)
      setMotivoRifiuto('')
      router.refresh()
    } catch (err: any) {
      setErrore(err?.message || 'Errore')
    }
    setLoading(false)
  }

  async function handleElimina(id: string) {
    if (!confirm('Eliminare questa proposta di visita?')) return
    await eliminaPropostaVisita(id)
    router.refresh()
  }

  function formatData(d: string | null) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🏠 Immobili proposti
            <span className="text-sm text-slate-500 font-normal">({proposte.length})</span>
          </h2>
          {!mostraForm && (
            <button
              onClick={() => setMostraForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Proponi immobile
            </button>
          )}
        </div>

        {mostraForm && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Immobile da proporre *
              </label>
              <select
                value={immobileSelezionato}
                onChange={(e) => setImmobileSelezionato(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Seleziona immobile —</option>
                {immobili.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Vengono mostrati solo gli immobili con incarico attivo
              </p>
            </div>

            {errore && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-3 py-2">
                {errore}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setMostraForm(false)
                  setImmobileSelezionato('')
                  setErrore('')
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleCrea}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : 'Proponi'}
              </button>
            </div>
          </div>
        )}

        {proposte.length > 0 ? (
          <div className="space-y-3">
            {proposte.map((p) => {
              const imm = Array.isArray(p.immobili) ? p.immobili[0] : p.immobili
              const stato = STATI[p.stato] || { label: p.stato, colore: 'bg-slate-700 text-slate-300' }
              const inAttesa = p.stato === 'proposta'

              return (
                <div key={p.id} className="border bg-slate-900 border-slate-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white">
                        {imm ? `${imm.indirizzo} ${imm.civico || ''}, ${imm.comune}` : 'Immobile'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Proposto il {formatData(p.data_proposta)}
                        {p.data_risposta && ` · Risposta il ${formatData(p.data_risposta)}`}
                      </div>
                      {p.motivo_rifiuto && (
                        <div className="text-xs text-red-400 mt-2">
                          Motivo rifiuto: {p.motivo_rifiuto}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${stato.colore}`}>
                        {stato.label}
                      </span>
                      {inAttesa && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setRispostaAperta(p.id)
                              setTipoRisposta('accettata')
                              setMotivoRifiuto('')
                              setErrore('')
                            }}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded transition-colors"
                          >
                            Rispondi
                          </button>
                          <button
                            onClick={() => handleElimina(p.id)}
                            className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                      {!inAttesa && (
                        <button
                          onClick={() => handleElimina(p.id)}
                          className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !mostraForm && (
            <p className="text-sm text-slate-500 text-center py-4">
              Nessun immobile proposto. Clicca &quot;+ Proponi immobile&quot; per iniziare.
            </p>
          )
        )}
      </div>

      {/* MODALE RISPOSTA */}
      {rispostaAperta && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setRispostaAperta(null)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4">Risposta del cliente</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  checked={tipoRisposta === 'accettata'}
                  onChange={() => setTipoRisposta('accettata')}
                  className="w-4 h-4 accent-emerald-600"
                />
                ✅ Cliente accetta la proposta
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  checked={tipoRisposta === 'rifiutata'}
                  onChange={() => setTipoRisposta('rifiutata')}
                  className="w-4 h-4 accent-red-600"
                />
                ❌ Cliente rifiuta la proposta
              </label>

              {tipoRisposta === 'rifiutata' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1 mt-3">
                    Motivo del rifiuto *
                  </label>
                  <textarea
                    rows={3}
                    value={motivoRifiuto}
                    onChange={(e) => setMotivoRifiuto(e.target.value)}
                    placeholder="Es. troppo caro, zona sbagliata, dimensioni non adatte..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              )}

              {errore && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-3 py-2">
                  {errore}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setRispostaAperta(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => handleRispondi(rispostaAperta)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvataggio...' : 'Salva risposta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}