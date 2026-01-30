import { useState, useMemo } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import useSWR from "swr";
import { Layout } from "@/components/Layout";
import {
    AlertTriangle,
    Search,
    Filter,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronDown,
    ArrowUpRight,
    User,
    Box,
    MoreVertical
} from "lucide-react";
import { IncidentDetailsModal } from "@/components/IncidentDetailsModal";

const fetcher = (url: string, token: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());

export default function IncidentsPage() {
    const { getToken, isLoaded, userId } = useAuth();
    const { memberships } = useOrganization({
        memberships: { pageSize: 50 },
    });

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [selectedIncident, setSelectedIncident] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Fetch incidents
    const { data: incidents, error, mutate, isValidating } = useSWR(
        isLoaded && userId ? [`/api/incidents?status=${statusFilter}&severity=${severityFilter}`, userId] : null,
        async ([url]) => {
            const token = await getToken();
            return fetcher(url, token || "");
        }
    );

    // Memoized user map for names
    const userMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (memberships?.data) {
            memberships.data.forEach((m: any) => {
                const uid = m.publicUserData?.userId;
                if (uid) {
                    map[uid] = `${m.publicUserData.firstName || ""} ${m.publicUserData.lastName || ""}`.trim() || uid;
                }
            });
        }
        return map;
    }, [memberships?.data]);

    const handleStatusUpdate = async (incidentId: number, newStatus: string) => {
        try {
            const token = await getToken();
            const response = await fetch(`/api/incidents/${incidentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                mutate();
            }
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case "Critical": return "bg-red-100 text-red-700 border-red-200";
            case "High": return "bg-orange-100 text-orange-700 border-orange-200";
            case "Medium": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Low": return "bg-blue-100 text-blue-700 border-blue-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Open": return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case "In Progress": return <Clock className="w-4 h-4 text-blue-500" />;
            case "Resolved": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "Closed": return <XCircle className="w-4 h-4 text-gray-400" />;
            default: return null;
        }
    };

    const filteredIncidents = useMemo(() => {
        if (!incidents || !Array.isArray(incidents)) return [];
        return incidents.filter((inc: any) =>
            inc.title.toLowerCase().includes(search.toLowerCase()) ||
            (inc.asset?.name || "").toLowerCase().includes(search.toLowerCase())
        );
    }, [incidents, search]);

    return (
        <Layout>
            <div className="max-w-6xl mx-auto py-4 md:py-8">
                {/* Header */}
                <div className="px-4 md:px-0 mb-6 md:mb-8 flex flex-col gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 md:w-7 md:h-7 text-red-600" />
                            Incident Tracking
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage asset issues and repair tickets.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            <option value="">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </div>

                {/* Grid */}
                {!incidents && !error ? (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                        <span className="text-gray-500 text-sm">Loading incidents...</span>
                    </div>
                ) : filteredIncidents.length === 0 ? (
                    <div className="mx-4 bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 md:p-20 text-center">
                        <MessageSquare className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-base md:text-lg font-medium text-gray-900">No Incidents Found</h3>
                        <p className="text-xs md:text-sm text-gray-500">Your inventory is currently healthy!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:gap-4 px-4 md:px-0 pb-6">
                        {filteredIncidents.map((inc: any) => (
                            <div
                                key={inc.id}
                                onClick={() => {
                                    setSelectedIncident(inc);
                                    setIsDetailsOpen(true);
                                }}
                                className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:border-red-200 hover:shadow-md transition-all group relative cursor-pointer overflow-hidden
                                    ${inc.severity === 'Critical' ? 'border-l-4 border-l-red-500' :
                                        inc.severity === 'High' ? 'border-l-4 border-l-orange-500' : ''}`}
                            >
                                <div className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                        <div className="space-y-2 md:space-y-3 flex-1">
                                            <div className="flex items-center flex-wrap gap-2">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getSeverityStyles(inc.severity)}`}>
                                                    {inc.severity}
                                                </span>
                                                <h3 className="flex-1 text-base md:text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors line-clamp-1">
                                                    {inc.title}
                                                </h3>
                                            </div>

                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 md:line-clamp-none">
                                                {inc.description}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 md:gap-x-6 text-[11px] md:text-xs text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Box className="w-3.5 h-3.5" />
                                                    <span className="font-medium text-gray-700 truncate">{inc.asset?.name || "Unknown Asset"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{new Date(inc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-gray-50 shrink-0">
                                            <div className="flex items-center gap-2 px-2.5 py-1 md:px-3 md:py-1.5 bg-gray-50 rounded-lg border border-gray-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors">
                                                {getStatusIcon(inc.status)}
                                                <span className="text-xs md:text-sm font-bold text-gray-700 group-hover:text-red-700">{inc.status}</span>
                                            </div>
                                            <ChevronDown className="w-4 h-4 text-gray-300 md:hidden" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <IncidentDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedIncident(null);
                }}
                incident={selectedIncident}
                onUpdate={() => {
                    mutate();
                    setIsDetailsOpen(false);
                    setSelectedIncident(null);
                }}
                userMap={userMap}
            />
        </Layout>
    );
}
