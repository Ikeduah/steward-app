/* steward-ui.jsx — Pixel-close recreation of the Steward app for demo videos.
   Includes shell, cursor, dashboard, asset list, assignments, incidents, activity.
   Exports to window. Depends on brand.jsx (StewardBrand etc.) and animations.jsx (useTime, Easing, clamp). */

/* ============ ANIMATED CURSOR ============ */
/* Drive with a script: [{ t, x, y, click?: true, hold?: 0.3 }]
   Cursor lerps between waypoints with easeInOut, pulses on click. */
function Cursor({ script, color = '#06140E', size = 22, startAt = 0 }) {
  const t = useTime();
  const local = t - startAt;

  if (local < (script[0]?.t ?? 0) - 0.5) return null;

  // Find current segment
  let cur = script[0];
  let next = script[0];
  for (let i = 0; i < script.length; i++) {
    if (script[i].t <= local) { cur = script[i]; next = script[i+1] || script[i]; }
  }
  let x = cur.x, y = cur.y;
  if (next !== cur) {
    const span = next.t - cur.t;
    const p = clamp((local - cur.t) / span, 0, 1);
    const e = Easing.easeInOutCubic(p);
    x = cur.x + (next.x - cur.x) * e;
    y = cur.y + (next.y - cur.y) * e;
  }

  // Click pulse if within 0.45s after a click waypoint
  let pulse = 0;
  for (const w of script) {
    if (w.click && local >= w.t && local <= w.t + 0.5) {
      const p = (local - w.t) / 0.5;
      pulse = Math.max(pulse, 1 - p);
    }
  }

  return (
    <div style={{position:'absolute', left:x, top:y, pointerEvents:'none', zIndex:1000, transform:'translate(-3px,-2px)'}}>
      {/* click ripple */}
      {pulse > 0 && (
        <div style={{
          position:'absolute', left:-12, top:-12, width:48, height:48, borderRadius:'50%',
          border:`2px solid ${StewardBrand.g500}`, opacity: pulse * 0.7,
          transform:`scale(${1 + (1 - pulse) * 1.5})`,
        }}/>
      )}
      {/* arrow */}
      <svg width={size} height={size * 1.32} viewBox="0 0 22 29" style={{
        filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
        transform: pulse > 0 ? `scale(${0.85 + pulse * 0.15})` : 'scale(1)',
        transition:'transform 0.05s linear',
      }}>
        <path d="M2 2 L2 22 L8 17 L11.5 25 L14.5 24 L11 16 L19 16 Z"
          fill="#fff" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

/* ============ SHELL — Sidebar + Main ============ */
const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard', icon:(c)=>(<g stroke={c} strokeWidth="2" fill="none"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></g>) },
  { id:'assets', label:'Assets', icon:(c)=>(<g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></g>) },
  { id:'assignments', label:'Assignments', icon:(c)=>(<g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/></g>) },
  { id:'incidents', label:'Incidents', icon:(c)=>(<g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></g>) },
  { id:'activity', label:'Activity', icon:(c)=>(<g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></g>) },
  { id:'team', label:'Team', icon:(c)=>(<g fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 14 0v1"/><circle cx="17" cy="6" r="3"/><path d="M22 20a5 5 0 0 0-6-4.5"/></g>) },
];

function Sidebar({ active = 'dashboard', revealItems = NAV_ITEMS.length }) {
  const B = StewardBrand;
  return (
    <div style={{
      width:240, background:'#fff', borderRight:'1px solid '+B.n100,
      display:'flex', flexDirection:'column', padding:'24px 16px', flexShrink:0, height:'100%',
    }}>
      <div style={{display:'flex', alignItems:'center', gap:12, padding:'8px 10px 24px', borderBottom:'1px solid '+B.n100, marginBottom:14}}>
        <KeystoneTile size={42} radius={11} glow={false}/>
        <span style={{fontFamily:B.display, fontWeight:600, fontSize:22, color:B.ink, letterSpacing:'-0.02em'}}>Steward</span>
      </div>
      {NAV_ITEMS.map((n, i) => {
        if (i >= revealItems) return null;
        const isActive = n.id === active;
        const color = isActive ? B.g700 : B.n500;
        return (
          <div key={n.id} style={{
            display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10,
            background: isActive ? B.g50 : 'transparent',
            color, fontFamily:B.body, fontSize:15, fontWeight: isActive ? 600 : 500,
            marginBottom:4,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24">{n.icon(color)}</svg>
            <span>{n.label}</span>
          </div>
        );
      })}
      <div style={{flex:1}}/>
      <div style={{display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, color:B.n500, fontFamily:B.body, fontSize:15, fontWeight:500}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Sign Out</span>
      </div>
    </div>
  );
}

function PageHeader({ title, sub, action }) {
  const B = StewardBrand;
  return (
    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32}}>
      <div>
        <h1 style={{fontFamily:B.display, fontWeight:700, fontSize:42, color:B.ink, letterSpacing:'-0.025em', marginBottom:6}}>{title}</h1>
        <p style={{fontFamily:B.body, fontSize:16, color:B.n500}}>{sub}</p>
      </div>
      {action}
    </div>
  );
}

function AppShell({ active = 'dashboard', revealItems, children, scale = 1 }) {
  const B = StewardBrand;
  // The "app frame" is rendered at a fixed 1680x920 canvas; videos may scale it
  return (
    <div style={{
      width: 1680, height: 920, background:'#FAFBF9',
      borderRadius:18, overflow:'hidden', display:'flex',
      boxShadow:'0 60px 120px -40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      transform:`scale(${scale})`, transformOrigin:'center',
    }}>
      <Sidebar active={active} revealItems={revealItems}/>
      <div style={{flex:1, padding:'40px 48px', overflow:'hidden'}}>
        {children}
      </div>
    </div>
  );
}

/* ============ DASHBOARD ============ */
function KpiCard({ label, value, sub, icon, color, primary, t = 1 }) {
  const B = StewardBrand;
  return (
    <div style={{
      flex:1, background:'#fff', borderRadius:14, padding:'22px 24px',
      border: primary ? `2px solid ${color}` : `1px solid ${B.n100}`,
      position:'relative', minHeight:140, opacity:t, transform:`translateY(${(1-t)*16}px)`,
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14}}>
        <div style={{fontFamily:B.body, fontSize:15, color:B.n500, fontWeight:500}}>{label}</div>
        <div style={{color}}>{icon}</div>
      </div>
      <div style={{fontFamily:B.display, fontWeight:700, fontSize:54, color:B.ink, letterSpacing:'-0.03em', lineHeight:1, fontVariantNumeric:'tabular-nums'}}>{value}</div>
      <div style={{fontFamily:B.body, fontSize:13, color:B.n400, marginTop:6}}>{sub}</div>
    </div>
  );
}

function ActivityRow({ name, action, who, when, t = 1, icon = 'plus' }) {
  const B = StewardBrand;
  const iconColor = icon === 'plus' ? B.g600 : B.blue;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, padding:'14px 0',
      borderBottom:'1px solid '+B.n100,
      opacity:t, transform:`translateX(${(1-t)*30}px)`,
    }}>
      <div style={{width:36, height:36, borderRadius:10, background:icon === 'plus' ? B.g50 : '#E0EBFF', display:'flex', alignItems:'center', justifyContent:'center', color:iconColor, flexShrink:0}}>
        {icon === 'plus' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 20h9M3 21l3.5-1L19 8.5 16.5 6 4 18.5 3 21z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
        )}
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:B.display, fontWeight:600, fontSize:16, color:B.ink, letterSpacing:'-0.01em'}}>{name}</div>
        <div style={{fontFamily:B.mono, fontSize:11, color:B.n400, letterSpacing:'0.06em', marginTop:4, textTransform:'uppercase'}}>{when} · {who}</div>
      </div>
    </div>
  );
}

/* ============ ASSET ROW (list) ============ */
function AssetRow({ name, added, qr, status, t = 1 }) {
  const B = StewardBrand;
  const map = {
    AVAILABLE:  { bg: B.g50,    fg: B.g700 },
    'CHECKED OUT': { bg: '#FFE9E6', fg: B.red },
    MAINTENANCE:{ bg: '#FFF3DC', fg: B.amber },
  };
  const s = map[status] || map.AVAILABLE;
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr auto',
      alignItems:'center', gap:24, padding:'18px 20px',
      borderBottom:'1px solid '+B.n100, opacity:t, transform:`translateY(${(1-t)*10}px)`,
    }}>
      <div style={{display:'flex', alignItems:'center', gap:14}}>
        <div style={{width:18, height:18, borderRadius:5, border:'2px solid '+B.n200}}/>
        <div>
          <div style={{fontFamily:B.display, fontWeight:600, fontSize:17, color:B.ink, letterSpacing:'-0.01em'}}>{name}</div>
          <div style={{fontFamily:B.mono, fontSize:11, color:B.n400, letterSpacing:'0.08em', marginTop:3, textTransform:'uppercase'}}>Added 5/31/2026</div>
        </div>
      </div>
      <div>
        <span style={{
          fontFamily:B.mono, fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase',
          background:s.bg, color:s.fg, padding:'5px 12px', borderRadius:999, fontWeight:600,
        }}>{status}</span>
      </div>
      <div style={{fontFamily:B.mono, fontSize:13, color:B.ink, letterSpacing:'0.06em', fontWeight:500}}>{qr}</div>
      <div style={{display:'flex', gap:14, color:B.n400}}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M3 21l3.5-1L19 8.5 16.5 6 4 18.5 3 21z"/></svg>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={B.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
      </div>
    </div>
  );
}

/* ============ BUTTON / SEARCH / TAB HEADER ============ */
function PrimaryButton({ children, icon = '+', highlight = false }) {
  const B = StewardBrand;
  return (
    <div style={{
      background: B.ink, color:'#fff', fontFamily:B.body, fontSize:15, fontWeight:600,
      padding:'12px 22px', borderRadius:12, display:'inline-flex', alignItems:'center', gap:10,
      boxShadow: highlight ? `0 0 0 4px ${B.g400}55` : '0 8px 20px -10px rgba(0,0,0,0.3)',
      transition:'box-shadow 0.2s',
    }}>
      {icon && <span style={{fontSize:18, lineHeight:1, marginTop:-2}}>{icon}</span>}
      {children}
    </div>
  );
}

function SearchBar({ placeholder = 'Search...', value = '', cursor = false }) {
  const B = StewardBrand;
  return (
    <div style={{
      flex:1, background:'#fff', border:'1px solid '+B.n200, borderRadius:12,
      padding:'14px 18px', display:'flex', alignItems:'center', gap:12,
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={B.n400} strokeWidth="2"/><path d="M20 20 L17 17" stroke={B.n400} strokeWidth="2" strokeLinecap="round"/></svg>
      <div style={{flex:1, fontFamily:B.body, fontSize:15, color: value ? B.ink : B.n400}}>
        {value || placeholder}
        {cursor && <span style={{color:B.g500, marginLeft:1}}>|</span>}
      </div>
    </div>
  );
}

function FilterDropdown({ value = 'All Status' }) {
  const B = StewardBrand;
  return (
    <div style={{
      background:'#fff', border:'1px solid '+B.n200, borderRadius:12,
      padding:'14px 18px', display:'flex', alignItems:'center', gap:12, minWidth:160,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5h16l-6 8v6l-4 2v-8z" stroke={B.n500} strokeWidth="2" strokeLinejoin="round"/></svg>
      <span style={{fontFamily:B.body, fontSize:15, color:B.ink, fontWeight:500, flex:1}}>{value}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={B.n500} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );
}

/* ============ MODAL ============ */
function Modal({ title, children, t = 1, width = 720 }) {
  const B = StewardBrand;
  return (
    <div style={{
      position:'absolute', inset:0, background:`rgba(0,0,0,${0.45 * t})`,
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:50,
    }}>
      <div style={{
        width, background:'#fff', borderRadius:20, padding:'28px 32px',
        opacity:t, transform:`translateY(${(1-t)*20}px) scale(${0.96 + 0.04*t})`,
        boxShadow:'0 40px 100px -30px rgba(0,0,0,0.5)',
        maxHeight:780,
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
          <div style={{fontFamily:B.display, fontWeight:700, fontSize:24, color:B.ink, letterSpacing:'-0.015em'}}>{title}</div>
          <div style={{width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:B.n500}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 6 L18 18 M18 6 L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalAssetRow({ name, qr, status = 'Available', highlight = false }) {
  const B = StewardBrand;
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:16, padding:'14px 18px',
      borderRadius:12, background:'#fff',
      border: highlight ? `2px solid ${B.g400}` : '1px solid '+B.n100,
      boxShadow: highlight ? `0 0 0 4px ${B.g100}` : 'none',
      marginBottom:10, transition:'all 0.15s',
    }}>
      <div style={{width:42, height:42, borderRadius:10, background:B.n50, border:'1px solid '+B.n100, display:'flex', alignItems:'center', justifyContent:'center'}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={B.n500} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:B.display, fontWeight:600, fontSize:17, color:B.ink, letterSpacing:'-0.01em'}}>{name}</div>
        <div style={{fontFamily:B.mono, fontSize:11.5, color:B.n400, marginTop:3, letterSpacing:'0.06em'}}>QR: {qr}</div>
      </div>
      <span style={{
        fontFamily:B.body, fontSize:13, color:B.g700, background:B.g50,
        padding:'5px 12px', borderRadius:999, fontWeight:500,
      }}>{status}</span>
    </div>
  );
}

/* ============ INCIDENT CARD ============ */
function IncidentCard({ priority='HIGH', title, desc, asset, date, t = 1 }) {
  const B = StewardBrand;
  const pColor = priority === 'HIGH' ? B.amber : priority === 'CRITICAL' ? B.red : B.blue;
  return (
    <div style={{
      background:'#fff', border:'1px solid '+B.n100, borderLeft:`5px solid ${pColor}`,
      borderRadius:12, padding:'22px 26px',
      opacity:t, transform:`translateX(${(1-t)*30}px)`,
      display:'flex', alignItems:'flex-start', gap:24,
      boxShadow:'0 2px 8px -4px rgba(0,0,0,0.08)',
    }}>
      <div style={{flex:1}}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:8}}>
          <span style={{
            background:'#FFE9C7', color:pColor, fontFamily:B.body, fontSize:11,
            fontWeight:700, padding:'4px 10px', borderRadius:6, letterSpacing:'0.08em',
          }}>{priority}</span>
          <div style={{fontFamily:B.display, fontWeight:700, fontSize:22, color:B.ink, letterSpacing:'-0.015em'}}>{title}</div>
        </div>
        <div style={{fontFamily:B.body, fontSize:15, color:B.n500, marginBottom:14}}>{desc}</div>
        <div style={{display:'flex', alignItems:'center', gap:18, fontFamily:B.body, fontSize:13, color:B.n500}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/></svg>
            {asset}
          </span>
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l3 2" strokeLinecap="round"/></svg>
            {date}
          </span>
        </div>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:6, fontFamily:B.body, fontSize:14, fontWeight:600, color:B.red, padding:'10px 14px', border:'1px solid '+B.n100, borderRadius:10}}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M10.3 4l-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0z"/></svg>
        Open
      </div>
    </div>
  );
}

/* ============ ACTIVITY LOG ROW (detailed audit) ============ */
function AuditRow({ who, action, what, when, t = 1, changes }) {
  const B = StewardBrand;
  return (
    <div style={{
      background:'#fff', border:'1px solid '+B.n100, borderRadius:12, padding:'16px 20px',
      display:'flex', alignItems:'flex-start', gap:14, marginBottom:10,
      opacity:t, transform:`translateY(${(1-t)*12}px)`,
    }}>
      <div style={{
        width:36, height:36, borderRadius:10, background: changes ? '#E0EBFF' : B.g50,
        display:'flex', alignItems:'center', justifyContent:'center',
        color: changes ? B.blue : B.g600, flexShrink:0,
      }}>
        {changes
          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M12 20h9M3 21l3.5-1L19 8.5 16.5 6 4 18.5 3 21z"/></svg>
          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontFamily:B.body, fontSize:15, color:B.ink, lineHeight:1.5}}>
          <b style={{fontWeight:700}}>{who}</b> <span style={{color:B.n500}}>{action}</span> <span style={{fontWeight:600}}>"{what}"</span>
        </div>
        {changes && (
          <div style={{marginTop:8, fontFamily:B.mono, fontSize:12, color:B.n500, display:'flex', flexWrap:'wrap', gap:14}}>
            <span>Changes: <b style={{color:B.ink}}>{changes.fields}</b></span>
            <span>Status: <span style={{textDecoration:'line-through', color:B.n400}}>{changes.from}</span> → <b style={{color:B.ink}}>{changes.to}</b></span>
          </div>
        )}
      </div>
      <div style={{fontFamily:B.mono, fontSize:12, color:B.n400, letterSpacing:'0.06em', textTransform:'uppercase'}}>{when}</div>
    </div>
  );
}

/* ============ TITLE OVERLAY (used as scene captions) ============ */
function TitleOverlay({ eyebrow, big, sub, side = 'left', t = 1 }) {
  const B = StewardBrand;
  return (
    <div style={{
      position:'absolute', inset:0, pointerEvents:'none',
      display:'flex', alignItems: side === 'top' ? 'flex-start' : 'center', justifyContent: side === 'top' ? 'center' : (side === 'right' ? 'flex-end' : 'flex-start'),
      padding: side === 'top' ? '64px 80px 0' : '0 80px',
    }}>
      <div style={{
        opacity:t, transform:`translateY(${(1-t)*16}px)`,
        textAlign: side === 'top' ? 'center' : 'left', maxWidth:560,
      }}>
        {eyebrow && (
          <div style={{fontFamily:B.mono, fontSize:13, color:B.g400, letterSpacing:'0.24em', textTransform:'uppercase', marginBottom:18, display:'flex', alignItems:'center', gap:14, justifyContent: side === 'top' ? 'center' : 'flex-start'}}>
            <span style={{width:32, height:1.5, background:B.g400}}/>
            {eyebrow}
          </div>
        )}
        <div style={{fontFamily:B.display, fontWeight:600, fontSize: side === 'top' ? 72 : 84, color:'#fff', letterSpacing:'-0.04em', lineHeight:1}}>{big}</div>
        {sub && <div style={{fontFamily:B.display, fontWeight:400, fontSize:24, color:B.n300, marginTop:18, lineHeight:1.4}}>{sub}</div>}
      </div>
    </div>
  );
}

/* ============ STAGE BACKGROUND ============ */
function PromoBackdrop({ glow = true, grid = true }) {
  return (
    <div style={{position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none'}}>
      {glow && <>
        <EmeraldGlow x="-15%" y="-10%" size="55%" intensity={0.16} blur={150}/>
        <EmeraldGlow x="60%"  y="60%" size="55%" intensity={0.14} blur={150}/>
      </>}
      {grid && <GridBg opacity={0.5} size={90}/>}
    </div>
  );
}

function CornerWatermark({ start = 0, end = 1000 }) {
  const B = StewardBrand;
  return (
    <Sprite start={start} end={end}>
      {({ localTime }) => {
        const op = Easing.easeOutCubic(clamp(localTime/0.5, 0, 1)) * 0.7;
        return (
          <div style={{position:'absolute', top:32, left:40, opacity:op, display:'flex', alignItems:'center', gap:12, zIndex:100}}>
            <KeystoneTile size={32} radius={8} glow={false}/>
            <span style={{fontFamily:B.display, fontWeight:600, fontSize:18, color:'#fff', letterSpacing:'-0.02em'}}>Steward</span>
          </div>
        );
      }}
    </Sprite>
  );
}

Object.assign(window, {
  Cursor, NAV_ITEMS, Sidebar, PageHeader, AppShell,
  KpiCard, ActivityRow, AssetRow,
  PrimaryButton, SearchBar, FilterDropdown,
  Modal, ModalAssetRow,
  IncidentCard, AuditRow,
  TitleOverlay, PromoBackdrop, CornerWatermark,
});
