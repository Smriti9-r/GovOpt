

import React, { useEffect, useMemo, useState } from 'react'
import {
  Wallet, RefreshCw, TrendingUp, Search, ArrowUpDown, Info,
  BarChart3, Scale, ShieldCheck, CheckCircle2, MapPin,
  ArrowUpRight, ArrowDownRight, Landmark, SlidersHorizontal,
  Award, Target, IndianRupee
} from 'lucide-react'
import api from '../services/api'

const FINAL_ALLOCATION = [
  { district: 'Haridwar', amount: 70 },
  { district: 'Udham Singh Nagar', amount: 70 },
  { district: 'Dehradun', amount: 70 },
  { district: 'Nainital', amount: 70 },
  { district: 'Chamoli', amount: 60 },
  { district: 'Almora', amount: 20 },
  { district: 'Bageshwar', amount: 20 },
  { district: 'Champawat', amount: 20 },
  { district: 'Pauri Garhwal', amount: 20 },
  { district: 'Pithoragarh', amount: 20 },
  { district: 'Rudraprayag', amount: 20 },
  { district: 'Tehri Garhwal', amount: 20 },
  { district: 'Uttarkashi', amount: 20 },
]

const FINAL_TOTAL = FINAL_ALLOCATION.reduce(
  (sum, district) => sum + district.amount, 0
)

const SCENARIOS = {
  equal: {
    key: 'equal_allocation_crore',
    label: 'Equal Allocation',
    shortLabel: 'Equal',
    description: 'The total budget is divided equally among all 13 districts.',
    color: '#64748b',
    light: '#f1f5f9',
    dark: '#334155',
    icon: Scale,
  },
  need: {
    key: 'need_based_allocation_crore',
    label: 'Need-Based Allocation',
    shortLabel: 'Need-based',
    description: 'A larger share is assigned to districts with higher assessed needs.',
    color: '#e34b61',
    light: '#fff0f2',
    dark: '#9f263e',
    icon: TrendingUp,
  },
  guarantee: {
    key: 'minimum_guarantee_allocation_crore',
    label: 'Minimum Guarantee',
    shortLabel: 'Minimum guarantee',
    description: 'Need-based distribution with a minimum allocation safeguard for each district.',
    color: '#0d9488',
    light: '#e6fffb',
    dark: '#115e59',
    icon: ShieldCheck,
  },
}

const formatCr = (value) => `₹${Number(value || 0).toFixed(2)} Cr`

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })

const StatCard = ({ label, value, note, icon: Icon, color, tint }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-[#111C30]">
    <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
    <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-[0.07] transition-transform duration-500 group-hover:scale-125" style={{ background: color }} />
    <div className="relative flex items-center justify-between gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[1.3px] text-slate-500 dark:text-slate-400">{label}</p>
      <span className="rounded-xl p-2.5" style={{ background: tint, color }}>
        <Icon size={19} />
      </span>
    </div>
    <p className="relative mt-4 text-2xl font-extrabold tracking-tight text-[#172554] dark:text-white sm:text-[27px]">{value}</p>
    <p className="relative mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
  </div>
)

function FinalAllocationSection() {
  const [sortDirection, setSortDirection] = useState('desc')

  const sorted = useMemo(() => {
    return [...FINAL_ALLOCATION].sort((a, b) => {
      const difference = a.amount - b.amount
      return sortDirection === 'desc' ? -difference : difference
    })
  }, [sortDirection])

  return (
    <section className="overflow-hidden rounded-3xl border border-rose-200/70 bg-white shadow-sm dark:border-rose-900/40 dark:bg-[#111C30]">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#172554] via-[#263f78] to-[#087f8c] px-5 py-6 text-white sm:px-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-24 right-48 h-52 w-52 rounded-full bg-cyan-300/10 blur-2xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-white/10 px-3 py-1.5">
              <CheckCircle2 size={13} className="text-cyan-300" />
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-cyan-100">
                Recommended baseline allocation
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Final District Allocation
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-blue-100/80 sm:text-sm">
              Proposed distribution of the ₹500 crore planning budget
              using the need-based allocation model and district allocation limits.
            </p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-100">
              Total allocated
            </p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums">
              ₹500 Cr
            </p>
            <p className="mt-1 text-[10px] text-blue-100/70">
              100% of budget distributed
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Districts covered', value: '13', icon: MapPin },
            { label: 'Highest allocation', value: '₹70 Cr', icon: TrendingUp },
            { label: 'Lowest allocation', value: '₹20 Cr', icon: ShieldCheck },
            { label: 'Budget utilisation', value: '100%', icon: Target },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-xl border border-white/15 bg-white/[0.08] p-3">
                <div className="flex items-center gap-2 text-blue-100/70">
                  <Icon size={14} />
                  <span className="text-[9px] font-semibold uppercase tracking-wide">{item.label}</span>
                </div>
                <p className="mt-2 text-xl font-extrabold">{item.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr] sm:p-7">
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
                District allocation breakdown
              </h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Allocation amount in ₹ crore
              </p>
            </div>
            <button
              onClick={() => setSortDirection((current) => current === 'desc' ? 'asc' : 'desc')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ArrowUpDown size={13} />
              {sortDirection === 'desc' ? 'Highest first' : 'Lowest first'}
            </button>
          </div>

          <div className="space-y-3">
            {sorted.map((district, index) => {
              const isPriority = district.amount >= 60
              const width = (district.amount / 70) * 100

              return (
                <div key={district.district} className="group">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[9px] font-extrabold ${isPriority ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="truncate text-xs font-bold text-[#172554] dark:text-slate-200">
                        {district.district}
                      </span>
                    </div>
                    <span className={`shrink-0 text-xs font-extrabold tabular-nums ${isPriority ? 'text-rose-600 dark:text-rose-300' : 'text-slate-600 dark:text-slate-300'}`}>
                      ₹{district.amount} Cr
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${width}%`,
                        background: isPriority
                          ? 'linear-gradient(90deg, #e34b61, #f08b77)'
                          : 'linear-gradient(90deg, #3976c5, #45b7bd)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
              Final allocation matrix
            </h3>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Exact district-wise budget distribution
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="max-h-[440px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-slate-500">District</th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">Allocation</th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-500">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {FINAL_ALLOCATION.map((district) => (
                    <tr key={district.district} className="border-t border-slate-100 dark:border-slate-700/70">
                      <td className="px-3 py-3 text-xs font-semibold text-[#172554] dark:text-slate-200">
                        {district.district}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-extrabold tabular-nums text-[#172554] dark:text-white">
                        ₹{district.amount} Cr
                      </td>
                      <td className="px-3 py-3 text-right text-[10px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                        {(district.amount / FINAL_TOTAL * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <td className="px-3 py-3 text-xs font-extrabold text-[#172554] dark:text-white">Total</td>
                    <td className="px-3 py-3 text-right text-xs font-extrabold text-teal-700 dark:text-teal-300">₹500 Cr</td>
                    <td className="px-3 py-3 text-right text-[10px] font-extrabold text-teal-700 dark:text-teal-300">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 dark:border-cyan-900/40 dark:bg-cyan-950/20">
            <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-900 dark:text-cyan-300">
              <Award size={15} />
              Allocation summary
            </div>
            <p className="mt-2 text-[11px] leading-5 text-cyan-900/80 dark:text-cyan-200/70">
              Four districts receive ₹70 crore each, Chamoli receives ₹60 crore,
              and the remaining eight districts receive the ₹20 crore minimum.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-amber-100 bg-amber-50/70 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20 sm:px-7">
        <div className="flex items-start gap-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
          <p className="text-[11px] leading-5 text-amber-900/80 dark:text-amber-200/75">
            <strong>Methodology:</strong> This is the ₹500-crore baseline
            need-based model output with a ₹20 crore minimum and ₹70 crore
            maximum per district. It is an analytical recommendation, not an
            official government sanction or expenditure order. The figures
            should be reviewed alongside district context and implementation
            requirements.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Allocations() {
  const [allocations, setAllocations] = useState([])
  const [budget, setBudget] = useState(500)
  const [selectedScenario, setSelectedScenario] = useState('need')
  const [search, setSearch] = useState('')
  const [sortDirection, setSortDirection] = useState('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAllocations = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/allocations')
      const payload = response.data

      if (!Array.isArray(payload.allocations)) {
        throw new Error('The allocation data format is unexpected.')
      }

      setAllocations(payload.allocations)
      setBudget(Number(payload.budget_crore) || 500)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Unable to load allocation data.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllocations()
  }, [])

  const scenario = SCENARIOS[selectedScenario]

  const totals = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(SCENARIOS).map(([id, item]) => [
          id,
          allocations.reduce(
            (sum, district) => sum + Number(district[item.key] || 0),
            0
          ),
        ])
      ),
    [allocations]
  )

  const selectedTotal = totals[selectedScenario] || 0

  const highestDistrict = useMemo(() => {
    if (!allocations.length) return null
    return allocations.reduce((highest, current) =>
      Number(current[scenario.key] || 0) >
      Number(highest[scenario.key] || 0) ? current : highest
    )
  }, [allocations, scenario])

  const lowestDistrict = useMemo(() => {
    if (!allocations.length) return null
    return allocations.reduce((lowest, current) =>
      Number(current[scenario.key] || 0) <
      Number(lowest[scenario.key] || 0) ? current : lowest
    )
  }, [allocations, scenario])

  const filteredAllocations = useMemo(() => {
    const filtered = allocations.filter((item) =>
      item.district.toLowerCase().includes(search.toLowerCase())
    )

    return [...filtered].sort((a, b) => {
      const difference =
        Number(a[scenario.key] || 0) - Number(b[scenario.key] || 0)
      return sortDirection === 'desc' ? -difference : difference
    })
  }, [allocations, search, scenario, sortDirection])

  const maximumAllocation = useMemo(
    () =>
      Math.max(
        1,
        ...allocations.flatMap((item) =>
          Object.values(SCENARIOS).map((itemScenario) =>
            Number(item[itemScenario.key] || 0)
          )
        )
      ),
    [allocations]
  )

  const allocationShare = (value) =>
    selectedTotal > 0 ? (value / selectedTotal) * 100 : 0

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
            <RefreshCw className="animate-spin text-[#e34b61]" size={25} />
          </div>
          <p className="text-sm font-bold text-[#172554] dark:text-white">
            Loading district allocations
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Retrieving the latest model outputs...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center dark:border-rose-900/50 dark:bg-[#111C30]">
        <Info className="mx-auto mb-3 text-[#e34b61]" size={32} />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Unable to load allocations
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{error}</p>
        <button onClick={fetchAllocations} className="mt-5 rounded-xl bg-[#172554] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#263d78]">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-7 pb-10">
      {/* PAGE INTRO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#172554] via-[#203b72] to-[#126b80] px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[35px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-28 right-40 h-64 w-64 rounded-full bg-cyan-300/[0.08] blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              <span className="text-[10px] font-bold uppercase tracking-[1.8px] text-cyan-100">
                Uttarakhand · Resource Distribution
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">District Allocations</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
              Explore how different allocation strategies distribute the state resource envelope across Uttarakhand's 13 districts.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-blue-100/80">
              <span className="inline-flex items-center gap-1.5"><MapPin size={13} />13 districts covered</span>
              <span className="h-1 w-1 rounded-full bg-cyan-300" />
              <span className="inline-flex items-center gap-1.5"><Landmark size={13} />Model-based planning</span>
            </div>
          </div>
          <button onClick={fetchAllocations} className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-bold text-white shadow-sm backdrop-blur transition hover:bg-white/20">
            <RefreshCw size={15} />Refresh data
          </button>
        </div>
      </section>

      {/* FINAL RECOMMENDED ALLOCATION */}
      <FinalAllocationSection />

      {/* OVERVIEW CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Districts Covered" value={allocations.length} note="Districts in the optimization model" icon={BarChart3} color="#3976c5" tint="#eaf2ff" />
        <StatCard label="Total Budget Pool" value={`₹${formatNumber(budget)} Cr`} note="Baseline comparison envelope" icon={Wallet} color="#8b5cf6" tint="#f1eaff" />
        <StatCard label="Distributed Budget" value={formatCr(selectedTotal)} note={`${scenario.label} strategy`} icon={TrendingUp} color={scenario.color} tint={scenario.light} />
        <StatCard label="Highest Allocation" value={highestDistrict ? formatCr(highestDistrict[scenario.key]) : '—'} note={highestDistrict?.district || 'No data available'} icon={ArrowUpRight} color="#0d9488" tint="#e6fffb" />
      </section>

      {/* STRATEGY SELECTOR */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#111C30]">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#e34b61]" />
              <h2 className="text-base font-extrabold text-[#172554] dark:text-white">Allocation Strategies</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Choose a model to explore how the budget is distributed.</p>
          </div>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">3 MODEL APPROACHES</span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Object.entries(SCENARIOS).map(([id, item]) => {
            const Icon = item.icon
            const active = selectedScenario === id

            return (
              <button
                key={id}
                onClick={() => setSelectedScenario(id)}
                aria-pressed={active}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  active
                    ? 'border-slate-300 shadow-md ring-2 ring-offset-2 dark:border-slate-600 dark:ring-offset-[#111C30]'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500'
                }`}
                style={{
                  background: active ? `linear-gradient(135deg, ${item.light}, white)` : undefined,
                  '--tw-ring-color': item.color,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-1 transition-all" style={{ background: item.color, opacity: active ? 1 : 0.35 }} />
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-110" style={{ background: item.color }}>
                    <Icon size={20} />
                  </span>
                  {active && <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ background: item.color }}><CheckCircle2 size={16} /></span>}
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#172554] dark:text-white">{item.label}</h3>
                <p className="mt-3 text-2xl font-extrabold tracking-tight" style={{ color: item.color }}>{formatCr(totals[id])}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: item.color }}>{active ? 'Currently selected' : 'View strategy'}</span>
                  <ArrowUpRight size={15} className="text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* COMPARISON CHART */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#111C30]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-[#3976c5]" />
              <h2 className="text-base font-extrabold text-[#172554] dark:text-white">District Allocation Comparison</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Compare the amount assigned to each district under all three strategies.</p>
          </div>
          <span className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">VALUES IN ₹ CRORE</span>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          {Object.entries(SCENARIOS).map(([id, item]) => (
            <div key={id} className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {[...allocations].sort((a, b) => Number(b[scenario.key] || 0) - Number(a[scenario.key] || 0)).map((district, index) => (
            <div key={district.district} className="rounded-xl border border-slate-100 px-3 py-3 transition hover:border-slate-200 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40 sm:px-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-extrabold ${index < 3 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="truncate text-xs font-bold text-[#172554] dark:text-slate-200">{district.district}</span>
                </div>
                <span className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-extrabold tabular-nums" style={{ background: scenario.light, color: scenario.color }}>{formatCr(district[scenario.key])}</span>
              </div>
              <div className="space-y-2">
                {Object.entries(SCENARIOS).map(([id, item]) => {
                  const value = Number(district[item.key] || 0)
                  const width = (value / maximumAllocation) * 100
                  return (
                    <div key={id} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-[10px] font-semibold text-slate-400">{item.shortLabel}</span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${width}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}bb)` }} />
                      </div>
                      <span className="w-[76px] shrink-0 text-right text-[10px] font-bold tabular-nums text-slate-500 dark:text-slate-300">{formatCr(value)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DISTRICT TABLE */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
        <div className="border-b border-slate-100 p-5 dark:border-slate-700 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-[#0d9488]" />
                <h2 className="text-base font-extrabold text-[#172554] dark:text-white">District-wise Allocation Matrix</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Detailed allocation values and each district's share of the selected strategy.</p>
            </div>
            <span className="rounded-lg px-3 py-1.5 text-[10px] font-bold" style={{ background: scenario.light, color: scenario.color }}>{scenario.label.toUpperCase()}</span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search district..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:bg-slate-900 dark:focus:ring-blue-900/40" />
            </div>
            <button onClick={() => setSortDirection((current) => current === 'desc' ? 'asc' : 'desc')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <ArrowUpDown size={14} />{sortDirection === 'desc' ? 'Highest first' : 'Lowest first'}
            </button>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400"><SlidersHorizontal size={13} />{filteredAllocations.length} districts</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gov-table w-full min-w-[760px] text-left">
            <thead>
              <tr>
                <th>District</th>
                <th className="text-right">Equal Allocation</th>
                <th className="text-right">Need-Based</th>
                <th className="text-right">Minimum Guarantee</th>
                <th className="text-right">Selected Share</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllocations.map((district, index) => {
                const value = Number(district[scenario.key] || 0)
                const share = allocationShare(value)
                return (
                  <tr key={district.district}>
                    <td className="whitespace-nowrap font-bold text-[#172554] dark:text-slate-100">
                      <span className="mr-3 text-[10px] font-bold text-slate-400">{String(index + 1).padStart(2, '0')}</span>
                      {district.district}
                    </td>
                    <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCr(district.equal_allocation_crore)}</td>
                    <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCr(district.need_based_allocation_crore)}</td>
                    <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCr(district.minimum_guarantee_allocation_crore)}</td>
                    <td className="text-right">
                      <span className="font-extrabold" style={{ color: scenario.color }}>{formatCr(value)}</span>
                      <span className="ml-2 text-[10px] font-semibold text-slate-400">({formatNumber(share)}%)</span>
                    </td>
                  </tr>
                )
              })}
              {filteredAllocations.length === 0 && (
                <tr><td colSpan="5" className="px-5 py-12 text-center text-xs text-slate-400">No districts match your search query.</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>Total Envelope</td>
                <td className="text-right">{formatCr(totals.equal)}</td>
                <td className="text-right">{formatCr(totals.need)}</td>
                <td className="text-right">{formatCr(totals.guarantee)}</td>
                <td className="text-right" style={{ color: scenario.color }}>{formatCr(selectedTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* INSIGHTS */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-5 dark:border-teal-900/50 dark:from-teal-950/30 dark:to-cyan-950/20">
          <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-teal-300/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-extrabold text-teal-900 dark:text-teal-300"><TrendingUp size={17} />Allocation Highlights</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-teal-100/80 bg-white/70 p-3 dark:border-teal-900/40 dark:bg-slate-900/30">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><ArrowUpRight size={12} />Highest share</div>
                <p className="mt-2 text-sm font-extrabold text-teal-800 dark:text-teal-300">{highestDistrict?.district || '—'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{highestDistrict ? formatCr(highestDistrict[scenario.key]) : '—'}</p>
              </div>
              <div className="rounded-xl border border-teal-100/80 bg-white/70 p-3 dark:border-teal-900/40 dark:bg-slate-900/30">
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"><ArrowDownRight size={12} />Lowest share</div>
                <p className="mt-2 text-sm font-extrabold text-teal-800 dark:text-teal-300">{lowestDistrict?.district || '—'}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{lowestDistrict ? formatCr(lowestDistrict[scenario.key]) : '—'}</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-teal-900/80 dark:text-teal-200/70">{scenario.description}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/20">
          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 dark:text-amber-300"><Info size={17} />Important Methodology Note</div>
          <p className="mt-3 text-xs leading-6 text-amber-900/80 dark:text-amber-200/75">
            These figures are model-generated allocation simulations based on district-level indicators and normative constraints. They are analytical decision-support projections, not official expenditure orders or government sanctions.
          </p>
          <div className="mt-4 rounded-xl border border-amber-200/70 bg-white/60 px-3 py-2.5 text-[10px] font-semibold leading-4 text-amber-900/80 dark:border-amber-900/40 dark:bg-slate-900/20 dark:text-amber-200/70">
            Always interpret allocations alongside district context, model assumptions and implementation requirements.
          </div>
        </div>
      </section>
    </div>
  )
}
