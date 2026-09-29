'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Cliente = { id: string; nome: string; cognome: string }

const TIPOLOGIE_DISPONIBILI = [
  'appartamento',
  'villa',
  'villetta',
  'rustico',
  'terreno',
  'ufficio',
  'negozio',
  'magazzino',
  'garage',
  'box',
  'altro',
]

const TIPOLOGIE_LABEL: Record<string, string> = {
  appartamento: 'Appartamento',
  villa: 'Villa',
  villetta: 'Villetta',
  rustico: 'Rustico',
  terreno: 'Terreno',
  ufficio: 'Ufficio',
  negozio: 'Negozio',
  magazzino: 'Magazzino',
  garage: 'Garage',
  box: 'Box',
  altro: 'Altro',
}

const FRAZIONI_DISPONIBILI = ['Altedo', 'Malalbergo', 'Pegola']

const ACCESSORI_DISPONIBILI = [
  'Box',
  'Cantina',
  'Soffitta',
  'Rustico',
  'Taverna',
  'Giardino',
  'Terrazzo',
  'Ascensore',
  'Balcone',
  'Piscina',
]

const STATI_IMMOBILE = [
  { value: 'nuovo', label: 'Nuovo' },
  { value: 'qualche_lavoro', label: 'Qualche lavoro' },
  { value: 'buono', label: 'Buono' },
  { value: 'da_ristrutturare', label: 'Da ristrutturare' },
  { value: 'rudere', label: 'Rudere' },
]

export default function FormRichiesta({
  richiesta,
  action,
}: {
  richiesta?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [clienti, setClienti] = useState<Cliente[]>([])

  const [suggerimentiFrazioni, setSuggerimentiFrazioni] = useState<string[]>([])
  const [mostraSuggerimentiFrazioni, setMostraSuggerimentiFrazioni] = useState(false)

  const [suggerimentiTipologie, setSuggerimentiTipologie] = useState<string[]>([])
  const [mostraSuggerimentiTipologie, setMostraSuggerimentiTipologie] = useState(false)

  const [form, setForm] = useState({
    cliente_id: richiesta?.cliente_id ?? '',
    cerca: richiesta?.cerca ?? 'vendita',
    stato: richiesta?.stato ?? 'nuova',
    motivo_chiusura: richiesta?.motivo_chiusura ?? '',
    zona_cercata: richiesta?.zona_cercata ?? '',
    frazioni_cercate: (richiesta?.frazioni_cercate ?? []).join(', '),
    comune: richiesta?.comuni_cercati?.[0] ?? '',
    cap: richiesta?.cap_cercato ?? '',
    tipologia: (richiesta?.tipologia ?? []).join(', '),
    locali_min: richiesta?.locali_min ?? '',
    locali_max: richiesta?.locali_max ?? '',
    mq_min: richiesta?.mq_min ?? '',
    mq_max: richiesta?.mq_max ?? '',
    stato_immobile: richiesta?.stato_immobile ?? '',
    tipo_stabile: richiesta?.tipo_stabile ?? '',
    accessori: richiesta?.accessori ?? [],
    riscaldamento: richiesta?.riscaldamento ?? '',
    prezzo_min: richiesta?.prezzo_min ?? '',
    prezzo_max: richiesta?.prezzo_max ?? '',
    mutuo: richiesta?.mutuo ?? false,
    mutuo_note: richiesta?.mutuo_note ?? '',
    note: richiesta?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleAccessorio(acc: string) {
    setForm((prev) => {
      const lista = [...prev.accessori]
      const idx = lista.indexOf(acc)
      if (idx >= 0) lista.splice(idx, 1)
      else lista.push(acc)
      return { ...prev, accessori: lista }
    })
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

  // Auto-compila comune e CAP in base alla PRIMA frazione selezionata
  async function aggiornaComuneCap(frazioniStr: string) {
    const parti = frazioniStr
      .split(',')
      .map((f: string) => f.trim())
      .filter(Boolean)

    if (parti.length === 0) {
      upd('comune', '')
      upd('cap', '')
      return
    }

    const primaFrazione = parti[0]

    const { data } = await supabase
      .from('strade')
      .select('comune, cap')
      .eq('frazione', primaFrazione)
      .limit(1)
      .single()

    if (data) {
      upd('comune', data.comune || '')
      upd('cap', data.cap || '')
    }
  }

  function handleFrazioniChange(valore: string) {
    upd('frazioni_cercate', valore)
    const parti = valore.split(',')
    const ultima = parti[parti.length - 1].trim().toLowerCase()
    if (ultima.length < 1) {
      setSuggerimentiFrazioni([])
      setMostraSuggerimentiFrazioni(false)
      return
    }
    const giaInseriti = parti
      .slice(0, -1)
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean)
    const filtrati = FRAZIONI_DISPONIBILI.filter(
      (f) =>
        f.toLowerCase().startsWith(ultima) &&
        !giaInseriti.includes(f.toLowerCase())
    )
    setSuggerimentiFrazioni(filtrati)
    setMostraSuggerimentiFrazioni(true)
  }

  async function selezionaFrazione(frazione: string) {
    const parti = form.frazioni_cercate.split(',')
    parti[parti.length - 1] = ` ${frazione}`
    const nuovo = parti.join(',').replace(/^\s*,/, '')
    const finale = nuovo + ', '
    upd('frazioni_cercate', finale)
    setSuggerimentiFrazioni([])
    setMostraSuggerimentiFrazioni(false)

    // Auto-compila comune e CAP dalla prima frazione
    await aggiornaComuneCap(finale)
  }

  function handleTipologiaChange(valore: string) {
    upd('tipologia', valore)
    const parti = valore.split(',')
    const ultima = parti[parti.length - 1].trim().toLowerCase()
    if (ultima.length < 1) {
      setSuggerimentiTipologie([])
      setMostraSuggerimentiTipologie(false)
      return
    }
    const giaInseriti = parti
      .slice(0, -1)
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean)
    const filtrati = TIPOLOGIE_DISPONIBILI.filter(
      (t) =>
        t.toLowerCase().startsWith(ultima) && !giaInseriti.includes(t.toLowerCase())
    )
    setSuggerimentiTipologie(filtrati)
    setMostraSuggerimentiTipologie(true)
  }

  function selezionaTipologia(tip: string) {
    const parti = form.tipologia.split(',')
    parti[parti.length - 1] = ` ${tip}`
    const nuovo = parti.join(',').replace(/^\s*,/, '')
    upd('tipologia', nuovo + ', ')
    setSuggerimentiTipologie([])
    setMostraSuggerimentiTipologie(false)
  }

  const mostraMotivoChiusura = form.stato.startsWith('chiusa_')

  return (
    <form action={action} className="space-y-8">
      {/* CLIENTE E RICERCA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Cliente e ricerca</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cliente *</label>
            <select
              name="cliente_id"
              required
              value={form.cliente_id}
              onChange={(e) => upd('cliente_id', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Seleziona —</option>
              {clienti.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.cognome} {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cerca *</label>
            <select
              name="cerca"
              required
              value={form.cerca}
              onChange={(e) => upd('cerca', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vendita">Vendita</option>
              <option value="locazione">Locazione</option>
              <option value="nuda_proprieta">Nuda proprietà</option>
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
              <option value="nuova">Nuova</option>
              <option value="in_corso">In corso</option>
              <option value="sospesa">Sospesa</option>
              <option value="chiusa_trovato">Chiusa - Trovato</option>
              <option value="chiusa_comprato_altri">Chiusa - Comprato altri</option>
              <option value="chiusa_non_cerca_piu">Chiusa - Non cerca più</option>
            </select>
          </div>
        </div>

        {mostraMotivoChiusura && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Motivo chiusura</label>
            <textarea
              name="motivo_chiusura"
              rows={2}
              value={form.motivo_chiusura}
              onChange={(e) => upd('motivo_chiusura', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Dettagli sulla chiusura della richiesta..."
            />
          </div>
        )}
      </section>

      {/* ZONA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Zona richiesta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Zona cercata</label>
            <input
              type="text"
              name="zona_cercata"
              value={form.zona_cercata}
              onChange={(e) => upd('zona_cercata', e.target.value)}
              placeholder="Es. Centro storico, periferia nord..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Frazioni <span className="text-slate-500 text-xs">(Altedo, Malalbergo, Pegola)</span>
            </label>
            <input
              type="text"
              name="frazioni_cercate"
              value={form.frazioni_cercate}
              onChange={(e) => handleFrazioniChange(e.target.value)}
              onFocus={() => {
                if (form.frazioni_cercate.trim().length > 0) {
                  handleFrazioniChange(form.frazioni_cercate)
                }
              }}
              onBlur={() => setTimeout(() => setMostraSuggerimentiFrazioni(false), 200)}
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comune <span className="text-slate-500 text-xs">(auto dalla frazione)</span>
            </label>
            <input
              type="text"
              name="comune"
              value={form.comune}
              onChange={(e) => upd('comune', e.target.value)}
              placeholder="Auto-compilato"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipologia</label>
            <div className="relative">
              <input
                type="text"
                name="tipologia"
                value={form.tipologia}
                onChange={(e) => handleTipologiaChange(e.target.value)}
                onFocus={() => {
                  if (form.tipologia.trim().length > 0) {
                    handleTipologiaChange(form.tipologia)
                  }
                }}
                onBlur={() => setTimeout(() => setMostraSuggerimentiTipologie(false), 200)}
                autoComplete="off"
                placeholder="Es. appartamento, villa"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mostraSuggerimentiTipologie && suggerimentiTipologie.length > 0 && (
                <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-600 rounded-lg max-h-60 overflow-y-auto shadow-xl">
                  {suggerimentiTipologie.map((t) => (
                    <li
                      key={t}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        selezionaTipologia(t)
                      }}
                      className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm"
                    >
                      {TIPOLOGIE_LABEL[t] || t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CAP <span className="text-slate-500 text-xs">(auto dalla frazione)</span>
            </label>
            <input
              type="text"
              name="cap_cercato"
              maxLength={5}
              value={form.cap}
              onChange={(e) => upd('cap', e.target.value)}
              placeholder="Auto-compilato"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* DIMENSIONI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Dimensioni</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">N. locali min</label>
            <input type="number" name="locali_min" value={form.locali_min}
              onChange={(e) => upd('locali_min', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">N. locali max</label>
            <input type="number" name="locali_max" value={form.locali_max}
              onChange={(e) => upd('locali_max', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mq min</label>
            <input type="number" name="mq_min" value={form.mq_min}
              onChange={(e) => upd('mq_min', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mq max</label>
            <input type="number" name="mq_max" value={form.mq_max}
              onChange={(e) => upd('mq_max', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      {/* CARATTERISTICHE STABILE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Caratteristiche stabile</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stato</label>
            <select name="stato_immobile" value={form.stato_immobile}
              onChange={(e) => upd('stato_immobile', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Indifferente</option>
              {STATI_IMMOBILE.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo stabile</label>
            <select name="tipo_stabile" value={form.tipo_stabile}
              onChange={(e) => upd('tipo_stabile', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Indifferente</option>
              <option value="indipendente">Indipendente</option>
              <option value="condominio">Condominio</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Riscaldamento</label>
            <select name="riscaldamento" value={form.riscaldamento}
              onChange={(e) => upd('riscaldamento', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Indifferente</option>
              <option value="autonomo">Autonomo</option>
              <option value="centralizzato">Centralizzato</option>
            </select>
          </div>
        </div>
      </section>

      {/* ACCESSORI E PERTINENZE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Accessori e pertinenze</h2>
        <input type="hidden" name="accessori" value={form.accessori.join(',')} />
        <div className="flex flex-wrap gap-2">
          {ACCESSORI_DISPONIBILI.map((acc) => {
            const attivo = form.accessori.includes(acc)
            return (
              <button
                key={acc}
                type="button"
                onClick={() => toggleAccessorio(acc)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  attivo
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                {attivo && '✓ '}
                {acc}
              </button>
            )
          })}
        </div>
      </section>

      {/* BUDGET */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Budget</h2>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prezzo min €</label>
            <input type="number" name="prezzo_min" value={form.prezzo_min}
              onChange={(e) => upd('prezzo_min', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Prezzo max €</label>
            <input type="number" name="prezzo_max" value={form.prezzo_max}
              onChange={(e) => upd('prezzo_max', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      {/* MUTUO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Mutuo</h2>
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none mb-4">
            <input type="checkbox" name="mutuo" checked={form.mutuo}
              onChange={(e) => upd('mutuo', e.target.checked)}
              className="w-4 h-4 accent-blue-600" />
            Il cliente ha bisogno di mutuo
          </label>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Note mutuo</label>
            <input type="text" name="mutuo_note" value={form.mutuo_note}
              onChange={(e) => upd('mutuo_note', e.target.value)}
              placeholder="Es. già pre-delibera, importo..."
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      {/* NOTE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Note</h2>
        <textarea name="note" rows={4} value={form.note}
          onChange={(e) => upd('note', e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note aggiuntive..." />
      </section>

      <div className="flex gap-3 justify-end">
        <a href={richiesta?.id ? `/richieste/${richiesta.id}` : '/richieste'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
          Annulla
        </a>
        <button type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          {richiesta?.id ? 'Salva modifiche' : 'Crea richiesta'}
        </button>
      </div>
    </form>
  )
}