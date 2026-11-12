
import { useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  RefreshCw,
  Wallet,
  SlidersHorizontal,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Target,
  ChevronRight,
  ChartNoAxesCombined,
} from 'lucide-react'
import api from '../services/api'

const INITIAL_WEIGHTS = {
  education: 40,
  water: 30,
  healthcare: 30,
}

const MIN_TOTAL_BUDGET = 260
const MAX_TOTAL_BUDGET = 910

const formatAmount = (value) =>
  `₹${Number(value || 0).toFixed(2)} Cr`

const sectorInfo = [
  {
    key: 'education',
    label: 'Education',
    description: 'Schools, learning and educational infrastructure',
    color: '#60A5FA',
    light: 'bg-blue-400',
  },
  {
    key: 'water',
    label: 'Water',
    description: 'Water access and infrastructure',
    color: '#2DD4BF',
    light: 'bg-teal-400',
  },
  {
    key: 'healthcare',
    label: 'Healthcare',
    description: 'Healthcare access and service needs',
    color: '#C084FC',
    light: 'bg-purple-400',
  },
]

function SectionHeading({ eyebrow, title, description, icon: Icon }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5">
        <Icon size={19} className="text-blue-700" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  )
}

function MetricCard({ title, value, subtitle, icon: Icon, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className={`absolute right-0 top-0 h-24 w-24 rounded-full opacity-[0.08] blur-2xl ${accent}`} />
      <div className="relative flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <div className={`rounded-xl p-2.5 ${accent}`}>
          <Icon size={19} className="text-white" />
        </div>
      </div>
      <p className="relative mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 shadow-2xl">
      <p className="mb-2 text-sm font-bold text-white">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="mt-1 text-xs text-slate-300">
          <span
            className="mr-2 inline-block h-2 w-2 rounded-full"
            style={{ background: item.color }}
          />
          {item.name}: <strong className="text-white">{formatAmount(item.value)}</strong>
        </p>
      ))}
    </div>
  )
}

export default function PolicyInsights({ user }) {
  const [budgets, setBudgets] = useState(['300', '500', '700'])
  const [weights, setWeights] = useState(INITIAL_WEIGHTS)
  const [results, setResults] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasCompared, setHasCompared] = useState(false)

  const weightTotal =
    Number(weights.education) +
    Number(weights.water) +
    Number(weights.healthcare)

  const validWeights =
    Object.values(weights).every(
      (value) =>
        value !== '' &&
        Number.isFinite(Number(value)) &&
        Number(value) >= 0 &&
        Number(value) <= 100
    ) && Math.abs(weightTotal - 100) < 0.001

  const numericBudgets = budgets.map(Number)

  const validBudgets =
    budgets.every(
      (value) =>
        value.trim() !== '' &&
        Number.isFinite(Number(value)) &&
        Number(value) >= MIN_TOTAL_BUDGET &&
        Number(value) <= MAX_TOTAL_BUDGET
    ) && new Set(numericBudgets).size === 3

  const handleBudgetChange = (index, value) => {
    setBudgets((previous) =>
      previous.map((budget, i) => (i === index ? value : budget))
    )
  }

  const handleWeightChange = (sector, value) => {
    setWeights((previous) => ({
      ...previous,
      [sector]: value,
    }))
  }

  const runComparison = async () => {
    if (!validBudgets) {
      setError(
        `Enter three different budgets between ₹${MIN_TOTAL_BUDGET} Cr and ₹${MAX_TOTAL_BUDGET} Cr.`
      )
      return
    }

    if (!validWeights) {
      setError('Sector weights must add up to exactly 100%.')
      return
    }

    if (!user || !['policy_maker', 'admin'].includes(user.role)) {
      setError('You must be an approved policy maker or admin to use this tool.')
      return
    }

    setLoading(true)
    setError('')
    setResults([])
    setHasCompared(false)

    try {
      const responses = await Promise.all(
        numericBudgets.map((budget) =>
          api.post('/policy/weights', {
            education_weight: Number(weights.education),
            water_weight: Number(weights.water),
            healthcare_weight: Number(weights.healthcare),
            budget_crore: budget,
            need_weight: 70,
            population_weight: 30,
            min_allocation_crore: 20,
            max_allocation_crore: 70,
          })
        )
      )

      const comparisons = responses.map((response, index) => {
        const data = response.data

        if (!data?.allocation?.allocations) {
          throw new Error(
            `The ₹${numericBudgets[index]} Cr response did not contain allocation data.`
          )
        }

        return {
          budget: numericBudgets[index],
          totalAllocated: data.allocation.total_allocated_crore,
          allocations: data.allocation.allocations,
          rankings: data.rankings || [],
        }
      })

      setResults(comparisons)
      setHasCompared(true)
      setSelectedDistrict(
        comparisons[0]?.allocations?.[0]?.district || ''
      )
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Unable to generate the comparison.'
      )
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    if (!results.length) return []

    const districtNames = [
      ...new Set(
        results.flatMap((scenario) =>
          scenario.allocations.map((item) => item.district)
        )
      ),
    ]

    return districtNames.map((district) => {
      const row = { district }

      results.forEach((scenario, index) => {
        const match = scenario.allocations.find(
          (item) => item.district === district
        )
        row[`scenario${index}`] = Number(
          match?.optimised_allocation_crore || 0
        )
      })

      return row
    })
  }, [results])

  const selectedDistrictData = useMemo(() => {
    if (!selectedDistrict || !results.length) return []

    return results.map((scenario) => {
      const item = scenario.allocations.find(
        (allocation) => allocation.district === selectedDistrict
      )

      return {
        budget: scenario.budget,
        allocation: Number(item?.optimised_allocation_crore || 0),
        target: Number(item?.target_allocation_crore || 0),
      }
    })
  }, [results, selectedDistrict])

  const insights = useMemo(() => {
    if (!results.length) return null

    const ordered = [...results].sort((a, b) => a.budget - b.budget)
    const low = ordered[0]
    const high = ordered[ordered.length - 1]

    const changes = low.allocations.map((item) => {
      const highItem = high.allocations.find(
        (entry) => entry.district === item.district
      )

      return {
        district: item.district,
        change:
          Number(highItem?.optimised_allocation_crore || 0) -
          Number(item.optimised_allocation_crore || 0),
      }
    })

    const sorted = [...changes].sort((a, b) => b.change - a.change)

    return {
      highestGain: sorted[0],
      smallestChange: sorted[sorted.length - 1],
      lowBudget: low.budget,
      highBudget: high.budget,
    }
  }, [results])

  const exportCSV = () => {
    if (!results.length) return

    const headers = [
      'District',
      ...results.map((item) => `Budget_${item.budget}_Cr`),
    ]

    const rows = chartData.map((row) => [
      row.district,
      ...results.map((scenario, index) => row[`scenario${index}`] ?? 0),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'GovOpt_Policy_Insights.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const resetSettings = () => {
    setBudgets(['300', '500', '700'])
    setWeights(INITIAL_WEIGHTS)
    setResults([])
    setSelectedDistrict('')
    setError('')
    setHasCompared(false)
  }

  return (
    <div className="space-y-7 pb-10">
      {/* PREMIUM HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0B1530] p-6 text-white shadow-xl md:p-9">
        <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-200">
              <Sparkles size={14} />
              POLICY INTELLIGENCE CENTER
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Policy Insights
              <span className="mt-1 block bg-gradient-to-r from-blue-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                Plan smarter. Allocate better.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 md:text-base">
              Explore budget scenarios, adjust development priorities and
              understand how policy choices influence district-level
              resource distribution across Uttarakhand.
            </p>
          </div>

          <div className="flex min-w-[190px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md">
            <div className="rounded-xl bg-emerald-400/15 p-3">
              <ShieldCheck size={23} className="text-emerald-300" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Workspace access</p>
              <p className="mt-1 font-semibold text-white">Policy planning</p>
              <p className="mt-1 text-[10px] text-emerald-300">Authorized workspace</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          <div>
            <p className="text-xl font-bold text-white">13</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
              Districts
            </p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">3</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
              Sectors
            </p>
          </div>
          <div>
            <p className="text-xl font-bold text-white">Flexible</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 sm:text-xs">
              Budget scenarios
            </p>
          </div>
        </div>
      </section>

      {/* BUDGET CONFIGURATION */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <SectionHeading
          eyebrow="01 / Scenario design"
          title="Budget configuration"
          description="Set three different budget amounts to evaluate alternative funding scenarios."
          icon={Wallet}
        />

        <div className="grid gap-4 md:grid-cols-3">
          {budgets.map((budget, index) => {
            const colors = [
              'border-blue-200 bg-blue-50/70',
              'border-teal-200 bg-teal-50/70',
              'border-purple-200 bg-purple-50/70',
            ]

            const labels = ['Conservative', 'Moderate', 'Expanded']
            const dots = ['bg-blue-500', 'bg-teal-500', 'bg-purple-500']

            return (
              <div
                key={index}
                className={`rounded-2xl border p-5 transition duration-200 hover:-translate-y-1 hover:shadow-md ${colors[index]}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Scenario 0{index + 1}
                  </span>
                  <span className={`h-2.5 w-2.5 rounded-full ${dots[index]}`} />
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {labels[index]}
                </p>

                <div className="mt-4 flex items-center rounded-xl border border-white bg-white px-3 shadow-sm">
                  <span className="text-lg font-semibold text-slate-400">₹</span>
                  <input
                    type="number"
                    min={MIN_TOTAL_BUDGET}
                    max={MAX_TOTAL_BUDGET}
                    step="1"
                    value={budget}
                    onChange={(event) =>
                      handleBudgetChange(index, event.target.value)
                    }
                    className="w-full bg-transparent px-2 py-3 text-xl font-bold text-slate-900 outline-none"
                    aria-label={`Scenario ${index + 1} budget in crore`}
                  />
                  <span className="text-xs font-semibold text-slate-400">Cr</span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <Activity size={15} className="text-blue-600" />
          <span>
            Supported total budget: ₹260–₹910 Cr, based on the current
            optimizer's ₹20–₹70 Cr per-district allocation limits.
          </span>
        </div>
      </section>

      {/* PRIORITY CONTROLS */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <SectionHeading
          eyebrow="02 / Policy preferences"
          title="Sector priority distribution"
          description="Choose how much importance each sector receives in the policy need score."
          icon={SlidersHorizontal}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {sectorInfo.map((sector) => (
            <div
              key={sector.key}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800">{sector.label}</h3>
                <span
                  className="rounded-lg px-3 py-1 text-sm font-bold"
                  style={{
                    color: sector.color,
                    backgroundColor: `${sector.color}18`,
                  }}
                >
                  {weights[sector.key]}%
                </span>
              </div>

              <p className="mt-1 min-h-9 text-xs leading-5 text-slate-500">
                {sector.description}
              </p>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={weights[sector.key]}
                onChange={(event) =>
                  handleWeightChange(sector.key, event.target.value)
                }
                className="mt-5 w-full cursor-pointer accent-blue-600"
                aria-label={`${sector.label} priority weight`}
              />

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">
                  0%
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  100%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-[#0B1530] p-5 text-white">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Combined priority weight
              </p>
              <p className="mt-1 text-2xl font-bold">
                {weightTotal}
                <span className="text-base text-slate-400"> / 100%</span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                All sector weights must total 100%.
              </p>
            </div>

            <div className="w-full max-w-sm">
              <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
                {sectorInfo.map((sector) => (
                  <div
                    key={sector.key}
                    style={{
                      width: `${Math.max(0, Number(weights[sector.key]) || 0)}%`,
                      backgroundColor: sector.color,
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {sectorInfo.map((sector) => (
                  <span
                    key={sector.key}
                    className="flex items-center gap-1.5 text-[10px] text-slate-300"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: sector.color }}
                    />
                    {sector.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!validWeights && (
          <p className="mt-3 text-sm font-medium text-rose-600">
            Adjust the sector weights until they add up to exactly 100%.
          </p>
        )}

        {!validBudgets && (
          <p className="mt-3 text-sm font-medium text-rose-600">
            Enter three different budgets between ₹260 Cr and ₹910 Cr.
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={runComparison}
            disabled={loading || !validBudgets || !validWeights}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Calculating scenarios...
              </>
            ) : (
              <>
                <ChartNoAxesCombined size={17} />
                Generate policy comparison
                <ChevronRight size={17} />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetSettings}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>
      </section>

      {/* RESULTS */}
      {hasCompared && results.length === 3 && (
        <>
          <section>
            <SectionHeading
              eyebrow="03 / Model output"
              title="Scenario overview"
              description="Summary of the optimized allocations returned by the model."
              icon={Target}
            />

            <div className="grid gap-4 md:grid-cols-3">
              {results.map((scenario, index) => (
                <MetricCard
                  key={scenario.budget}
                  title={`Scenario 0${index + 1} · ₹${scenario.budget} Cr`}
                  value={formatAmount(scenario.totalAllocated)}
                  subtitle="Total optimized allocation"
                  icon={Wallet}
                  accent={[
                    'bg-blue-600',
                    'bg-teal-600',
                    'bg-purple-600',
                  ][index]}
                />
              ))}
            </div>
          </section>

          {/* CHART */}
          <section className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0B1530] p-5 text-white shadow-xl md:p-7">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  District distribution
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Allocation comparison
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Compare the optimized allocation of all 13 districts.
                </p>
              </div>

              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <Download size={15} />
                Export comparison
              </button>
            </div>

            <div className="h-[390px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 65 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#263451"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="district"
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={85}
                    tick={{ fontSize: 10, fill: '#A8B4CA' }}
                    axisLine={{ stroke: '#33415F' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#A8B4CA' }}
                    tickFormatter={(value) => `₹${value}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{
                      fontSize: '11px',
                      paddingBottom: '18px',
                      color: '#CBD5E1',
                    }}
                  />
                  <Bar
                    dataKey="scenario0"
                    name={`₹${results[0].budget} Cr`}
                    fill="#60A5FA"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="scenario1"
                    name={`₹${results[1].budget} Cr`}
                    fill="#2DD4BF"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={20}
                  />
                  <Bar
                    dataKey="scenario2"
                    name={`₹${results[2].budget} Cr`}
                    fill="#C084FC"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* DISTRICT ANALYSIS */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
            <SectionHeading
              eyebrow="04 / District analysis"
              title="Explore district allocations"
              description="Inspect how one district's optimized allocation changes across scenarios."
              icon={Activity}
            />

            <select
              value={selectedDistrict}
              onChange={(event) => setSelectedDistrict(event.target.value)}
              className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
            >
              {chartData.map((item) => (
                <option key={item.district} value={item.district}>
                  {item.district}
                </option>
              ))}
            </select>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {selectedDistrictData.map((item, index) => (
                <div
                  key={item.budget}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      ₹{item.budget} Cr scenario
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        ['bg-blue-500', 'bg-teal-500', 'bg-purple-500'][index]
                      }`}
                    />
                  </div>

                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {formatAmount(item.allocation)}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Target allocation: {formatAmount(item.target)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* INSIGHTS */}
          {insights && (
            <section>
              <SectionHeading
                eyebrow="05 / Key observations"
                title="Allocation insights"
                description={`District changes between ₹${insights.lowBudget} Cr and ₹${insights.highBudget} Cr scenarios.`}
                icon={Sparkles}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
                  <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-emerald-200/30 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <ArrowUpRight size={17} />
                      Largest allocation increase
                    </div>
                    <p className="mt-4 text-xl font-bold text-slate-900">
                      {insights.highestGain?.district || '—'}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-700">
                      +{formatAmount(insights.highestGain?.change)}
                    </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
                  <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-amber-200/30 blur-2xl" />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700">
                      <ArrowDownRight size={17} />
                      Smallest allocation change
                    </div>
                    <p className="mt-4 text-xl font-bold text-slate-900">
                      {insights.smallestChange?.district || '—'}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-amber-700">
                      {insights.smallestChange?.change >= 0 ? '+' : ''}
                      {formatAmount(insights.smallestChange?.change)}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-400">
                These are model-derived differences between the lowest and
                highest entered budgets, not actual government spending.
              </p>
            </section>
          )}

          {/* TABLE */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                  Detailed breakdown
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  District allocation matrix
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Optimized allocation amounts in crore rupees.
                </p>
              </div>

              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Download size={15} />
                Download CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">District</th>
                    {results.map((scenario, index) => (
                      <th key={scenario.budget} className="px-5 py-4 text-right">
                        <span
                          className={[
                            'mr-2 inline-block h-2 w-2 rounded-full',
                            'bg-blue-500',
                            'bg-teal-500',
                            'bg-purple-500',
                          ][index]}
                        />
                        ₹{scenario.budget} Cr
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {chartData.map((row) => (
                    <tr
                      key={row.district}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {row.district}
                      </td>
                      {results.map((scenario, index) => (
                        <td
                          key={scenario.budget}
                          className="px-5 py-3.5 text-right font-medium tabular-nums text-slate-600"
                        >
                          {formatAmount(row[`scenario${index}`])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {!hasCompared && (
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-[#0B1530] p-8 text-center text-white md:p-12">
          <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]">
              <ChartNoAxesCombined size={29} className="text-cyan-300" />
            </div>
            <h3 className="mt-5 text-xl font-bold">
              Your policy analysis starts here
            </h3>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-400">
              Configure your budget scenarios and sector priorities above.
              Generate a comparison to explore district-level allocation
              patterns and identify changes across funding scenarios.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-200">
              <Activity size={14} />
              Waiting for scenario configuration
            </div>
          </div>
        </section>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-slate-400" />
        <p className="text-xs leading-5 text-slate-500">
          GovOpt Policy Insights is a planning and simulation tool.
          Budgets entered here are hypothetical scenario inputs, not confirmed
          government sanctions or actual expenditure figures. Results depend
          on the current allocation model and its constraints.
        </p>
      </div>
    </div>
  )
}
