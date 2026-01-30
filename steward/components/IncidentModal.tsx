import { useState, useEffect } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { X, AlertCircle, Loader2, Info, AlertTriangle, Flame } from "lucide-react";

interface Asset {
    id: number;
    name: string;
    qr_code?: string;
}

interface IncidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset | null;
    onSuccess: () => void;
}

export function IncidentModal({ isOpen, onClose, asset, onSuccess }: IncidentModalProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        severity: "Medium",
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: "",
                description: "",
                severity: "Medium",
            });
            setError("");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset) return;

        setLoading(true);
        setError("");

        try {
            const token = await getToken();
            const response = await fetch("/api/incidents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    asset_id: asset.id,
                    ...formData
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to report incident");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !asset) return null;

    const severities = [
        { value: "Low", icon: Info, color: "text-blue-600 bg-blue-50 border-blue-100" },
        { value: "Medium", icon: AlertCircle, color: "text-yellow-600 bg-yellow-50 border-yellow-100" },
        { value: "High", icon: AlertTriangle, color: "text-orange-600 bg-orange-50 border-orange-100" },
        { value: "Critical", icon: Flame, color: "text-red-600 bg-red-50 border-red-100" },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden transition-all duration-300">
                {/* Header - Sticky */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Report Incident</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Asset:</span>
                            <span className="text-[10px] text-red-600 uppercase font-bold tracking-wider">{asset.name}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all active:scale-90"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form - Scrollable */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600 animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Subject / Title</label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                            placeholder="e.g., Cracked Screen, Battery Leaking"
                            disabled={loading}
                        />
                    </div>

                    {/* Severity Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-700 ml-1">Severity Assessment</label>
                        <div className="grid grid-cols-2 gap-2">
                            {severities.map((s) => {
                                const Icon = s.icon;
                                const isSelected = formData.severity === s.value;
                                return (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, severity: s.value })}
                                        className={`flex items-center gap-2 p-3 border rounded-xl text-xs font-bold transition-all active:scale-95 ${isSelected ? s.color : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {s.value}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Details</label>
                        <textarea
                            rows={4}
                            required
                            maxLength={1000}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 text-sm resize-none"
                            placeholder="Provide full details about the issue..."
                            disabled={loading}
                        />
                    </div>
                </form>

                {/* Footer - Sticky */}
                <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0 z-10 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        type="submit"
                        disabled={loading}
                        className="flex-[2] py-3 px-4 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/10 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <span>REPORT ISSUE</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
