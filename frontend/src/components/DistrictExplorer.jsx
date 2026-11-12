
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  RefreshCw,
  MapPinned,
  TrendingUp,
  Activity,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  GitCompareArrows,
  UserRound,
  X,
  Award,
  Layers,
  BarChart3,
  SlidersHorizontal,
  MapPin,
} from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
} from 'recharts'
import api from '../services/api'

const PALETTE = {
  navy: '#172554',
  blue: '#3976c5',
  violet: '#8b5cf6',
  teal: '#0d9488',
  coral: '#e34b61',
  amber: '#d97706',
  cyan: '#0891b2',
}

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN')

const formatScore = (value) =>
  value === null || value === undefined || value === ''
    ? 'Unavailable'
    : Number(value).toFixed(2)

const formatPercent = (value) =>
  value === null || value === undefined || value === ''
    ? '—'
    : `${Number(value).toFixed(2)}%`

const getRankColor = (rank) => {
  if (rank <= 2) return '#e34b61'
  if (rank <= 5) return '#d97706'
  if (rank <= 8) return '#3976c5'
  if (rank <= 11) return '#0d9488'
  return '#8b5cf6'
}

function Metric({
  label,
  value,
  note,
  icon: Icon,
  color = PALETTE.blue,
  tint = '#eaf2ff',
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-[#111C30] sm:p-5">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full opacity-[0.07] transition-transform duration-500 group-hover:scale-125"
        style={{ background: color }}
      />
      <div className="relative flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[1.1px] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon && (
          <span className="rounded-xl p-2.5" style={{ background: tint, color }}>
            <Icon size={18} />
          </span>
        )}
      </div>
      <p className="relative mt-4 truncate text-2xl font-extrabold tracking-tight text-[#172554] dark:text-white">
        {value}
      </p>
      {note && (
        <p className="relative mt-1 text-xs text-slate-500 dark:text-slate-400">
          {note}
        </p>
      )}
    </div>
  )
}

function SectionHeading({ title, description, color = PALETTE.blue, right }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 rounded-full" style={{ background: color }} />
          <h2 className="text-base font-extrabold text-[#172554] dark:text-white">
            {title}
          </h2>
        </div>
        {description && (
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

function SectorRadarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid stroke="#94a3b8" strokeOpacity={0.35} />
        <PolarAngleAxis
          dataKey="sector"
          tick={{
            fill: '#64748b',
            fontSize: 12,
            fontWeight: 700,
          }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tickCount={6}
          tick={{
            fill: '#94a3b8',
            fontSize: 10,
          }}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [
            `${Number(value).toFixed(2)} / 100`,
            'Sector need score',
          ]}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.10)',
          }}
        />
        <Radar
          name="Sector need score"
          dataKey="score"
          stroke={PALETTE.violet}
          fill={PALETTE.violet}
          fillOpacity={0.28}
          strokeWidth={3}
          dot={{
            r: 5,
            fill: PALETTE.violet,
            stroke: '#ffffff',
            strokeWidth: 2,
          }}
          activeDot={{
            r: 7,
            fill: PALETTE.coral,
            stroke: '#ffffff',
            strokeWidth: 2,
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

function DistrictExplorer({ districts, apiLoading, apiError, onRefresh }) {
  const [search, setSearch] = useState('')
  const [policyRankings, setPolicyRankings] = useState([])
  const [policyLoading, setPolicyLoading] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [selectedForComparison, setSelectedForComparison] = useState([])
  const [selectedRadarDistrict, setSelectedRadarDistrict] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchPolicyScores = async () => {
      try {
        setPolicyLoading(true)
        setPolicyError('')

        const response = await api.post('/policy/weights', {
          education_weight: 34,
          water_weight: 33,
          healthcare_weight: 33,
        })

        if (!cancelled) {
          setPolicyRankings(response.data.rankings || [])
        }
      } catch (error) {
        if (!cancelled) {
          setPolicyError(
            error.response?.data?.detail ||
            'Sector scores could not be loaded.'
          )
        }
      } finally {
        if (!cancelled) setPolicyLoading(false)
      }
    }

    fetchPolicyScores()

    return () => {
      cancelled = true
    }
  }, [])

  const policyMap = useMemo(
    () => new Map(policyRankings.map((item) => [item.district, item])),
    [policyRankings]
  )

  const enrichedDistricts = useMemo(
    () =>
      districts.map((district) => ({
        ...district,
        ...(policyMap.get(district.district) || {}),
      })),
    [districts, policyMap]
  )

  const sortedDistricts = useMemo(
    () =>
      [...enrichedDistricts].sort(
        (a, b) =>
          Number(a.priority_rank || 999) -
          Number(b.priority_rank || 999)
      ),
    [enrichedDistricts]
  )

  const filteredDistricts = useMemo(
    () =>
      sortedDistricts.filter((district) =>
        district.district.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [sortedDistricts, search]
  )

  const topDistrict = sortedDistricts[0]

  // The radar chart uses existing sector scores returned by
  // POST /policy/weights. It does not generate or estimate values.
  const radarDistrict = enrichedDistricts.find(
    (district) => district.district === selectedRadarDistrict
  ) || topDistrict

  const radarData = useMemo(() => {
    if (!radarDistrict) return []

    return [
      {
        sector: 'Education',
        score: radarDistrict.education_need_score,
      },
      {
        sector: 'Water',
        score: radarDistrict.water_need_score,
      },
      {
        sector: 'Healthcare',
        score: radarDistrict.healthcare_need_score,
      },
    ].map((item) => ({
      ...item,
      score:
        item.score === null ||
        item.score === undefined ||
        item.score === ''
          ? null
          : Number(item.score),
    }))
  }, [radarDistrict])

  const radarHasValidScores =
    radarData.length === 3 &&
    radarData.every(
      (item) =>
        item.score !== null &&
        Number.isFinite(item.score)
    )

  const averageNeedScore = districts.length
    ? districts.reduce(
        (sum, district) =>
          sum + Number(district.revised_need_score || 0),
        0
      ) / districts.length
    : 0

  const maximumNeedScore = Math.max(
    1,
    ...sortedDistricts.map((district) =>
      Number(district.revised_need_score || 0)
    )
  )

  const profile = selectedProfile
    ? enrichedDistricts.find(
        (district) => district.district === selectedProfile
      )
    : null

  const comparisonDistricts = selectedForComparison
    .map((name) =>
      enrichedDistricts.find((district) => district.district === name)
    )
    .filter(Boolean)

  const toggleComparison = (districtName) => {
    setSelectedForComparison((current) => {
      if (current.includes(districtName)) {
        return current.filter((name) => name !== districtName)
      }
      if (current.length >= 3) return current
      return [...current, districtName]
    })
  }

  if (apiLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-[#111C30]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40">
            <RefreshCw className="animate-spin text-[#3976c5]" size={25} />
          </div>
          <p className="text-sm font-bold text-[#172554] dark:text-white">
            Loading district intelligence
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Retrieving district indicators and rankings...
          </p>
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900/50 dark:bg-[#111C30]">
        <Info className="mx-auto mb-3 text-[#e34b61]" size={32} />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Unable to load district data
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {apiError}
        </p>
        <button
          onClick={onRefresh}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#172554] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#263d78]"
        >
          <RefreshCw size={14} />
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-7 pb-10">

      {/* SUMMARY METRICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Districts Covered"
          value={districts.length}
          note="Districts in the Uttarakhand baseline"
          icon={MapPinned}
          color={PALETTE.blue}
          tint="#eaf2ff"
        />
        <Metric
          label="Top Priority District"
          value={topDistrict?.district || '—'}
          note="Highest ranked by assessed need"
          icon={Award}
          color={PALETTE.coral}
          tint="#fff0f2"
        />
        <Metric
          label="Highest Need Score"
          value={formatScore(topDistrict?.revised_need_score)}
          note="Top assessed developmental need"
          icon={TrendingUp}
          color={PALETTE.violet}
          tint="#f1eaff"
        />
        <Metric
          label="Average Need Score"
          value={formatScore(averageNeedScore)}
          note="Average across available districts"
          icon={Activity}
          color={PALETTE.teal}
          tint="#e6fffb"
        />
      </section>

      {/* PRIORITY OVERVIEW */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30] sm:p-6">
        <SectionHeading
          title="District Priority Overview"
          description="A visual ranking of districts based on their revised need scores."
          color={PALETTE.violet}
          right={
            <span className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              NEED SCORE RANKING
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-x-8 gap-y-4 lg:grid-cols-2">
          {sortedDistricts.map((district) => {
            const score = Number(district.revised_need_score || 0)
            const rank = Number(district.priority_rank || 0)
            const color = getRankColor(rank)

            return (
              <div key={district.district} className="min-w-0">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold"
                      style={{ background: `${color}18`, color }}
                    >
                      {rank ? `#${rank}` : '—'}
                    </span>
                    <span className="truncate text-xs font-bold text-[#172554] dark:text-slate-200">
                      {district.district}
                    </span>
                  </div>
                  <span
                    className="shrink-0 text-xs font-extrabold tabular-nums"
                    style={{ color }}
                  >
                    {formatScore(district.revised_need_score)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(0, (score / maximumNeedScore) * 100)}%`,
                      background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          {[
            ['Very high priority', '#e34b61'],
            ['High priority', '#d97706'],
            ['Moderate priority', '#3976c5'],
            ['Lower priority', '#0d9488'],
            ['Lowest relative priority', '#8b5cf6'],
          ].map(([label, color]) => (
            <span key={label} className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* DISTRICT SECTOR RADAR */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30] sm:p-6">
        <SectionHeading
          title="District Sector Radar"
          description="Explore how the selected district scores across Education, Water and Healthcare."
          color={PALETTE.violet}
          right={
            <span className="rounded-lg bg-violet-50 px-3 py-2 text-[10px] font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
              SECTOR COMPARISON
            </span>
          }
        />

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Select a district
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              The chart updates using that district's existing sector scores.
            </p>
          </div>

          <select
            value={radarDistrict?.district || ''}
            onChange={(event) => setSelectedRadarDistrict(event.target.value)}
            disabled={sortedDistricts.length === 0}
            className="min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#172554] outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-violet-900/40"
          >
            {sortedDistricts.map((district) => (
              <option key={district.district} value={district.district}>
                {district.district}
              </option>
            ))}
          </select>
        </div>

        {policyLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-3 animate-spin text-violet-500" size={25} />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Loading sector scores...
              </p>
            </div>
          </div>
        ) : policyError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/40 dark:bg-amber-950/20">
            <Info className="mx-auto mb-2 text-amber-600" size={25} />
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Sector scores are unavailable
            </p>
            <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/70">
              {policyError}
            </p>
          </div>
        ) : !radarHasValidScores ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <BarChart3 className="mx-auto mb-3 text-slate-400" size={28} />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Complete sector scores are not available
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              The radar chart needs valid Education, Water and Healthcare scores for this district.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.8fr)]">
              <div className="h-[320px] min-w-0 sm:h-[370px]">
                <SectorRadarChart data={radarData} />
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#3976c5]" />
                    <p className="text-xs font-extrabold text-[#172554] dark:text-blue-200">
                      Education
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#3976c5]">
                    {formatScore(radarData[0].score)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Sector need score
                  </p>
                </div>

                <div className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#0d9488]" />
                    <p className="text-xs font-extrabold text-[#172554] dark:text-teal-200">
                      Water
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#0d9488]">
                    {formatScore(radarData[1].score)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Sector need score
                  </p>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#e34b61]" />
                    <p className="text-xs font-extrabold text-[#172554] dark:text-rose-200">
                      Healthcare
                    </p>
                  </div>
                  <p className="mt-2 text-2xl font-extrabold tabular-nums text-[#e34b61]">
                    {formatScore(radarData[2].score)}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Sector need score
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900/40">
              <Info className="mt-0.5 shrink-0 text-slate-500" size={15} />
              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                These are model-based sector need scores on a 0–100 scale. A higher score indicates greater assessed need in that sector; it does not mean better service performance or greater funding already received.
              </p>
            </div>
          </>
        )}
      </section>

      {/* DISTRICT TABLE */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
        <div className="border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
          <SectionHeading
            title="District Index & Indicators"
            description="Search districts, inspect their indicators and select up to three for comparison."
            color={PALETTE.coral}
            right={
              <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {selectedForComparison.length}/3 SELECTED
              </span>
            }
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search district name..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900 dark:focus:ring-blue-900/40"
              />
            </div>

            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <SlidersHorizontal size={13} />
              Showing {filteredDistricts.length} of {districts.length}
            </span>

            {selectedForComparison.length > 0 && (
              <button
                onClick={() => setSelectedForComparison([])}
                className="text-xs font-bold text-[#e34b61] transition hover:underline"
              >
                Clear selection
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table w-full min-w-[1100px] text-left">
            <thead>
              <tr>
                <th className="w-16">Compare</th>
                <th>Priority</th>
                <th>District</th>
                <th>Need Score</th>
                <th>Population</th>
                <th>Pop. Share</th>
                <th>Need Share</th>
                <th>Need–Pop Gap</th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {filteredDistricts.map((district) => {
                const gap = Number(district.share_difference || 0)
                const checked = selectedForComparison.includes(district.district)
                const rankColor = getRankColor(Number(district.priority_rank || 99))

                return (
                  <tr key={district.district}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && selectedForComparison.length >= 3}
                        onChange={() => toggleComparison(district.district)}
                        aria-label={`Compare ${district.district}`}
                        className="h-4 w-4 rounded accent-[#e34b61] disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                    <td>
                      <span
                        className="inline-flex h-7 min-w-[30px] items-center justify-center rounded-lg px-2 text-xs font-extrabold"
                        style={{ background: `${rankColor}18`, color: rankColor }}
                      >
                        #{district.priority_rank}
                      </span>
                    </td>
                    <td className="whitespace-nowrap font-bold text-[#172554] dark:text-slate-100">
                      {district.district}
                    </td>
                    <td className="font-extrabold text-slate-800 dark:text-slate-200">
                      {formatScore(district.revised_need_score)}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {formatNumber(district.total_population)}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {formatPercent(district.population_share_percent)}
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">
                      {formatPercent(district.need_score_share_percent)}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          gap > 0
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                            : gap < 0
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {gap > 0 ? <TrendingUp size={12} /> : gap < 0 ? <ArrowDownRight size={12} /> : null}
                        {gap > 0 ? '+' : ''}{gap.toFixed(2)} pp
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedProfile(district.district)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#172554] transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Profile
                        <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredDistricts.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-5 py-10 text-center text-xs text-slate-400">
                    No districts found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* COMPARISON MATRIX */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30] sm:p-6">
        <SectionHeading
          title="Multi-District Comparison"
          description="Compare population, need distribution and sector indicators side by side."
          color={PALETTE.teal}
          right={
            <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
              UP TO 3 DISTRICTS
            </span>
          }
        />

        {selectedForComparison.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
            <GitCompareArrows className="mx-auto mb-3 text-slate-400" size={27} />
            <p className="text-sm font-bold text-[#172554] dark:text-white">
              No districts selected yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
              Select the checkboxes in the district table above to build a head-to-head comparison.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="gov-table w-full min-w-[650px] text-sm">
              <thead>
                <tr>
                  <th className="text-left">Indicator</th>
                  {comparisonDistricts.map((district, index) => (
                    <th key={district.district} className="text-left">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background: [PALETTE.blue, PALETTE.coral, PALETTE.teal][index],
                          }}
                        />
                        {district.district}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Priority rank', (d) => `#${d.priority_rank}`],
                  ['Total population', (d) => formatNumber(d.total_population)],
                  ['Population share', (d) => formatPercent(d.population_share_percent)],
                  ['Revised need score', (d) => formatScore(d.revised_need_score)],
                  ['Need score share', (d) => formatPercent(d.need_score_share_percent)],
                  ['Need–population gap', (d) => `${Number(d.share_difference || 0).toFixed(2)} pp`],
                  ['Education sector score', (d) => formatScore(d.education_need_score)],
                  ['Water sector score', (d) => formatScore(d.water_need_score)],
                  ['Healthcare sector score', (d) => formatScore(d.healthcare_need_score)],
                  ['Composite policy score', (d) => formatScore(d.policy_need_score)],
                ].map(([label, getValue]) => (
                  <tr key={label}>
                    <td className="font-semibold text-slate-600 dark:text-slate-300">
                      {label}
                    </td>
                    {comparisonDistricts.map((district) => (
                      <td key={district.district} className="font-bold text-[#172554] dark:text-slate-100">
                        {getValue(district)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {policyLoading && (
          <p className="mt-3 text-xs text-slate-400">
            Updating sector comparison metrics...
          </p>
        )}
        {policyError && (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            Sector-specific metrics are temporarily unavailable. Baseline indicator comparisons remain accessible.
          </p>
        )}
      </section>

      {/* DISTRICT PROFILE */}
      {profile && (
        <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#172554] via-[#203b72] to-[#126b80] p-5 text-white sm:p-6">
            <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[24px] border-white/[0.07]" />
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-white/20 bg-white/10 p-3">
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[1.7px] text-cyan-200">
                    District Development Profile
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">
                    {profile.district}
                  </h2>
                  <p className="mt-1 text-xs text-blue-100/80">
                    Comprehensive district indicator summary
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProfile(null)}
                className="rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                aria-label="Close district profile"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Priority Rank" value={`#${profile.priority_rank}`} note="Based on revised need score" icon={Award} color={PALETTE.coral} tint="#fff0f2" />
              <Metric label="Total Population" value={formatNumber(profile.total_population)} icon={Users} color={PALETTE.blue} tint="#eaf2ff" />
              <Metric label="Male Population" value={formatNumber(profile.male_population)} icon={UserRound} color={PALETTE.violet} tint="#f1eaff" />
              <Metric label="Female Population" value={formatNumber(profile.female_population)} icon={Users} color={PALETTE.teal} tint="#e6fffb" />
              <Metric label="Revised Need Score" value={formatScore(profile.revised_need_score)} color={PALETTE.coral} tint="#fff0f2" />
              <Metric label="Population Share" value={formatPercent(profile.population_share_percent)} color={PALETTE.blue} tint="#eaf2ff" />
              <Metric label="Need Score Share" value={formatPercent(profile.need_score_share_percent)} color={PALETTE.violet} tint="#f1eaff" />
              <Metric label="Need–Population Gap" value={`${Number(profile.share_difference || 0).toFixed(2)} pp`} note="Need share minus population share" icon={Layers} color={PALETTE.amber} tint="#fff7e8" />
            </div>

            <div className="border-t border-slate-100 pt-5 dark:border-slate-700">
              <SectionHeading
                title="Sector Dimension Breakdown"
                description="Calculated using baseline state weights: Education 34%, Water 33%, Healthcare 33%."
                color={PALETTE.teal}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Education Sector', value: profile.education_need_score, color: PALETTE.blue, tint: '#eaf2ff', icon: BarChart3 },
                  { label: 'Water Resources', value: profile.water_need_score, color: PALETTE.teal, tint: '#e6fffb', icon: Activity },
                  { label: 'Healthcare Infrastructure', value: profile.healthcare_need_score, color: PALETTE.coral, tint: '#fff0f2', icon: Users },
                  { label: 'Composite Policy Need', value: profile.policy_need_score, color: PALETTE.violet, tint: '#f1eaff', icon: TrendingUp },
                ].map((item) => (
                  <Metric
                    key={item.label}
                    label={item.label}
                    value={formatScore(item.value)}
                    icon={item.icon}
                    color={item.color}
                    tint={item.tint}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-cyan-950/20">
              <Info size={16} className="mt-0.5 shrink-0 text-blue-700 dark:text-blue-300" />
              <p className="text-xs leading-5 text-blue-950/80 dark:text-blue-200/80">
                Planning figures reflect empirical indicator synthesis and model assumptions. A positive need–population gap indicates that the district holds a larger share of the assessed development need than its share of the state's population.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* METHODOLOGY */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30] sm:p-6">
        <SectionHeading
          title="Understanding the Need–Population Variance"
          description="This comparison helps distinguish demographic size from assessed development need."
          color={PALETTE.amber}
        />

        <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/25 dark:to-orange-950/20">
          <p className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
            Variance formula
          </p>
          <p className="mt-1 text-sm font-bold text-amber-900 dark:text-amber-100">
            Need Score Share (%) − Population Share (%)
          </p>
          <p className="mt-1 text-[10px] text-amber-800/70 dark:text-amber-200/70">
            Expressed in percentage points (pp).
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              label: 'Positive variance (+)',
              description: 'Assessed need share is higher than population share.',
              color: PALETTE.teal,
            },
            {
              label: 'Negative variance (−)',
              description: 'Population share is higher than assessed need share.',
              color: PALETTE.amber,
            },
            {
              label: 'Near parity',
              description: 'Assessed need share is close to population share.',
              color: PALETTE.blue,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                <p className="text-xs font-extrabold text-[#172554] dark:text-white">
                  {item.label}
                </p>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-900/40">
          <Info size={15} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            Priority rankings and need scores are model-based analytical indicators. They should be interpreted alongside district context, data quality, model assumptions and implementation requirements—not as official government decisions.
          </p>
        </div>
      </section>
    </div>
  )
}

export default DistrictExplorer
