'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function RicercaRichieste() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ricerca, setRicerca] = useState(searchParams.get('q') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '')
  const [stato, setStato] = useState(searchParams.get('stato') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (ricerca) params.set('q', ricerca)
      if (tipo) params.set('tipo', tipo)
      if (stato) params.set('stato', stato)
      router.push(`/richieste?${params.toString()}`)
    }, 300)
    return () => clearTimeout(timer)
  }, [ricerca, tipo, stato, router])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="🔍 Cerca per zona, cliente..."
        value={ricerca}
        onChange={(e) => setRicerca(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tutti i tipi</option>
        <option value="vendita">Vendita</option>
        <option value="affitto">Affitto</option>
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
    </div>
  )
}