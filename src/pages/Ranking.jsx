import { useEffect, useState } from 'react'
import { getHoyLaVieron, getRanking } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

export default function Ranking() {
  const { user } = useAuth()
  const [ranking, setRanking] = useState([])
  const [batacazoUsers, setBatacazoUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadRanking() {
      setLoading(true)

      const [rankingResult, hoyLaVieronResult] = await Promise.all([
        getRanking(),
        getHoyLaVieron(),
      ])

      if (!active) return

      const rankingData = rankingResult.data || []

      setRanking(rankingData)
      setBatacazoUsers((hoyLaVieronResult.data || []).map(row => row.username))
      setLoading(false)
    }

    loadRanking()

    return () => {
      active = false
    }
  }, [])

  const medals = ['🥇', '🥈', '🥉']
  const panelClass = 'rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4'
  const pillClass = 'rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 sm:text-sm'

  return (
    <section className="mx-auto w-full max-w-3xl space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-sm sm:tracking-[0.24em]">Tabla general</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Ranking total</h1>
      </div>

      {loading && <p className="text-sm text-slate-500">Cargando ranking...</p>}

      {ranking.map((profile, index) => (
        <div
          key={profile.username}
          className={`flex items-center gap-2 sm:gap-3 ${panelClass} ${profile.username === user?.user_metadata?.username ? 'ring-1 ring-slate-300' : ''}`}
        >
          <span className="w-7 shrink-0 text-center text-xs font-semibold text-slate-500 sm:w-8 sm:text-sm">
            {medals[index] ?? index + 1}
          </span>
          <span className={`min-w-0 flex-1 truncate text-sm ${profile.username === user?.user_metadata?.username ? 'font-medium text-slate-950' : 'text-slate-700'}`}>
            {profile.username}
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-900 sm:gap-2 sm:text-sm">
            <span>{profile.total_points} pts</span>
            {batacazoUsers.includes(profile.username) ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Batacazo!
              </span>
            ) : null}
          </span>
        </div>
      ))}

      {!loading && ranking.length === 0 && (
        <p className="text-sm text-slate-500">Aún no hay puntos cargados.</p>
      )}

      <div className={panelClass}>
        <div className="mb-2 text-base font-semibold text-primary-900">¿Cómo se suman puntos?</div>
        <p className="text-base leading-6 text-primary-500">
          + 3 puntos por acertar el equipo ganador.<br />
          + 6 por acertar los goles (sin contar penales).<br />
          + 10 si acertás los penales.

          <p>No se acumulan, o sumás 3 o sumás 6 o sumás 10 por partido.</p>
        </p>
      </div>
    </section>
  )
}