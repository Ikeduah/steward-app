import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
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
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-10">Privacy Policy</h1>

                <div className="prose prose-invert max-w-none space-y-8 text-slate-400 font-medium leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
                        <p>
                            Steward collects information necessary to manage your organization's inventory. This includes
                            your name and email (provided via Clerk), and any equipment data you manually enter into the system.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">2. How We Use Data</h2>
                        <p>
                            Data is used strictly for the operation of the Steward platform:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li>Facilitating check-outs and check-ins.</li>
                            <li>Generating accountability logs for equipment assignments.</li>
                            <li>Providing role-based access to organization assets.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">3. Data Security</h2>
                        <p>
                            We prioritize the security of your data. We use industry-standard encryption and
                            rely on trusted infrastructure providers:
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Authentication:</strong> Managed securely by Clerk.</li>
                            <li><strong>Database:</strong> Hosted on Neon's secure PostgreSQL platform.</li>
                            <li><strong>Hosting:</strong> Secured by Vercel's global infrastructure.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">4. Third-Party Services</h2>
                        <p>
                            We do not sell your data. We only share information with the sub-processors necessary
                            to provide the service (Vercel, Clerk, and Neon).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-4">5. Your Rights</h2>
                        <p>
                            You have the right to access, correct, or delete your data at any time via your
                            Organization's administrator or by contacting Steward support.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="relative z-10 py-12 px-6 border-t border-white/5 mt-20 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Last Updated: January 2026
                </p>
            </footer>
        </div>
    );
}
