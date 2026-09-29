import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EliminaImmobileButton from './elimina-button'
import ToggleAttivoImmobileButton from './toggle-attivo-button'

const TIPI: Record<string, string> = {
  appartamento: 'Appartamento',
  villa: 'Villa',
  villetta: 'Villetta',
  terreno: 'Terreno',
  ufficio: 'Ufficio',
  negozio: 'Negozio',
  garage: 'Garage',
  box: 'Box',
  magazzino: 'Magazzino',
  rustico: 'Rustico',
  altro: 'Altro',
}

const STATI: Record<string, string> = {
  nuovo: 'Nuovo',
  ristrutturato: 'Ristrutturato',
  buono: 'Buono',
  da_ristrutturare: 'Da ristrutturare',
  rudere: 'Rudere',
}

export default async function ImmobilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: immobile } = await supabase
    .from('immobili')
    .select('*')
    .eq('id', id)
    .single()

  if (!immobile) notFound()

  const prezzoMq =
    immobile.metri_quadrati && immobile.prezzo
      ? Math.round(immobile.prezzo / immobile.metri_quadrati)
      : null

  return (
    <div className="p-6 lg:p-10">
      <div className="mb-8">
        <Link href="/immobili" className="text-sm text-slate-400 hover:text-white">
          ← Torna agli immobili
        </Link>
        <div className="flex items-start justify-between gap-4 mt-2 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">
              {immobile.indirizzo} {immobile.civico}
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-slate-400 flex-wrap">
              <span>
                {immobile.frazione && `${immobile.frazione} · `}
                {immobile.comune} {immobile.cap && `(${immobile.cap})`}
              </span>
              <span>·</span>
              <span>{TIPI[immobile.tipo] || immobile.tipo}</span>
              <span>·</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  immobile.attivo
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {immobile.attivo ? 'Attivo' : 'Archiviato'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/immobili/${id}/modifica`}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Modifica
            </Link>
            <ToggleAttivoImmobileButton id={id} attivo={immobile.attivo} />
            <EliminaImmobileButton
              id={id}
              nome={`${immobile.indirizzo} ${immobile.civico}`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PREZZI */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Prezzi</h2>
          <dl className="space-y-3 text-sm">
            {immobile.prezzo && (
              <div>
                <dt className="text-slate-400">Prezzo vendita</dt>
                <dd className="text-white mt-0.5 text-lg font-semibold">
                  € {Number(immobile.prezzo).toLocaleString('it-IT')}
                </dd>
              </div>
            )}
            {prezzoMq && (
              <div>
                <dt className="text-slate-400">Prezzo al mq</dt>
                <dd className="text-white mt-0.5">
                  € {prezzoMq.toLocaleString('it-IT')}/mq
                </dd>
              </div>
            )}
            {immobile.spese_condominiali && (
              <div>
                <dt className="text-slate-400">Spese condominiali</dt>
                <dd className="text-white mt-0.5">
                  € {Number(immobile.spese_condominiali).toLocaleString('it-IT')}/mese
                </dd>
              </div>
            )}
            {!immobile.prezzo && !immobile.spese_condominiali && (
              <p className="text-slate-500">Nessun prezzo inserito.</p>
            )}
          </dl>
        </div>

        {/* CARATTERISTICHE */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Caratteristiche</h2>
          <dl className="space-y-3 text-sm">
            {immobile.metri_quadrati && (
              <div>
                <dt className="text-slate-400">Superficie</dt>
                <dd className="text-white mt-0.5">{immobile.metri_quadrati} mq</dd>
              </div>
            )}
            {immobile.vani && (
              <div>
                <dt className="text-slate-400">Vani</dt>
                <dd className="text-white mt-0.5">{immobile.vani}</dd>
              </div>
            )}
            {immobile.camere && (
              <div>
                <dt className="text-slate-400">Camere</dt>
                <dd className="text-white mt-0.5">{immobile.camere}</dd>
              </div>
            )}
            {immobile.bagni && (
              <div>
                <dt className="text-slate-400">Bagni</dt>
                <dd className="text-white mt-0.5">{immobile.bagni}</dd>
              </div>
            )}
            {immobile.stato && (
              <div>
                <dt className="text-slate-400">Stato</dt>
                <dd className="text-white mt-0.5">
                  {STATI[immobile.stato] || immobile.stato}
                </dd>
              </div>
            )}
            {immobile.classe_energetica && (
              <div>
                <dt className="text-slate-400">Classe energetica</dt>
                <dd className="text-white mt-0.5">{immobile.classe_energetica}</dd>
              </div>
            )}
            {immobile.riscaldamento && (
              <div>
                <dt className="text-slate-400">Riscaldamento</dt>
                <dd className="text-white mt-0.5">{immobile.riscaldamento}</dd>
              </div>
            )}
            {immobile.anno_costruzione && (
              <div>
                <dt className="text-slate-400">Anno costruzione</dt>
                <dd className="text-white mt-0.5">{immobile.anno_costruzione}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* UBICAZIONE */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Ubicazione</h2>
          <dl className="space-y-3 text-sm">
            {immobile.piano && (
              <div>
                <dt className="text-slate-400">Piano</dt>
                <dd className="text-white mt-0.5">{immobile.piano}</dd>
              </div>
            )}
            {immobile.interno && (
              <div>
                <dt className="text-slate-400">Interno</dt>
                <dd className="text-white mt-0.5">{immobile.interno}</dd>
              </div>
            )}
            {immobile.scala && (
              <div>
                <dt className="text-slate-400">Scala</dt>
                <dd className="text-white mt-0.5">{immobile.scala}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-400">Indirizzo completo</dt>
              <dd className="text-white mt-0.5">
                {immobile.indirizzo} {immobile.civico}
                <br />
                {immobile.frazione && `${immobile.frazione}, `}
                {immobile.cap} {immobile.comune}{' '}
                {immobile.provincia && `(${immobile.provincia})`}
              </dd>
            </div>
          </dl>
        </div>

        {immobile.descrizione && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">Descrizione</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {immobile.descrizione}
            </p>
          </div>
        )}

        {immobile.note && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Note interne</h2>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {immobile.note}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}