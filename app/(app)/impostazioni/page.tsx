import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormImpostazioni from '@/components/form-impostazioni'

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

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Impostazioni</h1>
        <p className="text-slate-400 mt-1">
          Gestisci il tuo profilo e la tua password.
        </p>
      </div>

      <FormImpostazioni agente={agente} />
    </div>
  )
}