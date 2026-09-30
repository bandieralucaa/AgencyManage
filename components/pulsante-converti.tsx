'use client'

import { useState, useTransition } from 'react'

export default function PulsanteConverti({
  label,
  descrizione,
  azione,
  id,
  colore = 'blue',
  icona,
}: {
  label: string
  descrizione?: string
  azione: (id: string) => Promise<void>
  id: string
  colore?: 'blue' | 'emerald' | 'amber' | 'purple'
  icona: string
}) {
  const [errore, setErrore] = useState('')
  const [isPending, startTransition] = useTransition()

  const colori = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
  }

  function handleClick() {
    setErrore('')
    startTransition(async () => {
      try {
        await azione(id)
      } catch (err: any) {
        // Ignora gli errori di redirect di Next.js (sono attesi)
        if (
          err?.digest?.startsWith('NEXT_REDIRECT') ||
          err?.message?.includes('NEXT_REDIRECT')
        ) {
          return
        }
        setErrore(err?.message || 'Errore nella conversione')
      }
    })
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">{icona}</span>
            {label}
          </h3>
          {descrizione && (
            <p className="text-sm text-slate-400 mt-1">{descrizione}</p>
          )}
        </div>
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`${colori[colore]} text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap`}
        >
          {isPending ? 'Conversione...' : label}
        </button>
      </div>
      {errore && (
        <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-2">
          ⚠️ {errore}
        </div>
      )}
    </div>
  )
}