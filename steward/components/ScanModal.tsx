import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, RefreshCw } from 'lucide-react';

interface ScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

type ScanError = 'insecure' | 'denied' | 'generic';

const ERROR_MESSAGES: Record<ScanError, string> = {
    insecure: 'Camera requires a secure connection (HTTPS).',
    denied: 'Camera access was denied. Please allow camera access in your browser settings and try again.',
    generic: "Couldn't access the camera. Please try again.",
};

export function ScanModal({ isOpen, onClose, onScan }: ScanModalProps) {
    const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
    const [error, setError] = useState<ScanError | null>(null);
    const [retryToken, setRetryToken] = useState(0);

    // Keep latest callbacks available without restarting the camera on every
    // parent re-render (onScan/onClose are passed as fresh references).
    const onScanRef = useRef(onScan);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onScanRef.current = onScan; }, [onScan]);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        if (!isOpen) return;

        setError(null);

        if (typeof window !== 'undefined' && !window.isSecureContext) {
            setError('insecure');
            return;
        }

        let cancelled = false;
        const html5Qrcode = new Html5Qrcode('reader');
        html5QrcodeRef.current = html5Qrcode;

        html5Qrcode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                onScanRef.current(decodedText);
                onCloseRef.current();
            },
            () => { /* per-frame scan miss, expected — ignore */ }
        ).catch((err) => {
            if (cancelled) return;
            console.error('Failed to start QR scanner', err);
            const message = String(err);
            setError(
                message.includes('NotAllowedError') || message.includes('Permission denied')
                    ? 'denied'
                    : 'generic'
            );
        });

        return () => {
            cancelled = true;
            const scanner = html5QrcodeRef.current;
            html5QrcodeRef.current = null;
            if (!scanner) return;

            if (scanner.isScanning) {
                scanner.stop()
                    .then(() => scanner.clear())
                    .catch((err) => console.error('Failed to stop scanner', err));
            } else {
                scanner.clear();
            }
        };
    }, [isOpen, retryToken]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center z-[60] sm:p-4">
            <div className="bg-white w-full sm:max-w-md sm:rounded-3xl shadow-2xl flex flex-col h-[92vh] sm:h-auto overflow-hidden transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">QR / Barcode Scanner</h2>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Point & Capture</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all active:scale-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scanner View */}
                <div className="flex-1 overflow-y-auto bg-gray-900 flex items-center justify-center relative min-h-[280px]">
                    <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-white/5 shadow-2xl min-h-[280px]"></div>

                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center bg-gray-900/95">
                            <p className="text-white/80 text-sm font-medium">{ERROR_MESSAGES[error]}</p>
                            <button
                                onClick={() => setRetryToken((t) => t + 1)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full active:scale-95 transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Try Again
                            </button>
                        </div>
                    ) : (
                        /* Visual Overlay */
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                            <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                            </div>
                            <p className="mt-8 text-white/60 text-xs font-bold uppercase tracking-wider animate-pulse">Scanning for match...</p>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="p-6 bg-white border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                        Center the barcode or QR code within the frame above to automatically identify the asset.
                    </p>
                </div>
            </div>
        </div>
    );
}
