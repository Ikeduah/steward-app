import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { StewardMark } from "./StewardMark";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/router";

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    const { isLoaded, organization } = useOrganization();
    const { userId, orgId } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && userId && !organization && !orgId) {
            void router.push("/select-org");
        }
    }, [isLoaded, userId, organization, orgId, router]);

    if (!isLoaded) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    // Don't render layout if redirecting (optional optimization)
    if (userId && !organization && !orgId) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gray-50 text-[var(--foreground)] font-sans">
            <Sidebar />
            <main className="flex-1 md:ml-64 overflow-y-auto h-full">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(150deg, #34D399, #059669)" }}>
                            <StewardMark className="w-[18px] h-[18px] text-white" />
                        </div>
                        <span className="font-semibold tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)", color: "var(--ink)" }}>Steward</span>
                    </div>
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
