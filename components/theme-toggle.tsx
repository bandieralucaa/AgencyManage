'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button className="w-full text-sm bg-slate-700 text-white px-3 py-2 rounded-lg">
        Caricamento...
      </button>
    )
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full text-sm bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
      title={isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'}
    >
      {isDark ? '☀️ Tema chiaro' : '🌙 Tema scuro'}
    </button>
  )
}