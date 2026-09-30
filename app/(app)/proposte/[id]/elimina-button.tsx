'use client'

import { eliminaProposta } from '../actions'

export default function EliminaPropostaButton({
  id,
  nome,
}: {
  id: string
  nome: string
}) {
  function handleElimina() {
    if (!confirm(`Eliminare definitivamente la proposta per "${nome}"?`)) return
    eliminaProposta(id)
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