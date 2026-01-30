import { useState, useMemo } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import useSWR from "swr";
import { Layout } from "@/components/Layout";
import {
    History,
    Search,
    Filter,
    ChevronDown,
    Box,
    User,
    PlusCircle,
    Edit,
    RotateCcw,
    LogOut,
    Trash2,
    Loader2,
    Calendar,
    Clock,
    AlertTriangle
} from "lucide-react";

const ITEMS_PER_PAGE = 20;

export default function ActivityPage() {
    const { getToken, isLoaded, userId } = useAuth();
    const { memberships } = useOrganization({
        memberships: { pageSize: 50 },
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [limit, setLimit] = useState(ITEMS_PER_PAGE);

    // Fetch activity logs
    const { data: activityLogs, error, isValidating } = useSWR(
        isLoaded && userId ? [`/api/activity?limit=${limit}`, userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
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

    const getActivityDetails = (log: any) => {
        switch (log.event_type) {
            case 'created':
                return {
                    label: 'Added Asset',
                    color: 'bg-green-50 text-green-700',
                    icon: PlusCircle,
                    description: (name: string) => `added "${name}" to inventory`
                };
            case 'updated':
                const isStatusChange = log.details?.previous_status && log.details?.new_status;
                return {
                    label: 'Updated',
                    color: 'bg-blue-50 text-blue-700',
                    icon: Edit,
                    description: (name: string) => isStatusChange
                        ? `changed status for "${name}"`
                        : `updated details for "${name}"`
                };
            case 'checked_out':
                return {
                    label: 'Checked Out',
                    color: 'bg-red-50 text-red-700',
                    icon: LogOut,
                    description: (name: string) => `checked out "${name}"`
                };
            case 'checked_in':
                return {
                    label: 'Returned',
                    color: 'bg-green-50 text-green-700',
                    icon: RotateCcw,
                    description: (name: string) => `checked in "${name}"`
                };
            case 'deleted':
                return {
                    label: 'Deleted',
                    color: 'bg-gray-100 text-gray-700',
                    icon: Trash2,
                    description: (name: string) => `removed "${name}" from inventory`
                };
            case 'incident_reported':
                return {
                    label: 'Incident',
                    color: 'bg-orange-50 text-orange-700',
                    icon: AlertTriangle,
                    description: (name: string) => `reported an incident for "${name}"`
                };
            case 'incident_updated':
                return {
                    label: 'Incident Updated',
                    color: 'bg-blue-50 text-blue-700',
                    icon: Edit,
                    description: (name: string) => `updated incident status for "${name}"`
                };
            default:
                return {
                    label: log.event_type,
                    color: 'bg-gray-50 text-gray-700',
                    icon: History,
                    description: (name: string) => `performed action on "${name}"`
                };
        }
    };

    const filteredLogs = useMemo(() => {
        if (!Array.isArray(activityLogs)) return [];
        return activityLogs.filter((log: any) =>
            (log.asset_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (userMap[log.actor_id] || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.event_type || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activityLogs, searchQuery, userMap]);

    const renderMetadata = (log: any) => {
        if (!log.details) return null;
        const details = log.details;
        const items = [];

        if (details.assigned_to) {
            const name = userMap[details.assigned_to] || details.assigned_to;
            items.push(
                <div key="assigned" className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-gray-400" />
                    <span>Assigned to <span className="font-medium text-gray-700">{name}</span></span>
                </div>
            );
        }

        if (details.expected_return_at) {
            const date = new Date(details.expected_return_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
            });
            items.push(
                <div key="return" className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>Expected back by <span className="font-medium text-gray-700">{date}</span></span>
                </div>
            );
        }

        if (details.returned_at) {
            const date = new Date(details.returned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            items.push(
                <div key="returned" className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>Logged at <span className="font-medium text-gray-700">{date}</span></span>
                </div>
            );
        }

        if (details.updates && Array.isArray(details.updates)) {
            const filteredUpdates = details.updates.filter((u: string) => u !== 'status');
            if (filteredUpdates.length > 0) {
                items.push(
                    <div key="updates" className="flex items-center gap-1.5">
                        <Edit className="w-3 h-3 text-gray-400" />
                        <span>Changes: <span className="font-medium text-gray-700">{filteredUpdates.join(", ")}</span></span>
                    </div>
                );
            }
        }

        if (details.previous_status && details.new_status) {
            items.push(
                <div key="status-change" className="flex items-center gap-1.5">
                    <History className="w-3 h-3 text-gray-400" />
                    <span>Status: <span className="font-medium text-gray-500 line-through">{details.previous_status}</span> ➜ <span className="font-bold text-gray-800">{details.new_status}</span></span>
                </div>
            );
        }

        if (items.length === 0) return null;

        return (
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-[11px] text-gray-500 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 w-fit">
                {items}
            </div>
        );
    };

    const formatRelativeTime = (dateString: string) => {
        const timestamp = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return "Just now";
    };

    return (
        <Layout>
            <div className="max-w-5xl mx-auto py-4 md:py-8">
                {/* Header */}
                <div className="px-4 md:px-0 mb-6 md:mb-8 flex flex-col gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
                            Activity Log
                        </h1>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Audit trail of all asset movements.</p>
                    </div>

                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search asset or user..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
                        />
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white md:rounded-xl shadow-sm border-y md:border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {!activityLogs && !error ? (
                            <div className="p-12 text-center flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                                <span className="text-sm text-gray-500">Loading audit logs...</span>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="p-12 text-center text-sm text-gray-500 italic">
                                {searchQuery ? "No matching activity." : "No logs found."}
                            </div>
                        ) : (
                            filteredLogs.map((log: any) => {
                                const details = getActivityDetails(log);
                                const Icon = details.icon;
                                const userName = userMap[log.actor_id] || "System";

                                return (
                                    <div key={log.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-start gap-4">
                                        <div className={`mt-1 p-2 rounded-lg ${details.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                                                <div className="text-sm text-gray-900">
                                                    <span className="font-semibold text-gray-950">{userName}</span>
                                                    <span className="text-gray-600"> {details.description(log.asset_name || `Asset #${log.asset_id}`)}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                                    {formatRelativeTime(log.created_at)}
                                                </div>
                                            </div>

                                            {/* Pretty Metadata */}
                                            {renderMetadata(log)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {activityLogs && activityLogs.length >= limit && (
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                            <button
                                onClick={() => setLimit(prev => prev + ITEMS_PER_PAGE)}
                                disabled={isValidating}
                                className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                                        <span>Loading more...</span>
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                        <span>Load More Activity</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
