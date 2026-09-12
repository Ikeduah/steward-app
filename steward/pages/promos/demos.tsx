import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { StewardMark } from "../../components/StewardMark";

interface Demo {
  id: string;
  num: string;
  tag: string;
  title: string;
  desc: string;
  dur: string;
  src: string;
  preview: React.ReactNode;
}

const DEMOS: Demo[] = [
  {
    id: "d1",
    num: "D1",
    tag: "Dashboard",
    title: "Dashboard Tour",
    desc: "Sidebar reveals, KPIs count up, recent activity streams in. A 15-second answer to ‘what does Steward show me?’",
    dur: "27s",
    src: "/promos/demo-01-dashboard-tour.html",
    preview: (
      <div className="mini-app">
        <div className="mini-sb">
          <div className="mb"><div className="mbt" /><span className="mbw">Steward</span></div>
          <div className="ni act"><div className="nd" />Dashboard</div>
          <div className="ni"><div className="nd" />Assets</div>
          <div className="ni"><div className="nd" />Assignments</div>
          <div className="ni"><div className="nd" />Incidents</div>
          <div className="ni"><div className="nd" />Activity</div>
          <div className="ni"><div className="nd" />Team</div>
        </div>
        <div className="mini-main">
          <div className="mini-h"><h4>Dashboard</h4></div>
          <div className="mini-kpi">
            <div className="k pri"><div className="l">Available</div><div className="v">10</div></div>
            <div className="k"><div className="l">Checked Out</div><div className="v">1</div></div>
            <div className="k amb"><div className="l">Needs Attention</div><div className="v">1</div></div>
          </div>
          <div className="mini-row"><div className="d" /><div className="t">DJI Inspire 3 Drone Package</div></div>
          <div className="mini-row"><div className="d" /><div className="t">ARRI Alexa Mini LF · Body</div></div>
          <div className="mini-row"><div className="d b" /><div className="t">MacBook Pro M3 Max 64GB</div></div>
        </div>
      </div>
    ),
  },
  {
    id: "d2",
    num: "D2",
    tag: "Onboarding",
    title: "Add an Asset",
    desc: "Click + Add Asset, fill three fields, generate a QR. New row slides into the list, audit trail updates.",
    dur: "27s",
    src: "/promos/demo-02-add-an-asset.html",
    preview: (
      <div className="mini-app">
        <div className="mini-sb">
          <div className="mb"><div className="mbt" /><span className="mbw">Steward</span></div>
          <div className="ni"><div className="nd" />Dashboard</div>
          <div className="ni act"><div className="nd" />Assets</div>
          <div className="ni"><div className="nd" />Assignments</div>
          <div className="ni"><div className="nd" />Incidents</div>
          <div className="ni"><div className="nd" />Activity</div>
          <div className="ni"><div className="nd" />Team</div>
        </div>
        <div className="mini-main">
          <div className="mini-h"><h4>Assets</h4><div className="mbtn">+ Add Asset</div></div>
          <div className="mini-row" style={{ background: "rgba(16,185,129,.08)" }}><div className="d" /><div className="t">Sony FX6 Cinema Camera</div><div className="pill g">NEW</div></div>
          <div className="mini-row"><div className="d" /><div className="t">Sony FX3 Cinema Camera</div><div className="pill g">AVAIL</div></div>
          <div className="mini-row"><div className="d" /><div className="t">Sennheiser G4 Wireless Mic A</div><div className="pill g">AVAIL</div></div>
          <div className="mini-row"><div className="d" /><div className="t">Apple MacBook Pro 16&quot; M3</div><div className="pill g">AVAIL</div></div>
        </div>
      </div>
    ),
  },
  {
    id: "d3",
    num: "D3",
    tag: "Check-out",
    title: "Assign Gear",
    desc: "Search the asset, pick a person, set the return date, hit confirm. Two clicks from 'need it' to 'logged.'",
    dur: "27s",
    src: "/promos/demo-03-assign-gear.html",
    preview: (
      <div className="mini-app">
        <div className="mini-sb">
          <div className="mb"><div className="mbt" /><span className="mbw">Steward</span></div>
          <div className="ni"><div className="nd" />Dashboard</div>
          <div className="ni"><div className="nd" />Assets</div>
          <div className="ni act"><div className="nd" />Assignments</div>
          <div className="ni"><div className="nd" />Incidents</div>
          <div className="ni"><div className="nd" />Activity</div>
          <div className="ni"><div className="nd" />Team</div>
        </div>
        <div className="mini-main">
          <div className="mini-h"><h4>Assignments</h4><div className="mbtn">+ New</div></div>
          <div className="mini-modal">
            <div className="mh">Select Asset to Assign</div>
            <div className="mini-search t">Sony</div>
            <div className="ln g" /><div className="ln" /><div className="ln" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "d4",
    num: "D4",
    tag: "Incidents",
    title: "Report an Incident",
    desc: "Flag the asset, set priority, describe the issue. Ticket opens, asset auto-marked Maintenance, ops sees it instantly.",
    dur: "27s",
    src: "/promos/demo-04-report-an-incident.html",
    preview: (
      <div className="mini-app">
        <div className="mini-sb">
          <div className="mb"><div className="mbt" /><span className="mbw">Steward</span></div>
          <div className="ni"><div className="nd" />Dashboard</div>
          <div className="ni"><div className="nd" />Assets</div>
          <div className="ni"><div className="nd" />Assignments</div>
          <div className="ni act"><div className="nd" />Incidents</div>
          <div className="ni"><div className="nd" />Activity</div>
          <div className="ni"><div className="nd" />Team</div>
        </div>
        <div className="mini-main">
          <div className="mini-h"><h4>Incidents</h4><div className="mbtn">+ Ticket</div></div>
          <div className="mini-incident">
            <div><span className="itag">HIGH</span><span className="it">Broken Yoke Mount</span></div>
            <div className="id">The tightening knob on the yoke is stripped and won&apos;t lock.</div>
          </div>
          <div className="mini-incident" style={{ borderLeftColor: "var(--blue)" }}>
            <div><span className="itag" style={{ background: "#E5EEFF", color: "var(--blue)" }}>MED</span><span className="it">Battery Door Loose</span></div>
            <div className="id">Latch closes but doesn&apos;t fully click.</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "d5",
    num: "D5",
    tag: "Audit log",
    title: "Audit Trail",
    desc: "Filter the log to status changes, zoom into a diff. Old value → new value, with the who and the when. Audit-ready.",
    dur: "27s",
    src: "/promos/demo-05-audit-trail.html",
    preview: (
      <div className="mini-app">
        <div className="mini-sb">
          <div className="mb"><div className="mbt" /><span className="mbw">Steward</span></div>
          <div className="ni"><div className="nd" />Dashboard</div>
          <div className="ni"><div className="nd" />Assets</div>
          <div className="ni"><div className="nd" />Assignments</div>
          <div className="ni"><div className="nd" />Incidents</div>
          <div className="ni act"><div className="nd" />Activity</div>
          <div className="ni"><div className="nd" />Team</div>
        </div>
        <div className="mini-main">
          <div className="mini-h"><h4>Activity Log</h4></div>
          <div className="mini-search">Search asset or user…</div>
          <div className="mini-row"><div className="d" /><div className="t"><b>Maya Chen</b> added &quot;DJI Inspire 3&quot;</div></div>
          <div className="mini-row"><div className="d" /><div className="t"><b>Jordan Reyes</b> added &quot;MacBook Pro M3&quot;</div></div>
          <div className="mini-diff">
            <div className="dt"><b>Sam Lin</b> changed status for &quot;Sony FX3&quot;</div>
            <div className="dd">Status: <s>Maintenance</s> → <b>Available</b></div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function DemosPage() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  useEffect(() => {
    if (activeVideo) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [activeVideo]);

  return (
    <>
      <Head>
        <title>Demo Walkthroughs — Steward</title>
      </Head>

      <style jsx global>{`
        :root {
          --ink: #06140E; --ink-2: #0C1E16;
          --g700: #047857; --g600: #059669; --g500: #10B981; --g400: #34D399; --g300: #6EE7B7; --g100: #D1FAE5; --g50: #ECFDF5;
          --amber: #F59E0B; --red: #EF4444; --blue: #3B82F6;
          --n900: #0F1512; --n700: #2F3A35; --n500: #5B6862; --n400: #8A958F; --n300: #B9C2BD; --n200: #D9DEDB; --n100: #EDF0EE; --n50: #F6F8F7;
          --display: "Space Grotesk", sans-serif; --body: "Inter", sans-serif; --mono: "JetBrains Mono", monospace;
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: var(--body); background: var(--ink); color: #fff; min-height: 100vh; -webkit-font-smoothing: antialiased; line-height: 1.5; overflow-x: hidden; }

        /* NAV */
        .demos-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 60px; border-bottom: 1px solid rgba(255,255,255,.06); }
        .demos-nav .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: #fff; }
        .demos-nav .tile { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(150deg, var(--g400), var(--g600)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .demos-nav .tile svg { width: 20px; height: 20px; color: #fff; }
        .demos-nav .brand-name { font-family: var(--display); font-weight: 600; font-size: 17px; letter-spacing: -.02em; }
        .demos-nav .nav-links { display: flex; align-items: center; gap: 28px; }
        .demos-nav a.nav-link { font-family: var(--mono); font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--n300); text-decoration: none; transition: color .2s; }
        .demos-nav a.nav-link:hover { color: var(--g400); }

        /* HERO */
        .demos-hero { position: relative; padding: 72px 60px 60px; overflow: hidden; border-bottom: 1px solid rgba(255,255,255,.06); }
        .demos-hero .glow { position: absolute; border-radius: 50%; pointer-events: none; }
        .demos-hero .glow.a { width: 500px; height: 500px; background: rgba(16,185,129,.16); filter: blur(130px); top: -150px; right: -80px; }
        .demos-hero .glow.b { width: 400px; height: 400px; background: rgba(5,150,105,.12); filter: blur(110px); bottom: -200px; left: -60px; }
        .demos-hero .dot-grid { position: absolute; inset: 0; opacity: .5; pointer-events: none;
          background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 80px 80px;
          -webkit-mask-image: radial-gradient(circle at 30% 30%, #000, transparent 70%);
          mask-image: radial-gradient(circle at 30% 30%, #000, transparent 70%);
        }
        .demos-wrap { max-width: 1280px; margin: 0 auto; position: relative; z-index: 1; }
        .demos-eyebrow { font-family: var(--mono); font-size: 12px; letter-spacing: .24em; text-transform: uppercase; color: var(--g400); display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .demos-eyebrow::before { content: ""; width: 32px; height: 1.5px; background: var(--g400); display: inline-block; }
        .demos-hero h1 { font-family: var(--display); font-weight: 600; font-size: clamp(40px, 6vw, 80px); letter-spacing: -.04em; line-height: .95; margin-bottom: 20px; }
        .demos-hero h1 em { font-style: normal; color: var(--g400); }
        .demos-hero .lead { font-size: 18px; color: var(--n300); max-width: 600px; line-height: 1.55; }

        /* GRID */
        .demos-section { padding: 60px 60px 80px; }
        .demos-section .head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 36px; flex-wrap: wrap; gap: 16px; }
        .demos-section h2 { font-family: var(--display); font-weight: 600; font-size: clamp(28px, 4vw, 40px); letter-spacing: -.025em; }
        .demos-section .note { font-family: var(--mono); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--n400); }
        .demo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

        /* CARD */
        .demo-card { position: relative; background: var(--ink-2); border: 1px solid rgba(255,255,255,.08); border-radius: 22px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: .25s; }
        .demo-card:hover { border-color: var(--g400); transform: translateY(-4px); box-shadow: 0 28px 70px -36px rgba(16,185,129,.5); }
        .card-preview { aspect-ratio: 16/9; background: linear-gradient(135deg, #0c1e16, #06140e); position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, transparent 60%, rgba(6,20,14,.6)); transition: .2s; z-index: 2; }
        .demo-card:hover .play-overlay { background: linear-gradient(180deg, rgba(6,20,14,.3) 0%, rgba(6,20,14,.65)); }
        .play-btn { width: 68px; height: 68px; border-radius: 50%; background: rgba(16,185,129,.9); display: flex; align-items: center; justify-content: center; box-shadow: 0 18px 50px -10px rgba(16,185,129,.6), 0 0 0 6px rgba(16,185,129,.15); transition: .2s; }
        .demo-card:hover .play-btn { transform: scale(1.08); background: var(--g400); }
        .play-btn svg { width: 28px; height: 28px; color: #fff; margin-left: 3px; }
        .dur-badge { position: absolute; bottom: 12px; right: 12px; font-family: var(--mono); font-size: 11px; letter-spacing: .1em; background: rgba(0,0,0,.6); color: #fff; padding: 4px 9px; border-radius: 6px; backdrop-filter: blur(8px); z-index: 3; }
        .card-body { padding: 24px 26px 26px; display: flex; flex-direction: column; gap: 12px; flex: 1; }
        .card-row { display: flex; align-items: center; gap: 12px; }
        .card-num { font-family: var(--mono); font-size: 12px; color: var(--g400); letter-spacing: .18em; font-weight: 500; }
        .card-tag { font-family: var(--mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; padding: 3px 9px; border-radius: 6px; background: rgba(255,255,255,.05); color: var(--n300); border: 1px solid rgba(255,255,255,.08); margin-left: auto; }
        .demo-card h3 { font-family: var(--display); font-weight: 600; font-size: 22px; letter-spacing: -.02em; line-height: 1.1; }
        .demo-card p { font-size: 14px; color: var(--n300); line-height: 1.55; }
        .card-cta { margin-top: auto; display: flex; align-items: center; gap: 7px; font-family: var(--mono); font-size: 10px; color: var(--g400); letter-spacing: .16em; text-transform: uppercase; padding-top: 6px; }
        .card-cta svg { width: 12px; height: 12px; transition: .2s; }
        .demo-card:hover .card-cta svg { transform: translateX(3px); }

        /* MINI APP UI */
        .mini-app { position: relative; z-index: 1; width: 88%; aspect-ratio: 1680/920; background: #FAFBF9; border-radius: 8px; overflow: hidden; display: flex; box-shadow: 0 28px 56px -28px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04); }
        .mini-sb { width: 18%; background: #fff; border-right: 1px solid var(--n100); padding: 8px 5px; display: flex; flex-direction: column; gap: 2px; }
        .mini-sb .mb { display: flex; align-items: center; gap: 4px; padding: 2px 2px 6px; border-bottom: 1px solid var(--n100); margin-bottom: 5px; }
        .mini-sb .mbt { width: 12px; height: 12px; border-radius: 3px; background: linear-gradient(150deg, var(--g400), var(--g600)); flex-shrink: 0; }
        .mini-sb .mbw { font-family: var(--display); font-weight: 600; font-size: 7px; letter-spacing: -.02em; color: var(--ink); }
        .mini-sb .ni { display: flex; align-items: center; gap: 4px; padding: 3px 4px; border-radius: 4px; font-family: var(--body); font-size: 5.5px; color: var(--n500); font-weight: 500; }
        .mini-sb .ni.act { background: var(--g50); color: var(--g700); font-weight: 600; }
        .mini-sb .nd { width: 5px; height: 5px; border-radius: 1.5px; background: currentColor; opacity: .6; flex-shrink: 0; }
        .mini-main { flex: 1; padding: 12px 14px; background: #FAFBF9; overflow: hidden; }
        .mini-h { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
        .mini-h h4 { font-family: var(--display); font-weight: 700; font-size: 12px; color: var(--ink); letter-spacing: -.015em; }
        .mbtn { background: var(--ink); color: #fff; font-family: var(--body); font-weight: 600; font-size: 6px; padding: 3px 7px; border-radius: 4px; }
        .mini-kpi { display: flex; gap: 4px; margin-bottom: 7px; }
        .mini-kpi .k { flex: 1; background: #fff; border: 1px solid var(--n100); border-radius: 4px; padding: 5px 7px; }
        .mini-kpi .k.pri { border: 1.5px solid var(--g500); }
        .mini-kpi .k.amb { border: 1.5px solid var(--amber); }
        .mini-kpi .k .l { font-family: var(--body); font-size: 5.5px; color: var(--n500); }
        .mini-kpi .k .v { font-family: var(--display); font-weight: 700; font-size: 13px; color: var(--ink); letter-spacing: -.02em; margin-top: 1px; }
        .mini-row { background: #fff; border: 1px solid var(--n100); border-radius: 4px; padding: 4px 7px; margin-bottom: 2px; display: flex; align-items: center; gap: 5px; }
        .mini-row .d { width: 7px; height: 7px; border-radius: 50%; background: var(--g500); flex-shrink: 0; }
        .mini-row .d.b { background: var(--blue); }
        .mini-row .t { font-family: var(--body); font-size: 6px; color: var(--ink); flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .pill { font-family: var(--mono); font-size: 5px; padding: 1.5px 4px; border-radius: 99px; font-weight: 600; letter-spacing: .04em; flex-shrink: 0; }
        .pill.g { background: var(--g50); color: var(--g700); }
        .mini-modal { position: absolute; top: 16%; left: 12%; width: 72%; background: #fff; border-radius: 7px; padding: 9px 10px; box-shadow: 0 18px 36px -8px rgba(0,0,0,.4); z-index: 3; }
        .mh { font-family: var(--display); font-weight: 700; font-size: 9px; color: var(--ink); margin-bottom: 5px; }
        .mini-search { background: #fff; border: 1px solid var(--n100); border-radius: 4px; padding: 4px 7px; font-family: var(--body); font-size: 6px; color: var(--n400); margin-bottom: 6px; }
        .mini-search.t { color: var(--ink); font-weight: 600; }
        .ln { height: 5px; background: var(--n50); border-radius: 2px; margin-bottom: 3px; }
        .ln.g { background: var(--g50); border-left: 2px solid var(--g500); }
        .mini-incident { background: #fff; border: 1px solid var(--n100); border-left: 3px solid var(--amber); border-radius: 4px; padding: 5px 8px; margin-bottom: 2px; }
        .itag { display: inline-block; background: #FFE2B8; color: #B45309; font-family: var(--body); font-weight: 700; font-size: 5px; padding: 1px 3px; border-radius: 2px; margin-right: 3px; letter-spacing: .04em; }
        .it { font-family: var(--display); font-weight: 700; font-size: 7px; color: var(--ink); }
        .id { font-family: var(--body); font-size: 5.5px; color: var(--n500); margin-top: 1px; }
        .mini-diff { background: #fff; border: 1.5px solid var(--g400); border-radius: 4px; padding: 5px 7px; margin-bottom: 2px; box-shadow: 0 0 0 3px rgba(52,211,153,.15); }
        .dt { font-family: var(--body); font-size: 6px; color: var(--ink); }
        .dd { font-family: var(--mono); font-size: 5px; color: var(--n500); margin-top: 2px; }
        .dd s { color: var(--n400); }
        .dd b { color: var(--ink); }

        /* LIGHTBOX */
        .lightbox { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.55); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; animation: lbFadeIn .2s ease; }
        @keyframes lbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .lightbox-inner { position: relative; width: 90vw; max-width: 1280px; }
        .lightbox-inner iframe { width: 100%; aspect-ratio: 16/9; border: none; border-radius: 12px; display: block; }
        .lb-close { position: absolute; top: -44px; right: 0; width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: .2s; }
        .lb-close:hover { background: rgba(255,255,255,.22); }
        .lb-close svg { width: 16px; height: 16px; }

        /* FOOTER */
        .demos-foot { padding: 36px 60px; border-top: 1px solid rgba(255,255,255,.06); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .demos-foot .fl { display: flex; align-items: center; gap: 10px; }
        .demos-foot .fl svg { width: 20px; height: 20px; color: var(--g400); }
        .demos-foot .fl span { font-family: var(--display); font-weight: 600; font-size: 16px; letter-spacing: -.02em; }
        .demos-foot p { font-family: var(--mono); font-size: 11px; color: var(--n500); letter-spacing: .14em; text-transform: uppercase; }

        @media (max-width: 1000px) { .demo-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 680px) {
          .demo-grid { grid-template-columns: 1fr; }
          .demos-nav { padding: 16px 24px; }
          .demos-hero { padding: 48px 24px 44px; }
          .demos-section { padding: 40px 24px 60px; }
          .demos-foot { padding: 24px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="demos-nav">
        <Link href="/" className="brand">
          <div className="tile">
            <StewardMark className="w-5 h-5" />
          </div>
          <span className="brand-name">Steward</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">← Home</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="demos-hero">
        <div className="glow a" />
        <div className="glow b" />
        <div className="dot-grid" />
        <div className="demos-wrap">
          <div className="demos-eyebrow">Demo Walkthroughs · 5 product walkthroughs</div>
          <h1>See exactly <em>how it works.</em></h1>
          <p className="lead">Cursor-driven, pixel-close to the real app. Each walkthrough covers one core workflow — start to finish in under 30 seconds.</p>
        </div>
      </header>

      {/* DEMOS GRID */}
      <section className="demos-section">
        <div className="demos-wrap">
          <div className="head">
            <h2>Product walkthroughs</h2>
            <span className="note">Cursor-driven · pixel-close to the real app</span>
          </div>
          <div className="demo-grid">
            {DEMOS.map((demo) => (
              <div key={demo.id} className="demo-card" onClick={() => setActiveVideo(demo.src)}>
                <div className="card-preview">
                  {demo.preview}
                  <div className="play-overlay">
                    <div className="play-btn">
                      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4 L20 12 L6 20 Z" /></svg>
                    </div>
                  </div>
                  <div className="dur-badge">{demo.dur}</div>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="card-num">{demo.num}</span>
                    <span className="card-tag">{demo.tag}</span>
                  </div>
                  <h3>{demo.title}</h3>
                  <p>{demo.desc}</p>
                  <div className="card-cta">
                    Play
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

      {/* FOOTER */}
      <footer className="demos-foot">
        <div className="fl">
          <StewardMark className="w-5 h-5 text-emerald-400" />
          <span>Steward</span>
        </div>
        <p>Demo Walkthroughs · v1.0 · 2026</p>
      </footer>

      {/* LIGHTBOX */}
      {activeVideo && (
        <div className="lightbox" onClick={(e) => { if (e.target === e.currentTarget) setActiveVideo(null); }}>
          <div className="lightbox-inner">
            <button className="lb-close" onClick={() => setActiveVideo(null)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 L6 18 M6 6 L18 18" />
              </svg>
            </button>
            <iframe src={activeVideo} allowFullScreen />
          </div>
        </div>
      )}
    </>
  );
}
