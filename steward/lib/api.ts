import { DashboardData } from "@/types/dashboard";

export async function getDashboardSummary(token: string): Promise<DashboardData> {
    // In a real scenario, this would fetch from /api/dashboard/summary
    // const res = await fetch("/api/dashboard/summary?range=30d", { ... });

    // Returning mock data for now as per requirements
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                counts: {
                    totalAssets: 124,
                    checkedOut: 42,
                    overdue: 3,
                    repair: 5,
                    missing: 1,
                },
                healthBreakdown: {
                    good: 108,
                    needsAttention: 10,
                    outOfService: 6,
                },
                overdueTrend: [
                    { date: "Day 1", overdueCount: 1 },
                    { date: "Day 5", overdueCount: 2 },
                    { date: "Day 10", overdueCount: 1 },
                    { date: "Day 15", overdueCount: 4 },
                    { date: "Day 20", overdueCount: 3 },
                    { date: "Day 25", overdueCount: 2 },
                    { date: "Today", overdueCount: 3 },
                ],
                topAssets: [
                    { assetId: "A-101", name: "Canon R5 Kit", checkoutCount: 12 },
                    { assetId: "A-104", name: "Sony A7S III", checkoutCount: 9 },
                    { assetId: "L-202", name: "Aputure 600d", checkoutCount: 8 },
                    { assetId: "M-001", name: "MacBook Pro 16", checkoutCount: 7 },
                    { assetId: "Z-999", name: "Zoom H6", checkoutCount: 5 },
                ],
                valueAtRisk: {
                    overdueValue: 3500,
                    repairValue: 1200,
                    missingValue: 250,
                    totalValue: 4950,
                },
                lists: {
                    overdueAssignments: [
                        { id: "A-101", name: "Canon R5 Kit", status: "Checked Out", assignee: "Alex Chen", dueDate: "2023-10-25", value: 3500 },
                        { id: "M-003", name: "iPad Pro", status: "Checked Out", assignee: "Sarah Jones", dueDate: "2023-10-28", value: 900 },
                        { id: "L-105", name: "Godox SL60W", status: "Checked Out", assignee: "Mike Ross", dueDate: "2023-10-29", value: 150 },
                    ],
                    repairAssets: [
                        { id: "A-104", name: "Sony A7S III", status: "Maintenance", value: 3200 },
                        { id: "Z-999", name: "Zoom H6", status: "Maintenance", value: 350 },
                        { id: "T-001", name: "Manfrotto Tripod", status: "Maintenance", value: 200 },
                    ],
                    missingAssets: [
                        { id: "C-002", name: "HDMI Cable 50ft", status: "Missing", value: 50 },
                    ],
                },
                insights: [
                    "3 items are overdue today.",
                    "$4,950 worth of gear is currently unavailable (missing/repair/overdue).",
                    "The most checked-out asset this month is Canon R5 Kit (12 checkouts).",
                ],
            });
        }, 500);
    });
}
