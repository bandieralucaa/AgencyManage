import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaNotiziaButton from './elimina-button'
import SezioneAttivita from '@/components/sezione-attivita'

const STATI: Record<string, { label: string; colore: string }> = {
  aperta: { label: 'Aperta', colore: 'bg-blue-500/20 text-blue-400' },
  in_lavorazione: { label: 'In lavorazione', colore: 'bg-amber-500/20 text-amber-400' },
  chiusa_positiva: { label: 'Chiusa positiva', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_negativa: { label: 'Chiusa negativa', colore: 'bg-slate-700 text-slate-400' },
}

const TIPI: Record<string, string> = {
  agenzia: 'In agenzia',
  passaparola: 'Passaparola',
  incontro: 'Incontro in giro',
  telefono: 'Telefono',
  email: 'Email',
  social: 'Social',
  altro: 'Altro',
}

export default async function NotiziaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: notizia } = await supabase
    .from('notizie')
    .select(`
      *,
      agenti (nome, cognome),
      clienti (id, nome, cognome, telefono)
    `)
    .eq('id', id)
    .single()

  if (!notizia) notFound()

  const { data: attivita } = await supabase
    .from('attivita')
    .select('*, agenti (nome, cognome)')
    .eq('notizia_id', id)
    .order('data_attivita', { ascending: false })

  const ag = Array.isArray(notizia.agenti) ? notizia.agenti[0] : notizia.agenti
  const cli = Array.isArray(notizia.clienti) ? notizia.clienti[0] : notizia.clienti
  const stato = STATI[notizia.stato] || {
    label: notizia.stato,
    colore: 'bg-slate-700 text-slate-300',
  }
  const isClienteCerca = notizia.tipo_notizia === 'cliente_cerca'

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/notizie" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle notizie
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {notizia.indirizzo
                ? `${notizia.indirizzo} ${notizia.civico || ''}`
                : isClienteCerca
                ? 'Cliente cerca casa'
                : 'Immobile da vendere'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  isClienteCerca
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {isClienteCerca ? '🔍 Cliente cerca casa' : '🏠 Immobile da vendere'}
              </span>
              <span>·</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                {TIPI[notizia.tipo] || notizia.tipo || '—'}
              </span>
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
              {ag && (
                <>
                  <span>·</span>
                  <span>
                    Registrata da {ag.nome} {ag.cognome} il{' '}
                    {new Date(notizia.created_at).toLocaleDateString('it-IT')}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/notizie/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaNotiziaButton
              id={id}
              nome={
                notizia.indirizzo
                  ? `${notizia.indirizzo} ${notizia.civico || ''}`
                  : 'questa notizia'
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {notizia.indirizzo && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Indirizzo</h2>
            <p className="text-white text-sm">
              {notizia.indirizzo} {notizia.civico}
              <br />
              {notizia.frazione && `${notizia.frazione}, `}
              {notizia.comune}
            </p>
          </div>
        )}

        {cli && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente collegato</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Nome</dt>
                <dd className="text-white mt-0.5">
                  <Link
                    href={`/clienti/${cli.id}`}
                    className="text-blue-400 hover:underline"
                  >
                    {cli.cognome} {cli.nome}
                  </Link>
                </dd>
              </div>
              {cli.telefono && (
                <div>
                  <dt className="text-slate-400">Telefono</dt>
                  <dd className="text-white mt-0.5">{cli.telefono}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {notizia.motivo_chiusura && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Motivo chiusura</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {notizia.motivo_chiusura}
            </p>
          </div>
        )}
      </div>

      {/* ATTIVITÀ */}
      <SezioneAttivita
        entita="notizia"
        entitaId={id}
        attivita={attivita || []}
      />
    </div>
  )
}