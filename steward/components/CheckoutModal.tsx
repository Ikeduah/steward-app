import { useState, useEffect } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { X, Loader2, Calendar, User, Box } from "lucide-react";

interface Asset {
    id: number;
    name: string;
    qr_code?: string;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset | null;
    onSuccess: () => void;
}

export function CheckoutModal({ isOpen, onClose, asset, onSuccess }: CheckoutModalProps) {
    const { getToken } = useAuth();
    const { organization, memberships } = useOrganization({
        memberships: { pageSize: 50 },
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        assigned_to: "",
        expected_return_at: "",
        notes: "",
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                assigned_to: "",
                expected_return_at: "",
                notes: "",
            });
            setError("");
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset) return;
        if (!formData.assigned_to) {
            setError("Please select a team member");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = await getToken();
            const response = await fetch("/api/assignments/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    asset_id: asset.id,
                    assigned_to: formData.assigned_to,
                    expected_return_at: formData.expected_return_at || null,
                    notes: formData.notes || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Failed to check out asset");
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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden transition-all duration-300">
                {/* Header - Sticky */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Checkout Asset</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Assigning:</span>
                            <span className="text-[10px] text-green-600 uppercase font-bold tracking-wider">{asset.name}</span>
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

                    {/* Team Member Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1 flex items-center gap-2">
                            Assign To Team Member <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                required
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all appearance-none text-sm font-medium text-gray-900"
                                disabled={loading}
                            >
                                <option value="">Select a member...</option>
                                {memberships?.data?.map((m: any) => (
                                    <option key={m.publicUserData.userId} value={m.publicUserData.userId}>
                                        {m.publicUserData.firstName} {m.publicUserData.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Expected Return Date */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1 flex items-center gap-2">
                            Expected Return (Optional)
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={formData.expected_return_at}
                                onChange={(e) => setFormData({ ...formData, expected_return_at: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all text-sm font-medium text-gray-900"
                                disabled={loading}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-700 ml-1">Assignment Notes</label>
                        <textarea
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 text-sm resize-none"
                            placeholder="Add any specific details for this assignment..."
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
                        className="flex-[2] py-3 px-4 bg-black text-white rounded-xl text-xs font-bold shadow-lg shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <span>CHECK OUT ASSET</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
