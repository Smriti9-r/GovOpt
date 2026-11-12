
import { useEffect, useState } from 'react'
import {
  MessageSquareText,
  Send,
  ClipboardList,
  CheckCircle2,
  Clock,
  RefreshCw,
  MessageCircle,
  Search,
  Copy,
  ShieldCheck,
  Check,
  MapPin,
  Droplets,
  HeartPulse,
  GraduationCap,
  Building2,
  ArrowRight,
  FileText,
  Activity,
  Eye,
  CircleDot,
} from 'lucide-react'
import api from '../services/api'

const districts = [
  'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun',
  'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh',
  'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi',
]

const categories = [
  'Education', 'Water', 'Healthcare', 'Infrastructure', 'Other',
]

const statuses = ['Pending', 'Under Review', 'Resolved', 'Rejected']

const emptyForm = {
  district: '',
  category: '',
  subject: '',
  description: '',
}

const categoryStyles = {
  Education: {
    icon: GraduationCap,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  Water: {
    icon: Droplets,
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  Healthcare: {
    icon: HeartPulse,
    color: 'text-violet-700',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  Infrastructure: {
    icon: Building2,
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  Other: {
    icon: MessageSquareText,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
}

const statusStyles = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-blue-50 text-blue-700 border-blue-200',
  Resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

function CitizenFeedback({ user }) {
  const isAdmin = user?.role === 'admin'

  const [activeTab, setActiveTab] = useState('submit')
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const [referenceInput, setReferenceInput] = useState('')
  const [trackedFeedback, setTrackedFeedback] = useState(null)
  const [tracking, setTracking] = useState(false)

  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterDistrict, setFilterDistrict] = useState('All')
  const [updatingId, setUpdatingId] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setSuccess(null)
    setError('')
    setCopied(false)

    try {
      const response = await api.post('/feedback/', form)
      setSuccess(response.data)
      setForm(emptyForm)
      setActiveTab('submit')
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to submit feedback. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleTrack = async (event) => {
    event.preventDefault()

    if (!referenceInput.trim()) {
      setError('Please enter your feedback reference ID.')
      return
    }

    setTracking(true)
    setError('')
    setTrackedFeedback(null)

    try {
      const response = await api.get(
        `/feedback/track/${encodeURIComponent(referenceInput.trim())}`
      )
      setTrackedFeedback(response.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to find feedback. Please check your reference ID.'
      )
    } finally {
      setTracking(false)
    }
  }

  const copyReference = async () => {
    if (!success?.reference_id) return

    try {
      await navigator.clipboard.writeText(success.reference_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setError('Unable to copy the reference ID. Please copy it manually.')
    }
  }

  const fetchFeedback = async () => {
    if (!isAdmin) return

    setLoading(true)
    setError('')

    try {
      const params = {}
      if (filterStatus !== 'All') params.status = filterStatus
      if (filterDistrict !== 'All') params.district = filterDistrict

      const response = await api.get('/feedback/', { params })
      setFeedback(response.data)
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to load feedback submissions.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) fetchFeedback()
  }, [isAdmin, filterStatus, filterDistrict])

  const updateFeedback = async (id, status, admin_response) => {
    setUpdatingId(id)
    setError('')

    try {
      await api.patch(`/feedback/${id}`, { status, admin_response })
      await fetchFeedback()
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to update this feedback.'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const statusStyle = (status) =>
    statusStyles[status] || 'bg-slate-100 text-slate-600 border-slate-200'

  const statusCounts = statuses.reduce((counts, status) => {
    counts[status] = feedback.filter((item) => item.status === status).length
    return counts
  }, {})

  return (
    <div className="space-y-6">

      {/* HERO */}
      <section className="relative isolate overflow-hidden rounded-[26px] bg-gradient-to-br from-[#172554] via-[#1e3a70] to-[#087e8b] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[34px] border-white/[0.07]" />
        <div className="pointer-events-none absolute -bottom-28 right-1/4 h-64 w-64 rounded-full bg-cyan-300/[0.08] blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg border border-white/20 bg-white/10 p-2">
                <MessageSquareText size={19} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[2px] text-cyan-200">
                Citizen Engagement · Uttarakhand
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Citizen Feedback Portal
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-6 text-blue-100/80 sm:text-sm">
              A direct channel for communities to report local concerns,
              share ground-level insights, and follow the progress of
              administrative action.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[300px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <ShieldCheck size={20} className="text-cyan-200" />
              <p className="mt-3 text-sm font-bold">Anonymous</p>
              <p className="mt-1 text-[10px] text-blue-100/70">
                No contact details required
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <Activity size={20} className="text-amber-200" />
              <p className="mt-3 text-sm font-bold">Trackable</p>
              <p className="mt-1 text-[10px] text-blue-100/70">
                Follow updates by ticket ID
              </p>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          {[
            { label: 'Education', color: 'bg-blue-300' },
            { label: 'Water', color: 'bg-cyan-300' },
            { label: 'Healthcare', color: 'bg-violet-300' },
            { label: 'Infrastructure', color: 'bg-orange-300' },
            { label: 'Other concerns', color: 'bg-rose-300' },
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold text-blue-50"
            >
              <span className={`h-2 w-2 rounded-full ${item.color}`} />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <CircleDot size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* CITIZEN VIEW */}
      {!isAdmin && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('submit')
                setError('')
                setTrackedFeedback(null)
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition ${
                activeTab === 'submit'
                  ? 'bg-[#172554] text-white shadow-lg shadow-blue-950/15'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Send size={14} />
              Submit Feedback
            </button>

            <button
              onClick={() => {
                setActiveTab('track')
                setError('')
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold transition ${
                activeTab === 'track'
                  ? 'bg-[#087e8b] text-white shadow-lg shadow-cyan-950/15'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <Search size={14} />
              Track Ticket
            </button>
          </div>

          {/* SUBMIT */}
          {activeTab === 'submit' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="gov-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 xl:col-span-3 dark:border-slate-700 dark:bg-[#111C30]">
                <div className="mb-6 flex items-start gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 p-3 text-blue-800 dark:from-blue-950 dark:to-cyan-950 dark:text-cyan-200">
                    <MessageSquareText size={21} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#172554] dark:text-white">
                      Submit a Community Concern
                    </h2>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Describe the issue clearly so the relevant department can review it.
                    </p>
                  </div>
                </div>

                {success && (
                  <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50 p-5 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-cyan-950/20">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 size={19} />
                      <h3 className="text-sm font-extrabold">
                        Feedback successfully registered!
                      </h3>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-emerald-900/80 dark:text-emerald-200/80">
                      Your ticket has been created. Save the reference ID to check its status later.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-800 dark:bg-slate-900">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Unique reference ticket
                        </p>
                        <p className="mt-1 break-all font-mono text-sm font-extrabold text-[#172554] dark:text-white">
                          {success.reference_id}
                        </p>
                      </div>
                      <button
                        onClick={copyReference}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copied' : 'Copy Ticket'}
                      </button>
                    </div>

                    <p className="mt-3 text-[10px] leading-5 text-emerald-800/70 dark:text-emerald-300/60">
                      GovOpt does not request your phone number or email address. Keep this ticket ID safe.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        District <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="district"
                        value={form.district}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Select district</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Sector Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-medium text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="">Select sector</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {categories.map((category) => {
                      const style = categoryStyles[category]
                      const Icon = style.icon
                      const selected = form.category === category
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setForm((previous) => ({ ...previous, category }))}
                          className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition ${
                            selected
                              ? `${style.bg} ${style.border} ${style.color} ring-2 ring-offset-1 ring-current`
                              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
                          }`}
                        >
                          <Icon size={19} />
                          <span className="text-[10px] font-bold">{category}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Subject / Issue Summary <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      minLength={3}
                      maxLength={150}
                      placeholder="Write a short title for the issue..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Detailed Description <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {form.description.length}/5000
                      </span>
                    </div>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      required
                      minLength={10}
                      maxLength={5000}
                      rows={6}
                      placeholder="Describe the ground situation, location, who is affected, and the impact on the community..."
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs leading-6 text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-slate-800">
                    <p className="text-[10px] leading-5 text-slate-400">
                      Fields marked * are required. No personal contact details are requested.
                    </p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#172554] to-[#087e8b] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Send size={14} />
                      {submitting ? 'Registering...' : 'Submit Feedback'}
                      {!submitting && <ArrowRight size={14} />}
                    </button>
                  </div>
                </form>
              </div>

              {/* GUIDANCE */}
              <div className="space-y-4 xl:col-span-2">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#172554] via-[#1e3a70] to-[#087e8b] p-5 text-white shadow-lg">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border-[18px] border-white/[0.08]" />
                  <ShieldCheck size={25} className="relative text-cyan-200" />
                  <h3 className="relative mt-4 text-base font-extrabold">
                    Your Privacy Matters
                  </h3>
                  <p className="relative mt-2 text-xs leading-6 text-blue-100/80">
                    Submit concerns without providing phone numbers or email addresses. Your unique ticket reference is used to retrieve status updates.
                  </p>
                  <div className="relative mt-4 rounded-xl border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                      Helpful reminder
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/85">
                      Avoid including personal contact details or sensitive private information in your description.
                    </p>
                  </div>
                </div>

                <div className="gov-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                      <ClipboardList size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
                        How the Process Works
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        From submission to administrative response
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-5">
                    {[
                      {
                        number: '01',
                        title: 'Submit your concern',
                        description: 'Choose a district and sector, then describe the issue.',
                        color: 'bg-blue-100 text-blue-700',
                      },
                      {
                        number: '02',
                        title: 'Save your ticket ID',
                        description: 'Use the unique reference to retrieve your submission.',
                        color: 'bg-violet-100 text-violet-700',
                      },
                      {
                        number: '03',
                        title: 'Follow the review',
                        description: 'Check status changes and any published official response.',
                        color: 'bg-teal-100 text-teal-700',
                      },
                    ].map((step, index) => (
                      <div key={step.number} className="relative flex gap-3">
                        {index !== 2 && (
                          <span className="absolute left-[15px] top-9 h-7 border-l border-dashed border-slate-300 dark:border-slate-700" />
                        )}
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold ${step.color}`}>
                          {step.number}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {step.title}
                          </h4>
                          <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TRACK TICKET */}
          {activeTab === 'track' && (
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="gov-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-700 dark:bg-[#111C30]">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-cyan-50 p-3 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                    <Search size={21} />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-[#172554] dark:text-white">
                      Track Your Feedback
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Enter the reference ID you received after submitting your concern.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTrack} className="mt-6">
                  <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Ticket Reference ID
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={referenceInput}
                      onChange={(event) => setReferenceInput(event.target.value)}
                      placeholder="Enter your reference ID"
                      required
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs uppercase outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={tracking}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#087e8b] to-[#155e75] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      <Search size={14} />
                      {tracking ? 'Checking...' : 'Track Ticket'}
                    </button>
                  </div>
                </form>
              </div>

              {trackedFeedback && (
                <div className="gov-card overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                  <div className="flex flex-col justify-between gap-3 bg-gradient-to-r from-[#172554] to-[#087e8b] p-5 text-white sm:flex-row sm:items-center">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                        Feedback ticket
                      </p>
                      <p className="mt-1 break-all font-mono text-sm font-extrabold">
                        {trackedFeedback.reference_id}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[10px] font-extrabold ${statusStyle(trackedFeedback.status)}`}>
                      {trackedFeedback.status}
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-extrabold text-[#172554] dark:text-white">
                      {trackedFeedback.subject}
                    </h3>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1"><MapPin size={12} />{trackedFeedback.district}</span>
                      <span>·</span>
                      <span>{trackedFeedback.category}</span>
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                          Submitted
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {new Date(trackedFeedback.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                          Last updated
                        </p>
                        <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                          {new Date(trackedFeedback.updated_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-cyan-700 dark:text-cyan-300" />
                        <h4 className="text-xs font-extrabold text-[#172554] dark:text-white">
                          Current Lifecycle Status
                        </h4>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                        {trackedFeedback.status === 'Pending' &&
                          'Your feedback has been logged and is waiting for departmental review.'}
                        {trackedFeedback.status === 'Under Review' &&
                          'Your feedback is under active evaluation by the respective district administration.'}
                        {trackedFeedback.status === 'Resolved' &&
                          'The district authority has marked this issue as addressed and closed.'}
                        {trackedFeedback.status === 'Rejected' &&
                          'This submission has been reviewed and marked as non-actionable under current policy provisions.'}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} className="text-violet-700 dark:text-violet-300" />
                        <h4 className="text-xs font-extrabold text-violet-900 dark:text-violet-200">
                          Official Departmental Response
                        </h4>
                      </div>
                      {trackedFeedback.admin_response ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-700 dark:text-slate-200">
                          {trackedFeedback.admin_response}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          No administrative response has been published yet. Please check this ticket periodically.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ADMIN VIEW */}
      {isAdmin && (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-[#111C30]">
            <div>
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                  <ClipboardList size={19} />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-[#172554] dark:text-white">
                    Civic Feedback Administration
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Review submissions, manage status, and publish official responses.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={fetchFeedback}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh submissions
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Pending', value: statusCounts.Pending || 0, icon: Clock, color: 'amber' },
              { label: 'Under Review', value: statusCounts['Under Review'] || 0, icon: Eye, color: 'blue' },
              { label: 'Resolved', value: statusCounts.Resolved || 0, icon: CheckCircle2, color: 'emerald' },
              { label: 'Rejected', value: statusCounts.Rejected || 0, icon: CircleDot, color: 'rose' },
            ].map((item) => {
              const Icon = item.icon
              const tones = {
                amber: 'bg-amber-50 text-amber-700 border-amber-100',
                blue: 'bg-blue-50 text-blue-700 border-blue-100',
                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                rose: 'bg-rose-50 text-rose-700 border-rose-100',
              }
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {item.label}
                    </span>
                    <span className={`rounded-lg border p-2 ${tones[item.color]}`}>
                      <Icon size={15} />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold tabular-nums text-[#172554] dark:text-white">
                    {item.value}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
            <div className="mb-4 flex items-center gap-2">
              <Search size={16} className="text-cyan-700 dark:text-cyan-300" />
              <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
                Filter Feedback
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(event) => setFilterStatus(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="All">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300">
                  District
                </label>
                <select
                  value={filterDistrict}
                  onChange={(event) => setFilterDistrict(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="All">All districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-[#172554] dark:text-white">
                Submitted Reports
              </h3>
              <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                {feedback.length} record{feedback.length === 1 ? '' : 's'} matching the selected filters
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              Admin workspace
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 dark:border-slate-700 dark:bg-[#111C30]">
              <RefreshCw size={25} className="animate-spin text-cyan-600" />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Loading feedback submissions...
              </p>
            </div>
          ) : feedback.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center dark:border-slate-700 dark:bg-[#111C30]">
              <ClipboardList size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching submissions
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Try changing the status or district filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <FeedbackAdminCard
                  key={item.id}
                  item={item}
                  updating={updatingId === item.id}
                  statusStyle={statusStyle}
                  onUpdate={updateFeedback}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function FeedbackAdminCard({ item, updating, statusStyle, onUpdate }) {
  const [status, setStatus] = useState(item.status)
  const [response, setResponse] = useState(item.admin_response || '')

  useEffect(() => {
    setStatus(item.status)
    setResponse(item.admin_response || '')
  }, [item.status, item.admin_response])

  const handleSave = () => onUpdate(item.id, status, response)

  const categoryStyle = categoryStyles[item.category] || categoryStyles.Other
  const CategoryIcon = categoryStyle.icon

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-[#111C30]">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500" />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="break-all font-mono text-xs font-bold text-cyan-800 dark:text-cyan-300">
                {item.reference_id || `Legacy record #${item.id}`}
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyle(item.status)}`}>
                {item.status}
              </span>
            </div>

            <h3 className="mt-3 text-base font-extrabold text-[#172554] dark:text-white">
              {item.subject}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {item.district}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${categoryStyle.bg} ${categoryStyle.color} ${categoryStyle.border}`}>
                <CategoryIcon size={11} /> {item.category}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock size={12} /> {new Date(item.created_at).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <ShieldCheck size={13} /> Anonymous citizen
          </span>
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Community description
          </p>
          <p className="whitespace-pre-wrap text-xs leading-6 text-slate-700 dark:text-slate-300">
            {item.description}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 dark:border-slate-800">
          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Update lifecycle status
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-medium outline-none focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {statuses.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300">
              Official response (visible to citizen)
            </label>
            <textarea
              rows={3}
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              maxLength={5000}
              placeholder="Write the official response that will appear when the citizen tracks this ticket..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 outline-none focus:border-violet-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center dark:border-slate-800">
          <p className="text-[10px] text-slate-400">
            Changes are published to the citizen's ticket after saving.
          </p>
          <button
            onClick={handleSave}
            disabled={updating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#172554] to-[#087e8b] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {updating ? <RefreshCw size={13} className="animate-spin" /> : <Check size={14} />}
            {updating ? 'Saving changes...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </article>
  )
}

export default CitizenFeedback
