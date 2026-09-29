import { createClient } from '@/lib/supabase/server'

export type EventoCalendario = {
  id: string
  titolo: string
  inizio: string
  fine: string
  tuttoIlGiorno: boolean
  luogo?: string
  descrizione?: string
  calendario?: string
  calendarioId?: string
}

export type StatoCalendario = {
  connesso: boolean
  eventi: EventoCalendario[]
}

async function getAccessToken(agenteId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: integrazione } = await supabase
    .from('integrazioni_calendario')
    .select('access_token, refresh_token, expires_at')
    .eq('agente_id', agenteId)
    .eq('provider', 'google')
    .single()

  if (!integrazione) return null

  let accessToken = integrazione.access_token
  const scadenza = integrazione.expires_at ? new Date(integrazione.expires_at) : null
  const sta_perScadere = scadenza && scadenza.getTime() - Date.now() < 60000

  if (sta_perScadere) {
    if (!integrazione.refresh_token) return null

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

    if (!refreshRes.ok) return null

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

  return accessToken
}

export async function getStatoCalendario(agenteId: string): Promise<StatoCalendario> {
  const supabase = await createClient()

  const { data: integrazione } = await supabase
    .from('integrazioni_calendario')
    .select('agente_id')
    .eq('agente_id', agenteId)
    .eq('provider', 'google')
    .single()

  if (!integrazione) {
    return { connesso: false, eventi: [] }
  }

  const accessToken = await getAccessToken(agenteId)
  if (!accessToken) {
    return { connesso: true, eventi: [] }
  }

  const calendarsRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!calendarsRes.ok) {
    return { connesso: true, eventi: [] }
  }

  const calendarsData = await calendarsRes.json()
  const calendari = calendarsData.items || []

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
      calendarioId: cal.id,
    }))

    tuttiEventi.push(...eventi)
  }

  tuttiEventi.sort((a, b) => new Date(a.inizio).getTime() - new Date(b.inizio).getTime())

  return { connesso: true, eventi: tuttiEventi }
}

export async function getEventiMese(
  agenteId: string,
  anno: number,
  mese: number
): Promise<EventoCalendario[]> {
  const accessToken = await getAccessToken(agenteId)
  if (!accessToken) return []

  const calendarsRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!calendarsRes.ok) return []

  const calendarsData = await calendarsRes.json()
  const calendari = calendarsData.items || []

  const inizio = new Date(anno, mese, 1).toISOString()
  const fine = new Date(anno, mese + 1, 1).toISOString()

  const tuttiEventi: EventoCalendario[] = []

  for (const cal of calendari) {
    const params = new URLSearchParams({
      timeMin: inizio,
      timeMax: fine,
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
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
      descrizione: e.description,
      calendario: cal.summary,
      calendarioId: cal.id,
    }))

    tuttiEventi.push(...eventi)
  }

  return tuttiEventi
}

export async function creaEvento(
  agenteId: string,
  evento: {
    titolo: string
    inizio: string
    fine: string
    tuttoIlGiorno: boolean
    luogo?: string
    descrizione?: string
  }
): Promise<{ ok: boolean; errore?: string; evento?: EventoCalendario }> {
  const accessToken = await getAccessToken(agenteId)
  if (!accessToken) return { ok: false, errore: 'Non connesso a Google Calendar' }

  const body: any = {
    summary: evento.titolo,
    location: evento.luogo || undefined,
    description: evento.descrizione || undefined,
  }

  if (evento.tuttoIlGiorno) {
    body.start = { date: evento.inizio.split('T')[0] }
    body.end = { date: evento.fine.split('T')[0] }
  } else {
    body.start = { dateTime: evento.inizio, timeZone: 'Europe/Rome' }
    body.end = { dateTime: evento.fine, timeZone: 'Europe/Rome' }
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return { ok: false, errore: err }
  }

  const data = await res.json()

  return {
    ok: true,
    evento: {
      id: data.id,
      titolo: data.summary || '(senza titolo)',
      inizio: data.start.dateTime || data.start.date,
      fine: data.end.dateTime || data.end.date,
      tuttoIlGiorno: !data.start.dateTime,
      luogo: data.location,
      descrizione: data.description,
      calendarioId: 'primary',
    },
  }
}

export async function aggiornaEvento(
  agenteId: string,
  calendarId: string,
  eventId: string,
  evento: {
    titolo: string
    inizio: string
    fine: string
    tuttoIlGiorno: boolean
    luogo?: string
    descrizione?: string
  }
): Promise<{ ok: boolean; errore?: string }> {
  const accessToken = await getAccessToken(agenteId)
  if (!accessToken) return { ok: false, errore: 'Non connesso a Google Calendar' }

  const body: any = {
    summary: evento.titolo,
    location: evento.luogo || undefined,
    description: evento.descrizione || undefined,
  }

  if (evento.tuttoIlGiorno) {
    body.start = { date: evento.inizio.split('T')[0] }
    body.end = { date: evento.fine.split('T')[0] }
  } else {
    body.start = { dateTime: evento.inizio, timeZone: 'Europe/Rome' }
    body.end = { dateTime: evento.fine, timeZone: 'Europe/Rome' }
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const err = await res.text()
    return { ok: false, errore: err }
  }

  return { ok: true }
}

export async function eliminaEvento(
  agenteId: string,
  calendarId: string,
  eventId: string
): Promise<{ ok: boolean; errore?: string }> {
  const accessToken = await getAccessToken(agenteId)
  if (!accessToken) return { ok: false, errore: 'Non connesso a Google Calendar' }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!res.ok && res.status !== 410) {
    const err = await res.text()
    return { ok: false, errore: err }
  }

  return { ok: true }
}