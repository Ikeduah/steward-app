import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Box, Users, ClipboardList, AlertTriangle, History, Menu, LogOut, X } from "lucide-react";
import { UserButton, useUser, SignedIn, useClerk, Protect } from "@clerk/nextjs";
import { useState } from "react";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
    { label: "Assets", href: "/assets", icon: Box, role: "org:admin" },
    { label: "Assignments", href: "/assignments", icon: ClipboardList },
    { label: "Incidents", href: "/incidents", icon: AlertTriangle, role: "org:admin" },
    { label: "Activity", href: "/activity", icon: History, role: "org:admin" },
    { label: "Team", href: "/organization", icon: Users, role: "org:admin" },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [isOpen, setIsOpen] = useState(false);

    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* Mobile Toggle & Header Overlay Trigger */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
                    onClick={closeSidebar}
                />
            )}

            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-white rounded-xl shadow-lg border border-gray-100"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>

            {/* Sidebar Container */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-2xl border-r-0 transform transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo Area */}
                    <div className="h-20 flex items-center px-6 border-b border-[var(--sidebar-border)]">
                        <Link href="/dashboard" className="flex items-center gap-3">
                            <Image src="/logo.png" alt="Steward Logo" width={40} height={40} className="rounded-xl" />
                            <span className="text-xl font-bold tracking-tight text-black">Steward</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {NAV_ITEMS.map((item: any) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            const content = (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={closeSidebar}
                                    className={`
                     flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                     ${isActive
                                            ? "bg-green-50 text-green-700 shadow-sm"
                                            : "text-black hover:bg-gray-50"}
                   `}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? "text-green-600 dark:text-green-400" : "text-gray-500"} transition-colors`} />
                                    {item.label}
                                </Link>
                            );

                            if (item.role) {
                                return (
                                    <Protect key={item.href} role={item.role}>
                                        {content}
                                    </Protect>
                                );
                            }

                            return content;
                        })}

                        <div className="pt-4 mt-auto">
                            <button
                                onClick={() => signOut(() => router.push("/"))}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </div>
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t border-[var(--sidebar-border)]">
                        <SignedIn>
                            <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <UserButton afterSignOutUrl="/" />
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-sm font-medium truncate">{user?.fullName || user?.username}</span>
                                    <Protect role="org:admin" fallback={<span className="text-xs text-gray-500 truncate">Member</span>}>
                                        <span className="text-xs text-gray-500 truncate">Admin</span>
                                    </Protect>
                                </div>
                            </div>
                        </SignedIn>
                    </div>
                </div>
            </aside>
        </>
    );
}
