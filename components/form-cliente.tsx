'use client'

import { useState } from 'react'

export default function FormCliente({
  cliente,
  action,
}: {
  cliente?: any
  action: (formData: FormData) => void | Promise<void>
}) {
  const [form, setForm] = useState({
    tipologia: cliente?.tipologia ?? 'persona_fisica',
    tipo: cliente?.tipo ?? 'acquirente',
    nome: cliente?.nome ?? '',
    cognome: cliente?.cognome ?? '',
    data_nascita: cliente?.data_nascita ?? '',
    codice_fiscale: cliente?.codice_fiscale ?? '',
    partita_iva: cliente?.partita_iva ?? '',
    indirizzo: cliente?.indirizzo ?? '',
    civico: cliente?.civico ?? '',
    comune: cliente?.comune ?? '',
    cap: cliente?.cap ?? '',
    provincia: cliente?.provincia ?? '',
    telefono: cliente?.telefono ?? '',
    email: cliente?.email ?? '',
    pec: cliente?.pec ?? '',
    note: cliente?.note ?? '',
  })

  function upd<K extends keyof typeof form>(field: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const isPersonaFisica = form.tipologia === 'persona_fisica'

  return (
    <form action={action} className="space-y-8">
      {/* CLASSIFICAZIONE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Classificazione</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipologia *
            </label>
            <select
              name="tipologia"
              required
              value={form.tipologia}
              onChange={(e) => upd('tipologia', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="persona_fisica">Persona fisica</option>
              <option value="persona_giuridica">Persona giuridica</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo *
            </label>
            <select
              name="tipo"
              required
              value={form.tipo}
              onChange={(e) => upd('tipo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="venditore">Venditore</option>
              <option value="acquirente">Acquirente</option>
              <option value="inquilino">Inquilino</option>
              <option value="locatore">Locatore</option>
              <option value="entrambi">Entrambi</option>
            </select>
          </div>
        </div>
      </section>

      {/* DATI ANAGRAFICI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Dati anagrafici</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {isPersonaFisica ? 'Nome *' : 'Ragione sociale *'}
            </label>
            <input
              type="text"
              name="nome"
              required
              value={form.nome}
              onChange={(e) => upd('nome', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cognome
            </label>
            <input
              type="text"
              name="cognome"
              value={form.cognome}
              onChange={(e) => upd('cognome', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isPersonaFisica && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data di nascita
              </label>
              <input
                type="date"
                name="data_nascita"
                value={form.data_nascita}
                onChange={(e) => upd('data_nascita', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Utile per la sezione compleanni in dashboard
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Codice fiscale
            </label>
            <input
              type="text"
              name="codice_fiscale"
              value={form.codice_fiscale}
              onChange={(e) => upd('codice_fiscale', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Partita IVA
            </label>
            <input
              type="text"
              name="partita_iva"
              value={form.partita_iva}
              onChange={(e) => upd('partita_iva', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* INDIRIZZO */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Indirizzo</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Indirizzo
            </label>
            <input
              type="text"
              name="indirizzo"
              value={form.indirizzo}
              onChange={(e) => upd('indirizzo', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Civico
            </label>
            <input
              type="text"
              name="civico"
              value={form.civico}
              onChange={(e) => upd('civico', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comune
            </label>
            <input
              type="text"
              name="comune"
              value={form.comune}
              onChange={(e) => upd('comune', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              CAP
            </label>
            <input
              type="text"
              name="cap"
              maxLength={5}
              value={form.cap}
              onChange={(e) => upd('cap', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Prov.
            </label>
            <input
              type="text"
              name="provincia"
              maxLength={2}
              value={form.provincia}
              onChange={(e) => upd('provincia', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
        </div>
      </section>

      {/* CONTATTI */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Contatti</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Telefono
            </label>
            <input
              type="tel"
              name="telefono"
              value={form.telefono}
              onChange={(e) => upd('telefono', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={(e) => upd('email', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              PEC
            </label>
            <input
              type="email"
              name="pec"
              value={form.pec}
              onChange={(e) => upd('pec', e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </section>

      {/* NOTE */}
      <section className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Note</h2>
        <textarea
          name="note"
          rows={4}
          value={form.note}
          onChange={(e) => upd('note', e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note aggiuntive..."
        />
      </section>

      <div className="flex gap-3 justify-end">
        <a
          href={cliente?.id ? `/clienti/${cliente.id}` : '/clienti'}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </a>
        <button
          type="submit"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          {cliente?.id ? 'Salva modifiche' : 'Crea cliente'}
        </button>
      </div>
    </form>
  )
}