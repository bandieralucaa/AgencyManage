'use client'

import { useState } from 'react'
import { valutazioneToIncarico } from '@/app/(app)/flusso/actions'

export default function ConvertiValutazioneIncarico({
  valutazioneId,
  indirizzoCompleto,
  prezzoSuggerito,
}: {
  valutazioneId: string
  indirizzoCompleto: string
  prezzoSuggerito?: number | null
}) {
  const [aperta, setAperta] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  const oggi = new Date()
  const scadenza = new Date(oggi)
  scadenza.setFullYear(scadenza.getFullYear() + 1)

  const [form, setForm] = useState({
    tipo: 'vendita',
    data_inizio: oggi.toISOString().split('T')[0],
    data_scadenza: scadenza.toISOString().split('T')[0],
    prezzo: prezzoSuggerito ? String(prezzoSuggerito) : '',
    prezzo_pubblicita: '',
    esclusivo: false,
    stato: 'attivo',
    note: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrore('')

    const fd = new FormData()
    fd.append('tipo', form.tipo)
    fd.append('data_inizio', form.data_inizio)
    fd.append('data_scadenza', form.data_scadenza)
    fd.append('prezzo', form.prezzo)
    fd.append('prezzo_pubblicita', form.prezzo_pubblicita)
    if (form.esclusivo) fd.append('esclusivo', 'on')
    fd.append('stato', form.stato)
    fd.append('note', form.note)

    try {
      await valutazioneToIncarico(valutazioneId, fd)
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        return
      }
      setErrore(err?.message || 'Errore nella conversione')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-2xl">📝</span>
              Crea incarico
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Il proprietario ti ha dato il mandato? Crea l&apos;incarico.
            </p>
          </div>
          <button
            onClick={() => setAperta(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Crea incarico
          </button>
        </div>
      </div>

      {aperta && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !loading && setAperta(false)}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                📝 Nuovo incarico
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Immobile: <span className="text-white font-medium">{indirizzoCompleto}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Cliente e immobile verranno copiati automaticamente dalla valutazione.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo *
                  </label>
                  <select
                    required
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="vendita">Vendita</option>
                    <option value="affitto">Affitto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data inizio *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.data_inizio}
                    onChange={(e) => setForm({ ...form, data_inizio: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data scadenza *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.data_scadenza}
                    onChange={(e) => setForm({ ...form, data_scadenza: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prezzo richiesto €
                  </label>
                  <input
                    type="number"
                    value={form.prezzo}
                    onChange={(e) => setForm({ ...form, prezzo: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prezzo in pubblicità €
                  </label>
                  <input
                    type="number"
                    value={form.prezzo_pubblicita}
                    onChange={(e) => setForm({ ...form, prezzo_pubblicita: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Stato *
                  </label>
                  <select
                    required
                    value={form.stato}
                    onChange={(e) => setForm({ ...form, stato: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="attivo">🟢 Attivo</option>
                    <option value="concluso_bene">✅ Concluso bene</option>
                    <option value="concluso_male">❌ Concluso male</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none pb-2.5">
                    <input
                      type="checkbox"
                      checked={form.esclusivo}
                      onChange={(e) => setForm({ ...form, esclusivo: e.target.checked })}
                      className="w-4 h-4 accent-blue-600"
                    />
                    Incarico in esclusiva
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Note
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note sull'incarico..."
                />
              </div>

              {errore && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-2">
                  ⚠️ {errore}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setAperta(false)}
                  disabled={loading}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creazione...' : 'Crea incarico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}