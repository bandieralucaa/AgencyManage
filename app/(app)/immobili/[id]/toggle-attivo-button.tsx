'use client'

import { toggleAttivoImmobile } from '../actions'

export default function ToggleAttivoImmobileButton({
  id,
  attivo,
}: {
  id: string
  attivo: boolean
}) {
  function handleToggle() {
    const msg = attivo
      ? 'Archiviare questo immobile? Resterà nel database ma non apparirà nelle liste attive.'
      : 'Riattivare questo immobile?'
    if (!confirm(msg)) return
    toggleAttivoImmobile(id, attivo)
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