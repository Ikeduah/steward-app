import { useState, useEffect } from "react";
import { useAuth, useOrganization } from "@clerk/nextjs";
import {
    X,
    AlertCircle,
    Loader2,
    MessageSquare,
    Clock,
    User,
    Send,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Box
} from "lucide-react";

interface Incident {
    id: number;
    title: string;
    description: string;
    severity: string;
    status: string;
    notes: any[];
    created_at: string;
    reported_by: string;
    asset?: {
        id: number;
        name: string;
    };
}

interface IncidentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    incident: Incident | null;
    onUpdate: () => void;
    userMap: Record<string, string>;
}

export function IncidentDetailsModal({ isOpen, onClose, incident, onUpdate, userMap }: IncidentDetailsModalProps) {
    const { getToken, userId } = useAuth();
    const [loading, setLoading] = useState(false);
    const [noteText, setNoteText] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (incident) {
            setNewStatus(incident.status);
            setNoteText("");
            setError("");
        }
    }, [incident]);

    const handleSave = async () => {
        if (!incident) return;
        setLoading(true);
        setError("");

        try {
            const token = await getToken();
            const updates: any = {};

            if (newStatus !== incident.status) {
                updates.status = newStatus;
            }

            if (noteText.trim()) {
                updates.notes = [{ text: noteText.trim() }];
            }

            if (Object.keys(updates).length === 0) {
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/incidents/${incident.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) throw new Error("Failed to update incident");

            onUpdate();
            setNoteText("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !incident) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-hidden transition-all duration-300">
                {/* Header - Sticky */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">TICKET #{incident.id}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${incident.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                incident.severity === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                {incident.severity}
                            </span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{incident.title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                    {/* Status Update Quick Bar */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Current Status</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {["Open", "In Progress", "Resolved", "Closed"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setNewStatus(s)}
                                    className={`px-3 py-2.5 text-[10px] font-bold rounded-xl border transition-all active:scale-95 ${newStatus === s
                                        ? "bg-black text-white border-black shadow-lg shadow-black/10"
                                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1">Incident Report</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {incident.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[11px] font-bold text-gray-600">
                                <Box className="w-3.5 h-3.5" />
                                <span>{incident.asset?.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[11px] font-bold text-gray-600">
                                <User className="w-3.5 h-3.5" />
                                <span>{userMap[incident.reported_by]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full text-[11px] font-bold text-gray-600">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Update History */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between ml-1">
                            <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Logged Updates
                            </h4>
                            <span className="text-[10px] font-bold text-gray-300">{incident.notes?.length || 0} ITEMS</span>
                        </div>

                        <div className="space-y-4 relative">
                            {/* Visual Timeline Line */}
                            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100 -z-0" />

                            {incident.notes && incident.notes.length > 0 ? (
                                incident.notes.map((note, idx) => (
                                    <div key={idx} className="flex gap-4 relative z-10">
                                        <div className="shrink-0 pt-1">
                                            <div className="w-7 h-7 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-[10px] font-extrabold text-gray-400 shadow-sm">
                                                {(userMap[note.actor_id] || "?").charAt(0)}
                                            </div>
                                        </div>
                                        <div className="flex-1 bg-white border border-gray-100 p-3.5 rounded-2xl rounded-tl-none shadow-sm">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-[11px] font-extrabold text-gray-900">{userMap[note.actor_id] || "System"}</span>
                                                <span className="text-[9px] font-bold text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded uppercase">{new Date(note.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed font-medium">{note.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 text-gray-400 italic text-[11px] font-bold border-2 border-dashed border-gray-100 rounded-3xl">
                                    No logged history found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer - Input (Sticky) */}
                <div className="p-5 border-t border-gray-100 bg-white sticky bottom-0 shrink-0">
                    {error && <div className="mb-3 text-[10px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100">{error}</div>}

                    <div className="flex items-end gap-3">
                        <textarea
                            placeholder="Add a progress note..."
                            rows={1}
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="flex-1 p-4 text-sm border-2 border-transparent bg-gray-50 rounded-2xl focus:bg-white focus:border-black/5 focus:ring-4 focus:ring-black/5 outline-none resize-none transition-all placeholder:text-gray-400 placeholder:font-bold"
                            style={{ minHeight: '56px' }}
                        />
                        <button
                            onClick={handleSave}
                            disabled={loading || (!noteText.trim() && newStatus === incident.status)}
                            className="w-14 h-14 bg-black text-white rounded-2xl hover:bg-gray-900 disabled:opacity-30 transition-all shadow-xl shadow-black/10 active:scale-90 flex items-center justify-center shrink-0"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
