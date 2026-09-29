'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Cliente = { id: string; nome: string; cognome: string }

const FRAZIONI_DISPONIBILI = ['Altedo', 'Malalbergo', 'Pegola']

export default function FormNotizia({
  notizia,
  action,
}: {
  notizia?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [suggerimentiFrazioni, setSuggerimentiFrazioni] = useState<string[]>([])
  const [mostraSuggerimentiFrazioni, setMostraSuggerimentiFrazioni] = useState(false)

  const [form, setForm] = useState({
    tipo_notizia: notizia?.tipo_notizia ?? 'cliente_cerca',
    cliente_id: notizia?.cliente_id ?? '',
    tipo: notizia?.tipo ?? 'agenzia',
    indirizzo: notizia?.indirizzo ?? '',
    civico: notizia?.civico ?? '',
    frazione: notizia?.frazione ?? '',
    comune: notizia?.comune ?? 'Malalbergo',
    stato: notizia?.stato ?? 'aperta',
    motivo_chiusura: notizia?.motivo_chiusura ?? '',
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
      if (data) setClienti(data)
    }
    carica()
  }, [supabase])

  function handleFrazioniChange(valore: string) {
    upd('frazione', valore)
    const ultima = valore.trim().toLowerCase()
    if (ultima.length < 1) {
      setSuggerimentiFrazioni([])
      setMostraSuggerimentiFrazioni(false)
      return
    }
    const filtrati = FRAZIONI_DISPONIBILI.filter((f) =>
      f.toLowerCase().startsWith(ultima)
    )
    setSuggerimentiFrazioni(filtrati)
    setMostraSuggerimentiFrazioni(true)
  }

  function selezionaFrazione(frazione: string) {
    upd('frazione', frazione)
    setSuggerimentiFrazioni([])
    setMostraSuggerimentiFrazioni(false)
  }

  const mostraMotivoChiusura = form.stato.startsWith('chiusa_')
  const isClienteCerca = form.tipo_notizia === 'cliente_cerca'
  const isImmobileVendesi = form.tipo_notizia === 'immobile_vendesi'

  return (
    <form action={action} className="space-y-8">
      {/* TIPO NOTIZIA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Tipo di notizia *</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => upd('tipo_notizia', 'cliente_cerca')}
            className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
              isClienteCerca
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">🔍</div>
            <div className="font-semibold text-white">Cliente cerca casa</div>
            <div className="text-xs text-slate-400 mt-1">
              Un potenziale acquirente o inquilino
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
            <div className="font-semibold text-white">Immobile da vendere</div>
            <div className="text-xs text-slate-400 mt-1">
              Un immobile che potrebbe entrare in portafoglio
            </div>
          </button>
        </div>
        <input type="hidden" name="tipo_notizia" value={form.tipo_notizia} />
      </section>

      {/* PROVENIENZA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Provenienza</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cliente collegato (opzionale)
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
                  {c.cognome} {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* INDIRIZZO (opzionale, se riguarda un immobile specifico) */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Indirizzo{' '}
          <span className="text-slate-500 text-sm font-normal">
            {isImmobileVendesi
              ? '(dell\'immobile da vendere)'
              : '(opzionale, se il cliente cerca in una zona specifica)'}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Via</label>
            <input
              type="text"
              name="indirizzo"
              value={form.indirizzo}
              onChange={(e) => upd('indirizzo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Civico</label>
            <input
              type="text"
              name="civico"
              value={form.civico}
              onChange={(e) => upd('civico', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3 relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Frazione
            </label>
            <input
              type="text"
              name="frazione"
              value={form.frazione}
              onChange={(e) => handleFrazioniChange(e.target.value)}
              onFocus={() => {
                if (form.frazione.trim().length > 0) {
                  handleFrazioniChange(form.frazione)
                }
              }}
              onBlur={() =>
                setTimeout(() => setMostraSuggerimentiFrazioni(false), 200)
              }
              autoComplete="off"
              placeholder="Es. Altedo, Pegola"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {mostraSuggerimentiFrazioni && suggerimentiFrazioni.length > 0 && (
              <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                {suggerimentiFrazioni.map((f) => (
                  <li
                    key={f}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selezionaFrazione(f)
                    }}
                    className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">Comune</label>
            <input
              type="text"
              name="comune"
              value={form.comune}
              onChange={(e) => upd('comune', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* STATO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Stato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stato *</label>
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
              onChange={(e) => upd('motivo_chiusura', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dettagli sulla chiusura della notizia..."
            />
          </div>
        )}
      </section>

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