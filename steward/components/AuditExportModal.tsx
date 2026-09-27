import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { X, Loader2, FileDown, FileSpreadsheet, FileText } from "lucide-react";

type ReportType = "custody" | "activity";
type Format = "csv" | "pdf";

interface Usage {
    plan: string;
    limit: number | null;
    used: number;
    remaining: number | null;
    resets_on: string;
}

interface AuditExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** When set, the report covers this one item instead of everything. */
    asset?: { id: number; name: string } | null;
}

const REPORTS: { value: ReportType; label: string; hint: string }[] = [
    { value: "custody", label: "Custody report", hint: "Every check-out in the period: who had each item, when it went out, when it came back, and who received it." },
    { value: "activity", label: "Activity report", hint: "Everything that happened in the period: additions, edits, check-outs, returns, incidents and retirements." },
];

function isoDay(date: Date) {
    return date.toISOString().slice(0, 10);
}

function defaultPeriod() {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    return { start: isoDay(start), end: isoDay(end) };
}

function formatDay(iso: string) {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: "long", day: "numeric", timeZone: "UTC" });
}

/**
 * Downloads an audit report (#17). Every plan can export; Starter has a set
 * number of runs a month, and downloading the same report and period again
 * within 24 hours, in either format, does not use another.
 */
export function AuditExportModal({ isOpen, onClose, asset }: AuditExportModalProps) {
    const { getToken, userId } = useAuth();
    const [reportType, setReportType] = useState<ReportType>("custody");
    const [format, setFormat] = useState<Format>("pdf");
    const [period, setPeriod] = useState(defaultPeriod);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const { data: usage, mutate: refreshUsage } = useSWR<Usage>(
        isOpen && userId ? ["/api/audit/usage", userId] : null,
        async ([url]: [string]) => {
            const token = await getToken();
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("usage");
            return res.json();
        }
    );

    useEffect(() => {
        if (isOpen) setError("");
    }, [isOpen]);

    if (!isOpen) return null;

    const outOfRuns = usage?.remaining === 0;

    const handleExport = async () => {
        setError("");
        if (period.start > period.end) {
            setError("The start date must be on or before the end date.");
            return;
        }
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch("/api/audit/export", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    report_type: reportType,
                    format,
                    start: period.start,
                    end: period.end,
                    asset_id: asset?.id ?? null,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => null);
                const detail = typeof body?.detail === "string" ? body.detail : "The report could not be created. Please try again.";
                setError(detail);
                return;
            }

            const blob = await res.blob();
            const disposition = res.headers.get("Content-Disposition") || "";
            const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || `steward-${reportType}.${format}`;
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            refreshUsage();
        } catch {
            setError("The report could not be created. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Export audit report</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Covers:</span>
                            <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">
                                {asset ? asset.name : "All items"}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all active:scale-90"
                        disabled={loading}
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    <fieldset className="space-y-2">
                        <legend className="text-xs font-bold text-gray-700 ml-1 mb-1.5">Report</legend>
                        {REPORTS.map((report) => (
                            <label
                                key={report.value}
                                className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    reportType === report.value ? "border-emerald-500 bg-emerald-50/40" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="report-type"
                                    value={report.value}
                                    checked={reportType === report.value}
                                    onChange={() => setReportType(report.value)}
                                    className="mt-0.5 accent-emerald-600"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-900">{report.label}</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">{report.hint}</span>
                                </span>
                            </label>
                        ))}
                    </fieldset>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1.5">
                            <span className="text-xs font-bold text-gray-700 ml-1">From</span>
                            <input
                                type="date"
                                value={period.start}
                                max={period.end}
                                onChange={(e) => setPeriod({ ...period, start: e.target.value })}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm text-gray-900"
                            />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-xs font-bold text-gray-700 ml-1">To</span>
                            <input
                                type="date"
                                value={period.end}
                                min={period.start}
                                onChange={(e) => setPeriod({ ...period, end: e.target.value })}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm text-gray-900"
                            />
                        </label>
                    </div>
                    <p className="text-[11px] text-gray-400 -mt-2 ml-1">Dates and times in the report are in UTC. Both days are included.</p>

                    <fieldset>
                        <legend className="text-xs font-bold text-gray-700 ml-1 mb-1.5">Format</legend>
                        <div className="grid grid-cols-2 gap-3">
                            {([
                                { value: "pdf", label: "PDF", note: "To file or print", Icon: FileText },
                                { value: "csv", label: "CSV", note: "For Excel", Icon: FileSpreadsheet },
                            ] as const).map(({ value, label, note, Icon }) => (
                                <label
                                    key={value}
                                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                                        format === value ? "border-emerald-500 bg-emerald-50/40" : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="format"
                                        value={value}
                                        checked={format === value}
                                        onChange={() => setFormat(value)}
                                        className="sr-only"
                                    />
                                    <Icon className="w-4 h-4 text-gray-500" />
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-900">{label}</span>
                                        <span className="block text-[11px] text-gray-500">{note}</span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    {usage && usage.limit !== null && (
                        <p className={`text-xs rounded-xl p-3 ${outOfRuns ? "bg-amber-50 text-amber-800" : "bg-gray-50 text-gray-600"}`}>
                            {outOfRuns
                                ? `You've used all ${usage.limit} of this month's reports. More become available on ${formatDay(usage.resets_on)}. Downloading a report you ran in the last 24 hours again, in either format, still works.`
                                : `${usage.remaining} of ${usage.limit} reports left this month. Downloading the same report again within 24 hours, in either format, doesn't use another.`}
                        </p>
                    )}
                </div>

                <div className="p-5 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        {loading ? "Preparing report" : "Download report"}
                    </button>
                </div>
            </div>
        </div>
    );
}
