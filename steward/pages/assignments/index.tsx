import { useState, useMemo } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import useSWR from "swr";
import { Layout } from "@/components/Layout";
import {
    ClipboardList,
    Search,
    QrCode,
    CheckCircle,
    Clock,
    User,
    Box,
    ArrowRightLeft,
    Loader2,
    X,
    AlertTriangle
} from "lucide-react";
import { ScanModal } from "@/components/ScanModal";
import { CheckoutModal } from "@/components/CheckoutModal";
import { IncidentModal } from "@/components/IncidentModal";
import { Protect } from "@clerk/nextjs";

export default function AssignmentsPage() {
    const { getToken, isLoaded, userId } = useAuth();
    const { memberships } = useOrganization({
        memberships: { pageSize: 50 },
    });

    const [isScanOpen, setIsScanOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
    const [isIncidentOpen, setIsIncidentOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [searchQuery, setSearchQuery] = useState("");
    const [isProcessing, setIsProcessing] = useState<number | null>(null);

    // Fetch active assignments
    const { data: assignments, mutate: mutateAssignments } = useSWR(
        isLoaded && userId ? ["/api/assignments/active", userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        }
    );

    // Fetch assignment history
    const { data: history, mutate: mutateHistory } = useSWR(
        isLoaded && userId ? ["/api/assignments/history", userId] : null,
        async ([url]) => {
            const token = await getToken();
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.json();
        }
    );

    // Fetch assets (to show in checkout selection and for scanning)
    const { data: assets, mutate: mutateAssets } = useSWR(
        isLoaded && userId ? ["/api/assets", userId] : null,
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

    const handleCheckIn = async (assetId: number) => {
        setIsProcessing(assetId);
        try {
            const token = await getToken();
            const res = await fetch(`/api/assignments/checkin/${assetId}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                mutateAssignments();
                mutateAssets();
            }
        } catch (error) {
            console.error("Check-in failed:", error);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleScan = async (decodedText: string) => {
        const asset = assets?.find((a: any) => a.qr_code === decodedText);
        if (asset) {
            if (asset.status === "Checked Out") {
                handleCheckIn(asset.id);
            } else if (asset.status === "Available") {
                setSelectedAsset(asset);
                setIsCheckoutOpen(true);
            } else {
                alert(`Asset ${asset.name} is ${asset.status} and cannot be assigned.`);
            }
        } else {
            alert(`No asset found with QR: ${decodedText}`);
        }
    };

    const handleCheckoutSuccess = () => {
        mutateAssignments();
        mutateAssets();
    };

    const filteredAssignments = useMemo(() => {
        if (!Array.isArray(assignments)) return [];
        return assignments.filter((a: any) =>
            (a.asset?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (userMap[a.assigned_to] || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [assignments, searchQuery, userMap]);

    const filteredHistory = useMemo(() => {
        if (!Array.isArray(history)) return [];
        return history.filter((h: any) =>
            (h.asset?.name || "Unknown").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (userMap[h.assigned_to] || "Unknown").toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [history, searchQuery, userMap]);

    const availableAssetsForSelection = useMemo(() => {
        if (!Array.isArray(assets)) return [];
        return assets.filter((a: any) =>
            a.status === "Available" &&
            (a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.qr_code || "").toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [assets, searchQuery]);

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <ClipboardList className="w-7 h-7 text-green-600" />
                            Assignments
                        </h1>
                        <p className="text-gray-500 mt-1">Manage asset check-ins and check-outs.</p>
                    </div>

                    <Protect role="org:admin">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSelectionModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <Box className="w-4 h-4" />
                                Assign Asset
                            </button>
                            <button
                                onClick={() => setIsScanOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                <QrCode className="w-4 h-4" />
                                Scan Asset
                            </button>
                        </div>
                    </Protect>
                </div>

                {/* Search and Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                History
                            </button>
                        </div>

                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Mobile Card View (Active) */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {activeTab === 'active' ? (
                            !assignments || assignments.length === 0 ? (
                                <div className="px-6 py-12 text-center text-gray-500 italic">No active assignments found.</div>
                            ) : (
                                filteredAssignments?.map((item: any) => (
                                    <div key={item.id} className="p-4 bg-white active:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 shrink-0">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-bold text-gray-900 truncate">{item.asset?.name || `Asset #${item.asset_id}`}</h3>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-100">
                                                        Active
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                                                    <User className="w-3 h-3" />
                                                    <span>{userMap[item.assigned_to] || item.assigned_to}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mb-4">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{new Date(item.checked_out_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                                                </div>

                                                <div className="flex gap-2 mt-4">
                                                    <button
                                                        onClick={() => handleCheckIn(item.asset_id)}
                                                        disabled={isProcessing === item.asset_id}
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100 active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        {isProcessing === item.asset_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <><ArrowRightLeft className="w-4 h-4" /> Return</>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAsset(item.asset);
                                                            setIsIncidentOpen(true);
                                                        }}
                                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 active:scale-95 transition-all"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            /* Mobile History View */
                            !history || history.length === 0 ? (
                                <div className="px-6 py-12 text-center text-gray-500 italic">No history found.</div>
                            ) : (
                                filteredHistory?.map((item: any) => (
                                    <div key={item.id} className="p-4 opacity-75">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                                <Box className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-medium text-gray-900 truncate">{item.asset?.name || `Asset #${item.asset_id}`}</h3>
                                                    <span className="text-[10px] font-bold uppercase text-gray-400">Completed</span>
                                                </div>
                                                <div className="text-xs text-gray-500 space-y-1">
                                                    <p>User: {userMap[item.assigned_to] || item.assigned_to}</p>
                                                    <div className="flex flex-wrap gap-x-4">
                                                        <span>Out: {new Date(item.checked_out_at).toLocaleDateString()}</span>
                                                        <span>In: {item.actual_return_at ? new Date(item.actual_return_at).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        {activeTab === 'active' ? 'Checked Out' : 'Duration'}
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {activeTab === 'active' ? (
                                    !assignments || assignments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                                No active assignments found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAssignments?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                                            <Box className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{item.asset?.name || `Asset #${item.asset_id}`}</div>
                                                            <div className="text-xs text-gray-500">{item.asset?.qr_code || "No QR"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <span className="text-sm text-gray-700">{userMap[item.assigned_to] || item.assigned_to}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm text-gray-700">{new Date(item.checked_out_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(item.checked_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedAsset(item.asset);
                                                                setIsIncidentOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                                                            title="Report Issue"
                                                        >
                                                            <AlertTriangle className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleCheckIn(item.asset_id)}
                                                            disabled={isProcessing === item.asset_id}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100 disabled:opacity-50"
                                                        >
                                                            {isProcessing === item.asset_id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <ArrowRightLeft className="w-4 h-4" />
                                                            )}
                                                            Return
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                ) : (
                                    /* History Tab Items */
                                    !history || history.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                                                No assignment history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory?.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                                            <Box className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{item.asset?.name || `Asset #${item.asset_id}`}</div>
                                                            <div className="text-xs text-gray-500">{item.asset?.qr_code || "No QR"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                        <span className="text-sm text-gray-700">{userMap[item.assigned_to] || item.assigned_to}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col text-xs text-gray-500">
                                                        <span>Out: {new Date(item.checked_out_at).toLocaleDateString()}</span>
                                                        <span>In: {item.actual_return_at ? new Date(item.actual_return_at).toLocaleDateString() : 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-xs font-medium text-gray-400">Completed</span>
                                                </td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Asset Selection Modal (for manual checkout) */}
            {isSelectionModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Select Asset to Assign</h2>
                            <button onClick={() => setIsSelectionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search available assets..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {availableAssetsForSelection?.map((asset: any) => (
                                <button
                                    key={asset.id}
                                    onClick={() => {
                                        setSelectedAsset(asset);
                                        setIsCheckoutOpen(true);
                                        setIsSelectionModalOpen(false);
                                        setSearchQuery(""); // Clear search query after selection
                                    }}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100 text-left"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-500">
                                        <Box className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{asset.name}</div>
                                        <div className="text-xs text-gray-500">QR: {asset.qr_code || asset.id}</div>
                                    </div>
                                    <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                        Available
                                    </div>
                                </button>
                            ))}
                            {availableAssetsForSelection?.length === 0 && (
                                <div className="p-12 text-center text-gray-500 italic">
                                    No available assets found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ScanModal
                isOpen={isScanOpen}
                onClose={() => setIsScanOpen(false)}
                onScan={handleScan}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => {
                    setIsCheckoutOpen(false);
                    setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onSuccess={handleCheckoutSuccess}
            />

            <IncidentModal
                isOpen={isIncidentOpen}
                onClose={() => {
                    setIsIncidentOpen(false);
                    setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onSuccess={() => {
                    mutateAssignments();
                    mutateAssets();
                }}
            />
        </Layout>
    );
}
