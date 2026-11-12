
import { useEffect, useMemo, useState } from 'react'
import api from './services/api'

import PolicySimulator from './components/PolicySimulator'
import PolicyInsights from './components/PolicyInsights'
import Allocations from './components/Allocations'
import Analytics from './components/Analytics'
import Auth from './components/Auth'
import AdminDashboard from './components/AdminDashboard'
import DistrictMap from './components/DistrictMap'
import DistrictExplorer from './components/DistrictExplorer'
import SavedScenarios from './components/SavedScenarios'
import CitizenFeedback from './components/CitizenFeedback'
import Logo from './components/Logo'

import {
  LayoutDashboard, MapPinned, SlidersHorizontal, Wallet,
  ChartNoAxesCombined, Menu, X, ShieldCheck,
  ArrowUpRight, Activity, Database, RefreshCw, Bookmark,
  MessageSquareText, Sun, Moon, ChevronLeft, ChevronRight,
  GraduationCap, Droplets, HeartPulse, Info,
} from 'lucide-react'

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

const navigation = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Districts', icon: MapPinned },
  { name: 'Policy Simulator', icon: SlidersHorizontal },
  { name: 'Allocations', icon: Wallet },
  { name: 'Analytics', icon: ChartNoAxesCombined },
  { name: 'Citizen Feedback', icon: MessageSquareText },
]

const priorityColours = [
  '#E45B72', '#F08A62', '#E6A34A', '#9B78D0',
  '#3B9EAB', '#3987BD', '#5579C8', '#4D9C91',
  '#78A66B', '#8C9BBA', '#9B8BAF', '#7CABC1',
  '#A5B8C9',
]

const sectors = [
  {
    name: 'Education Sector',
    desc: 'Access, teacher ratios and school infrastructure deficits',
    icon: GraduationCap,
    color: '#2878B5',
    badgeBg: 'bg-blue-50 text-[#2878B5] dark:bg-blue-950/50 dark:text-blue-300',
    tag: 'Access & Facilities',
  },
  {
    name: 'Water Resources',
    desc: 'Potable water availability, coverage and service deficits',
    icon: Droplets,
    color: '#168C9B',
    badgeBg: 'bg-teal-50 text-[#168C9B] dark:bg-teal-950/50 dark:text-teal-300',
    tag: 'Potable Coverage',
  },
  {
    name: 'Healthcare Infrastructure',
    desc: 'Health facilities, hospital bed capacity and coverage gaps',
    icon: HeartPulse,
    color: '#B92742',
    badgeBg: 'bg-rose-50 text-[#B92742] dark:bg-rose-950/50 dark:text-rose-300',
    tag: 'Clinical Deficit',
  },
]

const ALLOCATION_STRATEGIES = {
  equal: {
    label: 'Equal Allocation',
    key: 'equal_allocation_crore',
    color: '#64748b',
  },
  need: {
    label: 'Need-Based',
    key: 'need_based_allocation_crore',
    color: '#e34b61',
  },
  guarantee: {
    label: 'Minimum Guarantee',
    key: 'minimum_guarantee_allocation_crore',
    color: '#0d9488',
  },
}

const normalizeDistrict = (name) =>
  String(name || '').trim().toLowerCase()

const formatPopulation = (value) =>
  Number(value || 0).toLocaleString('en-IN')

function ScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  const district = payload[0]?.payload
  if (!district) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-[#111C30]">
      <p className="mb-2 text-sm font-extrabold text-[#172554] dark:text-white">
        {district.district}
      </p>
      <div className="space-y-1.5 text-xs">
        <p className="text-slate-600 dark:text-slate-300">
          Need score:
          <strong className="ml-2 text-[#172554] dark:text-white">
            {district.needScore.toFixed(2)}
          </strong>
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          Allocation:
          <strong className="ml-2 text-rose-600 dark:text-rose-300">
            ₹{district.allocation.toFixed(2)} Cr
          </strong>
        </p>
        <p className="text-slate-600 dark:text-slate-300">
          Population:
          <strong className="ml-2 text-[#172554] dark:text-white">
            {formatPopulation(district.population)}
          </strong>
        </p>
      </div>
    </div>
  )
}

function NeedAllocationScatter({
  districts,
  allocations,
  loading,
  error,
}) {
  const [strategy, setStrategy] = useState('need')

  const chartData = useMemo(() => {
    const selected = ALLOCATION_STRATEGIES[strategy]

    if (!selected || !districts.length || !allocations.length) {
      return []
    }

    const allocationMap = new Map(
      allocations.map((item) => [
        normalizeDistrict(item.district),
        item,
      ])
    )

    return districts
      .map((district, index) => {
        const name = district.district || district.name
        const allocationRecord = allocationMap.get(
          normalizeDistrict(name)
        )

        if (!allocationRecord) return null

        const needScore = Number(district.revised_need_score)
        const allocation = Number(allocationRecord[selected.key])
        const population = Number(district.total_population)

        if (
          !Number.isFinite(needScore) ||
          !Number.isFinite(allocation)
        ) {
          return null
        }

        return {
          district: name,
          needScore,
          allocation,
          population: Number.isFinite(population) ? population : 0,
          color: priorityColours[index % priorityColours.length],
        }
      })
      .filter(Boolean)
  }, [districts, allocations, strategy])

  const selectedStrategy = ALLOCATION_STRATEGIES[strategy]

  return (
    <section className="gov-card mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-rose-500" />
            <h3 className="text-sm font-bold text-[#172554] dark:text-white">
              Need vs Allocation Analysis
            </h3>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Explore the relationship between assessed district needs
            and the budget assigned under different allocation strategies.
          </p>
        </div>

        <span className="w-fit rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          INTERACTIVE BUBBLE CHART
        </span>
      </div>

      <div className="p-5">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {Object.entries(ALLOCATION_STRATEGIES).map(([id, item]) => (
            <button
              key={id}
              onClick={() => setStrategy(id)}
              aria-pressed={strategy === id}
              className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                strategy === id
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
              style={
                strategy === id
                  ? { background: item.color }
                  : undefined
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Each bubble represents one district
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            Bubble size represents population
          </span>
        </div>

        {loading ? (
          <div className="flex h-[340px] items-center justify-center">
            <div className="text-center">
              <RefreshCw className="mx-auto mb-3 animate-spin text-rose-500" size={25} />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Loading allocation comparison...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-rose-50 p-5 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-xl bg-slate-50 text-center dark:bg-slate-800/50">
            <div className="max-w-sm px-5">
              <Info className="mx-auto mb-3 text-slate-400" size={25} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching district data available
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                The chart requires matching district names, need scores
                and allocation values from the backend.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-[340px] w-full sm:h-[410px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 15, right: 20, bottom: 20, left: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#94a3b8"
                    opacity={0.2}
                  />

                  <XAxis
                    type="number"
                    dataKey="needScore"
                    name="Need score"
                    domain={[0, 'auto']}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={{ stroke: '#94a3b8', opacity: 0.4 }}
                    label={{
                      value: 'District Need Score',
                      position: 'insideBottom',
                      offset: -10,
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    type="number"
                    dataKey="allocation"
                    name="Allocation"
                    domain={[0, 'auto']}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                    label={{
                      value: 'Allocation (₹ Crore)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#94a3b8',
                      fontSize: 11,
                    }}
                  />

                  <ZAxis
                    type="number"
                    dataKey="population"
                    range={[90, 420]}
                    name="Population"
                  />

                  <Tooltip
                    cursor={{
                      strokeDasharray: '4 4',
                      stroke: '#94a3b8',
                    }}
                    content={<ScatterTooltip />}
                  />

                  {chartData.map((district) => (
                    <Scatter
                      key={district.district}
                      name={district.district}
                      data={[district]}
                      fill={district.color}
                      fillOpacity={0.85}
                      stroke={district.color}
                      strokeWidth={1.8}
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* DISTRICT COLOUR LEGEND */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/40">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                District colour guide
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
                {chartData.map((district) => (
                  <div
                    key={district.district}
                    className="flex min-w-0 items-center gap-2"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-700"
                      style={{ backgroundColor: district.color }}
                    />
                    <span
                      className="truncate text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                      title={district.district}
                    >
                      {district.district}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-700">
          <p className="max-w-2xl text-[10px] leading-5 text-slate-500 dark:text-slate-400">
            A district further to the right has a higher assessed need score.
            A district higher on the chart receives a larger allocation
            under the selected strategy. Bubble size represents population.
            Each district retains its own colour across all three strategies.
          </p>

          <span
            className="rounded-lg px-3 py-1.5 text-[10px] font-bold"
            style={{
              background: `${selectedStrategy.color}15`,
              color: selectedStrategy.color,
            }}
          >
            {chartData.length} DISTRICTS PLOTTED
          </span>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState(null)
  const [authVisible, setAuthVisible] = useState(false)
  const [districts, setDistricts] = useState([])
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState('')

  const [allocationData, setAllocationData] = useState([])
  const [allocationLoading, setAllocationLoading] = useState(true)
  const [allocationError, setAllocationError] = useState('')

  const canManageScenarios =
    user?.role === 'policy_maker' || user?.role === 'admin'

  const visibleNavigation = [
    ...navigation,
    ...(canManageScenarios
      ? [
          { name: 'Saved Scenarios', icon: Bookmark },
          { name: 'Policy Insights', icon: ChartNoAxesCombined },
        ]
      : []),
    ...(user?.role === 'admin'
      ? [{ name: 'Admin Dashboard', icon: ShieldCheck }]
      : []),
  ]

  const fetchDistricts = async () => {
    try {
      setApiLoading(true)
      setApiError('')
      const response = await api.get('/districts')
      const list = Array.isArray(response.data)
        ? response.data
        : response.data?.districts || []
      setDistricts(list)
    } catch (error) {
      console.error('Failed to fetch districts:', error)
      setApiError(
        error.response?.data?.detail ||
        'Unable to connect to the GovOpt backend. Please check your connection and try again.'
      )
    } finally {
      setApiLoading(false)
    }
  }

  const fetchAllocationData = async () => {
    try {
      setAllocationLoading(true)
      setAllocationError('')

      const response = await api.get('/allocations')
      const records = response.data?.allocations

      if (!Array.isArray(records)) {
        throw new Error('Unexpected allocation data format.')
      }

      setAllocationData(records)
    } catch (error) {
      console.error('Failed to fetch allocation data:', error)
      setAllocationError(
        error.response?.data?.detail ||
        error.message ||
        'Unable to load allocation data.'
      )
    } finally {
      setAllocationLoading(false)
    }
  }

  useEffect(() => {
    const restoreSession = async () => {
      const token = sessionStorage.getItem('govopt_token')
      if (!token) return
      try {
        const response = await api.get('/auth/me')
        setUser(response.data)
      } catch {
        sessionStorage.removeItem('govopt_token')
        setUser(null)
      }
    }
    restoreSession()
  }, [])

  useEffect(() => {
    fetchDistricts()
    fetchAllocationData()
  }, [])

  useEffect(() => {
    if (activePage === 'Admin Dashboard' && user?.role !== 'admin') {
      setActivePage('Overview')
    }

    if (activePage === 'Saved Scenarios' && !canManageScenarios) {
      setActivePage('Overview')
    }

    if (activePage === 'Policy Insights' && !canManageScenarios) {
      setActivePage('Overview')
    }
  }, [activePage, user, canManageScenarios])

  const handleLogin = (data) => {
    sessionStorage.setItem('govopt_token', data.access_token)
    setUser(data.user)
    setAuthVisible(false)
    setActivePage('Overview')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('govopt_token')
    setUser(null)
    setAuthVisible(false)
    setActivePage('Overview')
    setSidebarOpen(false)
  }

  const apiConnected = !apiLoading && !apiError

  const sortedDistricts = useMemo(
    () =>
      [...districts].sort(
        (a, b) => Number(a.priority_rank) - Number(b.priority_rank)
      ),
    [districts]
  )

  const highestNeedScore = Math.max(
    1,
    ...sortedDistricts.map(d => Number(d.revised_need_score) || 0)
  )

  if (authVisible) {
    return (
      <Auth
        onLogin={handleLogin}
        onClose={() => setAuthVisible(false)}
      />
    )
  }

  const metricCards = [
    {
      label: 'Districts covered',
      value: apiLoading ? '…' : apiError ? '—' : districts.length,
      note: 'Districts included in the Uttarakhand model',
      icon: MapPinned,
      accent: 'navy',
    },
    {
      label: 'Priority sectors',
      value: '03',
      note: 'Education, water and healthcare',
      icon: Activity,
      accent: 'red',
    },
    {
      label: 'Planning budget',
      value: '—',
      note: 'Set a budget inside Policy Simulator',
      icon: Wallet,
      accent: 'violet',
    },
    {
      label: 'Data connection',
      value: apiLoading ? 'Loading' : apiConnected ? 'Connected' : 'Offline',
      note: 'Live connection to the GovOpt backend',
      icon: Database,
      accent: apiConnected ? 'green' : 'red',
    },
  ]

  return (
    <div className={`${darkMode ? 'dark' : ''} min-h-screen`}>
      <div className="gov-shell flex min-h-screen bg-[#E8EDF4] text-[#172554] transition-colors duration-300 dark:bg-[#0B1220] dark:text-slate-100">

        {/* SIDEBAR */}
        <aside
          className={`gov-sidebar fixed inset-y-0 left-0 z-50 flex flex-col bg-[#172554] text-white shadow-2xl transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${sidebarCollapsed ? 'lg:w-[72px]' : 'w-[268px]'}`}
        >
          <div
            className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${
              sidebarCollapsed ? 'justify-center px-3' : 'justify-between px-5'
            }`}
          >
            <Logo collapsed={sidebarCollapsed} size="sm" />
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className={`px-3 pt-6 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
            {!sidebarCollapsed && (
              <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[2.5px] text-blue-200/40">
                Main Workspace
              </p>
            )}

            <nav className="space-y-0.5">
              {visibleNavigation.map((item) => {
                const Icon = item.icon
                const active = activePage === item.name

                return (
                  <button
                    key={item.name}
                    title={sidebarCollapsed ? item.name : undefined}
                    onClick={() => {
                      setActivePage(item.name)
                      setSidebarOpen(false)
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-white text-[#172554] shadow-md shadow-black/10'
                        : 'text-blue-100/70 hover:bg-white/10 hover:text-white'
                    } ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                  >
                    {active && !sidebarCollapsed && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#DC2626]" />
                    )}
                    <Icon
                      size={18}
                      strokeWidth={2}
                      className={active
                        ? 'text-[#DC2626]'
                        : 'text-blue-200/60 group-hover:text-white'}
                    />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                    {active && !sidebarCollapsed && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#DC2626]/70" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto p-3">
            {!sidebarCollapsed ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3.5">
                <div className="mb-1.5 flex items-center gap-2 text-red-300/80">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold tracking-wide">GovOpt Platform</span>
                </div>
                <p className="text-[10px] leading-5 text-blue-100/50">
                  Data-driven platform for transparent public resource planning.
                </p>
                <div className="mt-3 border-t border-white/10 pt-2.5 text-[9px] font-bold tracking-[1.5px] text-blue-200/30">
                  VERSION 1.0 · UTTARAKHAND
                </div>
              </div>
            ) : (
              <div className="flex justify-center pb-1 text-blue-200/40">
                <ShieldCheck size={18} />
              </div>
            )}

            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-[11px] text-blue-100/60 transition hover:bg-white/10 hover:text-white lg:flex"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed
                ? <ChevronRight size={15} />
                : <><ChevronLeft size={15} /> Collapse</>}
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          />
        )}

        {/* MAIN WORKSPACE */}
        <main className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="gov-header sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur-xl sm:px-6 dark:border-slate-700/80 dark:bg-[#111C30]/95">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
              >
                <Menu size={20} />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span>GovOpt</span>
                  <span className="text-slate-300">/</span>
                  <span className="truncate text-[#DC2626]">{activePage}</span>
                </div>
                <h2 className="mt-0.5 truncate text-base font-bold tracking-tight text-[#172554] dark:text-white">
                  {activePage}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 xl:flex dark:border-slate-700 dark:bg-slate-800">
                <span className={`h-1.5 w-1.5 rounded-full ${
                  apiLoading ? 'animate-pulse bg-amber-400' : apiConnected ? 'bg-emerald-500' : 'bg-red-400'
                }`} />
                <span className="text-[10px] font-semibold tracking-wide text-slate-400 dark:text-slate-400">
                  UTTARAKHAND STATE PORTAL
                </span>
              </div>

              <button
                onClick={() => setDarkMode(v => !v)}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={darkMode ? 'Light mode' : 'Dark mode'}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              <div className="hidden h-7 w-px bg-slate-200 sm:block dark:bg-slate-700" />

              {user ? (
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#172554] text-xs font-bold text-white shadow-sm">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{user.full_name}</p>
                    <p className="text-[10px] capitalize text-slate-400">{user.role?.replace('_', ' ')}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthVisible(true)}
                  className="rounded-lg bg-[#172554] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1e3a8a] active:scale-95"
                >
                  Sign In
                </button>
              )}
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
            {/* OVERVIEW */}
            {activePage === 'Overview' && (
              <>
                {/* GEOSPATIAL HERO */}
                <section className="relative isolate mb-6 overflow-hidden rounded-[24px] bg-[#172554] text-white shadow-lg shadow-[#172554]/15">
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-40"
                    viewBox="0 0 1200 420"
                    preserveAspectRatio="xMidYMid slice"
                    fill="none"
                  >
                    <g stroke="#93C5FD" strokeWidth="1">
                      <path d="M620 420 C650 350 580 320 650 260 S760 190 700 120 S760 20 850 -30" />
                      <path d="M660 440 C700 350 620 320 690 260 S800 190 740 120 S800 20 890 -30" />
                      <path d="M700 440 C740 350 660 320 730 260 S840 190 780 120 S840 20 930 -30" />
                      <path d="M740 440 C780 350 700 320 770 260 S880 190 820 120 S880 20 970 -30" />
                      <path d="M780 440 C820 350 740 320 810 260 S920 190 860 120 S920 20 1010 -30" />
                      <path d="M820 440 C860 350 780 320 850 260 S960 190 900 120 S960 20 1050 -30" />
                      <path d="M860 440 C900 350 820 320 890 260 S1000 190 940 120 S1000 20 1090 -30" />
                      <path d="M900 440 C940 350 860 320 930 260 S1040 190 980 120 S1040 20 1130 -30" />
                      <path d="M940 440 C980 350 900 320 970 260 S1080 190 1020 120 S1080 20 1170 -30" />
                    </g>
                    <g stroke="#60A5FA" strokeWidth="1.2" opacity="0.7">
                      <path d="M780 0 C900 80 850 150 960 190 S1080 270 1200 220" />
                      <path d="M760 0 C880 80 830 150 940 190 S1060 270 1180 220" />
                      <path d="M740 0 C860 80 810 150 920 190 S1040 270 1160 220" />
                    </g>
                  </svg>

                  <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[46%] lg:block">
                    <svg viewBox="0 0 520 360" className="h-full w-full" fill="none" aria-hidden="true">
                      <path d="M300 42 L370 90 L330 145 L405 190 L350 260 L430 310" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 7" opacity=".55" />
                      <path d="M190 100 L260 140 L330 145 L390 90 L450 125" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 7" opacity=".4" />
                      <path d="M260 140 L220 220 L350 260 L405 190" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 7" opacity=".4" />
                      <path d="M220 220 L150 275 L350 260" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="5 7" opacity=".35" />
                      <g fill="#172554" stroke="#BFDBFE" strokeWidth="2">
                        <circle cx="300" cy="42" r="7" />
                        <circle cx="370" cy="90" r="6" />
                        <circle cx="330" cy="145" r="8" />
                        <circle cx="405" cy="190" r="6" />
                        <circle cx="350" cy="260" r="8" />
                        <circle cx="430" cy="310" r="6" />
                        <circle cx="190" cy="100" r="5" />
                        <circle cx="260" cy="140" r="6" />
                        <circle cx="220" cy="220" r="5" />
                        <circle cx="150" cy="275" r="5" />
                        <circle cx="450" cy="125" r="5" />
                      </g>
                      <g fill="#DC2626">
                        <circle cx="330" cy="145" r="3" />
                        <circle cx="350" cy="260" r="3" />
                      </g>
                      <g stroke="#60A5FA" strokeWidth="1" opacity=".35">
                        <circle cx="330" cy="145" r="24" />
                        <circle cx="350" cy="260" r="24" />
                        <circle cx="300" cy="42" r="18" />
                      </g>
                    </svg>
                  </div>

                  <div className="relative z-10 grid gap-8 px-6 py-7 sm:px-8 sm:py-9 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:px-10 lg:py-10">
                    <div className="max-w-3xl">
                      <div className="mb-5 flex items-center gap-2.5">
                        <span className="h-6 w-1 rounded-full bg-[#DC2626]" />
                        <p className="text-[10px] font-bold uppercase tracking-[2.4px] text-blue-200 sm:text-xs">
                          Uttarakhand · Development Intelligence
                        </p>
                      </div>
                      <h1 className="max-w-2xl text-3xl font-black leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[46px]">
                        Understand needs.
                        <br />
                        <span className="text-blue-200">Plan better.</span>{' '}
                        Allocate smarter.
                      </h1>
                      <p className="mt-5 max-w-2xl text-sm leading-6 text-blue-100/85 sm:text-base sm:leading-7">
                        GovOpt brings district-level development information
                        together to help planners identify priorities, explore
                        regional differences and examine public resource
                        allocation scenarios across Uttarakhand.
                      </p>
                      <div className="mt-7 flex flex-wrap gap-3">
                        <button
                          onClick={() => setActivePage('Districts')}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#172554] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-blue-50"
                        >
                          <MapPinned size={17} />
                          Explore districts
                          <ArrowUpRight size={15} />
                        </button>
                        <button
                          onClick={() => setActivePage('Policy Simulator')}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                        >
                          <SlidersHorizontal size={16} />
                          Open policy simulator
                        </button>
                      </div>
                    </div>

                    <div className="relative hidden lg:block">
                      <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm">
                        <div className="flex items-center justify-between border-b border-white/15 pb-4">
                          <div>
                            <p className="text-[9px] font-bold uppercase tracking-[1.8px] text-blue-200/70">State coverage</p>
                            <p className="mt-1 text-lg font-extrabold text-white">Uttarakhand</p>
                          </div>
                          <MapPinned size={23} className="text-blue-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-3 py-5">
                          <div>
                            <p className="text-3xl font-black text-white">{apiLoading || apiError ? '—' : districts.length}</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200/70">Districts</p>
                          </div>
                          <div>
                            <p className="text-3xl font-black text-white">03</p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-blue-200/70">Priority sectors</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-white/15 pt-4">
                          <span className="rounded-full border border-blue-200/20 bg-blue-200/10 px-2.5 py-1 text-[10px] font-semibold text-blue-100">Education</span>
                          <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-100">Water</span>
                          <span className="rounded-full border border-rose-200/20 bg-rose-200/10 px-2.5 py-1 text-[10px] font-semibold text-rose-100">Healthcare</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 px-6 py-4 text-[10px] font-semibold text-blue-100/80 sm:px-8 lg:px-10">
                    <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />District-level assessment</span>
                    <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-sky-300" />Three development sectors</span>
                    <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-white" />Resource planning support</span>
                  </div>
                </section>

                {/* METRICS */}
                <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                  {metricCards.map(metric => {
                    const Icon = metric.icon
                    const styles = {
                      red: { icon: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300', bar: 'from-rose-500 to-orange-400' },
                      green: { icon: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300', bar: 'from-teal-500 to-emerald-400' },
                      violet: { icon: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300', bar: 'from-violet-500 to-indigo-400' },
                      slate: { icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', bar: 'from-slate-400 to-slate-500' },
                      navy: { icon: 'bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200', bar: 'from-blue-600 to-cyan-400' },
                    }
                    const style = styles[metric.accent] || styles.navy
                    return (
                      <article key={metric.label} className="gov-card group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-[#111C30]">
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.bar}`} />
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500 dark:text-slate-400">{metric.label}</p>
                            <p className="mt-3.5 text-3xl font-extrabold tracking-tight text-[#172554] dark:text-white">{metric.value}</p>
                          </div>
                          <div className={`rounded-xl p-2.5 ${style.icon}`}><Icon size={20} /></div>
                        </div>
                        <p className="mt-3 text-[11px] leading-5 text-slate-400 dark:text-slate-500">{metric.note}</p>
                      </article>
                    )
                  })}
                </section>

                {/* MAP AND SECTORS */}
                <section className="grid grid-cols-1 items-start gap-5 2xl:grid-cols-12">
                  <article className="gov-card min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm 2xl:col-span-8 dark:border-slate-700 dark:bg-[#111C30]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-1 rounded-full bg-[#DC2626]" />
                          <h3 className="text-sm font-bold text-[#172554] dark:text-white">District Priority Map</h3>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Explore model-assessed resource needs across all 13 districts.</p>
                      </div>
                      <button onClick={() => setActivePage('Districts')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#172554] transition hover:border-[#DC2626]/40 hover:bg-red-50 hover:text-[#DC2626] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                        Explore districts <ArrowUpRight size={13} />
                      </button>
                    </div>
                    <div className="p-4 sm:p-5"><DistrictMap /></div>
                  </article>

                  <div className="space-y-5 2xl:col-span-4">
                    <article className="gov-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-1 rounded-full bg-[#DC2626]" />
                          <h3 className="text-sm font-bold text-[#172554] dark:text-white">Resource Planning Sectors</h3>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Three dimensions used in the district needs assessment.</p>
                      </div>
                      <div className="space-y-2.5">
                        {sectors.map(sector => {
                          const Icon = sector.icon
                          return (
                            <div key={sector.name} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50 dark:border-slate-700/70 dark:hover:bg-slate-800/50">
                              <div className={`rounded-xl p-2.5 ${sector.badgeBg}`}><Icon size={18} /></div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-[#172554] dark:text-slate-100">{sector.name}</h4>
                                <p className="mt-0.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">{sector.desc}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <button onClick={() => setActivePage('Policy Simulator')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#172554] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1e3a8a] active:scale-95">
                        <SlidersHorizontal size={14} />Open Policy Simulator
                      </button>
                    </article>

                    <article className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg bg-white p-2 text-[#DC2626] shadow-sm dark:bg-red-950/60 dark:text-red-400"><Info size={16} /></div>
                        <div>
                          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">How to read priorities</h3>
                          <p className="mt-1 text-xs leading-5 text-rose-800/75 dark:text-rose-100/60">
                            A higher assessed need score indicates greater model-estimated need. Rankings support planning discussions; they do not represent actual spending or final government decisions.
                          </p>
                        </div>
                      </div>
                    </article>
                  </div>
                </section>

                {/* PRIORITY CHART + TOP FIVE TABLE */}
                <section className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <article className="gov-card min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                    <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-1 rounded-full bg-gradient-to-b from-cyan-500 to-violet-500" />
                        <h3 className="text-sm font-bold text-[#172554] dark:text-white">District need score comparison</h3>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        All districts, ordered by their model-assessed priority score.
                      </p>
                    </div>

                    {apiLoading ? (
                      <div className="space-y-4 p-5">
                        {[1, 2, 3, 4, 5, 6].map(n => <div key={n} className="skeleton h-7" />)}
                      </div>
                    ) : apiError ? (
                      <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{apiError}</p>
                    ) : sortedDistricts.length === 0 ? (
                      <p className="p-6 text-sm text-slate-500">No district data is available.</p>
                    ) : (
                      <div className="space-y-3 p-5">
                        {sortedDistricts.map((district, index) => {
                          const score = Math.max(0, Number(district.revised_need_score) || 0)
                          const width = Math.max(1, (score / highestNeedScore) * 100)
                          const colour = priorityColours[index % priorityColours.length]
                          const name = district.district || district.name || 'Unknown district'
                          return (
                            <div key={name} className="group grid grid-cols-[minmax(92px,118px)_1fr_48px] items-center gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200" title={name}>{name}</p>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="priority-bar h-full rounded-full transition-all duration-700 ease-out group-hover:brightness-110"
                                  style={{
                                    width: `${width}%`,
                                    background: `linear-gradient(90deg, ${colour}, ${colour}B8)`,
                                  }}
                                  title={`${name}: ${score.toFixed(2)}`}
                                />
                              </div>
                              <p className="text-right text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">{score.toFixed(2)}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-700 dark:bg-slate-900/40">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Higher score = higher assessed need</span>
                      <button onClick={() => setActivePage('Analytics')} className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-800 dark:text-violet-300">
                        View analysis <ArrowUpRight size={12} />
                      </button>
                    </div>
                  </article>

                  <article className="gov-card min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center dark:border-slate-700">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-1 rounded-full bg-[#DC2626]" />
                          <h3 className="text-sm font-bold text-[#172554] dark:text-white">Highest assessed district needs</h3>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Top five district rankings returned by the GovOpt API.</p>
                      </div>
                      <button onClick={() => setActivePage('Districts')} className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:text-red-800 dark:hover:text-red-400">
                        View all <ArrowUpRight size={13} />
                      </button>
                    </div>

                    {apiLoading ? (
                      <div className="space-y-3 p-5">{[1, 2, 3].map(n => <div key={n} className="skeleton h-10" />)}</div>
                    ) : apiError ? (
                      <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{apiError}</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="gov-table w-full min-w-[490px] text-left">
                          <thead>
                            <tr><th>Rank</th><th>District</th><th>Need score</th><th>Population</th></tr>
                          </thead>
                          <tbody>
                            {sortedDistricts.slice(0, 5).map((district, index) => (
                              <tr key={district.district || district.name}>
                                <td>
                                  <span className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg px-2 text-xs font-extrabold ${
                                    index === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                      : index === 1 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300'
                                        : index === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                  }`}>#{district.priority_rank}</span>
                                </td>
                                <td className="font-bold text-[#172554] dark:text-slate-100">{district.district || district.name}</td>
                                <td className="font-semibold text-slate-700 dark:text-slate-200">{Number(district.revised_need_score || 0).toFixed(2)}</td>
                                <td className="text-slate-600 dark:text-slate-300">{Number(district.total_population || 0).toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </section>

                {/* NEED VS ALLOCATION SCATTER PLOT */}
                <NeedAllocationScatter
                  districts={districts}
                  allocations={allocationData}
                  loading={apiLoading || allocationLoading}
                  error={apiError || allocationError}
                />
              </>
            )}

           {/* DISTRICTS PAGE */}

{/* DISTRICTS PAGE */}
{activePage === 'Districts' && (
  <>
    <section className="relative isolate mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#2563a8] px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
      <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-blue-300/10 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-blue-200">
            Uttarakhand · District Intelligence
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Districts
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/85">
            Explore district-level indicators, development needs and
            resource priorities across Uttarakhand.
          </p>
        </div>

        <button
          onClick={fetchDistricts}
          disabled={apiLoading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20 disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={apiLoading ? 'animate-spin' : ''}
          />
          Refresh Data
        </button>
      </div>
    </section>

    <DistrictExplorer
      districts={districts}
      apiLoading={apiLoading}
      apiError={apiError}
      onRefresh={fetchDistricts}
    />
  </>
)}



            {/* OTHER PAGES */}
            {activePage === 'Allocations' && <Allocations />}
            {activePage === 'Analytics' && <Analytics user={user} />}
            {activePage === 'Policy Simulator' && <PolicySimulator user={user} onLoginClick={() => setAuthVisible(true)} />}
            {activePage === 'Saved Scenarios' && canManageScenarios && <SavedScenarios user={user} />}
            {activePage === 'Policy Insights' && canManageScenarios && <PolicyInsights user={user} />}
            {activePage === 'Admin Dashboard' && user?.role === 'admin' && <AdminDashboard user={user} />}
            {activePage === 'Citizen Feedback' && <CitizenFeedback user={user} />}

            {/* 404 FALLBACK */}
            {![
              'Overview',
              'Districts',
              'Allocations',
              'Analytics',
              'Policy Simulator',
              'Saved Scenarios',
              'Policy Insights',
              'Admin Dashboard',
              'Citizen Feedback',
            ].includes(activePage) && (
              <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#172554] dark:bg-blue-950/50 dark:text-blue-200"><LayoutDashboard size={26} /></div>
                <h2 className="mt-5 text-xl font-bold text-[#172554] dark:text-white">{activePage}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">This section is not available yet. Please return to the overview to explore available features.</p>
                <button onClick={() => setActivePage('Overview')} className="mt-6 rounded-xl bg-[#172554] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1e3a8a]">Return to Overview</button>
              </section>
            )}

            {/* FOOTER */}
            <footer className="mt-10 flex flex-col justify-between gap-2 border-t border-slate-200 py-5 text-[10px] font-medium text-slate-400 sm:flex-row dark:border-slate-700/60">
              <p>GovOpt · Uttarakhand Resource Allocation & Optimisation</p>
              <p>Data-driven planning for transparent and efficient resource allocation.</p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
