
import React, { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Award,
  BarChart3,
  Download,
  Info,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  CheckCircle2,
  MapPin,
  Lightbulb,
  Eye,
  EyeOff,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import api from '../services/api'

const PRESETS = {
  balanced: { label: 'Balanced', education: 34, water: 33, healthcare: 33 },
  education: { label: 'Education Focus', education: 50, water: 25, healthcare: 25 },
  water: { label: 'Water Focus', education: 25, water: 50, healthcare: 25 },
  healthcare: { label: 'Healthcare Focus', education: 25, water: 25, healthcare: 50 },
}

const SECTORS = {
  education: { label: 'Education', field: 'education_need_score', color: '#2563EB' },
  water: { label: 'Water', field: 'water_need_score', color: '#0284C7' },
  healthcare: { label: 'Healthcare', field: 'healthcare_need_score', color: '#9333EA' },
  overall: { label: 'Overall Priority', field: 'policy_need_score', color: '#DC2626' },
}

const HEATMAP_SECTORS = [
  SECTORS.education,
  SECTORS.water,
  SECTORS.healthcare,
]

const DISTRICT_COLOURS = [
  '#E45B72', '#F08A62', '#E6A34A', '#9B78D0',
  '#3B9EAB', '#3987BD', '#5579C8', '#4D9C91',
  '#78A66B', '#8C9BBA', '#9B8BAF', '#7CABC1',
  '#A5B8C9',
]

const number = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const hasScore = (value) =>
  value !== null &&
  value !== undefined &&
  value !== '' &&
  Number.isFinite(Number(value))

const formatScore = (value) => number(value).toFixed(2)

const formatWeight = (value) =>
  value === '' || value === null || value === undefined
    ? '—'
    : `${value}%`

const panelClass =
  'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]'

const sectionTitleClass =
  'text-sm font-bold tracking-tight text-[#172554] dark:text-white'

const smallLabelClass =
  'text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 dark:text-slate-400'

const hexToRgba = (hex, alpha) => {
  const value = hex.replace('#', '')
  const red = parseInt(value.substring(0, 2), 16)
  const green = parseInt(value.substring(2, 4), 16)
  const blue = parseInt(value.substring(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function RankingMovementTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const entries = payload
    .filter((entry) => entry.value !== null && entry.value !== undefined)
    .sort((a, b) => number(a.value) - number(b.value))

  return (
    <div className="max-w-[260px] rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-600 dark:bg-[#111C30]">
      <p className="mb-2 text-xs font-extrabold text-[#172554] dark:text-white">
        {label}
      </p>
      <div className="max-h-52 space-y-1.5 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.dataKey}
            className="flex items-center justify-between gap-5 text-[11px]"
          >
            <span className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate">{entry.dataKey}</span>
            </span>
            <strong className="shrink-0 text-[#172554] dark:text-white">
              Rank {entry.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics({ user }) {
  // Only policy makers and administrators can change the analysis weights.
  const canManageWeights =
    user?.role === 'policy_maker' || user?.role === 'admin'

  const [rankings, setRankings] = useState([])
  const [weights, setWeights] = useState({ ...PRESETS.balanced })
  const [appliedWeights, setAppliedWeights] = useState({ ...PRESETS.balanced })
  const [preset, setPreset] = useState('balanced')
  const [selectedSector, setSelectedSector] = useState('overall')
  const [selectedHeatmapDistrict, setSelectedHeatmapDistrict] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  // Ranking movement chart data and district selection.
  const [movementData, setMovementData] = useState([])
  const [movementDistricts, setMovementDistricts] = useState([])
  const [selectedMovementDistricts, setSelectedMovementDistricts] = useState([])
  const [movementLoading, setMovementLoading] = useState(true)
  const [movementError, setMovementError] = useState('')

  const weightTotal =
    number(weights.education) +
    number(weights.water) +
    number(weights.healthcare)

  const validWeights =
    ['education', 'water', 'healthcare'].every((field) => {
      const value = Number(weights[field])
      return (
        weights[field] !== '' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100
      )
    }) && weightTotal === 100

  const fetchAnalytics = async (selectedWeights) => {
    try {
      setUpdating(true)
      setError('')

      const response = await api.post('/policy/weights', {
        education_weight: Number(selectedWeights.education),
        water_weight: Number(selectedWeights.water),
        healthcare_weight: Number(selectedWeights.healthcare),
      })

      if (!Array.isArray(response.data.rankings)) {
        throw new Error('Unexpected analytics response format.')
      }

      setRankings(response.data.rankings)
      setAppliedWeights({ ...selectedWeights })
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Unable to calculate district rankings.'
      )
    } finally {
      setLoading(false)
      setUpdating(false)
    }
  }

  useEffect(() => {
    fetchAnalytics(PRESETS.balanced)
  }, [])

  // These four hypothetical profiles are read-only comparisons.
  // No budget is supplied, so this does not generate an allocation.
  useEffect(() => {
    let cancelled = false

    const loadRankingMovement = async () => {
      try {
        setMovementLoading(true)
        setMovementError('')

        const profiles = await Promise.all(
          Object.entries(PRESETS).map(async ([id, profile]) => {
            const response = await api.post('/policy/weights', {
              education_weight: profile.education,
              water_weight: profile.water,
              healthcare_weight: profile.healthcare,
            })

            if (!Array.isArray(response.data.rankings)) {
              throw new Error(`Unexpected response for ${profile.label}.`)
            }

            return {
              id,
              label: profile.label,
              rankings: response.data.rankings,
            }
          })
        )

        if (cancelled) return

        const districtNames = profiles[0].rankings
          .map((item) => item.district)
          .filter(Boolean)

        const rankMaps = profiles.map((profile) => {
          const map = new Map()

          profile.rankings.forEach((item) => {
            if (item.district) {
              map.set(
                item.district.trim().toLowerCase(),
                number(item.policy_priority_rank)
              )
            }
          })

          return map
        })

        const chartRows = profiles.map((profile, profileIndex) => {
          const row = { profile: profile.label }

          districtNames.forEach((district) => {
            row[district] =
              rankMaps[profileIndex].get(district.trim().toLowerCase()) ?? null
          })

          return row
        })

        setMovementDistricts(districtNames)
        setSelectedMovementDistricts(districtNames)
        setMovementData(chartRows)
      } catch (err) {
        if (!cancelled) {
          setMovementError(
            err.response?.data?.detail ||
            err.message ||
            'Unable to calculate ranking movement.'
          )
        }
      } finally {
        if (!cancelled) setMovementLoading(false)
      }
    }

    loadRankingMovement()

    return () => {
      cancelled = true
    }
  }, [])

  const sortedRankings = useMemo(
    () =>
      [...rankings].sort(
        (a, b) =>
          number(a.policy_priority_rank) -
          number(b.policy_priority_rank)
      ),
    [rankings]
  )

  const topDistrict = sortedRankings[0]
  const lowestDistrict = sortedRankings[sortedRankings.length - 1]

  const averageScore = rankings.length
    ? rankings.reduce(
        (sum, item) => sum + number(item.policy_need_score),
        0
      ) / rankings.length
    : 0

  const sector = SECTORS[selectedSector]

  const sectorRankings = useMemo(
    () =>
      [...rankings].sort(
        (a, b) => number(b[sector.field]) - number(a[sector.field])
      ),
    [rankings, sector.field]
  )

  const maximumScore = Math.max(
    1,
    ...rankings.map((item) => number(item[sector.field]))
  )

  const sectorAverage = rankings.length
    ? rankings.reduce(
        (sum, item) => sum + number(item[sector.field]),
        0
      ) / rankings.length
    : 0

  const filteredRankings = sortedRankings.filter((item) =>
    item.district.toLowerCase().includes(search.toLowerCase().trim())
  )

  const heatmapRanges = useMemo(() => {
    return Object.fromEntries(
      HEATMAP_SECTORS.map((item) => {
        const values = rankings
          .filter((district) => hasScore(district[item.field]))
          .map((district) => Number(district[item.field]))

        return [
          item.field,
          {
            min: values.length ? Math.min(...values) : 0,
            max: values.length ? Math.max(...values) : 0,
          },
        ]
      })
    )
  }, [rankings])

  const heatmapDistrict =
    sortedRankings.find(
      (item) => item.district === selectedHeatmapDistrict
    ) || sortedRankings[0]

  const districtSectorScores = heatmapDistrict
    ? HEATMAP_SECTORS.map((item) => ({
        ...item,
        score: hasScore(heatmapDistrict[item.field])
          ? Number(heatmapDistrict[item.field])
          : null,
      }))
    : []

  const availableDistrictScores = districtSectorScores.filter(
    (item) => item.score !== null
  )

  const highestSectorScore = availableDistrictScores.length
    ? Math.max(...availableDistrictScores.map((item) => item.score))
    : null

  const highestNeedSectors =
    highestSectorScore === null
      ? []
      : availableDistrictScores.filter(
          (item) => Math.abs(item.score - highestSectorScore) < 0.000001
        )

  const getHeatmapCell = (district, sectorItem) => {
    const rawValue = district[sectorItem.field]

    if (!hasScore(rawValue)) {
      return {
        value: '—',
        style: {
          backgroundColor: 'rgba(148,163,184,0.08)',
          color: '#94A3B8',
          borderColor: 'rgba(148,163,184,0.18)',
        },
      }
    }

    const score = Number(rawValue)
    const range = heatmapRanges[sectorItem.field]

    const intensity =
      range.max === range.min
        ? 0.6
        : 0.18 +
          ((score - range.min) / (range.max - range.min)) * 0.72

    return {
      value: formatScore(score),
      style: {
        backgroundColor: hexToRgba(sectorItem.color, intensity),
        color: intensity >= 0.58 ? '#FFFFFF' : '#172554',
        borderColor: hexToRgba(sectorItem.color, 0.35),
      },
    }
  }

  const toggleMovementDistrict = (district) => {
    setSelectedMovementDistricts((current) =>
      current.includes(district)
        ? current.filter((item) => item !== district)
        : [...current, district]
    )
  }

  const selectAllMovementDistricts = () => {
    setSelectedMovementDistricts(movementDistricts)
  }

  const clearMovementDistricts = () => {
    setSelectedMovementDistricts([])
  }

  const selectedMovementCount = selectedMovementDistricts.length

  const movementInsight = useMemo(() => {
    if (!movementData.length || !movementDistricts.length) return null

    const changes = movementDistricts.map((district) => {
      const ranks = movementData
        .map((row) => row[district])
        .filter((rank) => rank !== null && rank !== undefined)

      return {
        district,
        change: ranks.length > 1 ? Math.max(...ranks) - Math.min(...ranks) : 0,
      }
    })

    return changes.sort((a, b) => b.change - a.change)[0]
  }, [movementData, movementDistricts])

  const applyPreset = (presetId) => {
    if (!canManageWeights) return

    const selected = PRESETS[presetId]
    setPreset(presetId)
    setWeights({ ...selected })
    fetchAnalytics(selected)
  }

  const updateWeight = (field, value) => {
    if (!canManageWeights) return

    setPreset('custom')
    setWeights((current) => ({
      ...current,
      [field]: value === '' ? '' : Number(value),
    }))
  }

  const applyCustomWeights = () => {
    if (!canManageWeights || !validWeights || updating) return
    fetchAnalytics(weights)
  }

  const resetWeights = () => {
    if (!canManageWeights) return

    setPreset('balanced')
    setWeights({ ...PRESETS.balanced })
    fetchAnalytics(PRESETS.balanced)
  }

  const exportCSV = () => {
    const headers = [
      'District',
      'Education Need Score',
      'Water Need Score',
      'Healthcare Need Score',
      'Overall Priority Score',
      'Priority Rank',
    ]

    const rows = sortedRankings.map((item) => [
      item.district,
      item.education_need_score,
      item.water_need_score,
      item.healthcare_need_score,
      item.policy_need_score,
      item.policy_priority_rank,
    ])

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? '').replace(/"/g, '""')}"`
          )
          .join(',')
      )
      .join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'GovOpt_District_Analytics.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="mx-auto mb-3 animate-spin text-[#DC2626]"
            size={28}
          />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Analysing district indicators and relative needs...
          </p>
        </div>
      </div>
    )
  }

  if (error && rankings.length === 0) {
    return (
      <div className={`${panelClass} p-8 text-center`}>
        <Info className="mx-auto mb-3 text-[#DC2626]" size={32} />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Analytics could not be loaded
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {error}
        </p>
        <button
          onClick={() => fetchAnalytics(PRESETS.balanced)}
          className="mt-4 rounded-xl bg-[#172554] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1e3a8a]"
        >
          Try again
        </button>
      </div>
    )
  }

  const summaryCards = [
    {
      label: 'Districts analysed',
      value: rankings.length,
      note: 'Uttarakhand districts',
      icon: Activity,
      accent: '#172554',
    },
    {
      label: 'Highest assessed need',
      value: topDistrict?.district || '—',
      note: topDistrict
        ? `Priority score: ${formatScore(topDistrict.policy_need_score)}`
        : 'No data available',
      icon: Award,
      accent: '#DC2626',
    },
    {
      label: 'Average need score',
      value: formatScore(averageScore),
      note: 'Across all analysed districts',
      icon: BarChart3,
      accent: '#0284C7',
    },
    {
      label: 'Lowest assessed need',
      value: lowestDistrict?.district || '—',
      note: lowestDistrict
        ? `Priority score: ${formatScore(lowestDistrict.policy_need_score)}`
        : 'No data available',
      icon: TrendingDown,
      accent: '#64748B',
    },
  ]

  return (
    <div className="space-y-6 pb-8">

      {/* Page heading */}
      <div className="relative overflow-hidden rounded-2xl bg-[#172554] p-5 text-white shadow-sm sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-0 right-28 h-24 w-24 rounded-full bg-[#DC2626]/20 blur-2xl" />

        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#DC2626]" />
              <p className="text-[10px] font-bold uppercase tracking-[2px] text-blue-200">
                Uttarakhand · Indicator Analytics
              </p>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              District Analytics & Needs
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-5 text-blue-100/80 sm:text-sm">
              Explore development needs across education, water and healthcare.
              See how district priorities change when planning priorities are adjusted.
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={!rankings.length}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={15} />
            Export dataset
          </button>
        </div>

        <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-[10px] font-semibold text-blue-100/80">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
            District-level analysis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
            Three development sectors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {canManageWeights ? 'Adjustable analysis weights' : 'Read-only analysis'}
          </span>
        </div>
      </div>

      {/* Summary metrics */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon

          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111C30]"
            >
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ backgroundColor: card.accent }}
              />

              <div className="flex items-center justify-between gap-2">
                <p className={smallLabelClass}>{card.label}</p>
                <span
                  className="rounded-xl p-2"
                  style={{
                    color: card.accent,
                    backgroundColor:
                      index === 1
                        ? 'rgba(220,38,38,0.09)'
                        : 'rgba(23,37,84,0.07)',
                  }}
                >
                  <Icon size={17} />
                </span>
              </div>

              <p className="mt-4 break-words text-2xl font-extrabold tracking-tight text-[#172554] dark:text-white">
                {card.value}
              </p>

              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {card.note}
              </p>
            </div>
          )
        })}
      </section>

      {/* Weight sensitivity controls: policy makers and admins only */}
      {canManageWeights ? (
        <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#172554] p-2.5 text-white dark:bg-[#DC2626]">
                  <SlidersHorizontal size={18} />
                </div>
                <div>
                  <h2 className={sectionTitleClass}>Sector Weight Sensitivity</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    Test different planning priorities
                  </p>
                </div>
              </div>

              {updating && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-[10px] font-bold text-[#DC2626] dark:bg-red-950/30">
                  <RefreshCw size={12} className="animate-spin" />
                  Recalculating rankings
                </span>
              )}
            </div>

            <p className="mt-4 max-w-3xl text-xs leading-5 text-slate-500 dark:text-slate-400">
              Set the relative importance of each sector in the combined priority
              score. The weights must add up to exactly 100%. These changes
              recalculate this analysis; they are not saved as a permanent global configuration.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([id, item]) => (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  disabled={updating}
                  className={`rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                    preset === id
                      ? 'bg-[#172554] text-white shadow-sm dark:bg-[#DC2626]'
                      : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {item.label}
                </button>
              ))}
              {preset === 'custom' && (
                <span className="rounded-xl border border-[#DC2626]/30 bg-red-50 px-3.5 py-2 text-[11px] font-bold text-[#DC2626] dark:bg-red-950/20">
                  Custom configuration
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 dark:bg-[#0D1729]/40 md:grid-cols-3 sm:p-6">
            {[
              {
                field: 'education',
                label: 'Education',
                description: 'Schools and learning indicators',
                color: '#2563EB',
              },
              {
                field: 'water',
                label: 'Water',
                description: 'Water access and resource indicators',
                color: '#0284C7',
              },
              {
                field: 'healthcare',
                label: 'Healthcare',
                description: 'Health services and infrastructure',
                color: '#9333EA',
              },
            ].map((item) => (
              <div
                key={item.field}
                className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-[#111C30]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-[#172554] dark:text-white">
                      {item.label}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <span
                    className="text-xl font-extrabold tabular-nums"
                    style={{ color: item.color }}
                  >
                    {formatWeight(weights[item.field])}
                  </span>
                </div>

                <input
                  aria-label={`${item.label} weight`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={weights[item.field] === '' ? 0 : weights[item.field]}
                  onChange={(event) =>
                    updateWeight(item.field, event.target.value)
                  }
                  className="mt-5 w-full cursor-pointer accent-[#172554]"
                  style={{ accentColor: item.color }}
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                    Enter percentage
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      aria-label={`${item.label} percentage value`}
                      type="number"
                      min="0"
                      max="100"
                      value={weights[item.field]}
                      onChange={(event) =>
                        updateWeight(item.field, event.target.value)
                      }
                      className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-right text-xs font-bold text-[#172554] outline-none focus:border-[#DC2626] dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Total weight
                </span>
                <span
                  className={`text-sm font-extrabold tabular-nums ${
                    validWeights ? 'text-emerald-600' : 'text-[#DC2626]'
                  }`}
                >
                  {weightTotal}%
                </span>
                {validWeights && (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                {validWeights
                  ? 'Configuration is valid and ready to apply.'
                  : 'Adjust the sector values until the total equals 100%.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={resetWeights}
                disabled={updating}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={applyCustomWeights}
                disabled={!validWeights || updating}
                className="inline-flex items-center gap-2 rounded-xl bg-[#172554] px-5 py-2.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#DC2626] dark:hover:bg-[#b91c1c]"
              >
                {updating && <RefreshCw size={13} className="animate-spin" />}
                Apply weights
              </button>
            </div>
          </div>

          {error && (
            <p className="mx-5 mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 sm:mx-6">
              {error}
            </p>
          )}
        </section>
      ) : (
        <section className={`${panelClass} overflow-hidden`}>
          <div className="flex flex-wrap items-start gap-3 p-5 sm:p-6">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
              <Eye size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={sectionTitleClass}>Read-only planning analysis</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The district rankings below use the Balanced profile:
                Education 34%, Water 33%, and Healthcare 33%.
                You can explore the district results and compare how rankings
                change under the four example profiles, but changing the
                analysis weights is restricted to policy makers and administrators.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Weights used for the displayed calculation */}
      <section className={`${panelClass} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={smallLabelClass}>Analysis configuration</p>
            <h2 className={`mt-1 ${sectionTitleClass}`}>Weights used for these rankings</h2>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              The sector weights used to calculate the currently displayed district rankings.
            </p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            Calculation total · 100%
          </span>
        </div>

        <div className="mt-5 flex h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {[
            ['education', SECTORS.education.color],
            ['water', SECTORS.water.color],
            ['healthcare', SECTORS.healthcare.color],
          ].map(([field, color]) => (
            <div
              key={field}
              title={`${SECTORS[field].label}: ${appliedWeights[field]}%`}
              style={{
                width: `${appliedWeights[field]}%`,
                backgroundColor: color,
              }}
              className="h-full transition-all duration-500"
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['education', SECTORS.education.color],
            ['water', SECTORS.water.color],
            ['healthcare', SECTORS.healthcare.color],
          ].map(([field, color]) => (
            <div
              key={field}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 dark:border-slate-700"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {SECTORS[field].label}
                </span>
              </div>
              <span className="text-sm font-extrabold tabular-nums text-[#172554] dark:text-white">
                {appliedWeights[field]}%
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Sector distribution */}
      <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#DC2626]" />
              <h2 className={sectionTitleClass}>District Need Distribution</h2>
            </div>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              Compare district scores within a sector. Districts are ordered
              from highest to lowest assessed need for the selected measure.
            </p>
          </div>

          <select
            value={selectedSector}
            onChange={(event) => setSelectedSector(event.target.value)}
            className="min-w-[165px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#172554] outline-none focus:border-[#DC2626] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {Object.entries(SECTORS).map(([id, item]) => (
              <option key={id} value={id}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-[#0D1729]/40 sm:grid-cols-3 sm:p-5">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#111C30]">
            <p className={smallLabelClass}>Selected measure</p>
            <p className="mt-1 text-sm font-extrabold text-[#172554] dark:text-white">
              {sector.label}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#111C30]">
            <p className={smallLabelClass}>Average score</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums text-[#172554] dark:text-white">
              {formatScore(sectorAverage)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#111C30]">
            <p className={smallLabelClass}>Highest district score</p>
            <p className="mt-1 text-sm font-extrabold tabular-nums text-[#DC2626]">
              {sectorRankings.length
                ? formatScore(sectorRankings[0][sector.field])
                : '—'}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500 dark:text-slate-400">
              District comparison · Highest to lowest
            </p>
            <span className="text-[10px] font-semibold text-slate-400">
              Scale: 0–{formatScore(maximumScore)}
            </span>
          </div>

          <div className="space-y-3">
            {sectorRankings.map((item, index) => {
              const score = number(item[sector.field])
              const width = (score / maximumScore) * 100

              return (
                <div
                  key={item.district}
                  className="grid grid-cols-[minmax(90px,130px)_1fr_48px] items-center gap-3 sm:grid-cols-[minmax(120px,170px)_1fr_58px]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 text-[10px] font-bold tabular-nums text-slate-400">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate text-[11px] font-bold text-[#172554] dark:text-slate-200">
                      {item.district}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${width}%`,
                        backgroundColor: sector.color,
                        opacity: index === 0 ? 1 : 0.78,
                      }}
                    />
                  </div>

                  <span className="text-right text-[11px] font-extrabold tabular-nums text-slate-700 dark:text-slate-300">
                    {formatScore(score)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* District-Sector Heatmap */}
      <section className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-[#DC2626]" />
            <h2 className={sectionTitleClass}>
              Where Do Districts Need More Development Support?
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            Compare the model's assessment of education, drinking water and
            healthcare needs across Uttarakhand.
          </p>
        </div>

        <div className="p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
              <div>
                <p className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                  How to understand this comparison
                </p>
                <p className="mt-1 text-[11px] leading-5 text-blue-800 dark:text-blue-200/80">
                  Each row represents a district. Each column represents a
                  development sector. The number is the district's assessed
                  need score for that sector. A darker cell means a higher
                  score compared with other districts in the same sector.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold text-[#172554] dark:text-white">
                Compare all districts
              </p>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                Select a district below to see a plain-language summary.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span>Lighter = lower</span>
              <div className="flex gap-1">
                {[0.18, 0.35, 0.52, 0.7, 0.9].map((opacity) => (
                  <span
                    key={opacity}
                    className="h-4 w-5 rounded"
                    style={{
                      backgroundColor: hexToRgba('#2563EB', opacity),
                    }}
                  />
                ))}
              </div>
              <span>Darker = higher</span>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[590px]">
              <div className="grid grid-cols-[minmax(145px,1.2fr)_repeat(3,minmax(115px,1fr))] gap-2">
                <div className="flex items-center px-3 py-3">
                  <span className={smallLabelClass}>District</span>
                </div>

                {HEATMAP_SECTORS.map((item) => (
                  <div
                    key={item.field}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center dark:border-slate-700 dark:bg-slate-800/70"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-extrabold text-[#172554] dark:text-white">
                        {item.label}
                      </span>
                    </div>
                  </div>
                ))}

                {sortedRankings.map((district) => (
                  <React.Fragment key={district.district}>
                    <button
                      type="button"
                      onClick={() => setSelectedHeatmapDistrict(district.district)}
                      className={`flex min-w-0 items-center gap-2 rounded-xl border px-3 py-3 text-left transition ${
                        heatmapDistrict?.district === district.district
                          ? 'border-[#DC2626] bg-red-50 dark:bg-red-950/20'
                          : 'border-slate-100 bg-slate-50/70 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/40'
                      }`}
                    >
                      <span className="w-6 shrink-0 text-[10px] font-bold tabular-nums text-slate-400">
                        #{district.policy_priority_rank}
                      </span>
                      <span className="truncate text-[11px] font-bold text-[#172554] dark:text-slate-200">
                        {district.district}
                      </span>
                    </button>

                    {HEATMAP_SECTORS.map((sectorItem) => {
                      const cell = getHeatmapCell(district, sectorItem)

                      return (
                        <button
                          type="button"
                          key={`${district.district}-${sectorItem.field}`}
                          onClick={() => setSelectedHeatmapDistrict(district.district)}
                          title={`Select ${district.district}`}
                          className="flex min-h-[46px] items-center justify-center rounded-xl border px-2 py-3 transition hover:brightness-95"
                          style={cell.style}
                        >
                          <span className="text-xs font-extrabold tabular-nums">
                            {cell.value}
                          </span>
                        </button>
                      )
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin size={17} className="text-[#DC2626]" />
                <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
                  Understand one district
                </h3>
              </div>

              <select
                value={heatmapDistrict?.district || ''}
                onChange={(event) => setSelectedHeatmapDistrict(event.target.value)}
                className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#172554] outline-none focus:border-[#DC2626] dark:border-slate-700 dark:bg-[#111C30] dark:text-white"
              >
                {sortedRankings.map((item) => (
                  <option key={item.district} value={item.district}>
                    {item.district}
                  </option>
                ))}
              </select>
            </div>

            {heatmapDistrict ? (
              <>
                <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  Here is how GovOpt's model assesses development needs in{' '}
                  <strong>{heatmapDistrict.district}</strong>:
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {districtSectorScores.map((item) => (
                    <div
                      key={item.field}
                      className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-[#111C30]"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {item.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xl font-extrabold tabular-nums text-[#172554] dark:text-white">
                        {item.score === null ? 'Not available' : formatScore(item.score)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <Lightbulb size={17} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
                  <div>
                    <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                      What does this tell us?
                    </p>
                    {highestNeedSectors.length > 0 ? (
                      <p className="mt-1 text-[11px] leading-5 text-amber-900/80 dark:text-amber-100/80">
                        Within GovOpt's scoring framework,{' '}
                        <strong>
                          {highestNeedSectors.map((item) => item.label).join(' and ')}
                        </strong>{' '}
                        {highestNeedSectors.length === 1 ? 'has' : 'have'} the
                        highest assessed need score for {heatmapDistrict.district}
                        {' '}among the three sectors shown.
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] leading-5 text-amber-900/80 dark:text-amber-100/80">
                        Sector scores are not available for this district, so
                        GovOpt cannot generate a comparison.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                District information is not available.
              </p>
            )}
          </div>

          <p className="mt-4 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
            Important: These are model-based indicators of relative development
            need. A higher score does not prove that a service is absent, that
            its quality is poor, or that a particular funding amount is required.
            Colour intensity is compared separately within each sector column.
          </p>
        </div>
      </section>

      {/* District Ranking Movement Chart */}
      <section className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-[#DC2626]" />
                <h2 className={sectionTitleClass}>
                  How Do District Priorities Change?
                </h2>
              </div>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
                See how each district's priority position changes when the
                importance given to Education, Water or Healthcare is adjusted.
              </p>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
              4 planning profiles
            </span>
          </div>

          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="text-[11px] leading-5 text-blue-900 dark:text-blue-200">
              <strong>How to read this chart:</strong> Each coloured line
              represents a district. The vertical position shows its priority
              rank under each planning profile. Rank 1 is the highest assessed
              priority. A line that moves up or down indicates that the
              district's position changes when sector weights change.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {movementLoading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <RefreshCw className="mb-3 animate-spin text-[#DC2626]" size={25} />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Comparing district rankings across four planning profiles...
              </p>
            </div>
          ) : movementError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              <p className="font-bold">Ranking movement could not be calculated.</p>
              <p className="mt-1">{movementError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-[#172554] px-3 py-2 text-[11px] font-bold text-white"
              >
                Reload analytics
              </button>
            </div>
          ) : movementData.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-center text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              No ranking movement data is available.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold text-[#172554] dark:text-white">
                    Choose districts to compare
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    All districts are shown initially. Hide districts to focus on a smaller group.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={selectAllMovementDistricts}
                    disabled={selectedMovementCount === movementDistricts.length}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Eye size={12} />
                      Show all
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={clearMovementDistricts}
                    disabled={selectedMovementCount === 0}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <EyeOff size={12} />
                      Clear selection
                    </span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {movementDistricts.map((district, index) => {
                  const active = selectedMovementDistricts.includes(district)
                  const colour = DISTRICT_COLOURS[index % DISTRICT_COLOURS.length]

                  return (
                    <button
                      type="button"
                      key={district}
                      onClick={() => toggleMovementDistrict(district)}
                      aria-pressed={active}
                      className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-2 text-[10px] font-bold transition ${
                        active
                          ? 'border-slate-300 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                          : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: colour,
                          opacity: active ? 1 : 0.3,
                        }}
                      />
                      {district}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                  {selectedMovementCount} of {movementDistricts.length} districts displayed
                </p>
                <p className="text-[10px] text-slate-400">
                  Higher position on chart = higher priority
                </p>
              </div>

              {selectedMovementCount === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center dark:border-slate-700 dark:bg-slate-800/40">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    No districts selected
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Select one or more districts above to display their ranking movement.
                  </p>
                  <button
                    type="button"
                    onClick={selectAllMovementDistricts}
                    className="mt-3 rounded-lg bg-[#172554] px-4 py-2 text-[10px] font-bold text-white dark:bg-[#DC2626]"
                  >
                    Show all districts
                  </button>
                </div>
              ) : (
                <div className="mt-5 h-[360px] w-full sm:h-[430px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={movementData}
                      margin={{ top: 12, right: 20, left: 2, bottom: 8 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#CBD5E1"
                        opacity={0.55}
                      />
                      <XAxis
                        dataKey="profile"
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        axisLine={{ stroke: '#CBD5E1' }}
                        tickLine={false}
                        interval={0}
                      />
                      <YAxis
                        type="number"
                        domain={[1, movementDistricts.length || 13]}
                        reversed
                        allowDecimals={false}
                        ticks={Array.from(
                          { length: movementDistricts.length || 13 },
                          (_, index) => index + 1
                        )}
                        tickFormatter={(value) => `#${value}`}
                        tick={{ fontSize: 10, fill: '#64748B' }}
                        axisLine={false}
                        tickLine={false}
                        width={42}
                      />
                      <Tooltip content={<RankingMovementTooltip />} />

                      {movementDistricts.map((district, index) =>
                        selectedMovementDistricts.includes(district) ? (
                          <Line
                            key={district}
                            type="linear"
                            dataKey={district}
                            name={district}
                            stroke={DISTRICT_COLOURS[index % DISTRICT_COLOURS.length]}
                            strokeWidth={2.5}
                            dot={{
                              r: 4,
                              strokeWidth: 1.5,
                              fill: '#FFFFFF',
                            }}
                            activeDot={{ r: 6, strokeWidth: 2 }}
                            connectNulls={false}
                            isAnimationActive={false}
                          />
                        ) : null
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {movementInsight && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <Lightbulb size={17} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
                    <div>
                      <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                        What should users notice?
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-amber-900/80 dark:text-amber-100/80">
                        {movementInsight.change === 0 ? (
                          <>
                            The district rankings remain unchanged for all four
                            profiles, based on the returned ranking data.
                          </>
                        ) : (
                          <>
                            <strong>{movementInsight.district}</strong> has the
                            largest change in rank across the four profiles:
                            its position varies by {movementInsight.change}{' '}
                            {movementInsight.change === 1 ? 'place' : 'places'}.
                            This helps show how sensitive district priorities
                            can be to the selected sector weights.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <p className="mt-4 text-[10px] leading-5 text-slate-500 dark:text-slate-400">
            The four profiles use the same underlying district indicators but
            apply different sector weights. A change in rank reflects a change
            in the model's relative priority order, not a change in the
            district's underlying conditions. These are planning comparisons,
            not official government rankings.
          </p>
        </div>
      </section>

      {/* Comprehensive rankings */}
      <section className={`${panelClass} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#DC2626]" />
              <h2 className={sectionTitleClass}>District Priority Rankings</h2>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Overall ranking based on the weights used for this calculation.
            </p>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search district..."
              aria-label="Search districts"
              className="w-48 rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs outline-none transition focus:border-[#DC2626] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-5 pt-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
            Top three priority positions
          </span>
          <span className="text-[10px] text-slate-400">
            {filteredRankings.length} of {rankings.length} districts shown
          </span>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-5 py-3 sm:px-6">Rank</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3 text-right">Education</th>
                <th className="px-4 py-3 text-right">Water</th>
                <th className="px-4 py-3 text-right">Healthcare</th>
                <th className="px-5 py-3 text-right sm:px-6">Overall score</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70">
              {filteredRankings.map((item) => {
                const rank = number(item.policy_priority_rank)
                const topThree = rank <= 3

                return (
                  <tr
                    key={item.district}
                    className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <span
                        className={`inline-flex h-7 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-extrabold ${
                          topThree
                            ? 'bg-[#DC2626] text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {`#${item.policy_priority_rank}`}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-[#172554] dark:text-slate-100">
                      {item.district}
                    </td>

                    <td className="px-4 py-3.5 text-right text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {formatScore(item.education_need_score)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {formatScore(item.water_need_score)}
                    </td>

                    <td className="px-4 py-3.5 text-right text-xs tabular-nums text-slate-600 dark:text-slate-300">
                      {formatScore(item.healthcare_need_score)}
                    </td>

                    <td className="px-5 py-3.5 text-right text-xs font-extrabold tabular-nums text-[#DC2626] sm:px-6">
                      {formatScore(item.policy_need_score)}
                    </td>
                  </tr>
                )
              })}

              {filteredRankings.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-5 py-10 text-center text-xs text-slate-400"
                  >
                    No districts match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-700 sm:px-6">
          <p className="text-[10px] text-slate-400">
            Rankings are calculated using the sector weights displayed above.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="rounded-2xl border border-[#172554]/15 bg-[#172554]/[0.04] p-5 dark:border-slate-700 dark:bg-[#111C30] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#172554] p-2 text-white dark:bg-[#DC2626]">
            <Info size={17} />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-[#172554] dark:text-white">
              Understanding the scores
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
              Overall priority scores combine education, water and healthcare
              need scores using the sector weights shown in the analysis
              configuration. A higher score indicates a higher relative
              assessed development need under the model. Changing the weights
              changes the relative priority ranking; it does not change the
              underlying empirical indicator data.
            </p>
            <p className="mt-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
              These scores are decision-support indicators. They should be
              interpreted alongside district context, data limitations and
              relevant administrative considerations.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
