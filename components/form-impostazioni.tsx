'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { aggiornaProfilo, cambiaPassword } from '@/app/(app)/impostazioni/actions'

export default function FormImpostazioni({
  agente,
}: {
  agente: { id: string; nome: string; cognome: string; username: string; ruolo: string }
}) {
  const router = useRouter()

  // Profilo
  const [nome, setNome] = useState(agente.nome)
  const [cognome, setCognome] = useState(agente.cognome)
  const [salvandoProfilo, setSalvandoProfilo] = useState(false)
  const [msgProfilo, setMsgProfilo] = useState<{ tipo: 'ok' | 'errore'; testo: string } | null>(null)

  // Password
  const [vecchia, setVecchia] = useState('')
  const [nuova, setNuova] = useState('')
  const [conferma, setConferma] = useState('')
  const [salvandoPassword, setSalvandoPassword] = useState(false)
  const [msgPassword, setMsgPassword] = useState<{ tipo: 'ok' | 'errore'; testo: string } | null>(null)

  async function handleSalvaProfilo() {
    setSalvandoProfilo(true)
    setMsgProfilo(null)

    if (!nome.trim() || !cognome.trim()) {
      setMsgProfilo({ tipo: 'errore', testo: 'Nome e cognome sono obbligatori' })
      setSalvandoProfilo(false)
      return
    }

    const res = await aggiornaProfilo(nome.trim(), cognome.trim())

    if (res.ok) {
      setMsgProfilo({ tipo: 'ok', testo: 'Profilo aggiornato correttamente' })
      router.refresh()
    } else {
      setMsgProfilo({ tipo: 'errore', testo: res.errore || 'Errore' })
    }
    setSalvandoProfilo(false)
  }

  async function handleCambiaPassword() {
    setSalvandoPassword(true)
    setMsgPassword(null)

    if (!vecchia || !nuova || !conferma) {
      setMsgPassword({ tipo: 'errore', testo: 'Compila tutti i campi' })
      setSalvandoPassword(false)
      return
    }

    if (nuova !== conferma) {
      setMsgPassword({ tipo: 'errore', testo: 'Le nuove password non coincidono' })
      setSalvandoPassword(false)
      return
    }

    const res = await cambiaPassword(agente.username, vecchia, nuova)

    if (res.ok) {
      setMsgPassword({ tipo: 'ok', testo: 'Password cambiata correttamente' })
      setVecchia('')
      setNuova('')
      setConferma('')
    } else {
      setMsgPassword({ tipo: 'errore', testo: res.errore || 'Errore' })
    }
    setSalvandoPassword(false)
  }

  return (
    <div className="space-y-6">
      {/* PROFILO */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Il tuo profilo</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cognome *
            </label>
            <input
              type="text"
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={agente.username}
              disabled
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              L&apos;username non è modificabile
            </p>
          </div>
        </div>

        {msgProfilo && (
          <div
            className={`text-sm rounded-lg px-4 py-2 mb-4 ${
              msgProfilo.tipo === 'ok'
                ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}
          >
            {msgProfilo.tipo === 'ok' ? '✓ ' : '⚠️ '}
            {msgProfilo.testo}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleSalvaProfilo}
            disabled={salvandoProfilo}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {salvandoProfilo ? 'Salvataggio...' : 'Salva profilo'}
          </button>
        </div>
      </div>

      {/* PASSWORD */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Cambia password</h2>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password attuale *
            </label>
            <input
              type="password"
              value={vecchia}
              onChange={(e) => setVecchia(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nuova password * <span className="text-slate-500 text-xs">(min 6 caratteri)</span>
            </label>
            <input
              type="password"
              value={nuova}
              onChange={(e) => setNuova(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Conferma nuova password *
            </label>
            <input
              type="password"
              value={conferma}
              onChange={(e) => setConferma(e.target.value)}
              autoComplete="new-password"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {msgPassword && (
          <div
            className={`text-sm rounded-lg px-4 py-2 mt-4 max-w-md ${
              msgPassword.tipo === 'ok'
                ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/50 text-red-400'
            }`}
          >
            {msgPassword.tipo === 'ok' ? '✓ ' : '⚠️ '}
            {msgPassword.testo}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={handleCambiaPassword}
            disabled={salvandoPassword}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {salvandoPassword ? 'Cambio in corso...' : 'Cambia password'}
          </button>
        </div>
      </div>
    </div>
  )
}