import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (decodedText: string) => void;
}

export function ScanModal({ isOpen, onClose, onScan }: ScanModalProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen && !scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scannerRef.current.render(
                (decodedText) => {
                    onScan(decodedText);
                    onClose();
                    if (scannerRef.current) {
                        scannerRef.current.clear();
                    }
                },
                (error) => {
                    // console.warn(error);
                }
            );
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear scanner", error);
                });
                scannerRef.current = null;
            }
        };
    }, [isOpen]);

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
                <div className="flex-1 overflow-y-auto bg-gray-900 flex items-center justify-center relative">
                    <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-4 border-white/5 shadow-2xl"></div>

                    {/* Visual Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative">
                            <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-lg"></div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-lg"></div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-lg"></div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-lg"></div>
                        </div>
                        <p className="mt-8 text-white/60 text-xs font-bold uppercase tracking-wider animate-pulse">Scanning for match...</p>
                    </div>
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
