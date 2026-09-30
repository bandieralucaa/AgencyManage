'use client'

import { useState } from 'react'
import { accettaProposta } from '../actions'

export default function AccettaPropostaButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)

  async function handleAccetta() {
    if (
      !confirm(
        'Confermi che la proposta è stata accettata?\n\n' +
          'La richiesta verrà chiusa come "trovato" e l\'incarico come "concluso bene".'
      )
    )
      return

    setLoading(true)
    try {
      await accettaProposta(id)
    } catch (err: any) {
      alert(err?.message || 'Errore')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAccetta}
      disabled={loading}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? 'Chiusura...' : '✅ Accetta e chiudi'}
    </button>
  )
}