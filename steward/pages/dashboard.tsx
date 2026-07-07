import { SignedIn, SignedOut, SignInButton, Protect, useAuth, useOrganization } from "@clerk/nextjs";
import { useMemo } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
// import { AiAssistant } from "@/components/AiAssistant"; // AI — coming soon
import { ClipboardList, CheckCircle, AlertOctagon } from "lucide-react";

export default function Dashboard() {
    const { getToken, isLoaded, userId } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { memberships } = useOrganization({
        memberships: {
            pageSize: 50,
            keepPreviousData: true,
        },
    });


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

    useEffect(() => {
        setMounted(true);
    }, []);

    const { data: dashboardData, error } = useSWR<DashboardData>(
        isLoaded && userId ? ["/api/dashboard/summary", userId] : null,
        async () => {
            const token = await getToken();
            return getDashboardSummary(token || "");
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
                return { label: 'New Asset', color: 'bg-emerald-50 text-emerald-700', msg: 'Added to inventory' };
            case 'updated':
                if (d.new_status) {
                    return { label: d.new_status, color: 'bg-blue-50 text-blue-700', msg: `Status changed to ${d.new_status}` };
                }
                return { label: 'Updated', color: 'bg-blue-50 text-blue-700', msg: 'Asset details modified' };
            case 'checked_out':
                return { label: 'Checked Out', color: 'bg-red-50 text-red-700', msg: 'Assigned to teammate' };
            case 'checked_in':
                return { label: 'Returned', color: 'bg-emerald-50 text-emerald-700', msg: 'Returned to stock' };
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


    // Prepare chart data
    const healthData = dashboardData ? [
        { name: 'Good', value: dashboardData.healthBreakdown.good },
        { name: 'Needs Attention', value: dashboardData.healthBreakdown.needsAttention },
        { name: 'Out of Service', value: dashboardData.healthBreakdown.outOfService },
    ] : [];

    return (
        <Layout>
            <div className="space-y-8 max-w-7xl mx-auto pb-10">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--ink)" }}>Dashboard</h1>
                    <p className="text-gray-500 mt-2">Overview of your inventory status.</p>
                </div>

                <SignedOut>
                    <div className="p-10 border rounded-2xl bg-white shadow-sm text-center">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome to Steward</h3>
                        <p className="text-slate-500 mb-6">Sign in to manage your equipment inventory.</p>
                        <SignInButton mode="modal">
                            <button className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20">
                                Sign In
                            </button>
                        </SignInButton>
                    </div>
                </SignedOut>

                <SignedIn>
                    {!dashboardData ? (
                        <div className="p-12 text-center text-slate-400">Loading dashboard data...</div>
                    ) : (
                        <>
                            {/* Section 1: Status Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <StatCard
                                    label="Total Assets"
                                    value={dashboardData.counts.totalAssets}
                                    icon={Package}
                                    variant="default"
                                />
                                <StatCard
                                    label="Checked Out"
                                    value={dashboardData.counts.checkedOut}
                                    icon={CheckCircle}
                                    variant="default"
                                />
                                <StatCard
                                    label="Overdue"
                                    value={dashboardData.counts.overdue}
                                    icon={AlertTriangle}
                                    variant="danger"
                                />
                                <StatCard
                                    label="In Repair"
                                    value={dashboardData.counts.repair}
                                    icon={Wrench}
                                    variant="warning"
                                />
                                <StatCard
                                    label="Missing"
                                    value={dashboardData.counts.missing}
                                    icon={Search}
                                    variant="danger"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Section 2: Actionable Lists columns (taking up 2 columns) */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Actionable Lists Container */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Overdue Assignments */}
                                        <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                                    Overdue Assignments
                                                </h3>
                                                <span className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">{dashboardData.lists.overdueAssignments.length}</span>
                                            </div>
                                            <div className="space-y-3">
                                                {dashboardData.lists.overdueAssignments.length === 0 ? (
                                                    <div className="text-sm text-slate-400 italic py-2">No overdue items. Great job!</div>
                                                ) : (
                                                    dashboardData.lists.overdueAssignments.slice(0, 5).map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">{item.assignee} • Due {item.dueDate}</p>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Missing / Repair */}
                                        <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                    <Wrench className="w-5 h-5 text-amber-500" />
                                                    Attention Required
                                                </h3>
                                                <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full">
                                                    {dashboardData.lists.repairAssets.length + dashboardData.lists.missingAssets.length}
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {[...dashboardData.lists.missingAssets, ...dashboardData.lists.repairAssets].length === 0 ? (
                                                    <div className="text-sm text-slate-400 italic py-2">All equipment accounted for and functional.</div>
                                                ) : (
                                                    [...dashboardData.lists.missingAssets, ...dashboardData.lists.repairAssets].slice(0, 5).map((item, i) => (
                                                        <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl border border-transparent hover:border-slate-100 transition-colors cursor-pointer group">
                                                            <div>
                                                                <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    <span className={item.status === 'Missing' ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                                                                        {item.status}
                                                                    </span>
                                                                    {item.value && ` • $${item.value}`}
                                                                </p>
                                                            </div>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Charts Section */}
                                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-900 mb-6">Overdue Trends (30 Days)</h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={dashboardData.overdueTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                                    <RechartsTooltip
                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                        cursor={{ stroke: '#10B981', strokeWidth: 2 }}
                                                    />
                                                    <Line type="monotone" dataKey="overdueCount" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Insights & More Charts */}
                                <div className="space-y-6">
                                    {/* Steward Insights Panel */}
                                    <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-lg overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 translate-x-10 -translate-y-10"></div>
                                        <div className="relative z-10">
                                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                                                Steward Insights
                                            </h3>
                                            <div className="space-y-3">
                                                {dashboardData.insights.map((insight, i) => (
                                                    <div key={i} className="flex gap-3 text-sm font-medium text-emerald-50">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                                                        <p>{insight}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Equipment Health */}
                                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-900 mb-4">Equipment Health</h3>
                                        <div className="h-[200px] w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={healthData}
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {healthData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            {/* Centered Total */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="text-center">
                                                    <span className="text-3xl font-bold text-slate-900">{dashboardData.counts.totalAssets}</span>
                                                    <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-center gap-4 mt-2">
                                            {healthData.map((entry, index) => (
                                                <div key={index} className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                                                    <span className="text-xs font-bold text-slate-600">{entry.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {planInfo?.plan === 'pro' ? (
                                        <div className="h-20 flex items-center justify-center">
                                            <p className="text-xs text-gray-400 italic">Trend analytics coming soon</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Protect>
                    </div>
                    {/* AI Assistant — coming soon */}
                    {/* <AiAssistant /> */}
                </SignedIn>
            </div>
        </Layout>
    );
}
