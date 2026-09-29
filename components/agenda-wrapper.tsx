'use client'

import dynamic from 'next/dynamic'

const AgendaCalendario = dynamic(() => import('./agenda-calendario'), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center text-slate-400">
      Caricamento calendario...
    </div>
  ),
})

export default function AgendaWrapper() {
  return <AgendaCalendario />
}