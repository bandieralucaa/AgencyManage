import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/dashboard?errore=no_code`)
  }

  const supabase = await createClient()

  // Scambia il code con la sessione Supabase
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
  if (sessionError) {
    return NextResponse.redirect(`${origin}/dashboard?errore=session`)
  }

  // Recupera la sessione per ottenere il provider_token (access_token di Google)
  const { data: { session } } = await supabase.auth.getSession()

  if (session?.provider_token && session?.user) {
    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null

    // Salva o aggiorna i token nella tabella integrazioni_calendario
    await supabase.from('integrazioni_calendario').upsert(
      {
        agente_id: session.user.id,
        provider: 'google',
        access_token: session.provider_token,
        refresh_token: session.provider_refresh_token || null,
        expires_at: expiresAt,
        scope: 'https://www.googleapis.com/auth/calendar.readonly',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'agente_id,provider' }
    )
  }

  return NextResponse.redirect(`${origin}${next}`)
}