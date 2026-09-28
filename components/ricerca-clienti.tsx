'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function RicercaClienti() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [ricerca, setRicerca] = useState(searchParams.get('q') || '')
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '')
  const [comune, setComune] = useState(searchParams.get('comune') || '')
  const [mostraArchiviati, setMostraArchiviati] = useState(
    searchParams.get('archiviati') === '1'
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      if (ricerca) params.set('q', ricerca)
      if (tipo) params.set('tipo', tipo)
      if (comune) params.set('comune', comune)
      if (mostraArchiviati) params.set('archiviati', '1')
      router.push(`/clienti?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [ricerca, tipo, comune, mostraArchiviati, router])

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="🔍 Cerca per nome, cognome, telefono..."
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
        <option value="venditore">Venditore</option>
        <option value="acquirente">Acquirente</option>
        <option value="inquilino">Inquilino</option>
        <option value="locatore">Locatore</option>
        <option value="entrambi">Entrambi</option>
      </select>
      <input
        type="text"
        placeholder="Comune"
        value={comune}
        onChange={(e) => setComune(e.target.value)}
        className="w-40 px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
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