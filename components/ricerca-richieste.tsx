'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RicercaRichieste() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [ricerca, setRicerca] = useState(searchParams.get('q') || '')
  const [cerca, setCerca] = useState(searchParams.get('cerca') || '')
  const [stato, setStato] = useState(searchParams.get('stato') || '')
  const [frazione, setFrazione] = useState(searchParams.get('frazione') || '')
  const [frazioniDisponibili, setFrazioniDisponibili] = useState<string[]>([])

  useEffect(() => {
    async function caricaFrazioni() {
      const { data } = await supabase
        .from('strade')
        .select('frazione')
        .limit(20000)
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
      if (cerca) params.set('cerca', cerca)
      if (stato) params.set('stato', stato)
      if (frazione) params.set('frazione', frazione)
      router.push(`/richieste?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [ricerca, cerca, stato, frazione, router])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="🔍 Cerca per zona, comune..."
        value={ricerca}
        onChange={(e) => setRicerca(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={cerca}
        onChange={(e) => setCerca(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutte le ricerche</option>
        <option value="vendita">Vendita</option>
        <option value="locazione">Locazione</option>
        <option value="nuda_proprieta">Nuda proprietà</option>
      </select>
      <select
        value={stato}
        onChange={(e) => setStato(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutti gli stati</option>
        <option value="nuova">Nuova</option>
        <option value="in_corso">In corso</option>
        <option value="sospesa">Sospesa</option>
        <option value="chiusa_trovato">Chiusa - Trovato</option>
        <option value="chiusa_comprato_altri">Chiusa - Comprato altri</option>
        <option value="chiusa_non_cerca_piu">Chiusa - Non cerca più</option>
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
    </div>
  )
}