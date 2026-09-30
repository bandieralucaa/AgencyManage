import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormImpostazioni from '@/components/form-impostazioni'
import SezioneGoogleCalendar from '@/components/sezione-google-calendar'

export default async function ImpostazioniPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agente } = await supabase
    .from('agenti')
    .select('id, nome, cognome, username, ruolo')
    .eq('id', user.id)
    .single()

  if (!agente) redirect('/login')

  // Verifica se Google Calendar è connesso
  const { data: integrazione } = await supabase
    .from('integrazioni_calendario')
    .select('agente_id')
    .eq('agente_id', user.id)
    .eq('provider', 'google')
    .maybeSingle()

  const connesso = !!integrazione

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-slate-400 mt-1">
          Gestisci il tuo profilo, la password e le integrazioni.
        </p>
      </div>

      <div className="space-y-6">
        <FormImpostazioni agente={agente} />
        <SezioneGoogleCalendar connesso={connesso} />
      </div>
    </div>
  )
}