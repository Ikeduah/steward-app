import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
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

            <main className="relative z-10 flex-1 px-6 max-w-3xl mx-auto py-20">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-10">Terms of Service</h1>

                <div className="prose prose-invert max-w-none space-y-8 text-slate-400 font-medium leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using the Steward platform, you agree to be bound by these Terms of Service
                            and all applicable laws and regulations.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. Use License</h2>
                        <p>
                            Steward grants you a personal, non-exclusive, non-transferable license to use the service
                            for internal inventory management purposes within your organization.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. User Responsibilities</h2>
                        <p>
                            As a user of Steward, you are responsible for:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Maintaining the confidentiality of your account credentials.</li>
                            <li>Ensuring the accuracy of data entered into the system.</li>
                            <li>Using the equipment tracking features in compliance with your organization's policies.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. System Integrity</h2>
                        <p>
                            You agree not to attempt to circumvent any security features or role-based access controls
                            of the platform. Unauthorized access to administrative features is strictly prohibited.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Limitation of Liability</h2>
                        <p>
                            Steward is provided "as is" without warranty of any kind. We are not liable for any
                            indirect, incidental, or consequential damages arising from your use of the service.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="relative z-10 py-12 px-6 border-t border-white/5 mt-20 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                    © 2026 Steward. All Rights Reserved.
                </p>
            </footer>
        </div>
    );
}
