export interface DashboardCounts {
    totalAssets: number;
    checkedOut: number;
    overdue: number;
    repair: number;
    missing: number;
}

export interface HealthBreakdown {
    good: number;
    needsAttention: number;
    outOfService: number;
}

export interface OverdueTrend {
    date: string;
    overdueCount: number;
}

export interface TopAsset {
    assetId: string;
    name: string;
    checkoutCount: number;
}

export interface ValueAtRisk {
    overdueValue: number;
    repairValue: number;
    missingValue: number;
    totalValue: number;
}

// Minimal types for lists to avoid circular deps or complex mocks for now
export interface DashboardAsset {
    id: string;
    name: string;
    status: string;
    assignee?: string;
    dueDate?: string;
    value?: number;
}

export interface DashboardData {
    counts: DashboardCounts;
    healthBreakdown: HealthBreakdown;
    overdueTrend: OverdueTrend[];
    topAssets: TopAsset[];
    valueAtRisk: ValueAtRisk;
    lists: {
        overdueAssignments: DashboardAsset[];
        repairAssets: DashboardAsset[];
        missingAssets: DashboardAsset[];
    };
    insights: string[];
}
