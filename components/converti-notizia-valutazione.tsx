'use client'

import { useState } from 'react'
import { notiziaToValutazione } from '@/app/(app)/flusso/actions'

export default function ConvertiNotiziaValutazione({
  notiziaId,
  indirizzoCompleto,
}: {
  notiziaId: string
  indirizzoCompleto: string
}) {
  const [aperta, setAperta] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  const oggi = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    data_valutazione: oggi,
    stato: 'da_fare',
    metratura: '',
    prezzo_valutato: '',
    prezzo_richiesto: '',
    prezzo_pubblicita: '',
    note: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrore('')

    const fd = new FormData()
    fd.append('data_valutazione', form.data_valutazione)
    fd.append('stato', form.stato)
    fd.append('metratura', form.metratura)
    fd.append('prezzo_valutato', form.prezzo_valutato)
    fd.append('prezzo_richiesto', form.prezzo_richiesto)
    fd.append('prezzo_pubblicita', form.prezzo_pubblicita)
    fd.append('note', form.note)

    try {
      await notiziaToValutazione(notiziaId, fd)
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
              <span className="text-2xl">📋</span>
              Crea valutazione
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Fissa l&apos;appuntamento per andare a vedere l&apos;immobile.
            </p>
          </div>
          <button
            onClick={() => setAperta(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Crea valutazione
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
                📋 Nuova valutazione
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Immobile: <span className="text-white font-medium">{indirizzoCompleto}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                I dati dell&apos;immobile e del cliente verranno copiati automaticamente dalla notizia.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data valutazione *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.data_valutazione}
                    onChange={(e) => setForm({ ...form, data_valutazione: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                    <option value="da_fare">Da fare</option>
                    <option value="fatta">Fatta</option>
                    <option value="annullata">Annullata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Metratura (mq)
                  </label>
                  <input
                    type="number"
                    value={form.metratura}
                    onChange={(e) => setForm({ ...form, metratura: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prezzo valutato €
                  </label>
                  <input
                    type="number"
                    value={form.prezzo_valutato}
                    onChange={(e) => setForm({ ...form, prezzo_valutato: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prezzo richiesto €
                  </label>
                  <input
                    type="number"
                    value={form.prezzo_richiesto}
                    onChange={(e) => setForm({ ...form, prezzo_richiesto: e.target.value })}
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Note
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note sulla valutazione..."
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
                  {loading ? 'Creazione...' : 'Crea valutazione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}