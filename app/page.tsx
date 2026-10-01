import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">AgencyManage</h1>
        <p className="text-xl text-slate-300 mb-8">
          Gestionale interno per agenzie immobiliari.
        </p>
        <p className="text-slate-400 mb-8">
          Questa applicazione è uno strumento di lavoro per gli agenti immobiliare,
          che permette di gestire clienti, immobili, richieste e appuntamenti in modo semplice ed efficiente.
        </p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Accedi al gestionale
          </Link>
          <Link
            href="/privacy"
            className="text-slate-400 hover:text-white underline"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}