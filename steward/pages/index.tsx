import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ChevronRight, Shield, Zap, Layout as LayoutIcon, Cpu, Globe, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Animated Liquid Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/20 rounded-full blur-[120px] animate-liquid"></div>
        <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/20 rounded-full blur-[100px] animate-liquid-slow"></div>
        <div className="absolute bottom-[-15%] left-[10%] w-[55%] h-[55%] bg-green-600/15 rounded-full blur-[130px] animate-liquid-reverse"></div>
        <div className="absolute top-[40%] left-[30%] w-[25%] h-[25%] bg-emerald-400/10 rounded-full blur-[80px] animate-pulse opacity-50"></div>
      </div>

      <style jsx global>{`
        @keyframes liquid {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(50px, -50px) scale(1.1) rotate(5deg); }
          66% { transform: translate(-30px, 30px) scale(0.9) rotate(-5deg); }
          100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        @keyframes liquid-slow {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 60px) scale(1.2); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-liquid {
          animation: liquid 15s infinite ease-in-out;
        }
        .animate-liquid-slow {
          animation: liquid-slow 20s infinite ease-in-out;
        }
        .animate-liquid-reverse {
          animation: liquid 18s infinite ease-in-out reverse;
        }
        .glass-nav {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(16, 185, 129, 0.3);
          transform: translateY(-4px);
        }
      `}</style>

      {/* Navigation */}
      <nav className="relative z-10 glass-nav flex justify-between items-center py-5 px-6 md:px-12 max-w-full mx-auto w-full sticky top-0">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 group-hover:opacity-80 transition-opacity"></div>
            <img src="/logo.png" alt="Steward Logo" className="relative w-9 h-9 rounded-xl object-contain p-0.5 border border-white/10" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">Steward</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link href="/platform" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Platform</Link>
          <Link href="/pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/privacy" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Privacy</Link>
        </div>

        <div className="flex items-center gap-6">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 px-6 rounded-full transition-all shadow-lg shadow-emerald-900/40 active:scale-95">
                Sign up for free
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-4">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "border border-white/20 w-9 h-9"
                  }
                }}
              />
              <Link href="/dashboard" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-2.5 px-6 rounded-full transition-all shadow-lg shadow-emerald-900/40 active:scale-95 flex items-center gap-2">
                Launch App
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-6xl mx-auto py-24 md:py-32">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-10">
          <Zap className="w-3.5 h-3.5 fill-emerald-400" />
          Precision Inventory Management
        </div>

        <h1 className="text-6xl md:text-[7rem] font-black tracking-tighter text-white mb-10 leading-[0.85]">
          Manage Gear <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)]">
            Like a Pro.
          </span>
        </h1>

        <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mb-14 leading-relaxed font-medium">
          Steward is a premium inventory and accountability system for <span className="text-white font-bold">teams that share equipment</span>.
          Track assignments, monitor equipment health, and maintain total accountability in a workspace that feels alive whether you’re managing gear for <span className="text-emerald-400">academia, organizations, or modern enterprises</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4.5 px-12 rounded-2xl text-xl transition-all transform hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group">
                Sign up for free
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4.5 px-12 rounded-2xl text-xl transition-all transform hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 group">
                Go to Dashboard
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </Link>
          </SignedIn>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full">
          <div className="p-8 rounded-[2.5rem] glass-card text-left">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
              <LayoutIcon className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-xl text-white mb-3 tracking-tight">Native Workspace</h3>
            <p className="text-slate-400 font-medium leading-relaxed">A responsive, premium interface that feels like a high-end application on every screen.</p>
          </div>
          <div className="p-8 rounded-[2.5rem] glass-card text-left">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-xl text-white mb-3 tracking-tight">Total Accountability</h3>
            <p className="text-slate-400 font-medium leading-relaxed">Trace every checkout, return, and incident back to your specific team members instantly.</p>
          </div>
          <div className="p-8 rounded-[2.5rem] glass-card text-left">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Cpu className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-xl text-white mb-3 tracking-tight">Real-time Pulse</h3>
            <p className="text-slate-400 font-medium leading-relaxed">Instant tracking of equipment health, locations, and maintenance needs as they happen.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-80">
            <img src="/logo.png" alt="Steward Logo" className="w-6 h-6 grayscale opacity-50" />
            <span className="text-sm font-bold tracking-widest uppercase text-slate-500">Steward</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Link href="/platform" className="hover:text-emerald-400 transition-colors">Platform</Link>
            <Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
          </div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Steward. Precision Inventory.
          </p>
        </div>
      </footer>
    </div>
  );
}
