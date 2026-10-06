'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Opzione = {
  id: string
  label: string
}

export default function FormNotizia({
  notizia,
  action,
}: {
  notizia?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const [supabase] = useState(() => createClient())

  const [clienti, setClienti] = useState<Opzione[]>([])
  const [immobili, setImmobili] = useState<Opzione[]>([])

  const [proprietari, setProprietari] = useState<string[]>(
    notizia?.proprietari?.map((p: any) => p.cliente_id) ?? []
  )

  const [cercaProprietario, setCercaProprietario] = useState('')
  const [mostraProprietari, setMostraProprietari] = useState(false)

  const [form, setForm] = useState({
    tipo_notizia: notizia?.tipo_notizia ?? 'immobile_vuoto',
    immobile_id: notizia?.immobile_id ?? '',
    cliente_id: notizia?.cliente_id ?? '',
    tipo: notizia?.tipo ?? 'agenzia',
    stato: notizia?.stato ?? 'aperta',
    motivo_chiusura: notizia?.motivo_chiusura ?? '',
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
    }

    carica()
  }, [supabase])

  const mostraMotivoChiusura = form.stato.startsWith('chiusa_')
  const isImmobileVuoto = form.tipo_notizia === 'immobile_vuoto'
  const isImmobileVendesi = form.tipo_notizia === 'immobile_vendesi'

  const clientiFiltrati = clienti.filter((c) =>
    c.label.toLowerCase().includes(cercaProprietario.toLowerCase())
  )

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

  function rimuoviProprietario(id: string) {
    setProprietari((prev) => prev.filter((x) => x !== id))
  }

  return (
    <form action={action} className="space-y-8">

      {/* TIPO NOTIZIA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Tipo di notizia *
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => upd('tipo_notizia', 'immobile_vuoto')}
            className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
              isImmobileVuoto
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">🏚️</div>

            <div className="font-semibold text-white">
              Immobile vuoto
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Un immobile che potrebbe essere in vendita, da indagare
            </div>
          </button>

          <button
            type="button"
            onClick={() => upd('tipo_notizia', 'immobile_vendesi')}
            className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
              isImmobileVendesi
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">🏠</div>

            <div className="font-semibold text-white">
              Immobile da vendere
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Un immobile che è già in vendita
            </div>
          </button>
        </div>

        <input
          type="hidden"
          name="tipo_notizia"
          value={form.tipo_notizia}
        />
      </section>

      {/* IMMOBILE COLLEGATO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Immobile collegato *
        </h2>

        <div>
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

          <p className="text-xs text-slate-500 mt-1">
            L&apos;immobile deve esistere in portafoglio prima di creare la notizia
          </p>
        </div>
      </section>

      {/* PROVENIENZA + PROPRIETARI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Provenienza
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* PROVENIENZA */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Come l&apos;hai saputo? *
            </label>

            <select
              name="tipo"
              required
              value={form.tipo}
              onChange={(e) => upd('tipo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="agenzia">In agenzia</option>
              <option value="passaparola">Passaparola</option>
              <option value="incontro">Incontro in giro</option>
              <option value="telefono">Telefono</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          {/* PROPRIETARI */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Proprietari
            </label>

            {/* PROPRIETARI SELEZIONATI */}
            {proprietari.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {proprietari.map((id) => {
                  const cliente = clienti.find((c) => c.id === id)

                  if (!cliente) return null

                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-lg text-sm text-blue-300"
                    >
                      <span>{cliente.label}</span>

                      <button
                        type="button"
                        onClick={() => rimuoviProprietario(id)}
                        className="text-blue-300 hover:text-white"
                        title="Rimuovi proprietario"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* SELECT */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMostraProprietari((prev) => !prev)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-left text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {proprietari.length >= 2
                  ? 'Massimo 2 proprietari selezionati'
                  : 'Seleziona proprietario...'}
              </button>

              {mostraProprietari && (
                <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-600 rounded-lg shadow-xl overflow-hidden">

                  {/* RICERCA */}
                  <div className="p-3 border-b border-slate-700">
                    <input
                      type="text"
                      value={cercaProprietario}
                      onChange={(e) =>
                        setCercaProprietario(e.target.value)
                      }
                      placeholder="🔍 Cerca cliente..."
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* LISTA CLIENTI */}
                  <div className="max-h-64 overflow-y-auto">

                    {clientiFiltrati.length === 0 && (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        Nessun cliente trovato.
                      </div>
                    )}

                    {clientiFiltrati.map((c) => {
                      const selezionato = proprietari.includes(c.id)
                      const disabilitato =
                        !selezionato && proprietari.length >= 2

                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                            disabilitato
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-slate-800 cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selezionato}
                            disabled={disabilitato}
                            onChange={() => toggleProprietario(c.id)}
                            className="w-4 h-4"
                          />

                          <span className="text-white">
                            {c.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {/* FOOTER */}
                  <div className="flex items-center justify-between px-4 py-2 border-t border-slate-700">
                    <span className="text-xs text-slate-500">
                      {proprietari.length}/2 proprietari selezionati
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setMostraProprietari(false)
                        setCercaProprietario('')
                      }}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      Chiudi
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1">
              Se l&apos;immobile è cointestato, seleziona entrambi i proprietari.
            </p>

            {/* VALORI INVIATI AL SERVER */}
            {proprietari.map((id) => (
              <input
                key={id}
                type="hidden"
                name="proprietari"
                value={id}
              />
            ))}
          </div>
        </div>
      </section>

      {/* STATO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Stato
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <option value="aperta">Aperta</option>
              <option value="in_lavorazione">In lavorazione</option>
              <option value="chiusa_positiva">Chiusa positiva</option>
              <option value="chiusa_negativa">Chiusa negativa</option>
            </select>
          </div>
        </div>

        {mostraMotivoChiusura && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Motivo chiusura
            </label>

            <textarea
              name="motivo_chiusura"
              rows={3}
              value={form.motivo_chiusura}
              onChange={(e) =>
                upd('motivo_chiusura', e.target.value)
              }
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dettagli sulla chiusura della notizia..."
            />
          </div>
        )}
      </section>

      {/* BOTTONI */}
      <div className="flex gap-3 justify-end">
        <a
          href={notizia?.id ? `/notizie/${notizia.id}` : '/notizie'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {notizia?.id ? 'Salva modifiche' : 'Crea notizia'}
        </button>
      </div>
    </form>
  )
}