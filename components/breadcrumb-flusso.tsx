import Link from 'next/link'

export type StepBreadcrumb = {
  label: string
  icona: string
  link?: string
  attivo?: boolean
  futuro?: boolean
}

export default function BreadcrumbFlusso({ step }: { step: StepBreadcrumb[] }) {
  if (step.length === 0) return null

  return (
    <nav className="flex items-center gap-2 flex-wrap text-sm mb-4">
      {step.map((s, i) => {
        const isLast = i === step.length - 1

        // Testo + icona
        const contenuto = (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              s.attivo
                ? 'bg-blue-500/20 text-blue-300 font-medium'
                : s.futuro
                ? 'text-slate-500'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>{s.icona}</span>
            <span>{s.label}</span>
          </span>
        )

        return (
          <div key={i} className="flex items-center gap-2">
            {s.link && !s.attivo && !s.futuro ? (
              <Link href={s.link}>{contenuto}</Link>
            ) : (
              contenuto
            )}
            {!isLast && (
              <span className="text-slate-600 select-none">›</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}