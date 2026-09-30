import Link from 'next/link'

type Step = {
  label: string
  icona: string
  stato: 'completato' | 'attivo' | 'futuro'
  link?: string
  data?: string
}

export default function TimelineFlusso({ step }: { step: Step[] }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Flusso
      </h3>
      <ol className="space-y-2">
        {step.map((s, i) => {
          const contenuto = (
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  s.stato === 'completato'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : s.stato === 'attivo'
                    ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-slate-700 text-slate-500'
                }`}
              >
                {s.stato === 'completato' ? '✓' : s.icona}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    s.stato === 'futuro' ? 'text-slate-500' : 'text-white'
                  }`}
                >
                  {s.label}
                </div>
                {s.data && (
                  <div className="text-xs text-slate-500">{s.data}</div>
                )}
              </div>
              {s.link && (
                <span className="text-xs text-slate-400">→</span>
              )}
            </div>
          )

          return (
            <li key={i} className="relative">
              {s.link ? (
                <Link
                  href={s.link}
                  className="block p-2 -mx-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  {contenuto}
                </Link>
              ) : (
                <div className="p-2 -mx-2">{contenuto}</div>
              )}
              {i < step.length - 1 && (
                <div className="ml-6 h-3 border-l-2 border-dashed border-slate-700" />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}