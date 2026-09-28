import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: agente } = await supabase
    .from('agenti')
    .select('nome, cognome, username, ruolo')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen flex bg-slate-900 text-white">
      <Sidebar
        nome={agente?.nome || ''}
        cognome={agente?.cognome || ''}
        ruolo={agente?.ruolo || 'agente'}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}