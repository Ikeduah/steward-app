import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: LucideIcon;
    variant?: "default" | "success" | "warning" | "danger";
}

const variantConfig = {
    default: {
        card: "border-gray-200",
        icon: "text-gray-400",
        value: "#111827",
    },
    success: {
        card: "border-[#10B981] border-l-[4px]",
        icon: "text-[#10B981]",
        value: "var(--g700)",
    },
    warning: {
        card: "border-[#F59E0B] border-l-[4px]",
        icon: "text-[#F59E0B]",
        value: "#92400E",
    },
    danger: {
        card: "border-[#EF4444] border-l-[4px]",
        icon: "text-[#EF4444]",
        value: "var(--color-missing)",
    },
};

export function StatCard({ label, value, subtext, icon: Icon, variant = "default" }: StatCardProps) {
    const cfg = variantConfig[variant];

    return (
        <div className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-40 ${cfg.card}`}>
            <div className="flex justify-between items-start">
                <h3 className="text-gray-500 font-medium text-sm">{label}</h3>
                {Icon && <Icon className={`w-5 h-5 ${cfg.icon}`} />}
            </div>
            <div>
                <p className="text-3xl font-bold mt-2" style={{ fontFamily: "var(--font-space-grotesk)", color: cfg.value }}>{value}</p>
                {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
