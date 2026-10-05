'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InputPrezzo from './input-prezzo'

type Opzione = { id: string; label: string }

const STATI_PROPOSTA = [
  { value: 'in_corso', label: 'In corso' },
  { value: 'accettata', label: 'Accettata' },
  { value: 'rifiutata', label: 'Rifiutata' },
  { value: 'controproposta', label: 'Controproposta' },
  { value: 'ritirata', label: 'Ritirata' },
]

export default function FormProposta({
  proposta,
  immobilePreselezionato,
  richiestaPreselezionata,
  action,
}: {
  proposta?: any
  immobilePreselezionato?: string
  richiestaPreselezionata?: string
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [clienti, setClienti] = useState<Opzione[]>([])
  const [immobili, setImmobili] = useState<Opzione[]>([])
  const [richieste, setRichieste] = useState<Opzione[]>([])

  const [form, setForm] = useState({
    immobile_id: proposta?.immobile_id ?? immobilePreselezionato ?? '',
    richiesta_id: proposta?.richiesta_id ?? richiestaPreselezionata ?? '',
    cliente_id: proposta?.cliente_id ?? '',
    data_visita: proposta?.data_visita ?? '',
    data_proposta: proposta?.data_proposta ?? new Date().toISOString().split('T')[0],
    importo_proposto: proposta?.importo_proposto ?? '',
    stato: proposta?.stato ?? 'in_corso',
    note: proposta?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function carica() {
      const [c, i, r] = await Promise.all([
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
        supabase
          .from('richieste')
          .select('id, cerca, clienti (nome, cognome)')
          .in('stato', ['nuova', 'in_corso'])
          .order('data_inserimento', { ascending: false }),
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
      if (r.data) {
        setRichieste(
          r.data.map((x: any) => {
            const cli = Array.isArray(x.clienti) ? x.clienti[0] : x.clienti
            return {
              id: x.id,
              label: cli
                ? `${cli.cognome} ${cli.nome} - ${x.cerca}`
                : `Richiesta ${x.cerca}`,
            }
          })
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
              <option value="">— Seleziona —</option>
              {immobili.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cliente acquirente
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
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Richiesta collegata
            </label>
            <select
              name="richiesta_id"
              value={form.richiesta_id}
              onChange={(e) => upd('richiesta_id', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Nessuna —</option>
              {richieste.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* DETTAGLI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Dettagli proposta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data visita
            </label>
            <input
              type="date"
              name="data_visita"
              value={form.data_visita}
              onChange={(e) => upd('data_visita', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data proposta
            </label>
            <input
              type="date"
              name="data_proposta"
              value={form.data_proposta}
              onChange={(e) => upd('data_proposta', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Importo proposto €
            </label>
            <InputPrezzo
              name="importo_proposto"
              value={form.importo_proposto}
              onChange={(v) => upd('importo_proposto', v)}
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
              {STATI_PROPOSTA.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
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
          placeholder="Note sulla proposta..."
        />
      </section>

      <div className="flex gap-3 justify-end">
        <a
          href={proposta?.id ? `/proposte/${proposta.id}` : '/proposte'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {proposta?.id ? 'Salva modifiche' : 'Crea proposta'}
        </button>
      </div>
    </form>
  )
}