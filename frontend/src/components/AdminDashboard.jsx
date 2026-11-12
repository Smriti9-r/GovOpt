
import { useCallback, useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  AlertCircle,
  UserCheck,
  UserRound,
  CalendarDays,
  ArrowRight,
  LockKeyhole,
  ShieldAlert,
  ClipboardCheck,
} from 'lucide-react'
import api from '../services/api'

const formatDate = (value) => {
  if (!value) return 'Date unavailable'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function AdminDashboard({ user }) {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const response = await api.get('/auth/admin/pending-users')
      setPendingUsers(response.data.pending_users || [])
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to load pending registrations.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchPendingUsers()
    }
  }, [user, fetchPendingUsers])

  const handleApproval = async (userId, isApproved) => {
    try {
      setProcessingId(userId)
      setError('')
      setSuccess('')

      const response = await api.patch(
        `/auth/admin/users/${userId}/approval`,
        { is_approved: isApproved }
      )

      setPendingUsers((currentUsers) =>
        currentUsers.filter((item) => item.id !== userId)
      )

      setSuccess(
        response.data.message ||
        (isApproved
          ? 'Account approved successfully.'
          : 'Account rejected successfully.')
      )
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        'Unable to update this account.'
      )
    } finally {
      setProcessingId(null)
    }
  }

  if (user?.role !== 'admin') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-8 text-center dark:border-rose-900/60 dark:from-rose-950/30 dark:to-orange-950/20">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          <ShieldAlert size={30} />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-rose-900 dark:text-rose-200">
          Administrator access required
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-rose-700 dark:text-rose-300">
          You do not have permission to access the administrative control panel.
          Please sign in with an authorised administrator account.
        </p>
      </div>
    )
  }

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
                <ShieldCheck size={19} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[2px] text-cyan-200">
                Administration · Access Control
              </span>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-xl text-xs leading-6 text-blue-100/80 sm:text-sm">
              Manage policy-maker access requests, verify registrations,
              and maintain controlled access to GovOpt's decision-support tools.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:min-w-[260px]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-100">
                <UserRound size={21} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-sm font-extrabold">
                  {user?.full_name || 'Administrator'}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-blue-100/70">
                  {user?.email || 'Administrator account'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
              <span className="text-[10px] text-blue-100/70">
                Account permissions
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-2.5 py-1 text-[10px] font-bold text-emerald-200">
                <CheckCircle2 size={11} />
                Administrator
              </span>
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold text-blue-50">
            <span className="h-2 w-2 rounded-full bg-amber-300" />
            Registration review
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold text-blue-50">
            <span className="h-2 w-2 rounded-full bg-cyan-300" />
            Role validation
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold text-blue-50">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            Access control
          </span>
        </div>
      </section>

      {/* SUMMARY CARDS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/80 p-5 shadow-sm dark:border-amber-900/40 dark:from-[#111C30] dark:to-amber-950/20">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[1.3px] text-amber-700 dark:text-amber-300">
                Pending Registrations
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tabular-nums text-[#172554] dark:text-white">
                {loading ? '…' : pendingUsers.length}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Accounts awaiting verification
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-100 p-3 text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              <Users size={23} />
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-2 border-t border-amber-100 pt-3 text-[10px] font-semibold text-amber-700 dark:border-amber-900/40 dark:text-amber-300">
            <Clock size={12} />
            Requires administrator review
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-5 shadow-sm dark:border-blue-900/40 dark:from-[#111C30] dark:to-blue-950/20">
          <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-blue-200/30 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[1.3px] text-blue-700 dark:text-blue-300">
                Active Administrator
              </p>
              <h2 className="mt-3 truncate text-lg font-extrabold text-[#172554] dark:text-white">
                {user?.full_name || 'Administrator'}
              </h2>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email || 'Administrator account'}
              </p>
            </div>
            <div className="ml-3 rounded-2xl border border-blue-200 bg-blue-100 p-3 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              <ShieldCheck size={23} />
            </div>
          </div>
          <div className="relative mt-5 flex items-center gap-2 border-t border-blue-100 pt-3 text-[10px] font-semibold text-blue-700 dark:border-blue-900/40 dark:text-blue-300">
            <LockKeyhole size={12} />
            Full administrative access
          </div>
        </div>
      </section>

      {/* NOTICES */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* REGISTRATION REQUESTS */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111C30]">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 p-2.5 text-violet-700 dark:from-violet-950/50 dark:to-blue-950/50 dark:text-violet-300">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#172554] dark:text-white">
                Pending Account Requests
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Verify departmental staff before granting policy-maker access.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              {pendingUsers.length} awaiting review
            </span>
            <button
              onClick={fetchPendingUsers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 dark:bg-cyan-950/40">
              <RefreshCw size={22} className="animate-spin text-cyan-700 dark:text-cyan-300" />
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Loading user registrations...
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Retrieving pending access requests
            </p>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-teal-950/30 dark:text-emerald-300">
              <UserCheck size={26} />
            </div>
            <h3 className="mt-4 text-sm font-extrabold text-[#172554] dark:text-white">
              No pending registrations
            </h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500 dark:text-slate-400">
              All policy-maker registration requests have been reviewed.
              New requests will appear here when submitted.
            </p>
            <button
              onClick={fetchPendingUsers}
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <RefreshCw size={13} />
              Check again
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 bg-slate-50/80 px-5 py-3 dark:bg-slate-900/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Registration queue
              </p>
              <p className="text-[10px] text-slate-400">
                {pendingUsers.length} applicant{pendingUsers.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="gov-table w-full min-w-[760px] text-left">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Registration Date</th>
                    <th>Status</th>
                    <th>Review Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((applicant) => {
                    const isProcessing = processingId === applicant.id

                    return (
                      <tr key={applicant.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 text-xs font-extrabold text-blue-800 dark:border-blue-900/50 dark:from-blue-950/50 dark:to-violet-950/40 dark:text-blue-200">
                              {applicant.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-[#172554] dark:text-slate-100">
                                {applicant.full_name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-400">
                                Policy-maker applicant
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="shrink-0 text-cyan-600 dark:text-cyan-400" />
                            {applicant.email}
                          </span>
                        </td>

                        <td className="text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays size={13} className="text-violet-500" />
                            {formatDate(applicant.created_at)}
                          </span>
                        </td>

                        <td>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                            <Clock size={11} />
                            Pending Review
                          </span>
                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleApproval(applicant.id, true)}
                              disabled={processingId !== null}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 size={13} />
                              {isProcessing ? 'Saving...' : 'Approve'}
                            </button>

                            <button
                              onClick={() => handleApproval(applicant.id, false)}
                              disabled={processingId !== null}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-rose-600 transition hover:-translate-y-0.5 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            >
                              <XCircle size={13} />
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* SECURITY NOTICE */}
      <section className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-5 dark:border-indigo-900/40 dark:from-indigo-950/30 dark:via-[#111C30] dark:to-cyan-950/20">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-indigo-100 bg-white p-2.5 text-indigo-700 dark:border-indigo-900/50 dark:bg-slate-900 dark:text-indigo-300">
            <ShieldCheck size={19} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200">
              Administrative Security & Permissions
            </h3>
            <p className="mt-1.5 text-[11px] leading-6 text-slate-600 dark:text-slate-400">
              Account approvals are enforced by the GovOpt backend. Only authenticated administrators can authorise or reject registrations. Approving an account grants standard policy-maker simulation capabilities, not administrative permissions.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
