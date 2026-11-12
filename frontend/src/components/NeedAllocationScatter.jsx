
import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import {
  Activity,
  RefreshCw,
  Info,
  TrendingUp,
  Users,
} from 'lucide-react'
import api from '../services/api'

const STRATEGIES = {
  equal: {
    label: 'Equal Allocation',
    field: 'equal_allocation_crore',
    color: '#64748b',
  },
  need: {
    label: 'Need-Based',
    field: 'need_based_allocation_crore',
    color: '#e34b61',
  },
  guarantee: {
    label: 'Minimum Guarantee',
    field: 'minimum_guarantee_allocation_crore',
    color: '#0d9488',
  },
}

const normalizeDistrict = (name) =>
  String(name || '').trim().toLowerCase()

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const district = payload[0].payload

  return (
    <div className="min-w-[210px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-[#111C30]">
      <p className="mb-3 text-sm font-extrabold text-[#172554] dark:text-white">
        {district.district}
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between gap-5">
          <span className="text-slate-500 dark:text-slate-400">
            Need score
          </span>
          <strong className="text-[#172554] dark:text-white">
            {district.needScore.toFixed(2)}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="text-slate-500 dark:text-slate-400">
            Allocation
          </span>
          <strong className="text-[#e34b61]">
            ₹{formatNumber(district.allocation)} Cr
          </strong>
        </div>

        <div className="flex items-center justify-between gap-5">
          <span className="text-slate-500 dark:text-slate-400">
            Population
          </span>
          <strong className="text-[#172554] dark:text-white">
            {formatNumber(district.population)}
          </strong>
        </div>
      </div>
    </div>
  )
}

export default function NeedAllocationScatter({
  districts = [],
  apiLoading = false,
  apiError = '',
}) {
  const [allocationRows, setAllocationRows] = useState([])
  const [allocationLoading, setAllocationLoading] = useState(true)
  const [allocationError, setAllocationError] = useState('')
  const [selectedStrategy, setSelectedStrategy] = useState('need')

  const fetchAllocations = async () => {
    try {
      setAllocationLoading(true)
      setAllocationError('')

      const response = await api.get('/allocations')
      const rows = response.data?.allocations

      if (!Array.isArray(rows)) {
        throw new Error('The allocation API returned an unexpected data format.')
      }

      setAllocationRows(rows)
    } catch (error) {
      setAllocationError(
        error.response?.data?.detail ||
        error.message ||
        'Unable to retrieve allocation data.'
      )
    } finally {
      setAllocationLoading(false)
    }
  }

  useEffect(() => {
    fetchAllocations()
  }, [])

  const strategy = STRATEGIES[selectedStrategy]

  const chartData = useMemo(() => {
    if (!Array.isArray(districts) || !allocationRows.length) {
      return []
    }

    const allocationMap = new Map(
      allocationRows.map((row) => [
        normalizeDistrict(row.district),
        row,
      ])
    )

    return districts
      .map((district) => {
        const name = district.district || district.name
        const allocation = allocationMap.get(normalizeDistrict(name))

        if (!allocation) return null

        const needScore = Number(district.revised_need_score)
        const population = Number(district.total_population)
        const allocatedAmount = Number(allocation[strategy.field])

        if (
          !Number.isFinite(needScore) ||
          !Number.isFinite(population) ||
          !Number.isFinite(allocatedAmount) ||
          population <= 0 ||
          allocatedAmount < 0
        ) {
          return null
        }

        return {
          district: name,
          needScore,
          population,
          allocation: allocatedAmount,
        }
      })
      .filter(Boolean)
  }, [districts, allocationRows, strategy])

  const unmatchedCount = useMemo(() => {
    const allocationNames = new Set(
      allocationRows.map((row) => normalizeDistrict(row.district))
    )

    return districts.filter((district) => {
      const name = district.district || district.name
      return !allocationNames.has(normalizeDistrict(name))
    }).length
  }, [districts, allocationRows])

  const isLoading = apiLoading || allocationLoading
  const error = apiError || allocationError

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-700 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#e34b61]" />
            <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
              Need vs Allocation
            </h3>
          </div>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            Compare each district's assessed development need with its
            modelled budget allocation. Larger bubbles represent larger
            district populations.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
          <Activity size={14} />
          INTERACTIVE ANALYSIS
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 sm:px-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Allocation strategy
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Change the strategy to update the plotted allocation values.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(STRATEGIES).map(([key, item]) => {
            const active = selectedStrategy === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedStrategy(key)}
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-[10px] font-bold transition ${
                  active
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
                style={active ? { background: item.color } : undefined}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[360px] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={25}
              className="mx-auto mb-3 animate-spin text-[#e34b61]"
            />
            <p className="text-sm font-bold text-[#172554] dark:text-white">
              Loading comparison data
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Matching district needs with allocation results...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
          <Info size={20} className="mb-2 text-rose-600 dark:text-rose-300" />
          <p className="text-sm font-bold text-rose-800 dark:text-rose-200">
            Unable to display the comparison
          </p>
          <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-200/70">
            {error}
          </p>
          <button
            type="button"
            onClick={fetchAllocations}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2 text-xs font-bold text-white hover:bg-[#263d78]"
          >
            <RefreshCw size={13} />
            Try again
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="m-5 rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <Info size={20} className="mb-2 text-amber-700 dark:text-amber-300" />
          <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
            No matching district data
          </p>
          <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/70">
            The chart needs matching district names, need scores, population
            and allocation values from both APIs.
          </p>
        </div>
      ) : (
        <>
          <div className="px-2 pb-2 pt-5 sm:px-5">
            <div className="h-[360px] w-full sm:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 15, right: 24, bottom: 22, left: 12 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 5"
                    stroke="#94a3b8"
                    opacity={0.25}
                  />

                  <XAxis
                    type="number"
                    dataKey="needScore"
                    name="Need score"
                    domain={[0, 'auto']}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                    label={{
                      value: 'District need score',
                      position: 'insideBottom',
                      offset: -12,
                      fontSize: 11,
                      fill: '#64748b',
                    }}
                  />

                  <YAxis
                    type="number"
                    dataKey="allocation"
                    name="Allocation"
                    domain={[0, 'auto']}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `₹${value}`}
                    label={{
                      value: 'Allocation (₹ crore)',
                      angle: -90,
                      position: 'insideLeft',
                      fontSize: 11,
                      fill: '#64748b',
                    }}
                  />

                  <ZAxis
                    type="number"
                    dataKey="population"
                    range={[100, 650]}
                    name="Population"
                  />

                  <Tooltip
                    cursor={{
                      strokeDasharray: '4 4',
                      stroke: '#94a3b8',
                    }}
                    content={<CustomTooltip />}
                  />

                  <Scatter
                    name="Districts"
                    data={chartData}
                    fill={strategy.color}
                    fillOpacity={0.78}
                    stroke={strategy.color}
                    strokeWidth={1.5}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-700 sm:px-6">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: strategy.color }}
                />
                {strategy.label}
              </span>

              <span className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <Users size={13} />
                Bubble size = population
              </span>

              <span className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <TrendingUp size={13} />
                Each bubble = one district
              </span>
            </div>

            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {chartData.length} districts plotted
            </span>
          </div>

          {unmatchedCount > 0 && (
            <div className="border-t border-amber-100 bg-amber-50/70 px-5 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-[10px] text-amber-800 dark:text-amber-200">
                {unmatchedCount} district(s) could not be matched between the
                two datasets and were not plotted.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
