import { useEffect, useMemo, useState } from 'react'
import { getKnockoutMatches, saveKnockoutPrediction, deleteKnockoutPrediction, getMyKnockoutPredictions, isUserAdmin, toggleKnockoutMatchLock } from '../lib/db'
import { useAuth } from '../hooks/useAuth'

const teamFlagCodes = {
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  francia: 'fr',
  'españa': 'es',
  inglaterra: 'gb-eng',
  'estados unidos': 'us',
  'republica checa': 'cz',
  'corea del sur': 'kr',
  'costa de marfil': 'ci',
  'ecuador': 'ec',
  'iran': 'ir',
  'japon': 'jp',
  'mexico': 'mx',
  'noruega': 'no',
  portugal: 'pt',
  brasil: 'br',
  'paises bajos': 'nl',
  paraguay: 'py',
  marruecos: 'ma',
  belgica: 'be',
  alemania: 'de',
  'croacia': 'hr',
  'nueva zelanda': 'nz',
  haiti: 'ht',
  curazao: 'cw',
  ghana: 'gh',
  'cabo verde': 'cv',
  'bosnia y herzegovina': 'ba',
  jordania: 'jo',
  'arabia saudita': 'sa',
  sudafrica: 'za',
  irak: 'iq',
  qatar: 'qa',
  'catar': 'qa',
  uzbekistan: 'uz',
  'rd congo': 'cd',
  tunez: 'tn',
  escocia: 'gb-sct',
  argelia: 'dz',
  'suiza': 'ch',
  'suecia': 'se',
  senegal: 'sn',
  turquia: 'tr',
  'uruguay': 'uy',
  'colombia': 'co',
  panama: 'pa',
  canada: 'ca',
  'bosnia-herzegovina': 'ba',
  'bosnia herzegovina': 'ba',
}

function normalizeTeamName(teamName) {
  return String(teamName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizedTeamFlagCodes = Object.fromEntries(
  Object.entries(teamFlagCodes).map(([k, v]) => [normalizeTeamName(k), v])
)

function getTeamFlagCode(teamName) {
  return normalizedTeamFlagCodes[normalizeTeamName(teamName)] || ''
}

function TeamLabel({ teamName, align = 'left' }) {
  const flagCode = getTeamFlagCode(teamName)

  return (
    <span className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
      {flagCode ? (
        <span
          className={`fi fi-${flagCode} inline-block shrink-0 rounded-sm shadow-sm`}
          aria-hidden="true"
        />
      ) : null}
      <span className="truncate text-xs sm:text-sm">{teamName}</span>
    </span>
  )
}

const stageColors = {
  '16avos': '#64748B',
  'Octavos': '#3B82F6',
  'Cuartos': '#8B5CF6',
  'Semifinal': '#F59E0B',
  'Final': '#EF4444',
  'Tercer puesto': '#0EA5E9',
}

function getStageStyles(stage) {
  const backgroundColor = stageColors[stage] || '#64748B'
  return {
    backgroundColor,
    color: '#FFFFFF',
  }
}

function ScoreInput({ value, disabled, onChange }) {
  const [draft, setDraft] = useState(value != null ? String(value) : '')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) {
      setDraft(value != null ? String(value) : '')
    }
  }, [value, editing])

  function handleFocus(e) {
    setEditing(true)
    e.target.select()
  }

  function handleChange(e) {
    const raw = e.target.value
    if (raw === '') {
      setDraft('')
      return
    }
    if (/^\d{1,2}$/.test(raw) && Number(raw) <= 20) {
      setDraft(raw)
    }
  }

  function handleBlur() {
    setEditing(false)
    const num = draft === '' ? 0 : Number(draft)
    setDraft(draft === '' ? '' : String(num))
    onChange(num)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      disabled={disabled}
      value={draft}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-14 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400 sm:w-16 sm:text-sm"
    />
  )
}

function PenaltiesInput({ value, disabled, onChange }) {
  const [draft, setDraft] = useState(value != null ? String(value) : '')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) {
      setDraft(value != null ? String(value) : '')
    }
  }, [value, editing])

  function handleFocus(e) {
    setEditing(true)
    e.target.select()
  }

  function handleChange(e) {
    const raw = e.target.value
    if (raw === '') {
      setDraft('')
      return
    }
    if (/^\d{1,2}$/.test(raw) && Number(raw) <= 15) {
      setDraft(raw)
    }
  }

  function handleBlur() {
    setEditing(false)
    const num = draft === '' ? null : Number(draft)
    setDraft(draft === '' ? '' : String(num))
    onChange(num)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      disabled={disabled}
      value={draft}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-12 rounded-xl border border-slate-200 bg-white px-2 py-2 text-center text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-400 sm:w-14 sm:text-sm"
    />
  )
}

export default function Knockout() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [selectedStage, setSelectedStage] = useState('')
  const [myPredictions, setMyPredictions] = useState({})
  const [saved, setSaved] = useState({})
  const [saving, setSaving] = useState({})
  const [loadError, setLoadError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  function getMatchKey(match) {
    return match.match_id ?? match.id
  }

  function formatMatchDateTime(matchTime) {
    return new Date(matchTime).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  function getMatchResult(match) {
    if (match.home_score == null || match.away_score == null) return null

    const goles = `${match.home_score} - ${match.away_score}`
    if (match.home_penalties != null && match.away_penalties != null) {
      return `${goles} (${match.home_penalties} - ${match.away_penalties})`
    }
    return goles
  }

  function getWinner(match) {
    if (match.home_score == null || match.away_score == null) return null

    let homeTotal = match.home_score
    let awayTotal = match.away_score

    if (match.home_penalties != null && match.away_penalties != null) {
      if (match.home_score === match.away_score) {
        homeTotal = match.home_penalties
        awayTotal = match.away_penalties
      }
    }

    if (homeTotal > awayTotal) return 'home'
    if (awayTotal > homeTotal) return 'away'
    return 'draw'
  }

  useEffect(() => {
    async function loadData() {
      setLoadError('')
      const { data: matchesData, error: matchesError } = await getKnockoutMatches()

      if (matchesError) {
        setLoadError('No se pudieron cargar los partidos eliminatorios.')
      }

      setMatches(matchesData || [])

      if (user) {
        const admin = await isUserAdmin(user.id)
        setIsAdmin(admin)
        const { data: myPredictionsData } = await getMyKnockoutPredictions(user.id)
        const own = {}
        const ownSaved = {}
        myPredictionsData?.forEach(prediction => {
          own[prediction.match_id] = {
            home: prediction.home_score_pred,
            away: prediction.away_score_pred,
            homePenalties: prediction.home_penalties_pred,
            awayPenalties: prediction.away_penalties_pred,
          }
          ownSaved[prediction.match_id] = true
        })
        setMyPredictions(own)
        setSaved(ownSaved)
      } else {
        setMyPredictions({})
        setSaved({})
        setIsAdmin(false)
      }
    }

    loadData()

    const interval = setInterval(loadData, 10000)

    return () => clearInterval(interval)
  }, [user])

  const stageOptions = useMemo(() => {
    const stages = Array.from(new Set(matches.map(m => m.stage)))
    return stages.sort((a, b) => {
      const order = ['Cuartos', 'Semifinal', 'Final', 'Tercer puesto','16avos', 'Octavos']
      return order.indexOf(a) - order.indexOf(b)
    })
  }, [matches])

  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      return !selectedStage || match.stage === selectedStage
    })
  }, [matches, selectedStage])

  const groupedMatches = useMemo(() => {
    const byStage = {}
    filteredMatches.forEach(match => {
      if (!byStage[match.stage]) byStage[match.stage] = []
      byStage[match.stage].push(match)
    })

    return Object.entries(byStage)
      .map(([stage, items]) => ({ stage, items }))
      .sort((a, b) => {
        const order = ['Cuartos', 'Semifinal', 'Final', 'Tercer puesto','16avos', 'Octavos']
        return order.indexOf(a.stage) - order.indexOf(b.stage)
      })
  }, [filteredMatches])

  function updatePred(matchId, field, value) {
    setMyPredictions(p => {
      const prev = p[matchId] || { home: 0, away: 0, homePenalties: null, awayPenalties: null }
      const next = { ...prev, [field]: value }

      if ((field === 'home' || field === 'away') && next.home !== next.away) {
        next.homePenalties = null
        next.awayPenalties = null
      }

      return { ...p, [matchId]: next }
    })
  }

  function getMyPrediction(matchId) {
    return myPredictions[matchId] || { home: 0, away: 0, homePenalties: null, awayPenalties: null }
  }

  async function handleSave(matchId) {
    const pred = myPredictions[matchId]
    if (!pred || !user || saved[matchId]) return

    setSaving(s => ({ ...s, [matchId]: true }))
    const scoresEqual = pred.home === pred.away
    const { error } = await saveKnockoutPrediction(
      user.id,
      matchId,
      pred.home,
      pred.away,
      scoresEqual ? pred.homePenalties : null,
      scoresEqual ? pred.awayPenalties : null
    )
    setSaving(s => ({ ...s, [matchId]: false }))

    if (error) {
      setLoadError('No se pudo guardar la predicción. Intentá de nuevo.')
      return
    }

    setSaved(s => ({ ...s, [matchId]: true }))

    const { data: refreshedOwn } = await getMyKnockoutPredictions(user.id)
    const own = {}
    refreshedOwn?.forEach(prediction => {
      own[prediction.match_id] = {
        home: prediction.home_score_pred,
        away: prediction.away_score_pred,
        homePenalties: prediction.home_penalties_pred,
        awayPenalties: prediction.away_penalties_pred,
      }
    })
    setMyPredictions(own)
  }

  async function handleDelete(matchId) {
    if (!user) return

    setSaving(s => ({ ...s, [matchId]: true }))
    const { error } = await deleteKnockoutPrediction(user.id, matchId)
    setSaving(s => ({ ...s, [matchId]: false }))

    if (error) {
      setLoadError('No se pudo borrar la predicción. Intentá de nuevo.')
      return
    }

    setSaved(s => ({ ...s, [matchId]: false }))
    setMyPredictions(p => ({
      ...p,
      [matchId]: { home: 0, away: 0, homePenalties: null, awayPenalties: null },
    }))
  }

  async function handleToggleLock(matchId, currentLocked) {
    const { error } = await toggleKnockoutMatchLock(user.id, matchId, !currentLocked)
    if (error) {
      setLoadError('No se pudo cambiar el estado del partido.')
      return
    }
    setMatches(matches.map(m =>
      m.match_id === matchId ? { ...m, locked: !currentLocked } : m
    ))
  }

  function renderMatchCard(match) {
    const matchKey = getMatchKey(match)
    const myPred = getMyPrediction(matchKey)
    const locked = match.locked || !user || Boolean(saved[matchKey])
    const result = getMatchResult(match)
    const winner = getWinner(match)

    return (
      <div key={matchKey} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
          <span className="truncate">{formatMatchDateTime(match.match_time)}</span>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs"
              style={getStageStyles(match.stage)}
            >
              {match.stage}
            </span>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] items-center gap-2 text-sm sm:gap-3 sm:text-base">
            <span className={`min-w-0 text-right font-medium ${winner === 'home' ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
              <TeamLabel teamName={match.home_team} align="right" />
            </span>
            <span className="min-w-8 text-center font-semibold text-slate-900 sm:min-w-12">{match.home_score ?? '—'}</span>
            <span className="text-slate-400">-</span>
            <span className="min-w-8 text-center font-semibold text-slate-900 sm:min-w-12">{match.away_score ?? '—'}</span>
            <span className={`min-w-0 font-medium ${winner === 'away' ? 'text-emerald-600 font-bold' : 'text-slate-900'}`}>
              <TeamLabel teamName={match.away_team} />
            </span>
          </div>

          {match.home_penalties != null && match.away_penalties != null && (
            <div className="text-center text-xs text-slate-500 sm:text-sm">
              Penales: {match.home_penalties} - {match.away_penalties}
            </div>
          )}

          {result && (
            <div className="text-center text-sm font-semibold text-slate-700">
              Resultado final: {result}
            </div>
          )}

          <div className="grid gap-3 border-t border-slate-200 pt-4 justify-items-center text-center">
            <div className="text-center text-sm font-semibold text-slate-900">Tu predicción</div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">Goles</span>
                <div className="flex items-center gap-1">
                  <ScoreInput
                    value={myPred.home ?? 0}
                    disabled={locked}
                    onChange={val => updatePred(matchKey, 'home', val)}
                  />
                  <span className="text-slate-400">-</span>
                  <ScoreInput
                    value={myPred.away ?? 0}
                    disabled={locked}
                    onChange={val => updatePred(matchKey, 'away', val)}
                  />
                </div>
              </div>

              {(() => {
                const scoresEqual = myPred.home === myPred.away
                return (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">
                      {scoresEqual ? 'Penales' : 'Penales (solo si empatan)'}
                    </span>
                    <div className="flex items-center gap-1">
                      <PenaltiesInput
                        value={myPred.homePenalties}
                        disabled={locked || !scoresEqual}
                        onChange={val => updatePred(matchKey, 'homePenalties', val)}
                      />
                      <span className="text-slate-400">-</span>
                      <PenaltiesInput
                        value={myPred.awayPenalties}
                        disabled={locked || !scoresEqual}
                        onChange={val => updatePred(matchKey, 'awayPenalties', val)}
                      />
                    </div>
                  </div>
                )
              })()}

              <button
                disabled={locked || saving[matchKey]}
                onClick={() => handleSave(matchKey)}
                className={`rounded-xl px-3 py-2 text-xs font-medium text-white transition-colors duration-300 sm:px-4 sm:text-sm ${
                  saved[matchKey] ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-emerald-600'
                } disabled:cursor-not-allowed disabled:opacity-80`}
              >
                {saved[matchKey] ? 'Guardado' : saving[matchKey] ? 'Guardando...' : 'Guardar'}
              </button>
            </div>

            {saved[matchKey] && !match.locked && (
              <button
                type="button"
                onClick={() => handleDelete(matchKey)}
                className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors duration-300 hover:bg-red-600 hover:text-white sm:px-4 sm:text-sm"
              >
                Cambié de opinión
              </button>
            )}
            {match.locked && (
              <span className="text-xs text-red-600 font-medium sm:text-sm">
                Es muy tarde, ya empieza el partido!
              </span>
            )}
            {isAdmin && (
              <button
                onClick={() => handleToggleLock(match.match_id, match.locked)}
                className={`rounded-xl px-3 py-2 text-xs font-medium text-white transition-colors duration-300 sm:px-4 sm:text-sm ${
                  match.locked ? 'bg-red-600' : 'bg-amber-500'
                }`}
              >
                {match.locked ? 'Desbloquear' : 'Bloquear'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
      No hay partidos eliminatorios para los filtros seleccionados.
    </div>
  )

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500 sm:text-sm sm:tracking-[0.24em]">Eliminatorias</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Cruces Eliminatorios</h1>
        <p className="text-sm text-slate-500">Predicciones para la fase eliminatoria del mundial.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4">
        <div className="grid gap-1.5 sm:gap-2">
          <label htmlFor="stage-filter" className="text-xs font-medium text-slate-700 sm:text-sm">Fase</label>
          <select
            id="stage-filter"
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 sm:text-sm"
          >
            <option value="">Todas las fases</option>
            {stageOptions.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {groupedMatches.length > 0 ? (
        groupedMatches.map(section => (
          <div key={section.stage} className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {section.stage}
            </div>
            <div className="grid gap-4">
              {section.items.map(renderMatchCard)}
            </div>
          </div>
        ))
      ) : (
        emptyState
      )}
    </section>
  )
}
