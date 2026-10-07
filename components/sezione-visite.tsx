'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
creaVisita,
aggiornaVisita,
eliminaVisita,
} from '@/app/(app)/visite/actions'

type Opzione = {
id: string
label: string
}

type Visita = {
id: string
immobile_id: string | null
data_visita: string
ora_visita: string | null
esito: string | null
motivo_rifiuto: string | null
note: string | null
immobili?:
  | { indirizzo: string; civico: string | null }
  | { indirizzo: string; civico: string | null }[]
  | null
}

const ESITI: Record<string, { label: string; colore: string }> = {
piace: {
  label: '👍 Piace',
  colore: 'bg-emerald-500/20 text-emerald-400',
},
non_piace: {
  label: '👎 Non piace',
  colore: 'bg-red-500/20 text-red-400',
},
}

export default function SezioneVisite({
richiestaId,
clienteId,
visite,
}: {
richiestaId: string
clienteId: string | null
visite: Visita[]
}) {
const supabase = createClient()
const router = useRouter()
const searchParams = useSearchParams()

const [immobili, setImmobili] = useState<Opzione[]>([])
const [clienti, setClienti] = useState<Opzione[]>([])
const [modaleAperta, setModaleAperta] = useState(false)
const [modificaId, setModificaId] = useState<string | null>(null)
const [salvando, setSalvando] = useState(false)
const [errore, setErrore] = useState('')

const oggi = new Date().toISOString().split('T')[0]

const [form, setForm] = useState({
immobile_id: '',
cliente_id: clienteId || '',
data_visita: oggi,
ora_visita: '',
esito: 'piace',
motivo_rifiuto: '',
note: '',
})

useEffect(() => {
  async function carica() {
    const { data: clientiData } = await supabase
      .from('clienti')
      .select('id, nome, cognome, tipo')
      .eq('attivo', true)
      .in('tipo', ['acquirente', 'entrambi'])
      .order('cognome', { ascending: true })

      if (clientiData) {
        setClienti(
          clientiData.map((x) => ({
            id: x.id,
            label: `${x.cognome} ${x.nome}`,
          }))
        )
      }

    const { data: incarichi } = await supabase
      .from('incarichi')
      .select('immobile_id')
      .in('stato', ['attivo', 'in_trattativa'])
      .not('immobile_id', 'is', null)

    const ids = (incarichi || [])
      .map((i) => i.immobile_id)
      .filter(Boolean) as string[]

    if (ids.length === 0) {
      setImmobili([])
      return
    }

    const { data } = await supabase
      .from('immobili')
      .select('id, indirizzo, civico, comune')
      .in('id', ids)
      .eq('attivo', true)
      .order('indirizzo', { ascending: true })

    if (data) {
      setImmobili(
        data.map((x) => ({
          id: x.id,
          label: `${x.indirizzo} ${x.civico || ''}, ${x.comune}`,
        }))
      )
    }
  }

  carica()
}, [supabase])

// Precompilazione da ?fissa_visita=ID_IMMOBILE
useEffect(() => {
  const immobileDaFissare = searchParams.get('fissa_visita')

  if (immobileDaFissare && immobili.length > 0) {
    setForm({
immobile_id: immobileDaFissare,
cliente_id: clienteId || '',
data_visita: oggi,
ora_visita: '',
esito: 'piace',
motivo_rifiuto: '',
note: '',
})
    setModificaId(null)
    setModaleAperta(true)

    const url = new URL(window.location.href)
    url.searchParams.delete('fissa_visita')
    window.history.replaceState({}, '', url.pathname + url.search)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [immobili, searchParams])

function resetForm() {
setForm({
immobile_id: '',
cliente_id: clienteId || '',
data_visita: oggi,
ora_visita: '',
esito: 'piace',
motivo_rifiuto: '',
note: '',
})

  setModificaId(null)
  setErrore('')
}

function apriNuova() {
  resetForm()
  setModaleAperta(true)
}

function apriModifica(v: Visita) {
setForm({
immobile_id: v.immobile_id || '',
cliente_id: clienteId || '',
data_visita: v.data_visita,
ora_visita: v.ora_visita ? v.ora_visita.slice(0, 5) : '',
esito: v.esito || 'piace',
motivo_rifiuto: v.motivo_rifiuto || '',
note: v.note || '',
})

  setModificaId(v.id)
  setErrore('')
  setModaleAperta(true)
}

function chiudi() {
  setModaleAperta(false)
  resetForm()
}

async function salva() {
  if (!form.data_visita) {
    setErrore('Inserisci la data della visita')
    return
  }

  if (!form.esito) {
    setErrore('Seleziona l’esito della visita')
    return
  }

  setSalvando(true)
  setErrore('')

  const result = modificaId
    ? await aggiornaVisita(modificaId, richiestaId, {
        immobile_id: form.immobile_id || undefined,
        data_visita: form.data_visita,
        ora_visita: form.ora_visita || undefined,
motivo_rifiuto: form.motivo_rifiuto || undefined,
        esito: form.esito as 'piace' | 'non_piace',
        note: form.note,
      })
    : await creaVisita({
        richiesta_id: richiestaId,
        immobile_id: form.immobile_id || undefined,
        cliente_id: form.cliente_id || undefined,
        data_visita: form.data_visita,
        ora_visita: form.ora_visita || undefined,
        esito: form.esito as 'piace' | 'non_piace',
        motivo_rifiuto: form.motivo_rifiuto || undefined,
        note: form.note,
      })

  setSalvando(false)

  if (!result.ok) {
    setErrore(result.errore || 'Errore nel salvataggio')
    return
  }

  chiudi()
  router.refresh()
}

async function handleElimina(id: string) {
  if (!confirm('Eliminare questa visita?')) return

  const result = await eliminaVisita(id, richiestaId)

  if (result.ok) {
    router.refresh()
  } else {
    alert(result.errore)
  }
}

function formatData(data: string) {
  return new Date(data).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getImmobileLabel(v: Visita): string {
  const imm = Array.isArray(v.immobili)
    ? v.immobili[0]
    : v.immobili

  if (!imm) return '—'

  return `${imm.indirizzo} ${imm.civico || ''}`
}

return (
  <>
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          🚶 Visite effettuate
          <span className="text-sm text-slate-500 font-normal">
            ({visite.length})
          </span>
        </h2>

        <button
          onClick={apriNuova}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Registra visita
        </button>
      </div>

      {visite.length > 0 ? (
        <div className="space-y-2">
          {visite.map((v) => {
            const esito = ESITI[v.esito || ''] || {
              label: 'Esito non specificato',
              colore: 'bg-slate-700 text-slate-300',
            }

            return (
              <div
                key={v.id}
                className="border border-slate-700 rounded-lg p-4 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm text-white font-medium">
                        {formatData(v.data_visita)}
                        {v.ora_visita && ` · ore ${v.ora_visita.slice(0, 5)}`}
                      </span>

                      <span
                        className={`text-xs px-2 py-0.5 rounded ${esito.colore}`}
                      >
                        {esito.label}
                      </span>
                    </div>

                    {v.immobile_id && (
                      <div className="text-xs text-slate-400 mt-1">
                        🏠 {getImmobileLabel(v)}
                      </div>
                    )}

                    {v.note && (
                      <div className="text-xs text-slate-500 mt-1">
                        {v.note}
                      </div>
                    )}

                    {v.motivo_rifiuto && (
<div className="text-xs text-slate-400 mt-1">
  ❌ Motivo: {v.motivo_rifiuto}
</div>
)}

                    {v.esito === 'piace' && v.immobile_id && (
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`/proposte/nuovo?richiesta_id=${richiestaId}&immobile_id=${v.immobile_id}`}
                          className="text-xs bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-600/50 px-2.5 py-1 rounded transition-colors"
                        >
                          ✍️ Vuole fare una proposta
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <button
                      onClick={() => apriModifica(v)}
                      className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded transition-colors"
                      title="Modifica"
                    >
                      ✏️
                    </button>

                    <button
                      onClick={() => handleElimina(v.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-4">
          Nessuna visita effettuata.
        </p>
      )}
    </div>

    {/* MODALE */}
    {modaleAperta && (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={chiudi}
      >
        <div
          className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-semibold mb-4">
            {modificaId ? 'Modifica visita' : 'Nuova visita'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Immobile visitato
              </label>

              <select
                value={form.immobile_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    immobile_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Nessuno —</option>

                {immobili.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
  <label className="block text-sm font-medium text-slate-300 mb-1">
    Cliente
  </label>

  <select
    value={form.cliente_id}
    onChange={(e) =>
      setForm({
        ...form,
        cliente_id: e.target.value,
      })
    }
    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="">— Nessuno —</option>

    {clienti.map((c) => (
      <option key={c.id} value={c.id}>
        {c.label}
      </option>
    ))}
  </select>
</div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Data visita *
              </label>

              <input
                type="date"
                value={form.data_visita}
                onChange={(e) =>
                  setForm({
                    ...form,
                    data_visita: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
<label className="block text-sm font-medium text-slate-300 mb-1">
  Ora visita
</label>

<input
  type="time"
  value={form.ora_visita}
  onChange={(e) =>
    setForm({
      ...form,
      ora_visita: e.target.value,
    })
  }
  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
</div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Esito *
              </label>

              <select
                value={form.esito}
                onChange={(e) =>
                  setForm({
                    ...form,
                    esito: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="piace">👍 Piace</option>
                <option value="non_piace">👎 Non piace</option>
              </select>
              {form.esito === 'non_piace' && (
<div>
  <label className="block text-sm font-medium text-slate-300 mb-1">
    Motivo del rifiuto
  </label>

  <textarea
    rows={2}
    value={form.motivo_rifiuto}
    onChange={(e) =>
      setForm({
        ...form,
        motivo_rifiuto: e.target.value,
      })
    }
    placeholder="Perché il cliente non è interessato?"
    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
)}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Note
              </label>

              <textarea
                rows={3}
                value={form.note}
                onChange={(e) =>
                  setForm({
                    ...form,
                    note: e.target.value,
                  })
                }
                placeholder="Eventuali note sulla visita..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {errore && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm rounded-lg px-3 py-2">
                ⚠️ {errore}
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-6">
            <button
              onClick={chiudi}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annulla
            </button>

            <button
              onClick={salva}
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {salvando
                ? 'Salvataggio...'
                : modificaId
                  ? 'Salva modifiche'
                  : 'Aggiungi'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
)
}