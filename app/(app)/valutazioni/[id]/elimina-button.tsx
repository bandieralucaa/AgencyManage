'use client'

import { eliminaValutazione } from '../actions'

export default function EliminaValutazioneButton({
  id,
  nome,
}: {
  id: string
  nome: string
}) {
  function handleElimina() {
    if (
      !confirm(
        `Eliminare definitivamente la valutazione di "${nome}"? L'azione non è reversibile.`
      )
    )
      return
    eliminaValutazione(id)
  }

  return (
    <button
      onClick={handleElimina}
      className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 rounded-lg transition-colors"
    >
      Elimina
    </button>
  )
}