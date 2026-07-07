import { useState, useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Upload, Loader2, Printer, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { upload } from "@vercel/blob/client";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB — matches the upload-url server limit

/** Best-effort delete of a Vercel Blob (no-op for non-blob/empty URLs). */
async function deleteBlob(url: string | undefined | null) {
    if (!url || !url.includes(".blob.vercel-storage.com/")) return;
    try {
        await fetch("/api/assets/delete-blob", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
    } catch {
        // Cleanup is best-effort; a leaked blob is non-fatal.
    }
}

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
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        status: "Available",
        qr_code: "",
        image_url: "",
    });

    // The image URL the asset had when the modal opened (persisted value).
    const initialImageUrlRef = useRef("");
    // A blob uploaded during this session that is not yet persisted — tracked so
    // we can clean it up if the user re-uploads or cancels without saving.
    const pendingUploadRef = useRef<string | null>(null);

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
            initialImageUrlRef.current = asset.image_url || "";
        } else {
            // Generate random QR code for new assets
            setFormData({
                name: "",
                description: "",
                status: "Available",
                qr_code: `QR-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                image_url: "",
            });
            initialImageUrlRef.current = "";
        }
        pendingUploadRef.current = null;
        setError("");
    }, [asset, isOpen]);

    // Discard an unsaved blob when the modal is dismissed without saving.
    const handleClose = () => {
        if (pendingUploadRef.current && pendingUploadRef.current !== initialImageUrlRef.current) {
            deleteBlob(pendingUploadRef.current);
        }
        pendingUploadRef.current = null;
        onClose();
    };

    const handleFileSelected = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
            return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
            setError("Image must be under 5MB.");
            return;
        }
        setError("");
        setUploading(true);
        // The previous session upload becomes an orphan once we replace it.
        const previousPending = pendingUploadRef.current;
        try {
            const blob = await upload(file.name, file, {
                access: "public",
                handleUploadUrl: "/api/assets/upload-url",
            });
            if (previousPending && previousPending !== initialImageUrlRef.current) {
                deleteBlob(previousPending);
            }
            pendingUploadRef.current = blob.url;
            setFormData((prev) => ({ ...prev, image_url: blob.url }));
        } catch (err: any) {
            setError(err?.message || "Image upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        // If the current image is an unsaved session upload, delete it now.
        if (pendingUploadRef.current && pendingUploadRef.current === formData.image_url) {
            deleteBlob(pendingUploadRef.current);
            pendingUploadRef.current = null;
        }
        // A persisted image is only removed from storage once the change is saved.
        setFormData((prev) => ({ ...prev, image_url: "" }));
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const svgElement = document.getElementById('asset-qr-svg');
        const svgString = svgElement ? new XMLSerializer().serializeToString(svgElement) : '';

        const assetName = formData.name || 'New Asset';
        const assetId = formData.qr_code;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Asset Tag — ${assetName}</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
                    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet" />
                    <style>
                        *{box-sizing:border-box;margin:0;padding:0}
                        body{
                            display:flex;align-items:center;justify-content:center;
                            min-height:100vh;background:#F6F8F7;
                            font-family:system-ui,sans-serif;-webkit-font-smoothing:antialiased;
                        }
                        .card{
                            width:230px;background:#fff;border-radius:16px;
                            border:1px solid #D9DEDB;
                            box-shadow:0 18px 40px -22px rgba(6,20,14,.35);
                            overflow:hidden;
                        }
                        .card-header{
                            background:#06140E;padding:13px 16px;
                            display:flex;align-items:center;gap:9px;
                        }
                        .tile{
                            width:24px;height:24px;border-radius:7px;flex-shrink:0;
                            background:linear-gradient(150deg,#34D399,#059669);
                            display:flex;align-items:center;justify-content:center;
                        }
                        .brand-name{
                            font-family:'Space Grotesk',sans-serif;font-weight:600;
                            font-size:13px;color:#fff;letter-spacing:-.01em;
                        }
                        .qr-area{
                            padding:22px;display:flex;justify-content:center;
                        }
                        .qr-area svg{width:120px;height:120px;display:block;}
                        .info{padding:0 18px 18px;text-align:center;}
                        .asset-id{
                            font-family:'JetBrains Mono',monospace;font-size:11px;
                            color:#059669;margin-bottom:3px;text-transform:uppercase;
                            letter-spacing:.08em;
                        }
                        .asset-name{
                            font-family:'Space Grotesk',sans-serif;font-weight:600;
                            font-size:15px;color:#06140E;letter-spacing:-.01em;
                        }
                        @media print{
                            body{background:#fff;min-height:unset;display:block;}
                            .card{box-shadow:none;border-color:#D9DEDB;}
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="card-header">
                            <div class="tile">
                                <svg width="14" height="14" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                                    <path d="M45 19 C45 13 39 10 31 10 C20 10 14 16 14 23 C14 30 20 33 30 35 C40 37 45 40 45 45 C45 52 39 55 30 55"
                                        stroke="#fff" stroke-width="8.5" stroke-linecap="round"/>
                                    <circle cx="45" cy="19" r="5" fill="#fff"/>
                                    <circle cx="30" cy="55" r="5" fill="#fff"/>
                                </svg>
                            </div>
                            <span class="brand-name">Steward</span>
                        </div>
                        <div class="qr-area">${svgString}</div>
                        <div class="info">
                            <div class="asset-id">${assetId}</div>
                            <div class="asset-name">${assetName}</div>
                        </div>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

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
                let message = "Failed to save asset";
                try {
                    const text = await response.text();
                    const data = JSON.parse(text);
                    if (typeof data.detail === "string") message = data.detail;
                    else if (Array.isArray(data.detail)) message = data.detail[0]?.msg ?? message;
                    else if (text) message = text;
                } catch {
                    // non-JSON body — leave default message
                }
                throw new Error(message);
            }

            // Save succeeded: the persisted image is now `formData.image_url`.
            // If it replaced a different persisted blob, clean the old one up.
            if (
                initialImageUrlRef.current &&
                initialImageUrlRef.current !== formData.image_url
            ) {
                deleteBlob(initialImageUrlRef.current);
            }
            pendingUploadRef.current = null;

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
                        onClick={handleClose}
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
                            {formData.image_url && !uploading ? (
                                <div className="relative">
                                    <div className="flex items-center justify-center py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
                                        <div className="relative w-full px-4 h-32">
                                            <img src={formData.image_url} className="w-full h-full object-contain rounded-lg" alt="Preview" />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        disabled={loading}
                                        title="Remove photo"
                                        className="absolute top-2 right-2 p-1.5 bg-white text-gray-400 hover:text-red-600 rounded-full shadow-sm border border-gray-200 transition-all active:scale-90"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                    <label className="mt-2 block cursor-pointer text-center text-[11px] font-bold text-gray-500 hover:text-black transition-colors">
                                        CHANGE PHOTO
                                        <input type="file" accept="image/*" className="hidden" disabled={loading || uploading} onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelected(file);
                                            e.target.value = "";
                                        }} />
                                    </label>
                                </div>
                            ) : (
                                <label className="cursor-pointer group">
                                    <div className="flex flex-col items-center justify-center py-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl group-hover:border-gray-400 group-hover:bg-gray-100/50 transition-all">
                                        {uploading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 text-gray-400 mb-2 animate-spin" />
                                                <span className="text-[11px] font-bold text-gray-500">Uploading…</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                                <span className="text-[11px] font-bold text-gray-500">Tap to Upload Photo</span>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" disabled={loading || uploading} onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelected(file);
                                        e.target.value = "";
                                    }} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-xs font-bold text-gray-700">Digital Identity (QR)</label>
                            <button 
                                type="button" 
                                onClick={handlePrintQR}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-black transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                PRINT LABEL
                            </button>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 shrink-0">
                                <QRCode 
                                    id="asset-qr-svg"
                                    value={formData.qr_code || "PENDING"} 
                                    size={80} 
                                    level="H" 
                                />
                            </div>
                            <div className="flex-1 w-full space-y-1.5">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Internal Identifier</p>
                                <input
                                    type="text"
                                    value={formData.qr_code}
                                    onChange={(e) => setFormData({ ...formData, qr_code: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 text-xs font-mono focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer - Sticky */}
                <div className="p-5 bg-white border-t border-gray-100 sticky bottom-0 z-10 flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-3 px-4 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="flex-[2] py-3 px-4 bg-black text-white rounded-xl text-xs font-extrabold shadow-lg shadow-black/10 hover:bg-gray-900 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : uploading ? (
                            <span>UPLOADING…</span>
                        ) : (
                            <span>{asset ? "SAVE CHANGES" : "CREATE ASSET"}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
