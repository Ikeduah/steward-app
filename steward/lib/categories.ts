import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";

/** A subcategory, as GET /api/categories returns it inside its parent. */
export interface Subcategory {
    id: number;
    name: string;
    parent_id: number;
    asset_count: number;
}

/** A top-level category with its subcategories. */
export interface CategoryNode {
    id: number;
    name: string;
    parent_id: null;
    asset_count: number;
    subcategories: Subcategory[];
}

/** `?category_id=` value that lists assets with no category. */
export const UNCATEGORIZED = "none";

/** Longest name the API accepts (matches CATEGORY_NAME_MAX on the server). */
export const CATEGORY_NAME_MAX = 60;

/** The team's category tree, shared by every component that needs it. */
export function useCategories() {
    const { getToken, isLoaded, userId, orgId } = useAuth();
    const { data, error, mutate } = useSWR<CategoryNode[]>(
        isLoaded && userId ? ["/api/categories", orgId] : null,
        async ([url]: [string]) => {
            const token = await getToken();
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error(await errorMessage(res, "Couldn't load categories"));
            return res.json();
        }
    );
    const categories = Array.isArray(data) ? data : [];
    return { categories, isLoading: !data && !error, error, mutate };
}

/** id -> "Cameras" or "Cameras › Bodies", for labelling assets. */
export function categoryLabels(categories: CategoryNode[]): Map<number, string> {
    const labels = new Map<number, string>();
    for (const c of categories) {
        labels.set(c.id, c.name);
        for (const s of c.subcategories) labels.set(s.id, `${c.name} › ${s.name}`);
    }
    return labels;
}

/** Pull the API's `detail` message out of a failed response. */
export async function errorMessage(res: Response, fallback: string): Promise<string> {
    try {
        const data = await res.json();
        if (typeof data?.detail === "string") return data.detail;
        if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
    } catch {
        // Not JSON: fall through to the fallback.
    }
    return fallback;
}

/**
 * Options for a <select> of categories: each top-level category followed by
 * its subcategories. Subcategories carry the full path ("Cameras › Bodies")
 * so a selected one still says where it lives, and match the asset list.
 */
export function categoryOptions(categories: CategoryNode[]): { value: string; label: string }[] {
    const labels = categoryLabels(categories);
    const options: { value: string; label: string }[] = [];
    for (const c of categories) {
        options.push({ value: String(c.id), label: c.name });
        for (const s of c.subcategories) options.push({ value: String(s.id), label: labels.get(s.id) ?? s.name });
    }
    return options;
}
