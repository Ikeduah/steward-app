import { useState } from "react";
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { Layout } from "../../components/Layout";
import { AssetFormModal } from "../../components/AssetFormModal";
import { Plus, Search, Filter, QrCode, Edit2, Trash2, CheckSquare, Square, AlertTriangle } from "lucide-react";
import { IncidentModal } from "../../components/IncidentModal";

// Fetcher for SWR
const fetcher = (url: string, token: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.json());

export default function AssetsPage() {
    const { getToken, isLoaded, userId } = useAuth();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
    const [assetForIncident, setAssetForIncident] = useState<any>(null);

    // Fetch assets with SWR
    const { data: assets, error, mutate } = useSWR(
        isLoaded && userId ? [`/api/assets?search=${search}&status=${statusFilter}`, userId] : null,
        async ([url]) => {
            const token = await getToken();
            return fetcher(url, token || "");
        }
    );

    const isLoading = !assets && !error;

    // Bulk action handlers
    const handleSelectAll = () => {
        if (!Array.isArray(assets)) return;
        if (selectedIds.length === assets.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(assets.map((a: any) => a.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.length} asset(s)?`)) return;

        try {
            const token = await getToken();
            await Promise.all(
                selectedIds.map(id =>
                    fetch(`/api/assets/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    })
                )
            );
            setSelectedIds([]);
            mutate();
        } catch (err) {
            alert("Failed to delete assets");
        }
    };

    return (
        <Layout>
            <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
                        <p className="text-sm text-gray-500">Manage your inventory and equipment.</p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedAsset(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Asset</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search assets..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-bold tracking-wider text-xs"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 appearance-none font-bold tracking-wider text-xs"
                        >
                            <option value="">All Status</option>
                            <option value="Available">Available</option>
                            <option value="Checked Out">Checked Out</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Bulk Actions Control */}
                    <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200 uppercase tracking-widest font-bold">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSelectAll}
                                className="text-gray-400 hover:text-green-600 transition-colors"
                            >
                                {Array.isArray(assets) && assets.length > 0 && selectedIds.length === assets.length ? (
                                    <CheckSquare className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Square className="w-5 h-5" />
                                )}
                            </button>
                            <span className="text-[10px] text-gray-700">
                                {selectedIds.length > 0 ? `${selectedIds.length} Selected` : "Select All"}
                            </span>
                        </div>

                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-1 text-[10px] text-red-600 hover:text-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete Selected</span>
                            </button>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="w-12 px-6 py-4"></th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Asset Details</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">QR Code</th>
                                    <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 uppercase tracking-widest font-bold">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-xs">
                                            Loading assets...
                                        </td>
                                    </tr>
                                ) : !Array.isArray(assets) || assets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic text-xs">
                                            {error ? "Error loading assets" : "No assets found."}
                                        </td>
                                    </tr>
                                ) : (
                                    assets.map((asset: any) => (
                                        <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setSelectedIds(prev => prev.includes(asset.id) ? prev.filter(id => id !== asset.id) : [...prev, asset.id])}
                                                    className="text-gray-400 hover:text-green-600 transition-colors"
                                                >
                                                    {selectedIds.includes(asset.id) ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5" />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <button onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }} className="font-bold text-gray-900 hover:text-green-600 text-left text-xs">
                                                        {asset.name}
                                                    </button>
                                                    <span className="text-[9px] text-gray-400 mt-0.5">Added {new Date(asset.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[10px]">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border
                                                    ${asset.status === 'Available' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        asset.status === 'Checked Out' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            asset.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-mono text-[10px]">{asset.qr_code || '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 text-xs">
                                                    <button title="Report Issue" onClick={() => { setAssetForIncident(asset); setIsIncidentModalOpen(true); }} className="text-amber-600 hover:bg-amber-50 p-1.5 rounded-lg transition-colors"><AlertTriangle className="w-4 h-4" /></button>
                                                    <button title="Edit Asset" onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }} className="text-gray-600 hover:bg-gray-50 p-1.5 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button title="Delete Asset" onClick={() => { if (confirm('Delete this asset?')) { setSelectedIds([asset.id]); handleBulkDelete(); } }} className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100 uppercase tracking-widest font-bold">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="p-4 space-y-3 animate-pulse">
                                    <div className="flex justify-between">
                                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                                </div>
                            ))
                        ) : !Array.isArray(assets) || assets.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 italic text-xs">
                                {error ? "Error loading assets" : "No assets found."}
                            </div>
                        ) : (
                            assets.map((asset: any) => (
                                <div key={asset.id} className="p-4 bg-white active:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <button onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }} className="font-bold text-gray-900 text-left text-xs truncate block w-full">
                                                {asset.name}
                                            </button>
                                            <p className="text-[9px] text-gray-400 mt-0.5">Added {new Date(asset.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] border shrink-0
                                            ${asset.status === 'Available' ? 'bg-green-50 text-green-700 border-green-100' :
                                                asset.status === 'Checked Out' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    asset.status === 'Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-gray-50 text-gray-700 border-gray-100'}`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-mono text-gray-500">{asset.qr_code || '-'}</div>
                                        <div className="flex items-center gap-1">
                                            <button title="Report Issue" onClick={() => { setAssetForIncident(asset); setIsIncidentModalOpen(true); }} className="p-2 text-amber-600 transition-colors hover:bg-amber-50 rounded-lg"><AlertTriangle className="w-4 h-4" /></button>
                                            <button title="Edit Asset" onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); }} className="p-2 text-gray-600 transition-colors hover:bg-gray-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                                            <button title="Delete Asset" onClick={() => { if (confirm('Delete this asset?')) { setSelectedIds([asset.id]); handleBulkDelete(); } }} className="p-2 text-red-400 transition-colors hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AssetFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedAsset(null);
                }}
                asset={selectedAsset}
                onSuccess={() => {
                    mutate();
                }}
            />

            <IncidentModal
                isOpen={isIncidentModalOpen}
                onClose={() => {
                    setIsIncidentModalOpen(false);
                    setAssetForIncident(null);
                }}
                asset={assetForIncident}
                onSuccess={() => {
                    mutate();
                }}
            />
        </Layout>
    );
}
