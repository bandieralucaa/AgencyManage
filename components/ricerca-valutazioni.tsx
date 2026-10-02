'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RicercaValutazioni() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [ricerca, setRicerca] = useState(searchParams.get('q') || '')
  const [stato, setStato] = useState(searchParams.get('stato') || '')
  const [frazione, setFrazione] = useState(searchParams.get('frazione') || '')
  const [frazioniDisponibili, setFrazioniDisponibili] = useState<string[]>([])

  useEffect(() => {
    async function caricaFrazioni() {
      const { data } = await supabase
        .from('frazioni_uniche')
        .select('frazione')
      if (data) {
        setFrazioniDisponibili(data.map((s) => s.frazione))
      }
    }
    caricaFrazioni()
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (ricerca) params.set('q', ricerca)
      if (stato) params.set('stato', stato)
      if (frazione) params.set('frazione', frazione)
      router.push(`/valutazioni?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [ricerca, stato, frazione, router])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="🔍 Cerca per indirizzo, cliente..."
        value={ricerca}
        onChange={(e) => setRicerca(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={stato}
        onChange={(e) => setStato(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutti gli stati</option>
        <option value="da_fare">Da fare</option>
        <option value="fatta">Fatta</option>
        <option value="seguita">Seguita</option>
        <option value="persa">Persa</option>
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