'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InputPrezzo from './input-prezzo'

type Opzione = {
  id: string
  label: string
}

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
  const [proprietari, setProprietari] = useState<string[]>([])
  const [ricercaProprietario, setRicercaProprietario] = useState('')
  const [dropdownAperto, setDropdownAperto] = useState(false)

  const [form, setForm] = useState({
    immobile_id: valutazione?.immobile_id ?? '',
    data_valutazione:
      valutazione?.data_valutazione ??
      new Date().toISOString().split('T')[0],
    prezzo_valutato: valutazione?.prezzo_valutato ?? '',
    prezzo_richiesto: valutazione?.prezzo_richiesto ?? '',
    prezzo_minimo: valutazione?.prezzo_minimo ?? '',
    metratura: valutazione?.metratura ?? '',
    stato: valutazione?.stato ?? 'da_fare',
    note: valutazione?.note ?? '',
  })

  function upd<K extends keyof typeof form>(
    field: K,
    value: typeof form[K]
  ) {
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
          c.data.map((x) => ({
            id: x.id,
            label: `${x.cognome} ${x.nome}`,
          }))
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

      // Se stiamo modificando una valutazione,
      // recupera i proprietari dalla tabella di relazione.
      if (valutazione?.id) {
        const { data: proprietariData } = await supabase
          .from('valutazioni_proprietari')
          .select('cliente_id')
          .eq('valutazione_id', valutazione.id)

        if (proprietariData) {
          setProprietari(
            proprietariData
              .map((p) => p.cliente_id)
              .filter(Boolean)
              .slice(0, 2)
          )
        }
      }
    }

    carica()
  }, [supabase, valutazione?.id])

  function toggleProprietario(id: string) {
    setProprietari((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }

      if (prev.length >= 2) {
        return prev
      }

      return [...prev, id]
    })
  }

  const clientiFiltrati = clienti.filter((cliente) =>
    cliente.label
      .toLowerCase()
      .includes(ricercaProprietario.toLowerCase())
  )

  return (
    <form action={action} className="space-y-8">
      {/* IMMOBILE E PROPRIETARI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Immobile e proprietari
        </h2>

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

          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Proprietari
            </label>

            <button
              type="button"
              onClick={() => setDropdownAperto((prev) => !prev)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {proprietari.length === 0
                ? '— Nessun proprietario —'
                : proprietari
                    .map(
                      (id) =>
                        clienti.find((c) => c.id === id)?.label
                    )
                    .filter(Boolean)
                    .join(', ')}
            </button>

            {dropdownAperto && (
              <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-600 rounded-lg shadow-xl">
                <div className="p-2 border-b border-slate-700">
                  <input
                    type="text"
                    value={ricercaProprietario}
                    onChange={(e) =>
                      setRicercaProprietario(e.target.value)
                    }
                    placeholder="Cerca proprietario..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto p-2">
                  {clientiFiltrati.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-400">
                      Nessun cliente trovato
                    </p>
                  ) : (
                    clientiFiltrati.map((cliente) => {
                      const selezionato = proprietari.includes(
                        cliente.id
                      )

                      const disabilitato =
                        !selezionato && proprietari.length >= 2

                      return (
                        <label
                          key={cliente.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                            disabilitato
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selezionato}
                            disabled={disabilitato}
                            onChange={() =>
                              toggleProprietario(cliente.id)
                            }
                            className="h-4 w-4"
                          />

                          <span className="text-sm text-white">
                            {cliente.label}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>

                <div className="px-3 py-2 border-t border-slate-700 text-xs text-slate-400">
                  {proprietari.length}/2 proprietari selezionati
                </div>
              </div>
            )}

            {proprietari.map((clienteId) => (
              <input
                key={clienteId}
                type="hidden"
                name="proprietari"
                value={clienteId}
              />
            ))}
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
              onChange={(e) =>
                upd('data_valutazione', e.target.value)
              }
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
              <option value="annullata">Annullata</option>
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

            <InputPrezzo
              name="prezzo_valutato"
              value={form.prezzo_valutato}
              onChange={(v) => upd('prezzo_valutato', v)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo richiesto €
            </label>

            <InputPrezzo
              name="prezzo_richiesto"
              value={form.prezzo_richiesto}
              onChange={(v) => upd('prezzo_richiesto', v)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo in pubblicità €
            </label>

            <InputPrezzo
              name="prezzo_minimo"
              value={form.prezzo_minimo}
              onChange={(v) => upd('prezzo_minimo', v)}
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
          href={
            valutazione?.id
              ? `/valutazioni/${valutazione.id}`
              : '/valutazioni'
          }
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {valutazione?.id
            ? 'Salva modifiche'
            : 'Crea valutazione'}
        </button>
      </div>
    </form>
  )
}