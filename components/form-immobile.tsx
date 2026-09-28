'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type ImmobileData = any

export default function FormImmobile({
  immobile,
  action,
}: {
  immobile?: ImmobileData
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()
  const [via, setVia] = useState(immobile?.indirizzo || '')
  const [civico, setCivico] = useState(immobile?.civico || '')
  const [comune, setComune] = useState(immobile?.comune || '')
  const [frazione, setFrazione] = useState(immobile?.frazione || '')
  const [cap, setCap] = useState(immobile?.cap || '')
  const [suggerimenti, setSuggerimenti] = useState<string[]>([])
  const [mostraSuggerimenti, setMostraSuggerimenti] = useState(false)

  useEffect(() => {
    if (via.length < 2) {
      setSuggerimenti([])
      return
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('strade')
        .select('via')
        .ilike('via', `%${via}%`)
        .limit(50)

      if (data) {
        const vieUniche = [...new Set(data.map((d) => d.via))]
        setSuggerimenti(vieUniche.slice(0, 10))
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [via, supabase])

  async function selezionaVia(viaSelezionata: string) {
    setVia(viaSelezionata)
    setMostraSuggerimenti(false)

    const { data } = await supabase
      .from('strade')
      .select('comune, frazione, cap')
      .eq('via', viaSelezionata)
      .limit(1)
      .single()

    if (data) {
      setComune(data.comune || '')
      setFrazione(data.frazione || '')
      setCap(data.cap || '')
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* CLASSIFICAZIONE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Classificazione</h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Tipo *</label>
          <select name="tipo" required defaultValue={immobile?.tipo || 'appartamento'}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <div className="md:col-span-4 relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Via *</label>
            <input
              type="text"
              name="indirizzo"
              required
              value={via}
              onChange={(e) => {
                setVia(e.target.value)
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
                    onClick={() => selezionaVia(s)}
                    className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-white text-sm"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Civico</label>
            <input type="text" name="civico" value={civico} onChange={(e) => setCivico(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Frazione</label>
            <input type="text" name="frazione" value={frazione} onChange={(e) => setFrazione(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">Comune *</label>
            <input type="text" name="comune" required value={comune} onChange={(e) => setComune(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">CAP</label>
            <input type="text" name="cap" maxLength={5} value={cap} onChange={(e) => setCap(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Provincia</label>
            <input type="text" name="provincia" maxLength={2} defaultValue={immobile?.provincia || 'BO'}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Piano</label>
            <input type="text" name="piano" defaultValue={immobile?.piano || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Interno</label>
            <input type="text" name="interno" defaultValue={immobile?.interno || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">Scala</label>
            <input type="text" name="scala" defaultValue={immobile?.scala || ''}
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
            <input type="number" name="metri_quadrati" defaultValue={immobile?.metri_quadrati || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Vani</label>
            <input type="number" name="vani" defaultValue={immobile?.vani || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Camere</label>
            <input type="number" name="camere" defaultValue={immobile?.camere || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Bagni</label>
            <input type="number" name="bagni" defaultValue={immobile?.bagni || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Stato</label>
            <select name="stato" defaultValue={immobile?.stato || ''}
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
            <input type="text" name="classe_energetica" defaultValue={immobile?.classe_energetica || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Riscaldamento</label>
            <input type="text" name="riscaldamento" defaultValue={immobile?.riscaldamento || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Anno</label>
            <input type="number" name="anno_costruzione" defaultValue={immobile?.anno_costruzione || ''}
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
            <textarea name="descrizione" rows={4} defaultValue={immobile?.descrizione || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Note interne</label>
            <textarea name="note" rows={3} defaultValue={immobile?.note || ''}
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