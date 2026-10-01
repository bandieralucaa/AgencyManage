export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy di AgencyManage</h1>
        <p className="text-slate-400 mb-4">
          La presente informativa sulla privacy descrive come AgencyManage (di seguito "l'Applicazione")
          raccoglie, utilizza e protegge i dati personali degli utenti.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">1. Dati Raccolti</h2>
        <p className="text-slate-300">
          L'Applicazione può raccogliere i seguenti dati: nome, cognome, indirizzo email, numero di telefono,
          e dati relativi agli immobili e ai clienti inseriti dagli agenti.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">2. Utilizzo dei Dati</h2>
        <p className="text-slate-300">
          I dati raccolti vengono utilizzati esclusivamente per il funzionamento del gestionale
          e per le finalità connesse all'attività dell'agenzia immobiliare.
        </p>
        <h2 className="text-xl font-semibold mt-6 mb-2">3. Condivisione dei Dati</h2>
        <p className="text-slate-300">
          I dati non vengono condivisi con terze parti al di fuori di quanto necessario per il funzionamento
          dell'Applicazione (es. Supabase per il database, Vercel per l'hosting).
        </p>
      </div>
    </div>
  )
}