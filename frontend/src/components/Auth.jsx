import { useState } from 'react'
import { ShieldCheck, Lock, Mail, User, ArrowLeft, CheckCircle2 } from 'lucide-react'
import api from '../services/api'
import Logo from './Logo'

function Auth({ onLogin, onClose }) {
  const [mode, setMode] = useState('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (mode === 'register') {
        const response = await api.post('/auth/register', {
          full_name: fullName,
          email,
          password,
        })

        setMessage(response.data.message)
        setMode('login')
        setPassword('')
      } else {
        const response = await api.post('/auth/login', {
          email,
          password,
        })

        onLogin(response.data)
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#E8EDF4] dark:bg-[#0B1220] transition-colors duration-300">
      <div className="flex w-full flex-col lg:flex-row">

        {/* Left Branding Panel (Hidden on small screens, 42% on lg) */}
        <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#172554] p-12 text-white lg:flex lg:w-5/12 xl:w-4/12">
          {/* Subtle geometric & topographical decorative circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border-[36px] border-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full border-[28px] border-[#DC2626]/20" />

          <div className="relative z-10">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-blue-100 hover:bg-white/10 hover:text-white transition"
            >
              <ArrowLeft size={14} />
              Return to Public Portal
            </button>

            <div className="mt-14">
              <Logo size="lg" standalone={true} />
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[1.8px] text-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                State Planning Infrastructure
              </div>
            </div>
          </div>

          <div className="relative z-10 my-10 space-y-4">
            <h2 className="text-xl font-extrabold tracking-tight text-white xl:text-2xl">
              Evidence-based public resource optimisation across Uttarakhand.
            </h2>
            <p className="text-xs leading-relaxed text-blue-200/80">
              GovOpt enables departments to assess multi-sectoral needs across 13 districts, model dynamic allocation scenarios, and track civic priorities with complete auditability.
            </p>

            <div className="pt-2 space-y-2.5">
              <div className="flex items-center gap-2.5 text-xs text-blue-100/90">
                <CheckCircle2 size={16} className="text-[#DC2626] shrink-0" />
                <span>Verified policy simulations and budget modeling</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100/90">
                <CheckCircle2 size={16} className="text-[#DC2626] shrink-0" />
                <span>Comprehensive education, water and healthcare metrics</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-blue-100/90">
                <CheckCircle2 size={16} className="text-[#DC2626] shrink-0" />
                <span>Audited administrative scenario repository</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 border-t border-white/10 pt-4 text-[10px] text-blue-200/50">
            Government of Uttarakhand · Secure Policy Environment
          </div>
        </div>

        {/* Right Form Container */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10 lg:p-14">
          <div className="w-full max-w-md">

            {/* Top mobile navigation back link */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#172554] dark:text-slate-400 dark:hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to portal
              </button>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#DC2626]">
                GovOpt
              </span>
            </div>

            {/* Form Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9 dark:border-slate-800 dark:bg-[#111C30]">

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#172554] text-white shadow-md shadow-blue-950/20">
                  <ShieldCheck size={22} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-[#172554] dark:text-white">
                    GovOpt Workspace
                  </h1>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Secure Policy & Decision Portal
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#172554] dark:text-slate-100">
                  {mode === 'login' ? 'Sign in to your account' : 'Request policy-maker access'}
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {mode === 'login'
                    ? 'Enter your credentials to access protected simulation tools and saved records.'
                    : 'Submit your departmental credentials for administrative approval.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">

                {mode === 'register' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full name
                    </label>
                    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-[#DC2626] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                      <User size={16} className="text-slate-400" />
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        placeholder="e.g. Officer Name"
                        className="w-full py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Official email address
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-[#DC2626] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                    <Mail size={16} className="text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="officer@department.gov.in"
                      className="w-full py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 focus-within:border-[#DC2626] focus-within:bg-white focus-within:ring-2 focus-within:ring-red-500/10 dark:border-slate-700 dark:bg-slate-800/60 dark:focus-within:bg-slate-800">
                    <Lock size={16} className="text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={mode === 'register' ? 8 : undefined}
                      maxLength={128}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••••"
                      className="w-full py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none dark:text-slate-100"
                    />
                  </div>
                  {mode === 'register' && (
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      Minimum 8 characters with at least one uppercase letter or symbol.
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#172554] py-3 text-xs font-bold text-white shadow-md shadow-blue-950/15 transition hover:bg-[#1e3a8a] active:scale-[0.99] disabled:opacity-60 dark:bg-[#DC2626] dark:hover:bg-[#b91c1c]"
                >
                  {loading
                    ? 'Processing...'
                    : mode === 'login'
                      ? 'Sign In to Workspace'
                      : 'Submit Request for Verification'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center dark:border-slate-800">
                <button
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login')
                    setError('')
                    setMessage('')
                  }}
                  className="text-xs font-bold text-[#172554] hover:text-[#DC2626] transition dark:text-blue-300 dark:hover:text-red-400"
                >
                  {mode === 'login'
                    ? "Need policy-maker credentials? Request access"
                    : 'Already registered? Sign in'}
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-center dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                  New registrations require administrative role assignment. Citizen access is open directly via the public portal without authentication.
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Auth
