import { SignedIn, SignedOut, SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Layout } from "@/components/Layout";
import { StatCard } from "@/components/StatCard";
import {
    CheckCircle,
    AlertOctagon,
    AlertTriangle,
    Package,
    Wrench,
    Search,
    ArrowRight,
    TrendingUp,
    DollarSign
} from "lucide-react";
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    BarChart, Bar
} from "recharts";
import { getDashboardSummary } from "@/lib/api";
import { DashboardData } from "@/types/dashboard";
import { useState, useEffect } from "react";

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Good, Needs Attention, Out of Service

export default function Dashboard() {
    const { getToken, isLoaded, userId } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

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

    if (!isLoaded || !mounted) return <Layout><div>Loading...</div></Layout>;

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                        <p className="text-slate-500 mt-1">Overview of your inventory status and value.</p>
                    </div>
                    {dashboardData?.valueAtRisk && (
                        <div className="bg-white px-4 py-2 border rounded-xl shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Value at Risk</p>
                                <p className="text-lg font-bold text-slate-900">
                                    ${dashboardData.valueAtRisk.totalValue.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
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

                            {/* Equipment Health and Overdue Trends - Moved up */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Overdue Trends */}
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

                                    {/* Most Checked Out */}
                                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-bold text-slate-900 mb-4">Most Popular Gear</h3>
                                        <div className="space-y-4">
                                            {dashboardData.topAssets.map((asset, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="font-medium text-slate-700 truncate max-w-[180px]">{asset.name}</span>
                                                        <span className="font-bold text-emerald-600">{asset.checkoutCount} checkouts</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                        <div
                                                            className="bg-emerald-500 h-1.5 rounded-full"
                                                            style={{ width: `${(asset.checkoutCount / Math.max(...dashboardData.topAssets.map(a => a.checkoutCount))) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </SignedIn>
            </div>
        </Layout>
    );
}
