import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ConnettiGoogleCalendar from '@/components/connetti-google-calendar'
import AgendaWrapper from '@/components/agenda-wrapper'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: integrazione } = await supabase
    .from('integrazioni_calendario')
    .select('agente_id')
    .eq('agente_id', user.id)
    .eq('provider', 'google')
    .single()

  const connesso = !!integrazione

  return (
    <div className="p-6 lg:p-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-slate-400 mt-1">
            Il tuo calendario Google, direttamente nel gestionale.
          </p>
        </div>
        {!connesso && <ConnettiGoogleCalendar />}
      </div>

      {connesso ? (
        <AgendaWrapper />
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold mb-2">Google Calendar non collegato</h2>
          <p className="text-slate-400 mb-6">
            Collega il tuo account Google per vedere e gestire i tuoi impegni da qui.
          </p>
          <ConnettiGoogleCalendar />
        </div>
      )}
    </div>
  )
}