'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Opzione = { id: string; label: string }

export default function FormValutazione({
  valutazione,
  action,
}: {
  valutazione?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [clienti, setClienti] = useState<Opzione[]>([])
  const [immobili, setImmobili] = useState<Opzione[]>([])

  const [form, setForm] = useState({
    immobile_id: valutazione?.immobile_id ?? '',
    cliente_id: valutazione?.cliente_id ?? '',
    data_valutazione:
      valutazione?.data_valutazione ?? new Date().toISOString().split('T')[0],
    prezzo_valutato: valutazione?.prezzo_valutato ?? '',
    prezzo_richiesto: valutazione?.prezzo_richiesto ?? '',
    prezzo_minimo: valutazione?.prezzo_minimo ?? '',
    metratura: valutazione?.metratura ?? '',
    stato: valutazione?.stato ?? 'da_fare',
    note: valutazione?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function carica() {
      const [c, i] = await Promise.all([
        supabase
          .from('clienti')
          .select('id, nome, cognome')
          .eq('attivo', true)
          .order('cognome', { ascending: true }),
        supabase
          .from('immobili')
          .select('id, indirizzo, civico, comune')
          .eq('attivo', true)
          .order('indirizzo', { ascending: true }),
      ])
      if (c.data) {
        setClienti(
          c.data.map((x) => ({ id: x.id, label: `${x.cognome} ${x.nome}` }))
        )
      }
      if (i.data) {
        setImmobili(
          i.data.map((x) => ({
            id: x.id,
            label: `${x.indirizzo} ${x.civico || ''}, ${x.comune}`,
          }))
        )
      }
    }
    carica()
  }, [supabase])

  return (
    <form action={action} className="space-y-8">
      {/* IMMOBILE E CLIENTE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Immobile e cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Immobile *
            </label>
            <select
              name="immobile_id"
              required
              value={form.immobile_id}
              onChange={(e) => upd('immobile_id', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Seleziona immobile —</option>
              {immobili.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cliente (opzionale)
            </label>
            <select
              name="cliente_id"
              value={form.cliente_id}
              onChange={(e) => upd('cliente_id', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Nessuno —</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* VALUTAZIONE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Valutazione</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data valutazione *
            </label>
            <input
              type="date"
              name="data_valutazione"
              required
              value={form.data_valutazione}
              onChange={(e) => upd('data_valutazione', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stato *
            </label>
            <select
              name="stato"
              required
              value={form.stato}
              onChange={(e) => upd('stato', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="da_fare">Da fare</option>
              <option value="fatta">Fatta</option>
              <option value="seguita">Seguita</option>
              <option value="persa">Persa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Metratura (mq)
            </label>
            <input
              type="number"
              name="metratura"
              value={form.metratura}
              onChange={(e) => upd('metratura', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* PREZZI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Prezzi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo valutato €
            </label>
            <input
              type="number"
              name="prezzo_valutato"
              value={form.prezzo_valutato}
              onChange={(e) => upd('prezzo_valutato', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo richiesto €
            </label>
            <input
              type="number"
              name="prezzo_richiesto"
              value={form.prezzo_richiesto}
              onChange={(e) => upd('prezzo_richiesto', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo minimo €
            </label>
            <input
              type="number"
              name="prezzo_minimo"
              value={form.prezzo_minimo}
              onChange={(e) => upd('prezzo_minimo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* NOTE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Note</h2>
        <textarea
          name="note"
          rows={4}
          value={form.note}
          onChange={(e) => upd('note', e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note sulla valutazione..."
        />
      </section>

      <div className="flex gap-3 justify-end">
        <a
          href={valutazione?.id ? `/valutazioni/${valutazione.id}` : '/valutazioni'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {valutazione?.id ? 'Salva modifiche' : 'Crea valutazione'}
        </button>
      </div>
    </form>
  )
}