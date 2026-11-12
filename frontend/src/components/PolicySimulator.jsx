
import { useEffect, useState } from 'react'
import {
  SlidersHorizontal, Play, RefreshCw, TrendingUp, Wallet, Target,
  Info, AlertCircle, CheckCircle2, Lock, Save, FolderOpen, Trash2,
  Pencil, Download, GitCompareArrows, X, BookOpen, Droplets,
  HeartPulse, Users, Activity, Landmark, MapPin, BarChart3,
} from 'lucide-react'
import api from '../services/api'

const initialSettings = {
  education_weight: 40,
  water_weight: 30,
  healthcare_weight: 30,
  budget_crore: 600,
  need_weight: 70,
  population_weight: 30,
  min_allocation_crore: 20,
  max_allocation_crore: 70,
}

const COLORS = {
  navy: '#172554',
  blue: '#3989D0',
  teal: '#13A89E',
  violet: '#9360D5',
  coral: '#F07865',
  cyan: '#16A6C4',
  amber: '#D69A35',
  rose: '#DC6484',
}

function rebalanceWeights(current, changedKey, newValue, groupKeys) {
  const value = Math.min(100, Math.max(0, Math.round(Number(newValue))))
  const otherKeys = groupKeys.filter((key) => key !== changedKey)
  const remaining = 100 - value
  const previousTotal = otherKeys.reduce(
    (sum, key) => sum + Number(current[key] || 0), 0
  )
  const updated = { ...current, [changedKey]: value }

  if (otherKeys.length === 1) {
    updated[otherKeys[0]] = remaining
    return updated
  }

  if (previousTotal === 0) {
    const share = Math.floor(remaining / otherKeys.length)
    otherKeys.forEach((key, index) => {
      updated[key] = index === otherKeys.length - 1
        ? remaining - share * (otherKeys.length - 1)
        : share
    })
    return updated
  }

  let distributed = 0
  otherKeys.forEach((key, index) => {
    if (index === otherKeys.length - 1) {
      updated[key] = remaining - distributed
    } else {
      const adjusted = Math.round((remaining * current[key]) / previousTotal)
      updated[key] = adjusted
      distributed += adjusted
    }
  })
  return updated
}

const formatNumber = (value) =>
  Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })

const formatCrore = (value) => `₹${formatNumber(value)} Cr`

const getScenarioList = (data) => {
  if (Array.isArray(data)) return data
  return data?.scenarios || data?.data || []
}

const getScenarioId = (scenario) => scenario.id ?? scenario.scenario_id

const downloadPdf = (blob, filename) => {
  const file = new Blob([blob], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function PanelHeading({ icon: Icon, title, description, color = COLORS.blue }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon size={19} />
      </div>
      <div>
        <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

function NumberField({ label, value, onChange, min = 0, step = 1 }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold text-slate-600 dark:text-slate-300">
        {label}
      </label>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-bold text-[#172554] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-950"
      />
    </div>
  )
}

function WeightControl({ label, value, color, icon: Icon = Activity, description, onChange }) {
  const progress = Math.min(100, Math.max(0, Number(value) || 0))

  return (
    <div
      className="rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        borderColor: `${color}45`,
        background: `linear-gradient(120deg, ${color}0D, transparent 85%)`,
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {label}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-black tabular-nums"
          style={{ color, backgroundColor: `${color}18` }}
        >
          {progress}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={progress}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="gov-weight-slider mt-4 w-full cursor-pointer"
        style={{ accentColor: color }}
      />

      <div className="mt-2 flex items-center gap-3">
        <span className="text-[10px] font-semibold text-slate-400">0%</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${progress}%`,
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}70`,
            }}
          />
        </div>
        <span className="text-[10px] font-semibold text-slate-400">100%</span>
      </div>
    </div>
  )
}

function WeightTotal({ title, total, color = COLORS.teal }) {
  const valid = total === 100
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{title}</span>
        <span className={`flex items-center gap-1.5 text-xs font-extrabold ${valid ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'}`}>
          {valid && <CheckCircle2 size={14} />}
          Total: {total}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-700">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, total))}%`,
            background: valid
              ? `linear-gradient(90deg, ${color}, ${COLORS.cyan})`
              : `linear-gradient(90deg, ${COLORS.rose}, ${COLORS.amber})`,
          }}
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, note, icon: Icon, color }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-[#111C30]">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: color }} />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="rounded-xl p-2" style={{ backgroundColor: `${color}18`, color }}>
          <Icon size={18} />
        </div>
      </div>
      <h3 className="mt-4 text-2xl font-black tracking-tight text-[#172554] dark:text-white">
        {value}
      </h3>
      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{note}</p>
    </div>
  )
}

function SectionTitle({ eyebrow, title, description, color = COLORS.coral }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-4 w-1 rounded-full" style={{ backgroundColor: color }} />
        <p className="text-[10px] font-extrabold uppercase tracking-[2px]" style={{ color }}>
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#172554] dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
  )
}

function PolicySimulator({ user, onLoginClick }) {
  const canAllocate = ['policy_maker', 'admin'].includes(user?.role)

  const [settings, setSettings] = useState(initialSettings)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [scenarios, setScenarios] = useState([])
  const [scenarioName, setScenarioName] = useState('')
  const [scenariosLoading, setScenariosLoading] = useState(false)
  const [savingScenario, setSavingScenario] = useState(false)
  const [scenarioError, setScenarioError] = useState('')
  const [scenarioMessage, setScenarioMessage] = useState('')
  const [selectedScenarioIds, setSelectedScenarioIds] = useState([])
  const [comparing, setComparing] = useState(false)
  const [compareResult, setCompareResult] = useState(null)
  const [reportLoading, setReportLoading] = useState(null)

  const sectorTotal =
    Number(settings.education_weight) +
    Number(settings.water_weight) +
    Number(settings.healthcare_weight)

  const allocationWeightTotal =
    Number(settings.need_weight) + Number(settings.population_weight)

  const updateSectorWeight = (key, value) => {
    setSettings((previous) => rebalanceWeights(previous, key, value, [
      'education_weight', 'water_weight', 'healthcare_weight',
    ]))
    setResult(null)
    setError('')
  }

  const updateAllocationWeight = (key, value) => {
    setSettings((previous) => rebalanceWeights(previous, key, value, [
      'need_weight', 'population_weight',
    ]))
    setResult(null)
    setError('')
  }

  const updateNumber = (key, value) => {
    setSettings((previous) => ({ ...previous, [key]: value }))
    setResult(null)
    setError('')
  }

  const resetSettings = () => {
    setSettings(initialSettings)
    setResult(null)
    setError('')
  }

  const loadScenarios = async () => {
    if (!canAllocate) return
    try {
      setScenariosLoading(true)
      setScenarioError('')
      const response = await api.get('/scenarios')
      setScenarios(getScenarioList(response.data))
    } catch (err) {
      console.error('Unable to load scenarios:', err)
      setScenarioError(err.response?.data?.detail || 'Unable to load saved scenarios.')
    } finally {
      setScenariosLoading(false)
    }
  }

  useEffect(() => {
    if (canAllocate) loadScenarios()
  }, [canAllocate])

  const runSimulation = async () => {
    setError('')
    setResult(null)
    setScenarioMessage('')
    setCompareResult(null)

    if (sectorTotal !== 100) {
      setError('Sector weights must total exactly 100%.')
      return
    }

    const payload = {
      education_weight: Number(settings.education_weight),
      water_weight: Number(settings.water_weight),
      healthcare_weight: Number(settings.healthcare_weight),
    }

    if (canAllocate) {
      const budget = Number(settings.budget_crore)
      const minimum = Number(settings.min_allocation_crore)
      const maximum = Number(settings.max_allocation_crore)

      if (allocationWeightTotal !== 100) {
        setError('Development Need and Population weights must sum to 100%.')
        return
      }
      if (!Number.isFinite(budget) || budget <= 0) {
        setError('Please enter a valid budget greater than zero.')
        return
      }
      if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum < 0 || maximum < minimum) {
        setError('Please check your minimum and maximum allocation bounds.')
        return
      }
      if (minimum * 13 > budget) {
        setError('The total budget is insufficient to satisfy the minimum constraint across 13 districts.')
        return
      }
      if (maximum * 13 < budget) {
        setError('The maximum bounds are too restrictive to distribute the entire budget across 13 districts.')
        return
      }

      Object.assign(payload, {
        budget_crore: budget,
        need_weight: Number(settings.need_weight),
        population_weight: Number(settings.population_weight),
        min_allocation_crore: minimum,
        max_allocation_crore: maximum,
      })
    }

    try {
      setLoading(true)
      const response = await api.post('/policy/weights', payload)
      setResult(response.data)
    } catch (err) {
      console.error('Policy simulation failed:', err)
      setError(err.response?.data?.detail || 'Simulation calculation failed. Please check connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const saveScenario = async () => {
    const name = scenarioName.trim()
    if (!name) {
      setScenarioError('Please enter a descriptive name for this scenario.')
      return
    }
    if (!result) {
      setScenarioError('Run the simulation first to produce results before saving.')
      return
    }

    setSavingScenario(true)
    setScenarioError('')
    setScenarioMessage('')
    try {
      const payload = {
        name,
        budget_crore: Number(settings.budget_crore),
        education_weight: Number(settings.education_weight),
        water_weight: Number(settings.water_weight),
        healthcare_weight: Number(settings.healthcare_weight),
        need_weight: Number(settings.need_weight),
        population_weight: Number(settings.population_weight),
        min_allocation_crore: Number(settings.min_allocation_crore),
        max_allocation_crore: Number(settings.max_allocation_crore),
        result_snapshot: result,
      }
      await api.post('/scenarios', payload)
      setScenarioMessage('Scenario saved successfully to repository.')
      setScenarioName('')
      await loadScenarios()
    } catch (err) {
      console.error('Failed to save scenario:', err)
      setScenarioError(err.response?.data?.detail || 'Unable to save scenario. Please check name and try again.')
    } finally {
      setSavingScenario(false)
    }
  }

  const renameScenario = async (scenario) => {
    const id = getScenarioId(scenario)
    const newName = window.prompt('Update scenario name:', scenario.name || '')
    if (newName === null) return
    const trimmed = newName.trim()
    if (!trimmed) {
      setScenarioError('Scenario name cannot be left empty.')
      return
    }
    try {
      setScenarioError('')
      await api.put(`/scenarios/${id}`, { name: trimmed })
      setScenarioMessage('Scenario successfully renamed.')
      await loadScenarios()
    } catch (err) {
      console.error('Rename failed:', err)
      setScenarioError(err.response?.data?.detail || 'Unable to rename this scenario.')
    }
  }

  const deleteScenario = async (scenario) => {
    const id = getScenarioId(scenario)
    const confirmed = window.confirm(`Permanently delete "${scenario.name || 'this scenario'}"?`)
    if (!confirmed) return
    try {
      setScenarioError('')
      await api.delete(`/scenarios/${id}`)
      setScenarioMessage('Scenario deleted from repository.')
      setSelectedScenarioIds((current) => current.filter((item) => item !== id))
      await loadScenarios()
    } catch (err) {
      console.error('Delete failed:', err)
      setScenarioError(err.response?.data?.detail || 'Unable to delete this scenario.')
    }
  }

  const toggleScenarioSelection = (id) => {
    setSelectedScenarioIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= 5) {
        setScenarioError('You can compare a maximum of 5 scenarios simultaneously.')
        return current
      }
      return [...current, id]
    })
  }

  const compareScenarios = async () => {
    if (selectedScenarioIds.length < 2) {
      setScenarioError('Select at least 2 scenarios to execute a comparative study.')
      return
    }
    try {
      setComparing(true)
      setScenarioError('')
      const response = await api.post('/scenarios/compare', {
        scenario_ids: selectedScenarioIds,
      })
      setCompareResult(response.data)
    } catch (err) {
      console.error('Comparison execution failed:', err)
      setScenarioError(err.response?.data?.detail || 'Unable to compare selected scenarios.')
    } finally {
      setComparing(false)
    }
  }

  const downloadScenarioReport = async (scenario) => {
    const id = getScenarioId(scenario)
    try {
      setReportLoading(`scenario-${id}`)
      setScenarioError('')
      const response = await api.get(`/reports/scenarios/${id}`, { responseType: 'blob' })
      downloadPdf(
        response.data,
        `GovOpt_${(scenario.name || 'Scenario').replace(/[^a-z0-9_-]/gi, '_')}.pdf`
      )
    } catch (err) {
      console.error('Scenario PDF download failed:', err)
      setScenarioError('Unable to download this scenario report.')
    } finally {
      setReportLoading(null)
    }
  }

  const downloadComparisonReport = async () => {
    if (selectedScenarioIds.length < 2) {
      setScenarioError('Select at least 2 scenarios first.')
      return
    }
    try {
      setReportLoading('comparison')
      setScenarioError('')
      const response = await api.post(
        '/reports/scenarios/compare',
        { scenario_ids: selectedScenarioIds },
        { responseType: 'blob' }
      )
      downloadPdf(response.data, 'GovOpt_Scenario_Comparison.pdf')
    } catch (err) {
      console.error('Comparison PDF download failed:', err)
      setScenarioError('Unable to download the comparison report.')
    } finally {
      setReportLoading(null)
    }
  }

  const rankings = result?.rankings || []
  const allocations = result?.allocation?.allocations || []

  const panelClass = 'overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]'
  const buttonPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#172554] px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#DC2626] dark:hover:bg-red-700'
  const buttonSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'

  return (
    <div className="space-y-6">

      {/* PAGE HERO */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14234D] via-[#1E3A70] to-[#176D83] p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-white/15 p-2 text-cyan-200">
                <SlidersHorizontal size={18} />
              </span>
              <p className="text-[10px] font-extrabold uppercase tracking-[2.5px] text-cyan-200">
                Decision Support & Optimization Engine
              </p>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Policy Simulator
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-blue-100/85 sm:text-sm">
              Test development priorities, fiscal constraints and allocation strategies to understand how different policy choices could affect Uttarakhand's 13 districts.
            </p>
          </div>
          <div className="flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <span className={`h-2 w-2 rounded-full ${canAllocate ? 'bg-teal-300' : 'bg-cyan-300'}`} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-100/70">Access level</p>
              <p className="text-xs font-extrabold text-white">
                {canAllocate ? 'Policy Simulation Enabled' : 'Public Explorer'}
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-7 grid grid-cols-2 gap-2 border-t border-white/15 pt-5 sm:grid-cols-4">
          {[
            { label: 'Districts covered', value: '13', icon: MapPin },
            { label: 'Priority sectors', value: '03', icon: Target },
            { label: 'Weight groups', value: canAllocate ? '02' : '01', icon: SlidersHorizontal },
            { label: 'Planning workspace', value: canAllocate ? 'Full' : 'Explore', icon: Landmark },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className="rounded-lg bg-white/10 p-2 text-cyan-200"><Icon size={16} /></div>
                <div>
                  <p className="text-lg font-black text-white">{item.value}</p>
                  <p className="text-[10px] text-blue-100/70">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CONFIGURATION */}
      <section>
        <SectionTitle
          eyebrow="Simulation workspace"
          title="Configure your policy scenario"
          description="Change the relative priorities and constraints, then run the model to calculate district-level results."
          color={COLORS.blue}
        />

        <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-3">

            {/* SECTOR WEIGHTS */}
            <div className={panelClass}>
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-teal-400 to-violet-500" />
              <div className="p-5 sm:p-6">
                <PanelHeading
                  icon={BarChart3}
                  title="Sectoral Priority Weights"
                  description="Set how strongly each sector contributes to the composite district need score."
                  color={COLORS.blue}
                />
                <div className="space-y-3">
                  <WeightControl
                    label="Education Sector"
                    description="Schools, learning and education infrastructure"
                    value={settings.education_weight}
                    color={COLORS.blue}
                    icon={BookOpen}
                    onChange={(value) => updateSectorWeight('education_weight', value)}
                  />
                  <WeightControl
                    label="Water Resources"
                    description="Water access, supply and resource development"
                    value={settings.water_weight}
                    color={COLORS.teal}
                    icon={Droplets}
                    onChange={(value) => updateSectorWeight('water_weight', value)}
                  />
                  <WeightControl
                    label="Healthcare Infrastructure"
                    description="Health facilities and public health requirements"
                    value={settings.healthcare_weight}
                    color={COLORS.violet}
                    icon={HeartPulse}
                    onChange={(value) => updateSectorWeight('healthcare_weight', value)}
                  />
                </div>
                <WeightTotal title="Cumulative sectoral weights" total={sectorTotal} />
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50/80 px-3.5 py-3 text-[11px] leading-relaxed text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  Changing one sector automatically redistributes the remaining weight proportionally across the other sectors.
                </p>
              </div>
            </div>

            {/* ALLOCATION WEIGHTS */}
            {canAllocate && (
              <div className={panelClass}>
                <div className="h-1.5 bg-gradient-to-r from-[#F07865] via-rose-500 to-[#344D83]" />
                <div className="p-5 sm:p-6">
                  <PanelHeading
                    icon={Target}
                    title="Allocation Weighting Factors"
                    description="Balance assessed development need against the population share of each district."
                    color={COLORS.coral}
                  />
                  <div className="space-y-3">
                    <WeightControl
                      label="Development Need Factor"
                      description="Priority based on assessed district needs"
                      value={settings.need_weight}
                      color={COLORS.coral}
                      icon={Target}
                      onChange={(value) => updateAllocationWeight('need_weight', value)}
                    />
                    <WeightControl
                      label="Demographic Population Factor"
                      description="Priority based on district population share"
                      value={settings.population_weight}
                      color="#344D83"
                      icon={Users}
                      onChange={(value) => updateAllocationWeight('population_weight', value)}
                    />
                  </div>
                  <WeightTotal title="Total allocation coefficient" total={allocationWeightTotal} color={COLORS.coral} />
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50/80 px-3.5 py-3 text-[11px] leading-relaxed text-rose-800 dark:bg-rose-950/25 dark:text-rose-200">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    A higher need weight gives more influence to assessed development gaps; a higher population weight gives more influence to population share.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* BUDGET / ACCESS PANEL */}
          <div className="h-fit xl:col-span-2">
            {canAllocate ? (
              <div className={panelClass}>
                <div className="h-1.5 bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400" />
                <div className="p-5 sm:p-6">
                  <PanelHeading
                    icon={Wallet}
                    title="Budget Envelope & Constraints"
                    description="Set the total planning budget and per-district allocation limits."
                    color={COLORS.coral}
                  />
                  <div className="space-y-4">
                    <NumberField
                      label="Total State Budget Envelope (₹ Crore)"
                      value={settings.budget_crore}
                      min={1}
                      onChange={(value) => updateNumber('budget_crore', value)}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <NumberField
                        label="Minimum / District (₹ Cr)"
                        value={settings.min_allocation_crore}
                        min={0}
                        onChange={(value) => updateNumber('min_allocation_crore', value)}
                      />
                      <NumberField
                        label="Maximum / District (₹ Cr)"
                        value={settings.max_allocation_crore}
                        min={0}
                        onChange={(value) => updateNumber('max_allocation_crore', value)}
                      />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-4 dark:border-rose-900/40 dark:from-rose-950/30 dark:via-orange-950/20 dark:to-amber-950/20">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-300">
                          Planning budget
                        </p>
                        <Wallet size={16} className="text-rose-500" />
                      </div>
                      <p className="mt-2 text-3xl font-black tracking-tight text-[#172554] dark:text-white">
                        {formatCrore(settings.budget_crore)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Total envelope available for all 13 districts.
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Constraint capacity check
                      </p>
                      <div className="mt-2 flex justify-between gap-2 text-[11px]">
                        <span className="text-slate-500">Minimum combined floor</span>
                        <strong className="text-[#172554] dark:text-white">
                          {formatCrore(Number(settings.min_allocation_crore) * 13)}
                        </strong>
                      </div>
                      <div className="mt-1 flex justify-between gap-2 text-[11px]">
                        <span className="text-slate-500">Maximum combined ceiling</span>
                        <strong className="text-[#172554] dark:text-white">
                          {formatCrore(Number(settings.max_allocation_crore) * 13)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
                    <button onClick={runSimulation} disabled={loading} className={`${buttonPrimary} w-full`}>
                      {loading ? (
                        <><RefreshCw size={15} className="animate-spin" /> Executing optimization model...</>
                      ) : (
                        <><Play size={15} /> Generate Optimal Allocation</>
                      )}
                    </button>
                    <button onClick={resetSettings} disabled={loading} className={`${buttonSecondary} w-full`}>
                      <RefreshCw size={14} /> Reset Defaults
                    </button>
                  </div>

                  {error && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                      <AlertCircle size={15} className="mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${panelClass} p-5 sm:p-6`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                  <Lock size={20} />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-[#172554] dark:text-white">
                  Government Resource Optimization
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Public users can explore sector priorities and district rankings. Budget envelope calibration and allocation optimization require policy-maker authorization.
                </p>
                <div className="mt-5 space-y-2.5">
                  <button onClick={runSimulation} disabled={loading} className={`${buttonPrimary} w-full`}>
                    {loading ? 'Evaluating...' : <><Play size={14} /> Calculate District Priority Index</>}
                  </button>
                  <button onClick={resetSettings} disabled={loading} className={`${buttonSecondary} w-full`}>
                    <RefreshCw size={13} /> Reset Defaults
                  </button>
                  <button
                    onClick={onLoginClick}
                    className="w-full rounded-xl border border-rose-300 px-4 py-2.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    Sign in for Full Simulation Access
                  </button>
                </div>
                {error && (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                    {error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SIMULATION RESULTS */}
      {result && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <SectionTitle
              eyebrow="Model output"
              title={canAllocate ? 'Scenario Allocation Solution' : 'District Ranking Solution'}
              description="Results generated using the active policy weights and model settings."
              color={COLORS.teal}
            />
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300">
              <CheckCircle2 size={14} /> Optimization completed
            </span>
          </div>

          {canAllocate && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total budget"
                value={formatCrore(result.allocation?.budget_crore)}
                note="Configured scenario budget"
                icon={Wallet}
                color={COLORS.coral}
              />
              <MetricCard
                label="Total allocated"
                value={formatCrore(result.allocation?.total_allocated_crore)}
                note="Distributed across districts"
                icon={TrendingUp}
                color={COLORS.teal}
              />
              <MetricCard
                label="Districts analysed"
                value={result.district_count || 13}
                note="Districts in optimization model"
                icon={MapPin}
                color={COLORS.blue}
              />
              <MetricCard
                label="Need weight"
                value={`${result.allocation?.need_weight ?? settings.need_weight}%`}
                note={`Population weight: ${result.allocation?.population_weight ?? settings.population_weight}%`}
                icon={SlidersHorizontal}
                color={COLORS.violet}
              />
            </div>
          )}

          {/* SAVE SCENARIO */}
          {canAllocate && (
            <div className={panelClass}>
              <div className="h-1 bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400" />
              <div className="p-5 sm:p-6">
                <PanelHeading
                  icon={Save}
                  title="Save Scenario to Repository"
                  description="Store the active weights, fiscal constraints and generated solution for later comparison and reporting."
                  color={COLORS.coral}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(event) => setScenarioName(event.target.value)}
                    placeholder="e.g. Healthcare & High Deficit Focused FY26"
                    maxLength={120}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-rose-950"
                  />
                  <button onClick={saveScenario} disabled={savingScenario} className={`${buttonPrimary} sm:min-w-40`}>
                    {savingScenario ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                    {savingScenario ? 'Saving...' : 'Save Scenario'}
                  </button>
                </div>
                {scenarioMessage && (
                  <p className="mt-3 text-xs font-bold text-teal-600 dark:text-teal-400">{scenarioMessage}</p>
                )}
                {scenarioError && (
                  <p className="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400">{scenarioError}</p>
                )}
              </div>
            </div>
          )}

          {/* DISTRICT RANKINGS */}
          <div className={panelClass}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 dark:border-slate-700">
              <div>
                <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">District Priority Rankings</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Composite policy need scores under the active sector weights.
                </p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                {rankings.length} districts ranked
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="gov-table w-full min-w-[750px] text-left">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>District</th>
                    <th>Education Score</th>
                    <th>Water Score</th>
                    <th>Healthcare Score</th>
                    <th>Composite Need</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((district) => (
                    <tr key={district.district}>
                      <td>
                        <span className="inline-flex h-7 min-w-8 items-center justify-center rounded-lg bg-blue-100 px-2 text-xs font-extrabold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          #{district.policy_priority_rank}
                        </span>
                      </td>
                      <td className="font-bold text-[#172554] dark:text-slate-100">{district.district}</td>
                      <td className="text-slate-600 dark:text-slate-300">{formatNumber(district.education_need_score)}</td>
                      <td className="text-slate-600 dark:text-slate-300">{formatNumber(district.water_need_score)}</td>
                      <td className="text-slate-600 dark:text-slate-300">{formatNumber(district.healthcare_need_score)}</td>
                      <td className="font-extrabold text-rose-600 dark:text-rose-400">{formatNumber(district.policy_need_score)}</td>
                    </tr>
                  ))}
                  {rankings.length === 0 && (
                    <tr><td colSpan="6" className="px-5 py-8 text-center text-xs text-slate-400">No district rankings available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* OPTIMIZED ALLOCATIONS */}
          {canAllocate && (
            <div className={panelClass}>
              <div className="border-b border-slate-100 p-5 dark:border-slate-700">
                <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">Optimised District Allocations</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Target and final constrained distribution under the optimization model.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="gov-table w-full min-w-[650px] text-left">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th className="text-right">Combined Priority</th>
                      <th className="text-right">Target Allocation</th>
                      <th className="text-right">Optimised Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocations.map((district) => (
                      <tr key={district.district}>
                        <td className="font-bold text-[#172554] dark:text-slate-100">{district.district}</td>
                        <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">{formatNumber(district.combined_priority)}</td>
                        <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCrore(district.target_allocation_crore)}</td>
                        <td className="text-right font-extrabold tabular-nums text-rose-600 dark:text-rose-400">{formatCrore(district.optimised_allocation_crore)}</td>
                      </tr>
                    ))}
                    {allocations.length === 0 && (
                      <tr><td colSpan="4" className="px-5 py-8 text-center text-xs text-slate-400">No allocation results computed.</td></tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3">Total Optimized Budget Envelope</td>
                      <td className="text-right font-extrabold text-rose-600 dark:text-rose-400">
                        {formatCrore(result.allocation?.total_allocated_crore)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/70 p-4 dark:border-amber-900/40 dark:from-amber-950/25 dark:to-orange-950/20">
            <Info size={17} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80">
              These are analytical planning simulations based on model weights and constraints. They do not represent official treasury disbursements or gazetted financial approvals.
            </p>
          </div>
        </section>
      )}

      {/* SCENARIO REPOSITORY */}
      {canAllocate && (
        <section className={`${panelClass} p-5 sm:p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
            <PanelHeading
              icon={FolderOpen}
              title="Scenario Repository"
              description="Review, compare, audit and export saved resource allocation models."
              color={COLORS.violet}
            />
            <button onClick={loadScenarios} disabled={scenariosLoading} className={buttonSecondary}>
              <RefreshCw size={13} className={scenariosLoading ? 'animate-spin text-rose-500' : ''} />
              Refresh
            </button>
          </div>

          {scenarioError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>{scenarioError}</span>
            </div>
          )}
          {scenarioMessage && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-3 text-xs font-semibold text-teal-700 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-300">
              {scenarioMessage}
            </div>
          )}

          {scenariosLoading ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-blue-500" />
              Loading scenario archives...
            </div>
          ) : scenarios.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/30">
              <FolderOpen size={26} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-xs font-extrabold text-slate-600 dark:text-slate-300">No saved scenarios yet</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Generate an allocation above and save it to begin your policy archive.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#172554] dark:text-white">
                  {scenarios.length} {scenarios.length === 1 ? 'scenario' : 'scenarios'} saved
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select 2–5 scenarios to trigger comparative analysis
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {scenarios.map((scenario) => {
                  const id = getScenarioId(scenario)
                  const checked = selectedScenarioIds.includes(id)
                  const snapshot = scenario.result_snapshot || {}
                  const allocation = snapshot.allocation || {}

                  return (
                    <div
                      key={id}
                      className={`rounded-2xl border p-4 transition-all ${
                        checked
                          ? 'border-blue-400 bg-blue-50/70 shadow-sm ring-1 ring-blue-300 dark:border-blue-500 dark:bg-blue-950/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div className="flex min-w-0 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleScenarioSelection(id)}
                            className="mt-1 h-4 w-4 rounded accent-blue-600"
                            aria-label={`Select ${scenario.name} for comparison`}
                          />
                          <div className="min-w-0">
                            <h3 className="break-words text-xs font-extrabold text-[#172554] dark:text-white">
                              {scenario.name || `Scenario ${id}`}
                            </h3>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Budget: <strong>{formatCrore(scenario.budget_crore ?? allocation.budget_crore)}</strong>
                            </p>
                            {scenario.created_at && (
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Created: {new Date(scenario.created_at).toLocaleDateString('en-IN')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pl-7 md:pl-0">
                          <button
                            onClick={() => downloadScenarioReport(scenario)}
                            disabled={reportLoading === `scenario-${id}`}
                            title="Download PDF report"
                            className={buttonSecondary}
                          >
                            {reportLoading === `scenario-${id}` ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                            PDF
                          </button>
                          <button onClick={() => renameScenario(scenario)} title="Rename scenario" className={buttonSecondary}>
                            <Pencil size={13} /> Rename
                          </button>
                          <button
                            onClick={() => deleteScenario(scenario)}
                            title="Delete scenario"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {selectedScenarioIds.length} of 5 selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedScenarioIds([])
                      setCompareResult(null)
                      setScenarioError('')
                    }}
                    disabled={selectedScenarioIds.length === 0}
                    className={buttonSecondary}
                  >
                    <X size={13} /> Clear
                  </button>
                  <button
                    onClick={compareScenarios}
                    disabled={comparing || selectedScenarioIds.length < 2}
                    className={buttonPrimary}
                  >
                    {comparing ? <RefreshCw size={13} className="animate-spin" /> : <GitCompareArrows size={13} />}
                    Compare Selected
                  </button>
                  <button
                    onClick={downloadComparisonReport}
                    disabled={reportLoading === 'comparison' || selectedScenarioIds.length < 2}
                    className={buttonSecondary}
                  >
                    {reportLoading === 'comparison' ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                    Comparison PDF
                  </button>
                </div>
              </div>

              {compareResult && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/50 dark:bg-teal-950/30">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-xs font-extrabold text-teal-800 dark:text-teal-300">
                      Comparative Analysis Prepared
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-teal-900/80 dark:text-teal-200/80">
                      The selected scenarios have been synchronized and compared across allocations and need trajectories. Download the comparison PDF for a detailed report.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* INITIAL STATE */}
      {!result && !loading && (
        <section className="relative overflow-hidden rounded-3xl border border-dashed border-blue-200 bg-gradient-to-br from-white via-blue-50/70 to-cyan-50/70 px-6 py-12 text-center dark:border-slate-700 dark:from-[#111C30] dark:via-blue-950/20 dark:to-cyan-950/20">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl dark:bg-blue-500/10" />
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 via-teal-100 to-violet-100 text-[#172554] shadow-sm dark:from-blue-950 dark:via-teal-950 dark:to-violet-950 dark:text-blue-200">
            <TrendingUp size={25} />
          </div>
          <h3 className="relative mt-4 text-base font-extrabold text-[#172554] dark:text-white">
            {canAllocate ? 'Ready to run a policy optimization simulation?' : 'Explore district development priorities'}
          </h3>
          <p className="relative mx-auto mt-2 max-w-lg text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {canAllocate
              ? 'Adjust sector priorities, budget parameters and allocation bounds, then generate a simulation to examine how resources could be distributed across Uttarakhand.'
              : 'Adjust sectoral weights to explore how different policy priorities affect district development-need rankings.'}
          </p>
        </section>
      )}
    </div>
  )
}

export default PolicySimulator
