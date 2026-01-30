import Link from "next/link";
import { ChevronRight, Shield, Zap, Layout as LayoutIcon, Cpu, Globe, Users, ArrowLeft } from "lucide-react";

export default function Platform() {
    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[-5%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] bg-green-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center py-6 px-6 md:px-12 max-w-7xl mx-auto w-full backdrop-blur-md bg-black/20 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3 group">
                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Back to Home</span>
                </Link>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Steward Logo" className="w-7 h-7 rounded-lg object-contain p-0.5 border border-white/10" />
                    <span className="text-lg font-bold tracking-tight text-white">Steward</span>
                </div>
            </nav>

            <main className="relative z-10 flex-1 px-6 max-w-5xl mx-auto py-20">
                <div className="mb-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
                        The Platform for <br />
                        <span className="text-emerald-400">Inventory Excellence.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Steward isn't just a database. It's a living ecosystem designed to handle the unique
                        rigidity and flexibility required by modern church and media organizations.
                    </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Shield className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Enterprise RBAC</h3>
                        <p className="text-slate-400 leading-relaxed font-medium">
                            Segment your organization with precision. Admins maintain total control over inventory and
                            members, while team members get a focus-optimized view of their own assignments and history.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Zap className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Incident Automation</h3>
                        <p className="text-slate-400 leading-relaxed font-medium">
                            Don't manually track maintenance. High-severity incident reports automatically shift
                            assets into Maintenance status, blocking new checkouts until the issue is resolved.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <Globe className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Live Traceability</h3>
                        <p className="text-slate-400 leading-relaxed font-medium">
                            Every action is logged in an immutable activity feed. Know exactly who had what gear,
                            when it was returned, and any issues that occurred during the assignment.
                        </p>
                    </div>

                    <div className="p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <LayoutIcon className="w-7 h-7 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-4">Adaptive Workspace</h3>
                        <p className="text-slate-400 leading-relaxed font-medium">
                            A high-end interface that adapts to the mission. Whether you're on a 5K monitor or
                            scanning gear in a dark equipment room with your phone, Steward feels like a native app.
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-32 p-12 rounded-[3rem] bg-gradient-to-br from-emerald-600 to-green-700 text-center shadow-2xl shadow-emerald-900/40">
                    <h2 className="text-3xl md:text-5xl font-black mb-6">Ready to regain control?</h2>
                    <Link href="/" className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold py-4 px-10 rounded-2xl text-lg hover:bg-emerald-50 transition-colors shadow-xl">
                        Register your Team
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </main>

            <footer className="relative z-10 py-12 px-6 border-t border-white/5 mt-20 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                    © {new Date().getFullYear()} Steward Inventory Platform.
                </p>
            </footer>
        </div>
    );
}
