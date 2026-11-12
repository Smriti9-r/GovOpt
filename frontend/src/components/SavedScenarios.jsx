import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  Download,
  GitCompareArrows,
  X,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Wallet,
  BarChart3,
  LoaderCircle,
  FolderOpen,
} from "lucide-react";
import api from "../services/api";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const formatCrore = (value) => `₹${formatNumber(value)} Cr`;

const getErrorMessage = (error) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function SavedScenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportScenarioId, setReportScenarioId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/scenarios");

      setScenarios(response.data.scenarios || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      if (previous.length >= 5) {
        setError("You can compare a maximum of 5 scenarios.");
        return previous;
      }

      setError("");
      return [...previous, id];
    });
  };

  const clearComparison = () => {
    setSelectedIds([]);
    setComparisonResult(null);
    setError("");
    setSuccess("");
  };

  const viewScenario = async (id) => {
    try {
      setDetailsLoading(true);
      setError("");
      setSelectedScenario(null);

      const response = await api.get(`/scenarios/${id}`);

      setSelectedScenario(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedScenario(null);
  };

  const startRename = (scenario) => {
    setEditingId(scenario.id);
    setEditingName(scenario.name);
  };

  const saveRename = async (id) => {
    const cleanName = editingName.trim();

    if (!cleanName) {
      setError("Scenario name cannot be empty.");
      return;
    }

    try {
      setError("");
      await api.put(`/scenarios/${id}`, {
        name: cleanName,
      });

      setSuccess("Scenario renamed successfully.");
      setEditingId(null);
      setEditingName("");
      await loadScenarios();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const deleteScenario = async (scenario) => {
    const confirmed = window.confirm(
      `Permanently delete "${scenario.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/scenarios/${scenario.id}`);

      setSuccess("Scenario deleted successfully.");
      setSelectedIds((current) =>
        current.filter((item) => item !== scenario.id)
      );

      if (selectedScenario?.scenario?.id === scenario.id) {
        setSelectedScenario(null);
      }

      await loadScenarios();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const compareScenarios = async () => {
    if (selectedIds.length < 2) {
      setError("Please select at least 2 scenarios to compare.");
      return;
    }

    try {
      setComparing(true);
      setError("");
      setSuccess("");

      const response = await api.post("/scenarios/compare", {
        scenario_ids: selectedIds,
      });

      setComparisonResult(response.data);
      setSuccess("Comparison generated successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setComparing(false);
    }
  };

  const downloadScenarioPdf = async (scenario) => {
    try {
      setReportLoading(true);
      setReportScenarioId(scenario.id);
      setError("");

      const response = await api.get(
        `/reports/scenarios/${scenario.id}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `GovOpt_${scenario.name.replace(/[^a-z0-9_-]/gi, "_")}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setSuccess("Scenario PDF downloaded successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReportLoading(false);
      setReportScenarioId(null);
    }
  };

  const downloadComparisonPdf = async () => {
    if (selectedIds.length < 2) {
      setError("Please select at least 2 scenarios first.");
      return;
    }

    try {
      setReportLoading(true);
      setError("");

      const response = await api.post(
        "/reports/scenarios/compare",
        {
          scenario_ids: selectedIds,
        },
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "GovOpt_Scenario_Comparison.pdf";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

      setSuccess("Comparison PDF downloaded successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReportLoading(false);
    }
  };

  const comparisonScenarios = useMemo(() => {
    if (!comparisonResult) return [];

    return (comparisonResult.scenario_ids || [])
      .map((id) => scenarios.find((scenario) => scenario.id === id))
      .filter(Boolean);
  }, [comparisonResult, scenarios]);

  const comparisonRows = comparisonResult?.comparison || [];

  const scenarioDetails = selectedScenario?.scenario;
  const snapshot = selectedScenario?.result_snapshot || {};
  const allocationSnapshot = snapshot.allocation || {};
  const snapshotAllocations = allocationSnapshot.allocations || [];

  const maximumAllocation = useMemo(() => {
    const values = comparisonRows.flatMap((row) =>
      Object.values(row.scenarios || {}).map((item) =>
        Number(item.allocation_crore || 0)
      )
    );

    return Math.max(...values, 1);
  }, [comparisonRows]);

  const getScenarioAllocation = (row, scenarioId) =>
    Number(row.scenarios?.[String(scenarioId)]?.allocation_crore || 0);

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <RefreshCw className="h-5 w-5 animate-spin text-[#DC2626]" />
        Loading saved policy repository...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-4 w-1 rounded-full bg-[#DC2626]" />
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#DC2626]">
              Policy Simulation Repository
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#172554] dark:text-white sm:text-3xl">
            Saved Scenarios
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Audit, benchmark, and export stored resource allocation models across Uttarakhand districts.
          </p>
        </div>

        <button
          onClick={loadScenarios}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-[#DC2626]/40 hover:text-[#DC2626] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw size={14} />
          Refresh repository
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#DC2626]" />
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto"
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <span>{success}</span>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto"
            aria-label="Dismiss success"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Comparison Action Bar */}
      <section className="gov-card rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#111C30]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#172554] dark:text-white">
              <GitCompareArrows size={17} className="text-[#DC2626]" />
              Comparative Scenario Study
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Select 2 to 5 saved scenarios to conduct side-by-side district variance analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#172554] dark:bg-blue-950/60 dark:text-blue-300">
              {selectedIds.length} Selected
            </span>

            <button
              onClick={clearComparison}
              disabled={selectedIds.length === 0 && !comparisonResult}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>

            <button
              onClick={compareScenarios}
              disabled={selectedIds.length < 2 || comparing}
              className="inline-flex items-center gap-2 rounded-xl bg-[#172554] px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1e3a8a] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#DC2626] dark:hover:bg-[#b91c1c]"
            >
              {comparing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <GitCompareArrows size={13} />
              )}
              {comparing ? "Comparing..." : "Compare Selected"}
            </button>
          </div>
        </div>
      </section>

      {/* Saved scenario cards */}
      {scenarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111C30]">
          <FolderOpen className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <h3 className="text-sm font-bold text-[#172554] dark:text-white">
            No saved scenarios yet
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Run an allocation in the Policy Simulator and save it to review it here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {scenarios.map((scenario) => {
            const isSelected = selectedIds.includes(scenario.id);
            const isEditing = editingId === scenario.id;

            return (
              <div
                key={scenario.id}
                className={`gov-card relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-[#111C30] ${
                  isSelected
                    ? "border-[#172554] ring-2 ring-[#172554] dark:border-blue-500 dark:ring-blue-500"
                    : "border-slate-200/80 hover:border-slate-300 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelection(scenario.id)}
                      className="h-4 w-4 rounded accent-[#DC2626]"
                    />

                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Select for comparison
                    </span>
                  </label>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    ID #{scenario.id}
                  </span>
                </div>

                <div className="mt-3">
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        value={editingName}
                        onChange={(event) =>
                          setEditingName(event.target.value)
                        }
                        maxLength={120}
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-[#DC2626] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveRename(scenario.id)}
                          className="rounded-lg bg-[#172554] px-3 py-1 text-xs font-bold text-white hover:bg-[#1e3a8a] dark:bg-[#DC2626]"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h3 className="break-words text-base font-extrabold text-[#172554] dark:text-white">
                      {scenario.name}
                    </h3>
                  )}

                  <p className="mt-2 text-2xl font-extrabold text-[#DC2626] dark:text-red-400">
                    {formatCrore(scenario.budget_crore)}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Budget Envelope</p>
                </div>

                <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Education</span>
                    <span className="font-bold text-[#172554] dark:text-white">
                      {formatNumber(scenario.education_weight)}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, scenario.education_weight)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Water</span>
                    <span className="font-bold text-[#172554] dark:text-white">
                      {formatNumber(scenario.water_weight)}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-600"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, scenario.water_weight)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Healthcare</span>
                    <span className="font-bold text-[#172554] dark:text-white">
                      {formatNumber(scenario.healthcare_weight)}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-rose-600"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, scenario.healthcare_weight)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400">Need weight</p>
                      <p className="font-bold text-[#172554] dark:text-slate-200">
                        {formatNumber(scenario.need_weight)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400">
                        Population weight
                      </p>
                      <p className="font-bold text-[#172554] dark:text-slate-200">
                        {formatNumber(scenario.population_weight)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => viewScenario(scenario.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Eye size={13} />
                    View details
                  </button>

                  <button
                    onClick={() => startRename(scenario)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil size={13} />
                    Rename
                  </button>

                  <button
                    onClick={() => downloadScenarioPdf(scenario)}
                    disabled={reportLoading}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-[#172554] hover:bg-blue-50 disabled:opacity-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
                  >
                    {reportLoading && reportScenarioId === scenario.id ? (
                      <RefreshCw size={13} className="animate-spin text-[#DC2626]" />
                    ) : (
                      <Download size={13} />
                    )}
                    PDF Report
                  </button>

                  <button
                    onClick={() => deleteScenario(scenario)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison dashboard section */}
      {comparisonResult && (
        <section className="gov-card space-y-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#111C30]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-[#DC2626]" />
                <h2 className="text-base font-bold text-[#172554] dark:text-white">
                  Scenario Benchmark Dashboard
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Empirical allocation comparisons across {comparisonResult.scenario_count} selected models.
              </p>
            </div>

            <button
              onClick={downloadComparisonPdf}
              disabled={reportLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172554] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1e3a8a] disabled:opacity-50 dark:bg-[#DC2626] dark:hover:bg-[#b91c1c]"
            >
              {reportLoading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Download Comprehensive PDF
            </button>
          </div>

          {/* Comparative scenario summary cards */}
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
            }}
          >
            {comparisonScenarios.map((scenario, index) => {
              return (
                <div
                  key={scenario.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">
                    Scenario {index + 1}
                  </p>

                  <h3 className="mt-1 break-words text-xs font-bold text-[#172554] dark:text-white">
                    {scenario.name}
                  </h3>

                  <p className="mt-2 text-xl font-extrabold text-[#172554] dark:text-slate-100">
                    {formatCrore(scenario.budget_crore)}
                  </p>

                  <p className="text-[10px] text-slate-400">Total Envelope</p>

                  <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p>Education: <strong>{formatNumber(scenario.education_weight)}%</strong></p>
                    <p>Water: <strong>{formatNumber(scenario.water_weight)}%</strong></p>
                    <p>Healthcare: <strong>{formatNumber(scenario.healthcare_weight)}%</strong></p>
                    <p className="border-t border-slate-200/60 pt-1 text-[11px] text-slate-400 dark:border-slate-700">
                      Need: {formatNumber(scenario.need_weight)}% · Pop: {formatNumber(scenario.population_weight)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Allocation comparison chart bars */}
          <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              District Allocation Distribution Across Scenarios
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Comparative bar comparison by district.
            </p>

            <div className="mt-4 space-y-4">
              {comparisonRows.map((row) => (
                <div key={row.district} className="rounded-lg p-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <p className="mb-1.5 text-xs font-bold text-[#172554] dark:text-slate-200">
                    {row.district}
                  </p>

                  <div className="space-y-1.5">
                    {comparisonResult.scenario_ids.map((id, index) => {
                      const amount = getScenarioAllocation(row, id);
                      const scenarioName =
                        row.scenarios?.[String(id)]?.scenario_name ||
                        scenarios.find((item) => item.id === id)?.name ||
                        `Scenario ${index + 1}`;

                      const barColors = [
                        "bg-[#172554]",
                        "bg-[#DC2626]",
                        "bg-blue-600",
                        "bg-amber-600",
                        "bg-emerald-600",
                      ];

                      return (
                        <div
                          key={`${row.district}-${id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-24 shrink-0 truncate text-[11px] font-medium text-slate-400">
                            {scenarioName}
                          </div>

                          <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                barColors[index % barColors.length]
                              }`}
                              style={{
                                width: `${
                                  (amount / maximumAllocation) * 100
                                }%`,
                                minWidth: amount > 0 ? "4px" : "0",
                              }}
                            />
                          </div>

                          <div className="w-24 shrink-0 text-right text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-300">
                            {formatCrore(amount)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* District allocation table */}
          <div>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Detailed Comparative Allocation Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="gov-table w-full min-w-[650px] text-left">
                <thead>
                  <tr>
                    <th>District</th>
                    {comparisonScenarios.map((scenario) => (
                      <th key={scenario.id} className="text-right">
                        {scenario.name}
                      </th>
                    ))}
                    <th className="text-right">Highest Allocation</th>
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((row) => {
                    const values = comparisonResult.scenario_ids.map((id) =>
                      getScenarioAllocation(row, id)
                    );

                    const highest = Math.max(...values);

                    return (
                      <tr key={row.district}>
                        <td className="font-bold text-[#172554] dark:text-slate-100">
                          {row.district}
                        </td>

                        {values.map((value, index) => (
                          <td
                            key={`${row.district}-${index}`}
                            className="text-right tabular-nums text-slate-600 dark:text-slate-300"
                          >
                            {formatCrore(value)}
                          </td>
                        ))}

                        <td className="text-right font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCrore(highest)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation variance between first two scenarios */}
          {comparisonResult.scenario_ids.length >= 2 && (
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Marginal Variance Matrix (Scenario 2 vs Scenario 1)
              </h3>

              <p className="mb-3 text-xs text-slate-400">
                Variance between {comparisonScenarios[0]?.name} and {comparisonScenarios[1]?.name}.
              </p>

              <div className="overflow-x-auto">
                <table className="gov-table w-full min-w-[500px] text-left">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th className="text-right">{comparisonScenarios[0]?.name}</th>
                      <th className="text-right">{comparisonScenarios[1]?.name}</th>
                      <th className="text-right">Net Variance</th>
                    </tr>
                  </thead>

                  <tbody>
                    {comparisonRows.map((row) => {
                      const first = getScenarioAllocation(
                        row,
                        comparisonResult.scenario_ids[0]
                      );

                      const second = getScenarioAllocation(
                        row,
                        comparisonResult.scenario_ids[1]
                      );

                      const difference = second - first;

                      return (
                        <tr key={row.district}>
                          <td className="font-bold text-[#172554] dark:text-slate-100">
                            {row.district}
                          </td>

                          <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">
                            {formatCrore(first)}
                          </td>

                          <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">
                            {formatCrore(second)}
                          </td>

                          <td
                            className={`text-right font-extrabold tabular-nums ${
                              difference > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : difference < 0
                                  ? "text-[#DC2626] dark:text-red-400"
                                  : "text-slate-400"
                            }`}
                          >
                            {difference > 0 ? "+" : ""}
                            {formatCrore(difference)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Scenario details modal */}
      {(detailsLoading || selectedScenario) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="gov-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:border dark:border-slate-700 dark:bg-[#111C30]">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#DC2626]">
                  Scenario Snapshot Review
                </p>
                <h2 className="mt-0.5 text-lg font-extrabold text-[#172554] dark:text-white">
                  {scenarioDetails?.name}
                </h2>
              </div>

              <button
                onClick={closeDetails}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
            </div>

            {detailsLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-[#DC2626]" />
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Total Budget</p>
                    <p className="mt-1 text-lg font-extrabold text-[#DC2626] dark:text-red-400">
                      {formatCrore(scenarioDetails?.budget_crore)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Need Weight</p>
                    <p className="mt-1 text-lg font-extrabold text-[#172554] dark:text-white">
                      {formatNumber(scenarioDetails?.need_weight)}%
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Pop. Weight</p>
                    <p className="mt-1 text-lg font-extrabold text-[#172554] dark:text-white">
                      {formatNumber(scenarioDetails?.population_weight)}%
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Sectoral Priorities
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        label: "Education",
                        value: scenarioDetails?.education_weight,
                      },
                      {
                        label: "Water",
                        value: scenarioDetails?.water_weight,
                      },
                      {
                        label: "Healthcare",
                        value: scenarioDetails?.healthcare_weight,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <p className="text-[10px] text-slate-400">{item.label}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#172554] dark:text-white">
                          {formatNumber(item.value)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    District Allocations Breakdown
                  </h3>

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="gov-table w-full text-left text-xs">
                      <thead>
                        <tr>
                          <th>District</th>
                          <th className="text-right">Priority Score</th>
                          <th className="text-right">Optimised Allocation</th>
                        </tr>
                      </thead>

                      <tbody>
                        {snapshotAllocations.map((item) => (
                          <tr key={item.district}>
                            <td className="font-bold text-[#172554] dark:text-slate-100">
                              {item.district}
                            </td>

                            <td className="text-right tabular-nums text-slate-600 dark:text-slate-300">
                              {formatNumber(item.combined_priority)}
                            </td>

                            <td className="text-right font-extrabold tabular-nums text-[#DC2626] dark:text-red-400">
                              {formatCrore(item.optimised_allocation_crore)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2.5 flex justify-between rounded-xl bg-slate-50 p-3 text-xs font-bold dark:bg-slate-800">
                    <span className="text-slate-600 dark:text-slate-300">Total Allocated Sum:</span>
                    <span className="text-[#DC2626] dark:text-red-400">
                      {formatCrore(allocationSnapshot.total_allocated_crore)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
                  <button
                    onClick={() =>
                      downloadScenarioPdf({
                        id: scenarioDetails.id,
                        name: scenarioDetails.name,
                      })
                    }
                    disabled={reportLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#172554] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1e3a8a] disabled:opacity-50 dark:bg-[#DC2626] dark:hover:bg-[#b91c1c]"
                  >
                    <Download size={14} />
                    Download PDF
                  </button>

                  <button
                    onClick={closeDetails}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
