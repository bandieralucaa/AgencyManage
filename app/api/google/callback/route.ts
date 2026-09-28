import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const origin = new URL(request.url).origin

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/dashboard?errore=oauth`)
  }

  const redirectUri = `${origin}/api/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/dashboard?errore=token`)
  }

  const tokens = await tokenRes.json()

  const supabase = await createClient()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  const { error } = await supabase.from('integrazioni_calendario').upsert(
    {
      agente_id: state,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: expiresAt,
      scope: tokens.scope,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'agente_id,provider' }
  )

  if (error) {
    return NextResponse.redirect(`${origin}/dashboard?errore=db`)
  }

  return NextResponse.redirect(`${origin}/dashboard?ok=calendario`)
}