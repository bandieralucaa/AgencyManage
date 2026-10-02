'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RicercaImmobili() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [ricerca, setRicerca] = useState(searchParams.get('q') || '')
  const [categoria, setCategoria] = useState(searchParams.get('categoria') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '')
  const [frazione, setFrazione] = useState(searchParams.get('frazione') || '')
  const [mostraArchiviati, setMostraArchiviati] = useState(
    searchParams.get('archiviati') === '1'
  )
  const [frazioniDisponibili, setFrazioniDisponibili] = useState<string[]>([])

  useEffect(() => {
    async function caricaFrazioni() {
      const { data } = await supabase.from('strade').select('frazione')
      if (data) {
        const uniche = Array.from(
          new Set(data.map((s) => s.frazione).filter(Boolean))
        ).sort() as string[]
        setFrazioniDisponibili(uniche)
      }
    }
    caricaFrazioni()
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (ricerca) params.set('q', ricerca)
      if (categoria) params.set('categoria', categoria)
      if (tipo) params.set('tipo', tipo)
      if (frazione) params.set('frazione', frazione)
      if (mostraArchiviati) params.set('archiviati', '1')
      router.push(`/immobili?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [ricerca, categoria, tipo, frazione, mostraArchiviati, router])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="🔍 Cerca per via, civico..."
        value={ricerca}
        onChange={(e) => setRicerca(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutte le categorie</option>
        <option value="casa">Casa</option>
        <option value="non_casa">Non casa</option>
      </select>
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutti i tipi</option>
        <option value="appartamento">Appartamento</option>
        <option value="villa">Villa</option>
        <option value="villetta">Villetta</option>
        <option value="terreno">Terreno</option>
        <option value="ufficio">Ufficio</option>
        <option value="negozio">Negozio</option>
        <option value="garage">Garage</option>
        <option value="box">Box</option>
        <option value="magazzino">Magazzino</option>
        <option value="rustico">Rustico</option>
        <option value="altro">Altro</option>
      </select>
      <select
        value={frazione}
        onChange={(e) => setFrazione(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutte le frazioni</option>
        {frazioniDisponibili.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={mostraArchiviati}
          onChange={(e) => setMostraArchiviati(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        Mostra archiviati
      </label>
    </div>
  )
}