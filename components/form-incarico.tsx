'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import InputPrezzo from './input-prezzo'

type Opzione = { id: string; label: string }

const MOTIVI_CHIUSURA_MALE = [
  { value: 'venduto_altrove', label: '🔄 Venduto/Affittato altrove' },
  { value: 'ritirato_cliente', label: '🚫 Ritirato dal cliente' },
  { value: 'scaduto', label: '⏰ Scaduto senza rinnovo' },
  { value: 'altro', label: '📝 Altro' },
]

export default function FormIncarico({
  incarico,
  proprietari = [],
  action,
}: {
  incarico?: any
  proprietari?: { cliente_id: string }[]
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [clienti, setClienti] = useState<Opzione[]>([])
  const [errore, setErrore] = useState('')

  const [proprietariSelezionati, setProprietariSelezionati] = useState<string[]>(
  proprietari.map((p) => p.cliente_id)
  )

  const [cercaProprietario, setCercaProprietario] = useState('')
  const [mostraProprietari, setMostraProprietari] = useState(false)

  const [form, setForm] = useState({
    tipo: incarico?.tipo ?? 'vendita',
    data_inizio:
      incarico?.data_inizio ??
      new Date().toISOString().split('T')[0],
    data_scadenza: incarico?.data_scadenza ?? '',
    seconda_data_scadenza: incarico?.seconda_data_scadenza ?? '',
    prezzo: incarico?.prezzo ?? '',
    prezzo_pubblicita: incarico?.prezzo_pubblicita ?? '',
    spese_condominiali: incarico?.spese_condominiali ?? '',
    esclusivo: incarico?.esclusivo ?? false,
    stato: incarico?.stato ?? 'attivo',
    data_chiusura: incarico?.data_chiusura ?? '',
    motivo_chiusura: incarico?.motivo_chiusura ?? '',
    note: incarico?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleProprietario(id: string) {
    setProprietariSelezionati((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id)
      }

      if (prev.length >= 2) {
        return prev
      }

      return [...prev, id]
    })
  }

  function rimuoviProprietario(id: string) {
    setProprietariSelezionati((prev) => prev.filter((x) => x !== id))
  }

  function validaDate(): string {
    if (!form.data_inizio || !form.data_scadenza) return ''

    if (new Date(form.data_scadenza) < new Date(form.data_inizio)) {
      return 'La data di scadenza non può essere precedente alla data di inizio.'
    }

    if (
      form.seconda_data_scadenza &&
      new Date(form.seconda_data_scadenza) <= new Date(form.data_scadenza)
    ) {
      return 'La seconda data di scadenza deve essere successiva alla prima data di scadenza.'
    }

    return ''
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

  const isConclusoBene = form.stato === 'concluso_bene'
  const isConclusoMale = form.stato === 'concluso_male'

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
      {/* PROPRIETARI */}
<section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
  <h2 className="text-lg font-semibold mb-4">Proprietari</h2>

  <div className="relative">
    <label className="block text-sm font-medium text-slate-300 mb-2">
      Proprietari dell&apos;immobile (massimo 2)
    </label>

    {/* Proprietari selezionati */}
    {proprietariSelezionati.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-3">
        {proprietariSelezionati.map((id) => {
          const proprietario = clienti.find((c) => c.id === id)

          return (
            <div
              key={id}
              className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/40 text-blue-300 px-3 py-1.5 rounded-lg text-sm"
            >
              <span>{proprietario?.label || 'Proprietario'}</span>

              <button
                type="button"
                onClick={() => rimuoviProprietario(id)}
                className="text-blue-300 hover:text-white"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    )}

    {/* Campo ricerca */}
    <input
      type="text"
      value={cercaProprietario}
      onChange={(e) => {
        setCercaProprietario(e.target.value)
        setMostraProprietari(true)
      }}
      onFocus={() => setMostraProprietari(true)}
      onBlur={() => {
        setTimeout(() => setMostraProprietari(false), 150)
      }}
      placeholder="Cerca cliente..."
      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />

    {/* Lista clienti */}
    {mostraProprietari && (
      <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
        {clienti
          .filter((c) =>
            c.label.toLowerCase().includes(cercaProprietario.toLowerCase())
          )
          .map((c) => {
            const selezionato = proprietariSelezionati.includes(c.id)

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleProprietario(c.id)}
                className={`w-full text-left px-4 py-2.5 hover:bg-slate-800 ${
                  selezionato ? 'text-blue-400' : 'text-white'
                }`}
              >
                {selezionato ? '✓ ' : ''}
                {c.label}
              </button>
            )
          })}

        {clienti.filter((c) =>
          c.label.toLowerCase().includes(cercaProprietario.toLowerCase())
        ).length === 0 && (
          <div className="px-4 py-3 text-sm text-slate-500">
            Nessun cliente trovato
          </div>
        )}
      </div>
    )}

    {/* Hidden inputs per il server action */}
    {proprietariSelezionati.map((id) => (
      <input
        key={id}
        type="hidden"
        name="proprietari"
        value={id}
      />
    ))}

    <p className="text-xs text-slate-500 mt-2">
      Puoi selezionare fino a 2 proprietari.
    </p>
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo richiesto €
            </label>
            <InputPrezzo
              name="prezzo"
              value={form.prezzo}
              onChange={(v) => upd('prezzo', v)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prezzo in pubblicità €
            </label>
            <InputPrezzo
              name="prezzo_pubblicita"
              value={form.prezzo_pubblicita}
              onChange={(v) => upd('prezzo_pubblicita', v)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Spese condominiali €/mese
            </label>
            <input
              type="number"
              name="spese_condominiali"
              value={form.spese_condominiali}
              onChange={(e) => upd('spese_condominiali', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Incarico in esclusiva
            </label>
            <select
              name="esclusivo"
              value={form.esclusivo ? 'si' : 'no'}
              onChange={(e) => upd('esclusivo', e.target.value === 'si')}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="no">No</option>
              <option value="si">Sì</option>
            </select>
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
          <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Seconda data scadenza
          </label>
          <input
            type="date"
            name="seconda_data_scadenza"
            value={form.seconda_data_scadenza}
            onChange={(e) => upd('seconda_data_scadenza', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        </div>
      </section>

      {/* STATO E CHIUSURA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Stato incarico</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            type="button"
            onClick={() => upd('stato', 'attivo')}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              form.stato === 'attivo'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-xl mb-1">🟢</div>
            <div className="font-semibold text-white text-sm">Attivo</div>
            <div className="text-xs text-slate-400 mt-0.5">In corso</div>
          </button>
          <button
            type="button"
            onClick={() => upd('stato', 'in_trattativa')}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              form.stato === 'in_trattativa'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-xl mb-1">🤝</div>
            <div className="font-semibold text-white text-sm">In trattativa</div>
            <div className="text-xs text-slate-400 mt-0.5">Proposta accettata</div>
          </button>
          <button
            type="button"
            onClick={() => upd('stato', 'concluso_bene')}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              form.stato === 'concluso_bene'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-xl mb-1">✅</div>
            <div className="font-semibold text-white text-sm">Concluso bene</div>
            <div className="text-xs text-slate-400 mt-0.5">Venduto da noi</div>
          </button>
          <button
            type="button"
            onClick={() => upd('stato', 'concluso_male')}
            className={`text-left px-4 py-3 rounded-xl border-2 transition-colors ${
              form.stato === 'concluso_male'
                ? 'border-red-500 bg-red-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-xl mb-1">❌</div>
            <div className="font-semibold text-white text-sm">Concluso male</div>
            <div className="text-xs text-slate-400 mt-0.5">Non concluso</div>
          </button>
        </div>
        <input type="hidden" name="stato" value={form.stato} />

        {isConclusoBene && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data chiusura
            </label>
            <input
              type="date"
              name="data_chiusura"
              value={form.data_chiusura || new Date().toISOString().split('T')[0]}
              onChange={(e) => upd('data_chiusura', e.target.value)}
              className="w-full max-w-xs px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {isConclusoMale && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Motivo chiusura *
              </label>
              <select
                name="motivo_chiusura"
                required
                value={form.motivo_chiusura}
                onChange={(e) => upd('motivo_chiusura', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Seleziona motivo —</option>
                {MOTIVI_CHIUSURA_MALE.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data chiusura
              </label>
              <input
                type="date"
                name="data_chiusura"
                value={form.data_chiusura || new Date().toISOString().split('T')[0]}
                onChange={(e) => upd('data_chiusura', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
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