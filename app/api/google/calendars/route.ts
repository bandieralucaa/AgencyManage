import { createClient } from '@/lib/supabase/server'
import { getCalendari } from '@/lib/google-calendar'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ calendari: [] })

    const calendari = await getCalendari(user.id)
    return NextResponse.json({ calendari })
  } catch {
    return NextResponse.json({ calendari: [] })
  }
}