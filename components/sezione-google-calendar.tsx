'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { scollegaGoogleCalendar } from '@/app/(app)/impostazioni/actions'

export default function SezioneGoogleCalendar({
  connesso,
}: {
  connesso: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  async function handleScollega() {
    if (
      !confirm(
        'Scollegare Google Calendar?\n\n' +
          'Non vedrai più gli impegni in dashboard e agenda finché non lo ricolleghi.'
      )
    )
      return

    setLoading(true)
    setErrore('')

    const res = await scollegaGoogleCalendar()

    if (!res.ok) {
      setErrore(res.errore || 'Errore nella disconnessione')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  function handleConnetti() {
    window.location.href = '/api/google/connect'
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">📅 Google Calendar</h2>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connesso ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
            <span
              className={`text-sm font-medium ${
                connesso ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {connesso ? 'Connesso' : 'Non connesso'}
            </span>
          </div>

          {connesso ? (
            <p className="text-sm text-slate-400">
              Il tuo Google Calendar è collegato. Gli impegni di oggi appaiono in
              dashboard e nell&apos;agenda puoi crearli e modificarli.
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Collega il tuo Google Calendar per vedere gli impegni in dashboard e
              gestirli dall&apos;agenda.
            </p>
          )}
        </div>

        <div className="shrink-0">
          {connesso ? (
            <button
              onClick={handleScollega}
              disabled={loading}
              className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/50 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? 'Disconnessione...' : 'Scollega'}
            </button>
          ) : (
            <button
              onClick={handleConnetti}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              🔗 Connetti
            </button>
          )}
        </div>
      </div>

      {errore && (
        <div className="mt-4 bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-2">
          ⚠️ {errore}
        </div>
      )}
    </div>
  )
}