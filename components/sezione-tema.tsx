'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function SezioneTema() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">🎨 Tema</h2>
        <p className="text-sm text-slate-400">Caricamento...</p>
      </div>
    )
  }

  const isDark = theme === 'dark'

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">🎨 Tema</h2>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            Tema attuale: {isDark ? 'Scuro' : 'Chiaro'}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Scegli il tema dell&apos;interfaccia. La preferenza viene salvata sul tuo browser.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              !isDark
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            ☀️ Chiaro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              isDark
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            🌙 Scuro
          </button>
        </div>
      </div>
    </div>
  )
}