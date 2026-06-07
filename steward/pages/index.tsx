import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { ChevronRight, Shield, Zap, Layout as LayoutIcon, Cpu } from "lucide-react";
import { StewardMark } from "../components/StewardMark";

interface BrandFilm {
  id: string;
  num: string;
  tag: string;
  title: string;
  desc: string;
  dur: string;
  src: string;
  glows: { style: React.CSSProperties }[];
  scene: React.ReactNode;
}

const BRAND_FILMS: BrandFilm[] = [
  {
    id: "bf1",
    num: "01",
    tag: "Hero overview",
    title: "This Is Steward.",
    desc: "The brand opener. Logo reveal, then a sweep across inventory, custody, and live accountability. Use it on the landing page hero and the top of sales decks.",
    dur: "25s",
    src: "/promos/01-this-is-steward.html",
    glows: [
      { style: { top: "-20%", right: "-15%", background: "rgba(52,211,153,.32)" } },
      { style: { bottom: "-30%", left: "-15%", background: "rgba(5,150,105,.22)" } },
    ],
    scene: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="bf-tile-lg">
            <StewardMark className="bf-mark-lg" />
          </div>
          <span className="bf-wordmark">Steward</span>
        </div>
        <div className="bf-sub-mono">Precision Inventory Management</div>
      </div>
    ),
  },
  {
    id: "bf2",
    num: "02",
    tag: "Field workflow",
    title: "Scan. Track. Trust.",
    desc: "The product gesture, in three words. QR reticle locks on a tag, checkout panel fills itself, audit trail confirms it. Best as a product page explainer.",
    dur: "22s",
    src: "/promos/02-scan-track-trust.html",
    glows: [
      { style: { top: "-25%", left: "-15%", background: "rgba(52,211,153,.28)" } },
      { style: { bottom: "-25%", right: "-15%", background: "rgba(5,150,105,.22)" } },
    ],
    scene: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
          <span className="bf-big">Scan.</span>
          <span className="bf-big" style={{ color: "var(--g400)" }}>Track.</span>
          <span className="bf-big">Trust.</span>
        </div>
        <div className="bf-sub">Three gestures. One source of truth.</div>
      </div>
    ),
  },
  {
    id: "bf3",
    num: "03",
    tag: "Pain → relief",
    title: "Where's that camera?",
    desc: "The narrative pivot. Frantic group-text chaos collapses into one search and a clean chain of custody. 30 minutes → 8 seconds. Great for retargeting and social.",
    dur: "25s",
    src: "/promos/03-wheres-that-camera.html",
    glows: [
      { style: { top: "-25%", right: "-20%", background: "rgba(245,158,11,.18)" } },
      { style: { bottom: "-25%", left: "-15%", background: "rgba(52,211,153,.22)" } },
    ],
    scene: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div className="bf-eyebrow-mini">14:22 · Shoot starts in 38 min</div>
        <div className="bf-big" style={{ fontSize: 44, textAlign: "center", lineHeight: 1 }}>
          Where&apos;s the<br />
          <em style={{ fontStyle: "normal", color: "var(--g400)" }}>Sony FX3?</em>
        </div>
        <div className="bf-sub">The most expensive 30 minutes in production.</div>
      </div>
    ),
  },
  {
    id: "bf4",
    num: "04",
    tag: "ROI · Savings",
    title: "The cost of not knowing.",
    desc: "The money story. Four silent leaks add up to ~$48k/yr; Steward recovers ~$38k of it. Counters and bar charts do the talking. For procurement and finance conversations.",
    dur: "28s",
    src: "/promos/04-cost-of-not-knowing.html",
    glows: [
      { style: { top: "-25%", left: "-15%", background: "rgba(245,158,11,.2)" } },
      { style: { bottom: "-25%", right: "-15%", background: "rgba(52,211,153,.26)" } },
    ],
    scene: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div className="bf-eyebrow-mini" style={{ color: "var(--amber)" }}>The cost of not knowing</div>
        <div className="bf-big" style={{ fontSize: 72, color: "var(--g400)", fontVariantNumeric: "tabular-nums" }}>
          $38,256<span style={{ fontSize: 26, color: "var(--n300)", fontWeight: 500 }}>/yr</span>
        </div>
        <div className="bf-sub">Stop the leaks. Recover your gear.</div>
      </div>
    ),
  },
];

export default function Home() {
  const [hoveredFilm, setHoveredFilm] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  useEffect(() => {
    document.body.style.overflow = activeVideo ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [activeVideo]);

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
        :root {
          --g400: #34D399; --g500: #10B981; --g600: #059669; --g700: #047857;
          --g300: #6EE7B7; --g50: #ECFDF5;
          --amber: #F59E0B; --blue: #3B82F6;
          --ink: #06140E; --ink-2: #0C1E16;
          --n300: #B9C2BD; --n400: #8A958F; --n500: #5B6862;
          --display: "Space Grotesk", sans-serif;
          --mono: "JetBrains Mono", monospace;
        }
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
        .animate-liquid { animation: liquid 15s infinite ease-in-out; }
        .animate-liquid-slow { animation: liquid-slow 20s infinite ease-in-out; }
        .animate-liquid-reverse { animation: liquid 18s infinite ease-in-out reverse; }
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

        /* BRAND FILMS SECTION */
        .bf-section { position: relative; padding: 96px 60px 80px; overflow: hidden; }
        .bf-section::before { content: ""; position: absolute; inset: 0; border-top: 1px solid rgba(255,255,255,.06); pointer-events: none; }
        .bf-wrap { max-width: 1280px; margin: 0 auto; position: relative; z-index: 1; }
        .bf-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 48px; gap: 20px; flex-wrap: wrap; }
        .bf-eyebrow { font-family: var(--mono); font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--g400); display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .bf-eyebrow::before { content: ""; width: 32px; height: 1.5px; background: var(--g400); display: inline-block; }
        .bf-head h2 { font-family: var(--display); font-weight: 600; font-size: clamp(32px, 4vw, 52px); letter-spacing: -.03em; color: #fff; }
        .bf-head-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
        .bf-note { font-family: var(--mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--n400); }
        .bf-demos-link { font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--g400); text-decoration: none; display: flex; align-items: center; gap: 7px; transition: gap .2s; }
        .bf-demos-link:hover { gap: 11px; }
        .bf-demos-link svg { width: 12px; height: 12px; }

        .bf-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }

        .bf-card { position: relative; background: var(--ink-2); border: 1px solid rgba(255,255,255,.08); border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: .25s; }
        .bf-card:hover { border-color: var(--g400); transform: translateY(-4px); box-shadow: 0 30px 80px -40px rgba(16,185,129,.5); }

        .bf-preview { aspect-ratio: 16/9; background: var(--ink); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .bf-glow { position: absolute; width: 80%; height: 80%; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .bf-dot-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px);
          background-size: 48px 48px;
          -webkit-mask-image: radial-gradient(circle at 50% 50%, #000, transparent 70%);
          mask-image: radial-gradient(circle at 50% 50%, #000, transparent 70%);
        }
        .bf-scene { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 20px; width: 100%; pointer-events: none; }
        .bf-tile-lg { width: 54px; height: 54px; border-radius: 14px; background: linear-gradient(150deg, var(--g400), var(--g600)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bf-mark-lg { width: 32px; height: 32px; color: #fff; }
        .bf-wordmark { font-family: var(--display); font-weight: 600; font-size: 54px; letter-spacing: -.045em; color: #fff; line-height: .9; }
        .bf-big { font-family: var(--display); font-weight: 600; font-size: 52px; letter-spacing: -.04em; color: #fff; line-height: .95; }
        .bf-sub { font-family: var(--display); font-weight: 400; font-size: 14px; color: var(--n300); max-width: 300px; line-height: 1.35; }
        .bf-sub-mono { font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--g300); }
        .bf-eyebrow-mini { font-family: var(--mono); font-size: 10px; letter-spacing: .22em; text-transform: uppercase; color: var(--g400); display: flex; align-items: center; gap: 9px; }
        .bf-eyebrow-mini::before { content: ""; width: 20px; height: 1px; background: var(--g400); }

        .bf-iframe-wrap { position: absolute; inset: 0; z-index: 2; transition: opacity .3s ease; pointer-events: none; }
        .bf-iframe-wrap.visible { opacity: 1; pointer-events: auto; }
        .bf-iframe-wrap.hidden { opacity: 0; }
        .bf-iframe-wrap iframe { width: 100%; height: 100%; border: none; display: block; }

        .bf-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, transparent 60%, rgba(6,20,14,.6)); z-index: 3; transition: .2s; }
        .bf-card:hover .bf-play { background: linear-gradient(180deg, rgba(6,20,14,.35) 0%, rgba(6,20,14,.65)); }
        .bf-play-btn { width: 70px; height: 70px; border-radius: 50%; background: rgba(16,185,129,.9); display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 56px -10px rgba(16,185,129,.6), 0 0 0 6px rgba(16,185,129,.15); transition: .2s; }
        .bf-card:hover .bf-play-btn { transform: scale(1.08); background: var(--g400); }
        .bf-play-btn svg { width: 28px; height: 28px; color: #fff; margin-left: 3px; }
        .bf-dur { position: absolute; bottom: 12px; right: 12px; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; background: rgba(0,0,0,.6); color: #fff; padding: 4px 9px; border-radius: 6px; backdrop-filter: blur(8px); z-index: 4; }

        .bf-body { padding: 26px 28px 28px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .bf-row { display: flex; align-items: center; gap: 12px; }
        .bf-num { font-family: var(--mono); font-size: 12px; color: var(--g400); letter-spacing: .18em; font-weight: 500; }
        .bf-tag { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; padding: 3px 9px; border-radius: 6px; background: rgba(255,255,255,.05); color: var(--n300); border: 1px solid rgba(255,255,255,.08); margin-left: auto; }
        .bf-card h3 { font-family: var(--display); font-weight: 600; font-size: 26px; letter-spacing: -.025em; line-height: 1.05; color: #fff; }
        .bf-card p { font-size: 14px; color: var(--n300); line-height: 1.55; }
        .bf-cta { margin-top: auto; display: flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 10px; color: var(--g400); letter-spacing: .16em; text-transform: uppercase; padding-top: 6px; }
        .bf-cta svg { width: 12px; height: 12px; transition: .2s; }
        .bf-card:hover .bf-cta svg { transform: translateX(3px); }

        /* LIGHTBOX */
        .bf-lightbox { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.55); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; animation: lbIn .2s ease; }
        @keyframes lbIn { from { opacity: 0; } to { opacity: 1; } }
        .bf-lb-inner { position: relative; width: 90vw; max-width: 1280px; }
        .bf-lb-inner iframe { width: 100%; aspect-ratio: 16/9; border: none; border-radius: 12px; display: block; }
        .bf-lb-close { position: absolute; top: -44px; right: 0; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: .2s; }
        .bf-lb-close:hover { background: rgba(255,255,255,.22); }
        .bf-lb-close svg { width: 16px; height: 16px; }

        @media (max-width: 900px) {
          .bf-section { padding: 60px 28px 60px; }
          .bf-grid { grid-template-columns: 1fr; }
          .bf-head-right { align-items: flex-start; }
          .bf-big { font-size: 38px; }
          .bf-wordmark { font-size: 40px; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="relative z-10 glass-nav flex justify-between items-center py-5 px-6 md:px-12 max-w-full mx-auto w-full sticky top-0">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 group-hover:opacity-80 transition-opacity rounded-xl"></div>
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(150deg, #34D399, #059669)" }}>
              <StewardMark className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-semibold tracking-tight text-white group-hover:text-emerald-400 transition-colors" style={{ fontFamily: "var(--font-space-grotesk)" }}>Steward</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <Link href="/platform" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Platform</Link>
          <Link href="/pricing" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Pricing</Link>
          <Link href="/#brand-films" className="text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors">Brand Films</Link>
          <Link href="/promos/demos" className="text-sm font-bold text-slate-400 hover:text-emerald-400 transition-colors">Demos</Link>
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
          Steward is a premium inventory system designed for <span className="text-white font-bold">organizations and modern enterprises</span>.
          Track assignments, monitor equipment health, and maintain total accountability in a workspace that feels <span className="text-emerald-400">alive</span>.
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
      </main>

      {/* BRAND FILMS SECTION */}
      <section id="brand-films" className="bf-section relative z-10">
        <div className="bf-wrap">
          <div className="bf-head">
            <div>
              <div className="bf-eyebrow">See Steward in Action</div>
              <h2>Four ways to tell the story.</h2>
            </div>
            <div className="bf-head-right">
              <span className="bf-note">Story · emotion · hooks</span>
              <Link href="/promos/demos" className="bf-demos-link">
                Watch all demos
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12 H19 M13 6 L19 12 L13 18" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="bf-grid">
            {BRAND_FILMS.map((film) => (
              <div
                key={film.id}
                className="bf-card"
                onMouseEnter={() => {
                  setHoveredFilm(film.id);
                  iframeRefs.current[film.id]?.contentWindow?.postMessage({ type: 'steward:reset' }, '*');
                }}
                onMouseLeave={() => setHoveredFilm(null)}
                onClick={() => setActiveVideo(film.src)}
              >
                <div className="bf-preview">
                  {/* Static background glows + dot grid */}
                  {film.glows.map((g, i) => (
                    <div key={i} className="bf-glow" style={g.style} />
                  ))}
                  <div className="bf-dot-grid" />

                  {/* Static scene content */}
                  <div className="bf-scene">{film.scene}</div>

                  {/* Hover iframe preview */}
                  <div className={`bf-iframe-wrap ${hoveredFilm === film.id ? "visible" : "hidden"}`}>
                    <iframe
                      ref={(el) => { iframeRefs.current[film.id] = el; }}
                      src={`${film.src}?preview=1`}
                      title={film.title}
                      tabIndex={-1}
                    />
                  </div>

                  {/* Play button overlay — hidden while iframe preview is active */}
                  {hoveredFilm !== film.id && (
                    <div className="bf-play">
                      <div className="bf-play-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4 L20 12 L6 20 Z" /></svg>
                      </div>
                    </div>
                  )}
                  <div className="bf-dur">{film.dur}</div>
                </div>

                <div className="bf-body">
                  <div className="bf-row">
                    <span className="bf-num">{film.num}</span>
                    <span className="bf-tag">{film.tag}</span>
                  </div>
                  <h3>{film.title}</h3>
                  <p>{film.desc}</p>
                  <div className="bf-cta">
                    Watch
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12 H19 M13 6 L19 12 L13 18" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="relative z-10 px-6 pb-24 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-60">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(150deg, #34D399, #059669)" }}>
              <StewardMark className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-slate-500" style={{ fontFamily: "var(--font-space-grotesk)" }}>Steward</span>
          </div>
          <div className="flex gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Link href="/platform" className="hover:text-emerald-400 transition-colors">Platform</Link>
            <Link href="/pricing" className="hover:text-emerald-400 transition-colors">Pricing</Link>
            <Link href="/#brand-films" className="hover:text-emerald-400 transition-colors">Brand Films</Link>
            <Link href="/promos/demos" className="hover:text-emerald-400 transition-colors">Demos</Link>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms</Link>
          </div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            © {new Date().getFullYear()} Steward. Precision Inventory.
          </p>
        </div>
      </footer>

      {/* LIGHTBOX */}
      {activeVideo && (
        <div
          className="bf-lightbox"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveVideo(null); }}
        >
          <div className="bf-lb-inner">
            <button className="bf-lb-close" onClick={() => setActiveVideo(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 L6 18 M6 6 L18 18" />
              </svg>
            </button>
            <iframe src={activeVideo} title="Brand Film" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  );
}
