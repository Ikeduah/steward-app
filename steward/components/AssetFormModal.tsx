import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Upload, Loader2 } from "lucide-react";

interface Asset {
    id?: number;
    name: string;
    description: string;
    status: string;
    qr_code: string;
    image_url: string;
}

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset?: Asset | null;
    onSuccess: () => void;
}

export function AssetFormModal({ isOpen, onClose, asset, onSuccess }: AssetFormModalProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "Available",
        qr_code: "",
        image_url: "",
    });

    // Pre-populate form when editing
    useEffect(() => {
        if (asset) {
            setFormData({
                name: asset.name || "",
                description: asset.description || "",
                status: asset.status || "Available",
                qr_code: asset.qr_code || "",
                image_url: asset.image_url || "",
            });
        } else {
            // Generate random QR code for new assets
            setFormData({
                name: "",
                description: "",
                status: "Available",
                qr_code: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                image_url: "",
            });
        }
        setError("");
    }, [asset, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const token = await getToken();
            const url = asset ? `/api/assets/${asset.id}` : "/api/assets";
            const method = asset ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to save asset");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden transition-all duration-300">
                {/* Header - Sticky */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">
                            {asset ? "Edit Asset" : "New Asset"}
                        </h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Details & Specifications</p>
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

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">
                            Asset Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={100}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400 text-sm"
                            placeholder="e.g., MacBook Pro 16-inch"
                            disabled={loading}
                        />
                    </div>

                    {/* Status */}
                    {asset && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 ml-1">Status</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['Available', 'Maintenance', 'Retired'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, status: s })}
                                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${formData.status === s
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Description</label>
                        <textarea
                            rows={3}
                            maxLength={500}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400 text-sm resize-none"
                            placeholder="Any specific details..."
                            disabled={loading}
                        />
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Photo Reference</label>
                        <div className="grid grid-cols-1 gap-3">
                            <label className="cursor-pointer group">
                                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl group-hover:border-gray-400 group-hover:bg-gray-100/50 transition-all">
                                    {formData.image_url ? (
                                        <div className="relative w-full px-4 h-32">
                                            <img src={formData.image_url} className="w-full h-full object-contain rounded-lg" alt="Preview" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-lg">
                                                <span className="text-[10px] font-extrabold text-white bg-black px-2 py-1 rounded">CHANGE</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                            <span className="text-[11px] font-bold text-gray-500">Tap to Upload Photo</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setFormData({ ...formData, image_url: reader.result as string });
                                        reader.readAsDataURL(file);
                                    }
                                }} disabled={loading} />
                            </label>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Identifier (QR)</label>
                        <input
                            type="text"
                            value={formData.qr_code}
                            onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 border-transparent rounded-xl text-gray-500 text-xs font-mono"
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
                        className="flex-[2] py-3 px-4 bg-black text-white rounded-xl text-xs font-extrabold shadow-lg shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <span>{asset ? "SAVE CHANGES" : "CREATE ASSET"}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
