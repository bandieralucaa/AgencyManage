'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { creaVisita, eliminaVisita } from '@/app/(app)/visite/actions'

type Visita = {
  id: string
  data_visita: string
  note: string | null
  immobili?: { indirizzo: string; civico: string | null; comune: string } | { indirizzo: string; civico: string | null; comune: string }[] | null
  clienti?: { nome: string; cognome: string } | { nome: string; cognome: string }[] | null
}

type Immobile = { id: string; label: string }
type Cliente = { id: string; label: string }

export default function SezioneVisite({
  visite,
  contesto,
  mostraFormImmobile = false,
  mostraFormCliente = false,
}: {
  visite: Visita[]
  contesto: {
    richiesta_id?: string
    immobile_id?: string
    cliente_id?: string
  }
  mostraFormImmobile?: boolean
  mostraFormCliente?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [immobili, setImmobili] = useState<Immobile[]>([])
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [mostraForm, setMostraForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  const oggi = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    immobile_id: contesto.immobile_id || '',
    cliente_id: contesto.cliente_id || '',
    data_visita: oggi,
    note: '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function carica() {
      if (mostraFormImmobile) {
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

      if (mostraFormCliente) {
        const { data } = await supabase
          .from('clienti')
          .select('id, nome, cognome')
          .eq('attivo', true)
          .order('cognome', { ascending: true })

        if (data) {
          setClienti(
            data.map((c) => ({ id: c.id, label: `${c.cognome} ${c.nome}` }))
          )
        }
      }
    }
    carica()
  }, [supabase, mostraFormImmobile, mostraFormCliente])

  async function handleCrea() {
    if (mostraFormImmobile && !form.immobile_id) {
      setErrore('Seleziona un immobile')
      return
    }
    if (!form.data_visita) {
      setErrore('Inserisci la data della visita')
      return
    }

    setLoading(true)
    setErrore('')

    try {
      const formData = new FormData()
      formData.append('immobile_id', form.immobile_id || contesto.immobile_id || '')
      formData.append('data_visita', form.data_visita)
      if (form.note) formData.append('note', form.note)
      if (contesto.richiesta_id) formData.append('richiesta_id', contesto.richiesta_id)
      if (form.cliente_id || contesto.cliente_id) {
        formData.append('cliente_id', form.cliente_id || contesto.cliente_id || '')
      }

      await creaVisita(formData)
      setMostraForm(false)
      setForm({ ...form, immobile_id: contesto.immobile_id || '', cliente_id: contesto.cliente_id || '', data_visita: oggi, note: '' })
      router.refresh()
    } catch (err: any) {
      setErrore(err?.message || 'Errore')
    }
    setLoading(false)
  }

  async function handleElimina(id: string) {
    if (!confirm('Eliminare questa visita?')) return
    await eliminaVisita(id)
    router.refresh()
  }

  function formatData(d: string) {
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
            🚶 Visite effettuate
            <span className="text-sm text-slate-500 font-normal">({visite.length})</span>
          </h2>
          {!mostraForm && (
            <button
              onClick={() => setMostraForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Registra visita
            </button>
          )}
        </div>

        {mostraForm && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mostraFormImmobile && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Immobile *
                  </label>
                  <select
                    value={form.immobile_id}
                    onChange={(e) => upd('immobile_id', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {mostraFormCliente && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Cliente
                  </label>
                  <select
                    value={form.cliente_id}
                    onChange={(e) => upd('cliente_id', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Nessuno —</option>
                    {clienti.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Data visita *
                </label>
                <input
                  type="date"
                  value={form.data_visita}
                  onChange={(e) => upd('data_visita', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Note</label>
              <textarea
                rows={2}
                value={form.note}
                onChange={(e) => upd('note', e.target.value)}
                placeholder="Es. cliente interessato, da richiamare..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                {loading ? 'Salvataggio...' : 'Registra'}
              </button>
            </div>
          </div>
        )}

        {visite.length > 0 ? (
          <div className="space-y-2">
            {visite.map((v) => {
              const imm = Array.isArray(v.immobili) ? v.immobili[0] : v.immobili
              const cli = Array.isArray(v.clienti) ? v.clienti[0] : v.clienti

              return (
                <div key={v.id} className="border bg-slate-900 border-slate-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-sm text-blue-400 font-medium w-24 shrink-0 pt-0.5">
                      {formatData(v.data_visita)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {imm && (
                        <div className="font-medium text-white text-sm">
                          {imm.indirizzo} {imm.civico || ''}, {imm.comune}
                        </div>
                      )}
                      {cli && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          Cliente: {cli.cognome} {cli.nome}
                        </div>
                      )}
                      {v.note && (
                        <div className="text-xs text-slate-300 mt-1.5 whitespace-pre-wrap">
                          {v.note}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleElimina(v.id)}
                      className="text-xs text-slate-400 hover:text-red-400 px-2 py-1 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          !mostraForm && (
            <p className="text-sm text-slate-500 text-center py-4">
              Nessuna visita registrata.
            </p>
          )
        )}
      </div>
    </>
  )
}