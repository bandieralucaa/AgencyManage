import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaRichiestaButton from './elimina-button'

const STATI: Record<string, { label: string; colore: string }> = {
  nuova: { label: 'Nuova', colore: 'bg-blue-500/20 text-blue-400' },
  in_corso: { label: 'In corso', colore: 'bg-amber-500/20 text-amber-400' },
  sospesa: { label: 'Sospesa', colore: 'bg-slate-500/20 text-slate-400' },
  chiusa_trovato: { label: 'Chiusa · Trovato', colore: 'bg-emerald-500/20 text-emerald-400' },
  chiusa_comprato_altri: { label: 'Chiusa · Comprato altri', colore: 'bg-purple-500/20 text-purple-400' },
  chiusa_non_cerca_piu: { label: 'Chiusa · Non cerca più', colore: 'bg-slate-700 text-slate-400' },
}

const STATI_IMMOBILE: Record<string, string> = {
  nuovo: 'Nuovo',
  ristrutturato: 'Ristrutturato',
  buono: 'Buono',
  da_ristrutturare: 'Da ristrutturare',
  rudere: 'Rudere',
}

export default async function RichiestaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: richiesta } = await supabase
    .from('richieste')
    .select(`
      *,
      clienti (id, nome, cognome, telefono, email)
    `)
    .eq('id', id)
    .single()

  if (!richiesta) notFound()

  const cli = Array.isArray(richiesta.clienti) ? richiesta.clienti[0] : richiesta.clienti
  const stato = STATI[richiesta.stato] || { label: richiesta.stato, colore: 'bg-slate-700 text-slate-300' }

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/richieste" className="text-sm text-slate-400 hover:text-white">
          ← Torna alle richieste
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {cli ? `${cli.cognome} ${cli.nome}` : 'Richiesta'}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span className="capitalize">{richiesta.tipo}</span>
              <span>·</span>
              <span className={`text-xs px-2 py-0.5 rounded ${stato.colore}`}>
                {stato.label}
              </span>
              {richiesta.data_chiusura && (
                <>
                  <span>·</span>
                  <span>
                    Chiusa il {new Date(richiesta.data_chiusura).toLocaleDateString('it-IT')}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/richieste/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <EliminaRichiestaButton id={id} nome={cli ? `${cli.cognome} ${cli.nome}` : 'questa richiesta'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cli && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Cliente</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-slate-400">Nome</dt>
                <dd className="text-white mt-0.5">
                  <Link href={`/clienti/${cli.id}`} className="text-blue-400 hover:underline">
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
              {cli.email && (
                <div>
                  <dt className="text-slate-400">Email</dt>
                  <dd className="text-white mt-0.5">{cli.email}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Cosa cerca</h2>
          <dl className="space-y-3 text-sm">
            {richiesta.zona_cercata && (
              <div>
                <dt className="text-slate-400">Zona</dt>
                <dd className="text-white mt-0.5">{richiesta.zona_cercata}</dd>
              </div>
            )}
            {richiesta.comuni_cercati && richiesta.comuni_cercati.length > 0 && (
              <div>
                <dt className="text-slate-400">Comuni</dt>
                <dd className="text-white mt-0.5">{richiesta.comuni_cercati.join(', ')}</dd>
              </div>
            )}
            {richiesta.tipologia && richiesta.tipologia.length > 0 && (
              <div>
                <dt className="text-slate-400">Tipologia</dt>
                <dd className="text-white mt-0.5 capitalize">{richiesta.tipologia.join(', ')}</dd>
              </div>
            )}
            {(richiesta.grandezza_min || richiesta.grandezza_max) && (
              <div>
                <dt className="text-slate-400">Superficie</dt>
                <dd className="text-white mt-0.5">
                  {richiesta.grandezza_min && `${richiesta.grandezza_min} mq`}
                  {richiesta.grandezza_min && richiesta.grandezza_max && ' - '}
                  {richiesta.grandezza_max && `${richiesta.grandezza_max} mq`}
                </dd>
              </div>
            )}
            {(richiesta.prezzo_min || richiesta.prezzo_max) && (
              <div>
                <dt className="text-slate-400">Budget</dt>
                <dd className="text-white mt-0.5">
                  {richiesta.prezzo_min && `€ ${Number(richiesta.prezzo_min).toLocaleString('it-IT')}`}
                  {richiesta.prezzo_min && richiesta.prezzo_max && ' - '}
                  {richiesta.prezzo_max && `€ ${Number(richiesta.prezzo_max).toLocaleString('it-IT')}`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Caratteristiche desiderate</h2>
          <dl className="space-y-3 text-sm">
            {richiesta.stato_immobile && (
              <div>
                <dt className="text-slate-400">Stato immobile</dt>
                <dd className="text-white mt-0.5">
                  {STATI_IMMOBILE[richiesta.stato_immobile] || richiesta.stato_immobile}
                </dd>
              </div>
            )}
            {richiesta.camere_min && (
              <div>
                <dt className="text-slate-400">Camere minime</dt>
                <dd className="text-white mt-0.5">{richiesta.camere_min}</dd>
              </div>
            )}
            {richiesta.bagni_min && (
              <div>
                <dt className="text-slate-400">Bagni minimi</dt>
                <dd className="text-white mt-0.5">{richiesta.bagni_min}</dd>
              </div>
            )}
            {richiesta.piano_preferito && (
              <div>
                <dt className="text-slate-400">Piano preferito</dt>
                <dd className="text-white mt-0.5">{richiesta.piano_preferito}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-400">Spazio esterno</dt>
              <dd className="text-white mt-0.5">
                {richiesta.spazio_esterno ? '✅ Sì' : '❌ No'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Box / Garage</dt>
              <dd className="text-white mt-0.5">
                {richiesta.box_garage ? '✅ Sì' : '❌ No'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Mutuo</h2>
          <div className="text-sm">
            <div className="text-white mb-2">
              {richiesta.mutuo ? '✅ Sì, il cliente ha bisogno di mutuo' : '❌ No'}
            </div>
            {richiesta.mutuo_note && (
              <div className="text-slate-300 text-xs mt-2">{richiesta.mutuo_note}</div>
            )}
          </div>
        </div>

        {richiesta.motivo_chiusura && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Motivo chiusura</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {richiesta.motivo_chiusura}
            </p>
          </div>
        )}

        {richiesta.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Note</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{richiesta.note}</p>
          </div>
        )}
      </div>
    </div>
  )
}