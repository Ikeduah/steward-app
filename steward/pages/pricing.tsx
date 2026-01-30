import Link from "next/link";
import { ChevronRight, Check, X, Zap, Shield, Globe, ArrowLeft } from "lucide-react";

export default function Pricing() {
    const plans = [
        {
            name: "Starter",
            id: "cplan_38aqHgyzV4VLU75NSZM0rYO3yo5",
            price: "$10.99",
            period: "/month",
            description: "Perfect for starting your stewardship journey.",
            features: [
                "Up to 100 Assets",
                "Up to 25 People",
                "Check-in / Check-out",
                "Due Date Tracking",
                "QR / Tag Lookup",
                "Last 30 days history"
            ],
            notIncluded: [
                "Photo Uploads",
                "Unlimited History",
                "Advanced Reporting",
                "Priority Support"
            ],
            cta: "Get Started",
            highlight: false
        },
        {
            name: "Pro",
            id: "cplan_38aqeaPaWPeptXtTSkM7espqMZ6",
            price: "$34.99",
            period: "/month",
            description: "Unlimited power for modern enterprises.",
            features: [
                "Unlimited Assets",
                "Unlimited People",
                "Photo Uploads",
                "Incident Resolution Tracking",
                "Unlimited History",
                "Advanced Dashboard Trends",
                "Event Tags on Assignments",
                "Priority Email Support"
            ],
            notIncluded: [],
            cta: "Go Pro",
            highlight: true
        }
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center py-6 px-6 md:px-12 max-w-7xl mx-auto w-full backdrop-blur-md bg-black/20 border-b border-white/5">
                <Link href="/" className="flex items-center gap-3 group">
                    <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">Back</span>
                </Link>
                <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Steward Logo" className="w-7 h-7 rounded-lg object-contain p-0.5 border border-white/10" />
                    <span className="text-lg font-bold tracking-tight text-white">Steward</span>
                </div>
            </nav>

            <main className="relative z-10 flex-1 px-6 max-w-7xl mx-auto py-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
                        Simple, <span className="text-emerald-400">Honest Pricing.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Choose the plan that fits your organization's mission. No hidden fees,
                        just precision inventory management.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className={`p-10 rounded-[2.5rem] relative flex flex-col ${plan.highlight
                                ? 'bg-gradient-to-br from-emerald-600/20 to-green-700/10 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-900/40'
                                : 'bg-white/[0.02] border border-white/10 backdrop-blur-sm'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg shadow-emerald-500/50">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-black text-white">{plan.price}</span>
                                    {plan.period && <span className="text-slate-400 font-bold">{plan.period}</span>}
                                </div>
                                <p className="text-slate-400 text-sm font-medium">{plan.description}</p>
                            </div>

                            <div className="flex-1 mb-10 space-y-4">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-200">{feature}</span>
                                    </div>
                                ))}
                                {plan.notIncluded.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 opacity-30">
                                        <div className="w-5 h-5 rounded-full bg-slate-500/20 flex items-center justify-center">
                                            <X className="w-3 h-3 text-slate-400" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-400">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <SignInButton mode="modal">
                                <button className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] ${plan.highlight
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/30'
                                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                                    }`}>
                                    {plan.cta}
                                </button>
                            </SignInButton>
                        </div>
                    ))}
                </div>

                {/* Feature Comparison Table (Mobile & Desktop) */}
                <div className="mt-32 max-w-4xl mx-auto overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.01]">
                    <div className="p-8 border-b border-white/5 bg-black/20">
                        <h2 className="text-2xl font-black text-white">Full Comparison</h2>
                    </div>
                    <div className="p-0 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-slate-500">Feature</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-emerald-400">Starter</th>
                                    <th className="p-6 text-sm font-black uppercase tracking-widest text-emerald-400">Pro</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {[
                                    ["Asset Limit", "100", "Unlimited"],
                                    ["People Limit", "25", "Unlimited"],
                                    ["History", "30 Days", "Unlimited"],
                                    ["Photo Uploads", "❌", "✅"],
                                    ["Incident Resolution", "❌", "✅"],
                                    ["Advanced Dashboard", "❌", "✅"],
                                    ["Event Tags", "❌", "✅"],
                                    ["Support", "Standard", "Priority"]
                                ].map(([feature, starter, pro]) => (
                                    <tr key={feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="p-6 text-sm font-bold">{feature}</td>
                                        <td className="p-6 text-sm font-medium">{starter}</td>
                                        <td className="p-6 text-sm font-medium">{pro}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 py-16 px-6 border-t border-white/5 mt-20 text-center bg-black/20">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    © {new Date().getFullYear()} Steward Inventory. Secure. Scalable. Precise.
                </p>
            </footer>
        </div>
    );
}

import { SignInButton } from "@clerk/nextjs";
