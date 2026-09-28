import { createClient } from '@/lib/supabase/server'

export type EventoCalendario = {
  id: string
  titolo: string
  inizio: string
  fine: string
  tuttoIlGiorno: boolean
  luogo?: string
  calendario?: string
}

export type StatoCalendario = {
  connesso: boolean
  eventi: EventoCalendario[]
}

export async function getStatoCalendario(agenteId: string): Promise<StatoCalendario> {
  const supabase = await createClient()

  const { data: integrazione } = await supabase
    .from('integrazioni_calendario')
    .select('access_token, refresh_token, expires_at')
    .eq('agente_id', agenteId)
    .eq('provider', 'google')
    .single()

  if (!integrazione) {
    return { connesso: false, eventi: [] }
  }

  let accessToken = integrazione.access_token

  if (integrazione.expires_at && new Date(integrazione.expires_at) < new Date()) {
    if (!integrazione.refresh_token) {
      return { connesso: true, eventi: [] }
    }

    const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: integrazione.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    if (!refreshRes.ok) {
      return { connesso: true, eventi: [] }
    }

    const newTokens = await refreshRes.json()
    accessToken = newTokens.access_token

    await supabase
      .from('integrazioni_calendario')
      .update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('agente_id', agenteId)
      .eq('provider', 'google')
  }

  // 1. Recupera la lista di TUTTI i calendari dell'utente
  const calendarsRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!calendarsRes.ok) {
    return { connesso: true, eventi: [] }
  }

  const calendarsData = await calendarsRes.json()
  const calendari = calendarsData.items || []

  // 2. Per ogni calendario, leggi gli eventi di oggi
  const oggi = new Date()
  const inizio = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate()).toISOString()
  const fine = new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + 1).toISOString()

  const tuttiEventi: EventoCalendario[] = []

  for (const cal of calendari) {
    const params = new URLSearchParams({
      timeMin: inizio,
      timeMax: fine,
      singleEvents: 'true',
      orderBy: 'startTime',
    })

    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (!eventsRes.ok) continue

    const data = await eventsRes.json()
    const eventi = (data.items || []).map((e: any) => ({
      id: e.id,
      titolo: e.summary || '(senza titolo)',
      inizio: e.start.dateTime || e.start.date,
      fine: e.end.dateTime || e.end.date,
      tuttoIlGiorno: !e.start.dateTime,
      luogo: e.location,
      calendario: cal.summary,
    }))

    tuttiEventi.push(...eventi)
  }

  // 3. Ordina per orario di inizio
  tuttiEventi.sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime())

  return { connesso: true, eventi: tuttiEventi }
}