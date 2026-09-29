'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const VOCI = [
  { href: '/dashboard', label: 'Dashboard', icona: '📊' },
  { href: '/agenda', label: 'Agenda', icona: '📅' },
  { href: '/clienti', label: 'Clienti', icona: '👥' },
  { href: '/immobili', label: 'Immobili', icona: '🏠' },
  { href: '/richieste', label: 'Richieste', icona: '🔍' },
  { href: '/valutazioni', label: 'Valutazioni', icona: '📋' },
  { href: '/incarichi', label: 'Incarichi', icona: '📝' },
  { href: '/attivita', label: 'Attività', icona: '📞' },
]

export default function Sidebar({
  nome,
  cognome,
  ruolo,
}: {
  nome: string
  cognome: string
  ruolo: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [menuAperto, setMenuAperto] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Bottone mobile per aprire il menu */}
      <button
        onClick={() => setMenuAperto(!menuAperto)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-slate-800 border border-slate-700 p-2 rounded-lg"
        aria-label="Apri menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay mobile */}
      {menuAperto && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMenuAperto(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-40
          transition-transform duration-200
          ${menuAperto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo / Brand */}
        <div className="px-5 py-5 border-b border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMenuAperto(false)}>
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
              CM
            </div>
            <span className="font-bold text-lg">CasaManager</span>
          </Link>
        </div>

        {/* Navigazione */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {VOCI.map((voce) => {
              const attivo = pathname === voce.href || pathname.startsWith(voce.href + '/')
              return (
                <li key={voce.href}>
                  <Link
                    href={voce.href}
                    onClick={() => setMenuAperto(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${attivo
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'}
                    `}
                  >
                    <span className="text-base">{voce.icona}</span>
                    <span>{voce.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Utente + Logout */}
        <div className="border-t border-slate-700 p-4">
          <div className="mb-3">
            <div className="text-sm font-medium truncate">
              {nome} {cognome}
            </div>
            <div className="text-xs text-slate-500 capitalize">{ruolo}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-sm bg-slate-700 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
          >
            Esci
          </button>
        </div>
      </aside>
    </>
  )
}