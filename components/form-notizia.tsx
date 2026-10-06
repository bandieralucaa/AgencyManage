'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Opzione = {
  id: string
  label: string
}

export default function FormNotizia({
  notizia,
  action,
}: {
  notizia?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const supabase = createClient()

  const [clienti, setClienti] = useState<Opzione[]>([])
  const [immobili, setImmobili] = useState<Opzione[]>([])

  const [proprietari, setProprietari] = useState<string[]>(
    notizia?.proprietari?.map((p: any) => p.cliente_id) ?? []
  )

  const [cercaProprietario, setCercaProprietario] = useState('')
  const [mostraProprietari, setMostraProprietari] = useState(false)

  const [form, setForm] = useState({
    tipo_notizia: notizia?.tipo_notizia ?? 'immobile_vuoto',
    immobile_id: notizia?.immobile_id ?? '',
    cliente_id: notizia?.cliente_id ?? '',
    tipo: notizia?.tipo ?? 'agenzia',
    stato: notizia?.stato ?? 'aperta',
    motivo_chiusura: notizia?.motivo_chiusura ?? '',
  })

  function upd<K extends keyof typeof form>(
    field: K,
    value: typeof form[K]
  ) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function carica() {
      const [c, i] = await Promise.all([
        supabase
          .from('clienti')
          .select('id, nome, cognome')
          .eq('attivo', true)
          .order('cognome', { ascending: true }),

        supabase
          .from('immobili')
          .select('id, indirizzo, civico, comune')
          .eq('attivo', true)
          .order('indirizzo', { ascending: true }),
      ])

      if (c.data) {
        setClienti(
          c.data.map((x) => ({
            id: x.id,
            label: `${x.cognome} ${x.nome}`,
          }))
        )
      }

      if (i.data) {
        setImmobili(
          i.data.map((x) => ({
            id: x.id,
            label: `${x.indirizzo} ${x.civico || ''}, ${x.comune}`,
          }))
        )
      }
    }

    carica()
  }, [])

  const mostraMotivoChiusura = form.stato.startsWith('chiusa_')
  const isImmobileVuoto = form.tipo_notizia === 'immobile_vuoto'
  const isImmobileVendesi = form.tipo_notizia === 'immobile_vendesi'

  return (
    <form action={action} className="space-y-8">

      {/* TIPO NOTIZIA */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Tipo di notizia *
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => upd('tipo_notizia', 'immobile_vuoto')}
            className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
              isImmobileVuoto
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">🏚️</div>

            <div className="font-semibold text-white">
              Immobile vuoto
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Un immobile che potrebbe essere in vendita, da indagare
            </div>
          </button>

          <button
            type="button"
            onClick={() => upd('tipo_notizia', 'immobile_vendesi')}
            className={`text-left px-5 py-4 rounded-xl border-2 transition-colors ${
              isImmobileVendesi
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-1">🏠</div>

            <div className="font-semibold text-white">
              Immobile da vendere
            </div>

            <div className="text-xs text-slate-400 mt-1">
              Un immobile che è già in vendita
            </div>
          </button>
        </div>

        <input
          type="hidden"
          name="tipo_notizia"
          value={form.tipo_notizia}
        />
      </section>

      {/* IMMOBILE COLLEGATO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Immobile collegato *
        </h2>

        <div>
          <select
            name="immobile_id"
            required
            value={form.immobile_id}
            onChange={(e) => upd('immobile_id', e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Seleziona immobile —</option>

            {immobili.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>

          <p className="text-xs text-slate-500 mt-1">
            L&apos;immobile deve esistere in portafoglio prima di creare la notizia
          </p>
        </div>
      </section>

      {/* PROVENIENZA + PROPRIETARI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Provenienza
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* PROVENIENZA */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Come l&apos;hai saputo? *
            </label>

            <select
              name="tipo"
              required
              value={form.tipo}
              onChange={(e) => upd('tipo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="agenzia">In agenzia</option>
              <option value="passaparola">Passaparola</option>
              <option value="incontro">Incontro in giro</option>
              <option value="telefono">Telefono</option>
              <option value="email">Email</option>
              <option value="social">Social</option>
              <option value="altro">Altro</option>
            </select>
          </div>

          {/* PROPRIETARI - TEST TEMPORANEO */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Proprietari
            </label>

            <div className="text-slate-400">
              Test proprietari
            </div>
          </div>

        </div>
      </section>

      {/* STATO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Stato
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Stato *
            </label>

            <select
              name="stato"
              required
              value={form.stato}
              onChange={(e) => upd('stato', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="aperta">Aperta</option>
              <option value="in_lavorazione">In lavorazione</option>
              <option value="chiusa_positiva">Chiusa positiva</option>
              <option value="chiusa_negativa">Chiusa negativa</option>
            </select>
          </div>
        </div>

        {mostraMotivoChiusura && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Motivo chiusura
            </label>

            <textarea
              name="motivo_chiusura"
              rows={3}
              value={form.motivo_chiusura}
              onChange={(e) =>
                upd('motivo_chiusura', e.target.value)
              }
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white"
              placeholder="Dettagli sulla chiusura della notizia..."
            />
          </div>
        )}
      </section>

      {/* BOTTONI */}
      <div className="flex gap-3 justify-end">
        <a
          href={notizia?.id ? `/notizie/${notizia.id}` : '/notizie'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>

        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {notizia?.id ? 'Salva modifiche' : 'Crea notizia'}
        </button>
      </div>

    </form>
  )
}