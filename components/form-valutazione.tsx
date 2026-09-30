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
  const [suggerimenti, setSuggerimenti] = useState<string[]>([])
  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false)

  const [form, setForm] = useState({
    cliente_id: valutazione?.cliente_id ?? '',
    indirizzo: valutazione?.indirizzo ?? '',
    civico: valutazione?.civico ?? '',
    frazione: valutazione?.frazione ?? '',
    comune: valutazione?.comune ?? '',
    cap: valutazione?.cap ?? '',
    provincia: valutazione?.provincia ?? 'BO',
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
      const { data } = await supabase
        .from('clienti')
        .select('id, nome, cognome')
        .eq('attivo', true)
        .order('cognome', { ascending: true })
      if (data) {
        setClienti(
          data.map((x) => ({ id: x.id, label: `${x.cognome} ${x.nome}` }))
        )
      }
    }
    carica()
  }, [supabase])

  // Autocomplete via
  useEffect(() => {
    if (form.indirizzo.length < 2) {
      setSuggerimenti([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('strade')
        .select('via')
        .ilike('via', `%${form.indirizzo}%`)
        .limit(50)
      if (data) {
        const vieUniche = [...new Set(data.map((d) => d.via))]
        setSuggerimenti(vieUniche.slice(0, 10))
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [form.indirizzo, supabase])

  async function selezionaVia(viaSelezionata: string) {
    upd('indirizzo', viaSelezionata)
    setMostraSuggerimenti(false)
    const { data } = await supabase
      .from('strade')
      .select('comune, frazione, cap')
      .eq('via', viaSelezionata)
      .limit(1)
      .maybeSingle()
    if (data) {
      upd('comune', data.comune || '')
      upd('frazione', data.frazione || '')
      upd('cap', data.cap || '')
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* UBICAZIONE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Ubicazione</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-4 relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Via *
            </label>
            <input
              type="text"
              name="indirizzo"
              required
              value={form.indirizzo}
              onChange={(e) => {
                upd('indirizzo', e.target.value)
                setMostraSuggerimenti(true)
              }}
              onFocus={() => setMostraSuggerimenti(true)}
              onBlur={() => setTimeout(() => setMostraSuggerimenti(false), 200)}
              autoComplete="off"
              placeholder="Inizia a digitare..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {mostraSuggerimenti && suggerimenti.length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                {suggerimenti.map((s) => (
                  <li
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selezionaVia(s)
                    }}
                    className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Civico
            </label>
            <input
              type="text"
              name="civico"
              value={form.civico}
              onChange={(e) => upd('civico', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Frazione
            </label>
            <input
              type="text"
              name="frazione"
              value={form.frazione}
              onChange={(e) => upd('frazione', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comune *
            </label>
            <input
              type="text"
              name="comune"
              required
              value={form.comune}
              onChange={(e) => upd('comune', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CAP
            </label>
            <input
              type="text"
              name="cap"
              maxLength={5}
              value={form.cap}
              onChange={(e) => upd('cap', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* CLIENTE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Cliente proprietario</h2>
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
          <p className="text-xs text-slate-500 mt-1">
            Il proprietario dell&apos;immobile che stai valutando
          </p>
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