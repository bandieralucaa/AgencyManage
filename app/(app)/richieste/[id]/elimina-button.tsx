'use client'

import { eliminaRichiesta } from '../actions'

export default function EliminaRichiestaButton({
  id,
  nome,
}: {
  id: string
  nome: string
}) {
  function handleElimina() {
    if (!confirm(`Eliminare definitivamente la richiesta di "${nome}"? L'azione non è reversibile.`)) return
    eliminaRichiesta(id)
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