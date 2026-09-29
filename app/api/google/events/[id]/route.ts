import { createClient } from '@/lib/supabase/server'
import { aggiornaEvento, eliminaEvento } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ errore: 'Non autenticato' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    if (!body.titolo || !body.inizio || !body.fine) {
      return NextResponse.json(
        { errore: 'Titolo, inizio e fine sono obbligatori' },
        { status: 400 }
      )
    }

    const calendarId = body.calendarId || 'primary'

    const result = await aggiornaEvento(user.id, calendarId, id, {
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

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ errore: err?.message || 'Errore' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ errore: 'Non autenticato' }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const calendarId = searchParams.get('calendarId') || 'primary'

    const result = await eliminaEvento(user.id, calendarId, id)

    if (!result.ok) {
      return NextResponse.json({ errore: result.errore }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ errore: err?.message || 'Errore' }, { status: 500 })
  }
}