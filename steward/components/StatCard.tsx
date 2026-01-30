import { LucideIcon } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: LucideIcon;
    variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ label, value, subtext, icon: Icon, variant = "default" }: StatCardProps) {
    const variantStyles = {
        default: "border-gray-200",
        success: "border-green-500 border-l-[4px]",
        warning: "border-yellow-500 border-l-[4px]",
        danger: "border-red-500 border-l-[4px]"
    };

    return (
        <div className={`bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-40 ${variantStyles[variant]}`}>
            <div className="flex justify-between items-start">
                <h3 className="text-gray-500 font-medium text-sm">{label}</h3>
                {Icon && <Icon className="w-5 h-5 text-gray-400" />}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
            </div>
        </div>
    );
}
