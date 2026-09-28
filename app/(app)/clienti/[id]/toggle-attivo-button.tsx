'use client'

import { toggleAttivoCliente } from '../actions'

export default function ToggleAttivoButton({
  id,
  attivo,
}: {
  id: string
  attivo: boolean
}) {
  function handleToggle() {
    const msg = attivo
      ? 'Archiviare questo cliente? Resterà nel database ma non apparirà nelle liste attive.'
      : 'Riattivare questo cliente?'
    if (!confirm(msg)) return
    toggleAttivoCliente(id, attivo)
  }

  return (
    <button
      onClick={handleToggle}
      className={`px-4 py-2 rounded-lg transition-colors ${
        attivo
          ? 'bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-600/50'
          : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50'
      }`}
    >
      {attivo ? 'Archivia' : 'Riattiva'}
    </button>
  )
}