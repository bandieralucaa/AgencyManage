'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const DOMINIO_FINTO = 'casamanager.local'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrore('')
    setLoading(true)

    const emailFinta = `${username.toLowerCase().trim()}@${DOMINIO_FINTO}`

    const { error } = await supabase.auth.signInWithPassword({
      email: emailFinta,
      password,
    })

    if (error) {
      setErrore('Username o password non corretti')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">CasaManager</h1>
            <p className="text-slate-400 mt-2 text-sm">Gestionale agenzia immobiliare</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                autoFocus
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="il tuo username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {errore && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-4 py-3">
                {errore}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © CasaManager — Accesso riservato
        </p>
      </div>
    </div>
  )
}