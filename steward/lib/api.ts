import { DashboardData } from "@/types/dashboard";

export async function getDashboardSummary(token: string): Promise<DashboardData> {
    const res = await fetch("/api/dashboard/summary?range=30d", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch dashboard data: ${res.status} ${res.statusText}`);
    }

    return res.json();
}
