import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { X, Plus, Pencil, Trash2, Check, Loader2, FolderTree, CornerDownRight } from "lucide-react";
import { CATEGORY_NAME_MAX, CategoryNode, errorMessage, useCategories } from "../lib/categories";

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Called after any change, so the page can refresh assets that moved. */
    onChanged: () => void;
}

const SUGGESTED = ["Cameras", "Lenses", "Audio", "Lighting", "Grip", "Cables & Power", "IT"];

const inputClass =
    "w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-gray-400 text-sm";

/** Admin-only editor for the team's categories and subcategories. */
export function CategoryManagerModal({ isOpen, onClose, onChanged }: CategoryManagerModalProps) {
    const { getToken } = useAuth();
    const { categories, isLoading, mutate } = useCategories();

    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [newName, setNewName] = useState("");
    // Which category has its "add subcategory" row open, and what's typed in it.
    const [addingUnder, setAddingUnder] = useState<number | null>(null);
    const [subName, setSubName] = useState("");
    // Which category or subcategory is being renamed.
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    if (!isOpen) return null;

    const call = async (url: string, method: string, body?: unknown): Promise<boolean> => {
        setBusy(true);
        setError("");
        try {
            const token = await getToken();
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) {
                setError(await errorMessage(res, "Something went wrong. Please try again."));
                return false;
            }
            await mutate();
            onChanged();
            return true;
        } catch {
            setError("Couldn't reach the server. Check your connection and try again.");
            return false;
        } finally {
            setBusy(false);
        }
    };

    const addCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        if (await call("/api/categories", "POST", { name: newName })) setNewName("");
    };

    const addSubcategory = async (e: React.FormEvent, parentId: number) => {
        e.preventDefault();
        if (!subName.trim()) return;
        if (await call("/api/categories", "POST", { name: subName, parent_id: parentId })) {
            setSubName("");
            setAddingUnder(null);
        }
    };

    const saveRename = async (e: React.FormEvent, id: number) => {
        e.preventDefault();
        if (!editName.trim()) return;
        if (await call(`/api/categories/${id}`, "PUT", { name: editName })) setEditingId(null);
    };

    const remove = async (id: number, name: string, assetCount: number) => {
        const note = assetCount
            ? `${assetCount} asset${assetCount === 1 ? "" : "s"} will become uncategorized. They won't be deleted.`
            : "No assets use it.";
        if (!confirm(`Delete "${name}"?\n\n${note}`)) return;
        await call(`/api/categories/${id}`, "DELETE");
    };

    const startRename = (id: number, name: string) => {
        setEditingId(id);
        setEditName(name);
        setAddingUnder(null);
        setError("");
    };

    const renderRow = (id: number, name: string, assetCount: number, isSub: boolean, node?: CategoryNode) => {
        if (editingId === id) {
            return (
                <form onSubmit={(e) => saveRename(e, id)} className="flex items-center gap-2">
                    <input
                        autoFocus
                        aria-label={`New name for ${name}`}
                        value={editName}
                        maxLength={CATEGORY_NAME_MAX}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setEditingId(null)}
                        className={inputClass}
                        disabled={busy}
                    />
                    <button type="submit" disabled={busy || !editName.trim()} title="Save name" className="p-2 rounded-lg bg-black text-white disabled:opacity-40">
                        <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} title="Cancel" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                        <X className="w-4 h-4" />
                    </button>
                </form>
            );
        }
        const hasSubs = !!node && node.subcategories.length > 0;
        return (
            <div className="flex items-center gap-2 min-h-[40px]">
                {isSub && <CornerDownRight className="w-3.5 h-3.5 text-gray-300 shrink-0" aria-hidden="true" />}
                <span className={`flex-1 min-w-0 truncate text-sm ${isSub ? "text-gray-700" : "font-semibold text-gray-900"}`}>{name}</span>
                <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
                    {assetCount} {assetCount === 1 ? "asset" : "assets"}
                </span>
                <div className="flex items-center shrink-0">
                    {!isSub && (
                        <button
                            type="button"
                            title={`Add a subcategory to ${name}`}
                            onClick={() => { setAddingUnder(id); setSubName(""); setEditingId(null); setError(""); }}
                            className="p-2 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                    <button type="button" title={`Rename ${name}`} onClick={() => startRename(id, name)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        title={hasSubs ? "Delete its subcategories first" : `Delete ${name}`}
                        onClick={() => remove(id, name, assetCount)}
                        disabled={busy || hasSubs}
                        className="p-2 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="category-manager-title"
                className="bg-white w-full sm:max-w-lg sm:rounded-2xl shadow-2xl flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh] overflow-hidden rounded-t-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 id="category-manager-title" className="text-lg font-bold text-gray-900">Categories</h2>
                        <p className="text-xs text-gray-500">Group assets into categories and subcategories.</p>
                    </div>
                    <button onClick={onClose} title="Close" className="p-2 bg-gray-50 text-gray-400 hover:text-gray-600 rounded-full transition-all active:scale-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                    {error && (
                        <div role="alert" className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Add a top-level category */}
                    <form onSubmit={addCategory} className="flex items-center gap-2">
                        <input
                            aria-label="New category name"
                            placeholder="New category, e.g. Cameras"
                            value={newName}
                            maxLength={CATEGORY_NAME_MAX}
                            onChange={(e) => setNewName(e.target.value)}
                            className={inputClass}
                            disabled={busy}
                        />
                        <button
                            type="submit"
                            disabled={busy || !newName.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium whitespace-nowrap disabled:opacity-40"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Add
                        </button>
                    </form>

                    {isLoading ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Loading categories…</p>
                    ) : categories.length === 0 ? (
                        <div className="text-center py-8 px-4 border border-dashed border-gray-200 rounded-xl">
                            <FolderTree className="w-8 h-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                            <p className="text-sm font-semibold text-gray-900">No categories yet</p>
                            <p className="text-xs text-gray-500 mt-1 mb-4 max-w-xs mx-auto">
                                Add your own above, or start with a suggested set: {SUGGESTED.join(", ")}.
                            </p>
                            <button
                                type="button"
                                onClick={() => call("/api/categories/suggested", "POST")}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium hover:border-gray-400 disabled:opacity-40"
                            >
                                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                Add suggested categories
                            </button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 border border-gray-100 rounded-xl">
                            {categories.map((c) => (
                                <li key={c.id} className="px-3 py-1.5">
                                    {renderRow(c.id, c.name, c.asset_count, false, c)}
                                    {(c.subcategories.length > 0 || addingUnder === c.id) && (
                                        <ul className="pl-3 pb-1">
                                            {c.subcategories.map((s) => (
                                                <li key={s.id}>{renderRow(s.id, s.name, s.asset_count, true)}</li>
                                            ))}
                                            {addingUnder === c.id && (
                                                <li>
                                                    <form onSubmit={(e) => addSubcategory(e, c.id)} className="flex items-center gap-2 py-1">
                                                        <CornerDownRight className="w-3.5 h-3.5 text-gray-300 shrink-0" aria-hidden="true" />
                                                        <input
                                                            autoFocus
                                                            aria-label={`New subcategory in ${c.name}`}
                                                            placeholder={`Subcategory in ${c.name}`}
                                                            value={subName}
                                                            maxLength={CATEGORY_NAME_MAX}
                                                            onChange={(e) => setSubName(e.target.value)}
                                                            onKeyDown={(e) => e.key === "Escape" && setAddingUnder(null)}
                                                            className={inputClass}
                                                            disabled={busy}
                                                        />
                                                        <button type="submit" disabled={busy || !subName.trim()} title="Add subcategory" className="p-2 rounded-lg bg-black text-white disabled:opacity-40">
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button type="button" onClick={() => setAddingUnder(null)} title="Cancel" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </form>
                                                </li>
                                            )}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
