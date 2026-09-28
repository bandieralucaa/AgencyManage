'use client'

type ClienteData = {
  id?: string
  tipologia?: string
  tipo?: string
  nome?: string
  cognome?: string
  partita_iva?: string | null
  codice_fiscale?: string | null
  indirizzo?: string | null
  civico?: string | null
  comune?: string | null
  cap?: string | null
  provincia?: string | null
  telefono?: string | null
  email?: string | null
  pec?: string | null
  note?: string | null
}

export default function FormCliente({
  cliente,
  action,
}: {
  cliente?: ClienteData
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form action={action} className="space-y-8">
      {/* TIPOLOGIA E TIPO */}
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
              defaultValue={cliente?.tipologia || 'persona_fisica'}
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
              defaultValue={cliente?.tipo || 'acquirente'}
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
              Nome / Ragione sociale *
            </label>
            <input
              type="text"
              name="nome"
              required
              defaultValue={cliente?.nome || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cognome
            </label>
            <input
              type="text"
              name="cognome"
              defaultValue={cliente?.cognome || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Codice fiscale
            </label>
            <input
              type="text"
              name="codice_fiscale"
              defaultValue={cliente?.codice_fiscale || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Partita IVA
            </label>
            <input
              type="text"
              name="partita_iva"
              defaultValue={cliente?.partita_iva || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              defaultValue={cliente?.indirizzo || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Civico
            </label>
            <input
              type="text"
              name="civico"
              defaultValue={cliente?.civico || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Comune
            </label>
            <input
              type="text"
              name="comune"
              defaultValue={cliente?.comune || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              defaultValue={cliente?.cap || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              defaultValue={cliente?.provincia || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
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
              defaultValue={cliente?.telefono || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={cliente?.email || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              PEC
            </label>
            <input
              type="email"
              name="pec"
              defaultValue={cliente?.pec || ''}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          defaultValue={cliente?.note || ''}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Note aggiuntive..."
        />
      </section>

      {/* BOTTONI */}
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