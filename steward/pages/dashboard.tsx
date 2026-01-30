import { SignedIn, SignedOut, SignInButton, Protect, useAuth, useOrganization } from "@clerk/nextjs";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import { ClipboardList, CheckCircle, AlertOctagon } from "lucide-react";

export default function Dashboard() {
    const { getToken, isLoaded, userId } = useAuth();
    const router = useRouter();
    const { memberships } = useOrganization({
        memberships: {
            pageSize: 50,
            keepPreviousData: true,
        },
    });
    const [adminMsg, setAdminMsg] = useState("");

    // Fetch activity logs
    const { data: activityLogs } = useSWR(
        isLoaded && userId ? ["/api/activity", userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        }
    );

    // Fetch subscription plan
    const { data: planInfo } = useSWR(
        isLoaded && userId ? ["/api/billing/plan", userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        }
    );

    // Fetch incidents (for Repair Queue - Pro feature)
    const { data: incidents } = useSWR(
        isLoaded && userId && planInfo?.plan === 'pro' ? ["/api/incidents?status=Open&severity=High", userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        }
    );

    // Fetch assets (for stats)
    const { data: assets } = useSWR(
        isLoaded && userId ? ["/api/assets", userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        }
    );

    // Calculate stats
    const checkedOutCount = Array.isArray(assets) ? assets.filter((a: any) => a.status === "Checked Out").length : 0;
    const availableCount = Array.isArray(assets) ? assets.filter((a: any) => a.status === "Available").length : 0;
    const needsAttentionCount = Array.isArray(assets) ? assets.filter((a: any) =>
        a.status === "Maintenance" || a.status === "Retired"
    ).length : 0;

    // Memoized user map for O(1) lookups
    const userMap = useMemo(() => {
        const map: Record<string, string> = {};
        if (memberships?.data) {
            memberships.data.forEach((m: any) => {
                const uid = m.publicUserData?.userId;
                if (uid) {
                    const firstName = m.publicUserData?.firstName || "";
                    const lastName = m.publicUserData?.lastName || "";
                    map[uid] = `${firstName} ${lastName}`.trim() || uid;
                }
            });
        }
        return map;
    }, [memberships?.data]);

    // Helper to format activity event types and colors
    const getActivityDetails = (log: any) => {
        const d = log.details || {};
        switch (log.event_type) {
            case 'created':
                return { label: 'New Asset', color: 'bg-green-50 text-green-700', msg: 'Added to inventory' };
            case 'updated':
                if (d.new_status) {
                    return { label: d.new_status, color: 'bg-blue-50 text-blue-700', msg: `Status changed to ${d.new_status}` };
                }
                return { label: 'Updated', color: 'bg-blue-50 text-blue-700', msg: 'Asset details modified' };
            case 'checked_out':
                return { label: 'Checked Out', color: 'bg-red-50 text-red-700', msg: 'Assigned to teammate' };
            case 'checked_in':
                return { label: 'Returned', color: 'bg-green-50 text-green-700', msg: 'Returned to stock' };
            case 'deleted':
                return { label: 'Deleted', color: 'bg-gray-100 text-gray-700', msg: 'Removed from system' };
            case 'incident_reported':
                return { label: 'Issue', color: 'bg-orange-50 text-orange-700', msg: d.title || 'New incident reported' };
            case 'incident_updated':
                if (d.action === 'archived') return { label: 'Archived', color: 'bg-gray-100 text-gray-700', msg: 'Incident archived' };
                if (d.new_status) return { label: d.new_status, color: 'bg-orange-50 text-orange-700', msg: `Issue marked as ${d.new_status}` };
                return { label: 'Issue Updated', color: 'bg-orange-50 text-orange-700', msg: 'Incident updated' };
            default:
                const cleanLabel = log.event_type.replace(/_/g, ' ').replace(/\b\w/g, (l: any) => l.toUpperCase());
                return { label: cleanLabel, color: 'bg-gray-50 text-gray-700', msg: 'Activity recorded' };
        }
    };

    const getUserName = (actorUserId: string | null) => {
        if (!actorUserId) return null;
        return userMap[actorUserId] || null;
    };



    return (
        <Layout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black">Dashboard</h1>
                    <p className="text-gray-500 mt-2">Overview of your inventory status.</p>
                </div>

                <SignedOut>
                    <div className="p-6 border rounded-lg bg-white shadow-sm text-center">
                        <p className="mb-4">You are currently signed out.</p>
                        <SignInButton mode="modal">
                            <button className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors">
                                Sign in to view dashboard
                            </button>
                        </SignInButton>
                    </div>
                </SignedOut>

                <SignedIn>
                    {/* Stats Grid - High Density */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <StatCard
                            label="Available"
                            value={availableCount.toString()}
                            subtext="Ready for use"
                            icon={CheckCircle}
                            variant="success"
                        />
                        <StatCard
                            label="Checked Out"
                            value={checkedOutCount.toString()}
                            subtext="Active assignments"
                            icon={ClipboardList}
                            variant="default"
                        />
                        <Protect role="org:admin">
                            <StatCard
                                label="Needs Attention"
                                value={needsAttentionCount.toString()}
                                subtext="Repair or maintenance"
                                icon={AlertOctagon}
                                variant="warning"
                            />
                        </Protect>
                    </div>

                    {/* Content Areas - Stack on mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Activity */}
                        <Protect role="org:admin">
                            <div
                                onClick={() => router.push('/activity')}
                                className="p-5 sm:p-6 border border-gray-100 rounded-2xl bg-white shadow-sm min-h-[300px] cursor-pointer hover:border-gray-300 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-lg text-gray-900">Recent Activity</h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-md group-hover:bg-black group-hover:text-white transition-colors">View All</span>
                                </div>
                                {!Array.isArray(activityLogs) || activityLogs.length === 0 ? (
                                    <div className="text-gray-500 text-sm italic">No recent activity found.</div>
                                ) : (
                                    <div className="space-y-3">
                                        {activityLogs.slice(0, 5).map((log: any) => {
                                            const timestamp = new Date(log.created_at);
                                            const now = new Date();
                                            const diffMs = now.getTime() - timestamp.getTime();
                                            const diffMins = Math.floor(diffMs / 60000);
                                            const diffHours = Math.floor(diffMins / 60);
                                            const diffDays = Math.floor(diffHours / 24);

                                            let timeAgo = "";
                                            if (diffDays > 0) timeAgo = `${diffDays}d ago`;
                                            else if (diffHours > 0) timeAgo = `${diffHours}h ago`;
                                            else if (diffMins > 0) timeAgo = `${diffMins}m ago`;
                                            else timeAgo = "Just now";

                                            const details = getActivityDetails(log);

                                            return (
                                                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className="font-bold text-gray-900 truncate text-sm">{log.asset_name || `Asset #${log.asset_id}`}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                                            {details.msg}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{timeAgo}</span>
                                                            {log.actor_id && (
                                                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1">
                                                                    <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                                                    {log.actor_id === 'system' ? 'System' : (getUserName(log.actor_id) || 'User')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Protect>

                        {/* Pro Modules: Repair Queue & Overdue Trends */}
                        <Protect role="org:admin">
                            <div className="space-y-6">
                                {/* Repair Queue (Pro Only) */}
                                <div className={`p-5 sm:p-6 border rounded-2xl bg-white shadow-sm min-h-[150px] relative overflow-hidden ${planInfo?.plan !== 'pro' ? 'border-dashed border-gray-200' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <AlertOctagon className="w-5 h-5 text-orange-500" />
                                            <h3 className="font-bold text-lg text-gray-900">Repair Queue</h3>
                                        </div>
                                        {planInfo?.plan === 'pro' && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                                                {incidents?.length || 0} Critical
                                            </span>
                                        )}
                                    </div>

                                    {planInfo?.plan === 'pro' ? (
                                        <div className="space-y-2">
                                            {(!incidents || incidents.length === 0) ? (
                                                <p className="text-gray-400 text-sm">No critical repairs pending.</p>
                                            ) : (
                                                incidents.slice(0, 3).map((inc: any) => (
                                                    <div key={inc.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                                                        <span className="font-medium truncate max-w-[150px]">Asset #{inc.asset_id}</span>
                                                        <span className="text-red-500 font-bold text-xs">{inc.severity}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                                            <p className="text-sm font-bold text-gray-400 mb-2">Pro Feature</p>
                                            <button onClick={() => router.push('/pricing')} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20">
                                                Upgrade to Unlock
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Overdue Trends (Pro Only) */}
                                <div className={`p-5 sm:p-6 border rounded-2xl bg-white shadow-sm min-h-[150px] relative overflow-hidden ${planInfo?.plan !== 'pro' ? 'border-dashed border-gray-200' : 'border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-lg text-gray-900">Overdue Trends</h3>
                                        {planInfo?.plan === 'pro' && (
                                            <span className="text-[10px] font-bold text-gray-400">LAST 30 DAYS</span>
                                        )}
                                    </div>

                                    {planInfo?.plan === 'pro' ? (
                                        <div className="h-20 flex items-end gap-2 justify-between px-2">
                                            {/* Fake chart bars for demo */}
                                            {[40, 65, 30, 80, 50, 20, 45].map((h, i) => (
                                                <div key={i} className="w-full bg-emerald-100 rounded-t-sm hover:bg-emerald-200 transition-colors relative group" style={{ height: `${h}%` }}>
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold text-emerald-700 bg-white px-1 shadow-sm rounded">
                                                        {h}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4">
                                            <p className="text-sm font-bold text-gray-400 mb-2">Pro Feature</p>
                                            <button onClick={() => router.push('/pricing')} className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20">
                                                Upgrade to Unlock
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Protect>
                    </div>
                </SignedIn>
            </div>
        </Layout>
    );
}
