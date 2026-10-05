'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type SuggerimentoVia = { nome: string; frazione: string }
type Frazione = { id: string; nome: string; comune: string; cap: string; provincia: string }

export default function FormImmobile({
  immobile,
  action,
}: {
  immobile?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [suggerimenti, setSuggerimenti] = useState<SuggerimentoVia[]>([])
  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false)
  const [frazioni, setFrazioni] = useState<Frazione[]>([])

  const [form, setForm] = useState({
    tipo: immobile?.tipo ?? 'appartamento',
    categoria: immobile?.categoria ?? 'casa',
    indirizzo: immobile?.indirizzo ?? '',
    civico: immobile?.civico ?? '',
    frazione_id: '',
    frazione: immobile?.frazione ?? '',
    comune: immobile?.comune ?? '',
    cap: immobile?.cap ?? '',
    provincia: immobile?.provincia ?? 'BO',
    piano: immobile?.piano ?? '',
    interno: immobile?.interno ?? '',
    scala: immobile?.scala ?? '',
    metri_quadrati: immobile?.metri_quadrati ?? '',
    vani: immobile?.vani ?? '',
    camere: immobile?.camere ?? '',
    bagni: immobile?.bagni ?? '',
    stato: immobile?.stato ?? '',
    classe_energetica: immobile?.classe_energetica ?? '',
    riscaldamento: immobile?.riscaldamento ?? '',
    anno_costruzione: immobile?.anno_costruzione ?? '',
    descrizione: immobile?.descrizione ?? '',
    note: immobile?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Carica le frazioni all'avvio
  useEffect(() => {
    async function caricaFrazioni() {
      const { data } = await supabase
        .from('frazioni')
        .select('id, nome, comuni (nome, cap, provincia)')
        .order('nome', { ascending: true })

      if (data) {
        const lista: Frazione[] = data.map((f: any) => {
          const com = Array.isArray(f.comuni) ? f.comuni[0] : f.comuni
          return {
            id: f.id,
            nome: f.nome,
            comune: com?.nome || '',
            cap: com?.cap || '',
            provincia: com?.provincia || '',
          }
        })
        setFrazioni(lista)
      }
    }
    caricaFrazioni()
  }, [supabase])

  // Autocomplete via
  useEffect(() => {
    if (form.indirizzo.length < 2) {
      setSuggerimenti([])
      return
    }
    const timer = setTimeout(async () => {
      let query = supabase.from('vie').select('nome, frazioni (nome)')

      // Se è selezionata una frazione, filtra per quella frazione
      if (form.frazione_id) {
        query = query.eq('frazione_id', form.frazione_id)
      }

      const { data } = await query.ilike('nome', `%${form.indirizzo}%`).limit(50)

      if (data) {
        const risultati: SuggerimentoVia[] = data.map((v: any) => {
          const fraz = Array.isArray(v.frazioni) ? v.frazioni[0] : v.frazioni
          return {
            nome: v.nome,
            frazione: fraz?.nome || '',
          }
        })
        const unici = risultati.filter(
          (r, i, arr) =>
            arr.findIndex(
              (x) => x.nome === r.nome && x.frazione === r.frazione
            ) === i
        )
        setSuggerimenti(unici.slice(0, 10))
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [form.indirizzo, form.frazione_id, supabase])

  function selezionaVia(nome: string) {
    upd('indirizzo', nome)
    setMostraSuggerimenti(false)
  }

  function selezionaFrazione(frazioneId: string) {
    upd('frazione_id', frazioneId)
    const fraz = frazioni.find((f) => f.id === frazioneId)
    if (fraz) {
      upd('frazione', fraz.nome)
      upd('comune', fraz.comune)
      upd('cap', fraz.cap)
      upd('provincia', fraz.provincia)
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* CLASSIFICAZIONE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Classificazione</h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tipo *</label>
          <select
            name="tipo"
            required
            value={form.tipo}
            onChange={(e) => upd('tipo', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="appartamento">Appartamento</option>
            <option value="villa">Villa</option>
            <option value="villetta">Villetta</option>
            <option value="rustico">Rustico</option>
            <option value="terreno">Terreno</option>
            <option value="ufficio">Ufficio</option>
            <option value="negozio">Negozio</option>
            <option value="magazzino">Magazzino</option>
            <option value="garage">Garage</option>
            <option value="box">Box</option>
            <option value="altro">Altro</option>
          </select>
        </div>
      </section>

      {/* UBICAZIONE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Ubicazione</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* VIA */}
          <div className="md:col-span-4 relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Via *</label>
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
                {suggerimenti.map((s, i) => (
                  <li
                    key={`${s.nome}-${s.frazione}-${i}`}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selezionaVia(s)
                    }}
                    className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm"
                  >
                    {s.nome}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Se non è in elenco, verrà aggiunta automaticamente
            </p>
          </div>

          {/* CIVICO */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Civico</label>
            <input type="text" name="civico" value={form.civico}
              onChange={(e) => upd('civico', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* FRAZIONE (select) */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">Frazione *</label>
            <select
              name="frazione_id"
              required
              value={form.frazione_id}
              onChange={(e) => selezionaFrazione(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Seleziona frazione —</option>
              {frazioni.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome} ({f.comune})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Compila automaticamente comune, CAP e provincia
            </p>
          </div>

          {/* FRAZIONE (hidden - valore salvato nel DB) */}
          <input type="hidden" name="frazione" value={form.frazione} />

          {/* COMUNE (auto) */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comune * <span className="text-slate-500 text-xs">(auto)</span>
            </label>
            <input type="text" name="comune" required value={form.comune}
              onChange={(e) => upd('comune', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* CAP (auto) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CAP <span className="text-slate-500 text-xs">(auto)</span>
            </label>
            <input type="text" name="cap" maxLength={5} value={form.cap}
              onChange={(e) => upd('cap', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {/* PROVINCIA (auto) */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prov. <span className="text-slate-500 text-xs">(auto)</span>
            </label>
            <input type="text" name="provincia" maxLength={2} value={form.provincia}
              onChange={(e) => upd('provincia', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>

          {/* PIANO */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Piano</label>
            <input type="text" name="piano" value={form.piano}
              onChange={(e) => upd('piano', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Interno</label>
            <input type="text" name="interno" value={form.interno}
              onChange={(e) => upd('interno', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Scala</label>
            <input type="text" name="scala" value={form.scala}
              onChange={(e) => upd('scala', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>
  
      {/* CARATTERISTICHE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Caratteristiche</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mq</label>
            <input type="number" name="metri_quadrati" value={form.metri_quadrati}
              onChange={(e) => upd('metri_quadrati', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Vani</label>
            <input type="number" name="vani" value={form.vani}
              onChange={(e) => upd('vani', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Camere</label>
            <input type="number" name="camere" value={form.camere}
              onChange={(e) => upd('camere', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bagni</label>
            <input type="number" name="bagni" value={form.bagni}
              onChange={(e) => upd('bagni', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stato</label>
            <select name="stato" value={form.stato}
              onChange={(e) => upd('stato', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">—</option>
              <option value="nuovo">Nuovo</option>
              <option value="ristrutturato">Ristrutturato</option>
              <option value="buono">Buono</option>
              <option value="da_ristrutturare">Da ristrutturare</option>
              <option value="rudere">Rudere</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Classe energ.</label>
            <input type="text" name="classe_energetica" value={form.classe_energetica}
              onChange={(e) => upd('classe_energetica', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Riscaldamento</label>
            <select name="riscaldamento" value={form.riscaldamento}
              onChange={(e) => upd('riscaldamento', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">—</option>
              <option value="autonomo">Autonomo</option>
              <option value="centralizzato">Centralizzato</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Anno</label>
            <input type="number" name="anno_costruzione" value={form.anno_costruzione}
              onChange={(e) => upd('anno_costruzione', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      {/* DESCRIZIONE E NOTE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Descrizione e note</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descrizione</label>
            <textarea name="descrizione" rows={4} value={form.descrizione}
              onChange={(e) => upd('descrizione', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Note interne</label>
            <textarea name="note" rows={3} value={form.note}
              onChange={(e) => upd('note', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      <div className="flex gap-3 justify-end">
        <a href={immobile?.id ? `/immobili/${immobile.id}` : '/immobili'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
          Annulla
        </a>
        <button type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          {immobile?.id ? 'Salva modifiche' : 'Crea immobile'}
        </button>
      </div>
    </form>
  )
}