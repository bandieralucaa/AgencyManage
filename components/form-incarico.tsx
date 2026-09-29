'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Opzione = { id: string; label: string }

export default function FormIncarico({
  incarico,
  action,
}: {
  incarico?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [clienti, setClienti] = useState<Opzione[]>([])
  const [immobili, setImmobili] = useState<Opzione[]>([])
  const [errore, setErrore] = useState('')

  const [form, setForm] = useState({
    immobile_id: incarico?.immobile_id ?? '',
    cliente_id: incarico?.cliente_id ?? '',
    tipo: incarico?.tipo ?? 'vendita',
    data_inizio: incarico?.data_inizio ?? new Date().toISOString().split('T')[0],
    data_scadenza: incarico?.data_scadenza ?? '',
    prezzo: incarico?.prezzo ?? '',
    esclusivo: incarico?.esclusivo ?? false,
    stato: incarico?.stato ?? 'attivo',
    note: incarico?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validaDate(): string {
    if (!form.data_inizio || !form.data_scadenza) return ''
    if (new Date(form.data_scadenza) < new Date(form.data_inizio)) {
      return 'La data di scadenza non può essere precedente alla data di inizio.'
    }
    return ''
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
    <form
      action={action}
      onSubmit={(e) => {
        const err = validaDate()
        if (err) {
          e.preventDefault()
          setErrore(err)
        } else {
          setErrore('')
        }
      }}
      className="space-y-8"
    >
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
              Cliente venditore (opzionale)
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

      {/* DETTAGLI INCARICO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Dettagli incarico</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo *</label>
            <select
              name="tipo"
              required
              value={form.tipo}
              onChange={(e) => upd('tipo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vendita">Vendita</option>
              <option value="affitto">Affitto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stato *</label>
            <select
              name="stato"
              required
              value={form.stato}
              onChange={(e) => upd('stato', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="attivo">Attivo</option>
              <option value="scaduto">Scaduto</option>
              <option value="revocato">Revocato</option>
              <option value="concluso">Concluso</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo richiesto €
            </label>
            <input
              type="number"
              name="prezzo"
              value={form.prezzo}
              onChange={(e) => upd('prezzo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data inizio *
            </label>
            <input
              type="date"
              name="data_inizio"
              required
              value={form.data_inizio}
              onChange={(e) => upd('data_inizio', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data scadenza *
            </label>
            <input
              type="date"
              name="data_scadenza"
              required
              value={form.data_scadenza}
              onChange={(e) => upd('data_scadenza', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none pb-2.5">
              <input
                type="checkbox"
                name="esclusivo"
                checked={form.esclusivo}
                onChange={(e) => upd('esclusivo', e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Incarico in esclusiva
            </label>
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
          placeholder="Note sull'incarico..."
        />
      </section>

      {errore && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3">
          ⚠️ {errore}
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <a
          href={incarico?.id ? `/incarichi/${incarico.id}` : '/incarichi'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {incarico?.id ? 'Salva modifiche' : 'Crea incarico'}
        </button>
      </div>
    </form>
  )
}