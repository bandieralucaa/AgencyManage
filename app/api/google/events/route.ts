import { createClient } from '@/lib/supabase/server'
import { getEventiMese, creaEvento } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'

// GET /api/google/events?anno=2026&mese=9
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ eventi: [], errore: 'Non autenticato' })
    }

    const { searchParams } = new URL(request.url)
    const anno = parseInt(searchParams.get('anno') || String(new Date().getFullYear()))
    const mese = parseInt(searchParams.get('mese') || String(new Date().getMonth()))

    const eventi = await getEventiMese(user.id, anno, mese)
    return NextResponse.json({ eventi })
  } catch (err: any) {
    console.error('Errore GET eventi:', err)
    return NextResponse.json({ eventi: [], errore: err?.message || 'Errore' })
  }
}

// POST /api/google/events
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ errore: 'Non autenticato' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.titolo || !body.inizio || !body.fine) {
      return NextResponse.json(
        { errore: 'Titolo, inizio e fine sono obbligatori' },
        { status: 400 }
      )
    }

    const calendarId = body.calendarId || 'primary'

    const result = await creaEvento(user.id, calendarId, {
      titolo: body.titolo,
      inizio: body.inizio,
      fine: body.fine,
      tuttoIlGiorno: !!body.tuttoIlGiorno,
      luogo: body.luogo,
      descrizione: body.descrizione,
    })

    if (!result.ok) {
      return NextResponse.json({ errore: result.errore }, { status: 500 })
    }

    return NextResponse.json({ ok: true, evento: result.evento })
  } catch (err: any) {
    console.error('Errore POST evento:', err)
    return NextResponse.json({ errore: err?.message || 'Errore' }, { status: 500 })
  }
}