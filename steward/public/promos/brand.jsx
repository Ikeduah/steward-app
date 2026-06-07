/* brand.jsx — Shared Steward brand components for promo videos.
   Exports to window so each video's Babel script can use them. */

const StewardBrand = {
  ink:    '#06140E',
  ink2:   '#0C1E16',
  ink3:   '#13231C',
  paper:  '#FBFBF9',
  paper2: '#F3F5F2',
  g700:   '#047857',
  g600:   '#059669',
  g500:   '#10B981',
  g400:   '#34D399',
  g300:   '#6EE7B7',
  g100:   '#D1FAE5',
  g50:    '#ECFDF5',
  amber:  '#F59E0B',
  red:    '#EF4444',
  blue:   '#3B82F6',
  n900:   '#0F1512',
  n700:   '#2F3A35',
  n500:   '#5B6862',
  n400:   '#8A958F',
  n300:   '#B9C2BD',
  n200:   '#D9DEDB',
  n100:   '#EDF0EE',
  n50:    '#F6F8F7',
  display: '"Space Grotesk", system-ui, sans-serif',
  body:    '"Inter", system-ui, sans-serif',
  mono:    '"JetBrains Mono", ui-monospace, monospace',
};

/* ===== Logo / Mark ===== */
function KeystoneMark({ color = '#fff', size = 64, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={style}>
      <path d="M45 19 C45 13 39 10 31 10 C20 10 14 16 14 23 C14 30 20 33 30 35 C40 37 45 40 45 45 C45 52 39 55 30 55"
        fill="none" stroke={color} strokeWidth="8.5" strokeLinecap="round"/>
      <circle cx="45" cy="19" r="5" fill={color}/>
      <circle cx="30" cy="55" r="5" fill={color}/>
    </svg>
  );
}

function KeystoneTile({ size = 96, radius, glow = true, style = {} }) {
  const r = radius != null ? radius : size * 0.22;
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: 'linear-gradient(150deg, #34D399, #059669)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: glow ? `0 ${size*0.2}px ${size*0.6}px -${size*0.18}px rgba(16,185,129,0.55)` : 'none',
      flexShrink: 0,
      ...style,
    }}>
      <KeystoneMark color="#fff" size={size * 0.62}/>
    </div>
  );
}

function StewardLockup({ tileSize = 88, wordSize = 64, color = '#fff', gap, style = {} }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:gap != null ? gap : tileSize*0.3, ...style}}>
      <KeystoneTile size={tileSize}/>
      <span style={{fontFamily:StewardBrand.display,fontWeight:600,fontSize:wordSize,letterSpacing:'-0.035em',color,lineHeight:0.9}}>Steward</span>
    </div>
  );
}

/* ===== Background helpers ===== */
function EmeraldGlow({ x='15%', y='15%', size='55%', intensity = 0.25, blur = 160 }) {
  return (
    <div style={{
      position:'absolute', left:x, top:y, width:size, height:size,
      background:`rgba(16,185,129,${intensity})`,
      filter:`blur(${blur}px)`, borderRadius:'50%',
      pointerEvents:'none',
    }}/>
  );
}

function GridBg({ opacity = 0.5, size = 80 }) {
  return (
    <div style={{
      position:'absolute', inset:0, opacity, pointerEvents:'none',
      backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
      backgroundSize:`${size}px ${size}px`,
      WebkitMaskImage:'radial-gradient(circle at 50% 45%, #000 30%, transparent 80%)',
      maskImage:'radial-gradient(circle at 50% 45%, #000 30%, transparent 80%)',
    }}/>
  );
}

/* ===== Typography ===== */
function Eyebrow({ children, color = '#34D399', size = 16, letterSpacing = '0.24em' }) {
  return (
    <div style={{fontFamily:StewardBrand.mono,fontSize:size,letterSpacing,textTransform:'uppercase',color,display:'flex',alignItems:'center',gap:14,fontWeight:500}}>
      <span style={{width:36,height:1.5,background:color,display:'inline-block'}}/>
      <span>{children}</span>
    </div>
  );
}

/* ===== Number counter (uses local sprite progress) ===== */
function CountUp({ from = 0, to = 100, prefix = '', suffix = '', decimals = 0, ease, style = {}, format }) {
  const { progress } = useSprite();
  const easedFn = ease || Easing.easeOutCubic;
  const e = easedFn(progress);
  const val = from + (to - from) * e;
  const formatted = format ? format(val) : val.toFixed(decimals);
  // Add thousands separator
  const [intPart, decPart] = formatted.split('.');
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return <span style={{fontVariantNumeric:'tabular-nums', ...style}}>{prefix}{withCommas}{decPart != null ? '.' + decPart : ''}{suffix}</span>;
}

/* ===== Asset Tag UI (small card with QR) ===== */
function AssetTag({ id = 'ASSET-04821', name = 'Shure SM7B Mic', width = 260 }) {
  return (
    <div style={{
      width, background:'#fff', borderRadius:18, overflow:'hidden',
      boxShadow:'0 30px 60px -25px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      border:'1px solid #E5EAE7',
    }}>
      <div style={{background:StewardBrand.ink, padding:'14px 18px', display:'flex', alignItems:'center', gap:10}}>
        <KeystoneTile size={26} radius={7} glow={false}/>
        <span style={{fontFamily:StewardBrand.display, fontWeight:600, fontSize:15, color:'#fff', letterSpacing:'-0.015em'}}>Steward</span>
      </div>
      <div style={{padding:'24px 24px 0', display:'flex', justifyContent:'center'}}>
        <FauxQR size={132}/>
      </div>
      <div style={{padding:'14px 18px 20px', textAlign:'center'}}>
        <div style={{fontFamily:StewardBrand.mono, fontSize:12, color:StewardBrand.g600, letterSpacing:'0.08em', marginBottom:4}}>{id}</div>
        <div style={{fontFamily:StewardBrand.display, fontWeight:600, fontSize:17, color:StewardBrand.ink}}>{name}</div>
      </div>
    </div>
  );
}

/* ===== Faux QR ===== */
function FauxQR({ size = 120 }) {
  // 11x11 grid - corners reserved
  const cells = React.useMemo(() => {
    const g = [];
    const seed = 7;
    let s = seed;
    for (let y = 0; y < 11; y++) {
      for (let x = 0; x < 11; x++) {
        // Corner finder patterns
        const inCorner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7);
        if (inCorner) continue;
        s = (s * 9301 + 49297) % 233280;
        const v = s / 233280;
        if (v > 0.5) g.push({x, y});
      }
    }
    return g;
  }, []);
  const c = size / 11;
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" style={{display:'block'}}>
      {/* finder patterns */}
      {[[0,0],[8,0],[0,8]].map(([fx,fy],i) => (
        <g key={i}>
          <rect x={fx} y={fy} width="3" height="3" fill="none" stroke={StewardBrand.ink} strokeWidth="0.4"/>
          <rect x={fx+1} y={fy+1} width="1" height="1" fill={StewardBrand.ink}/>
        </g>
      ))}
      {cells.map((c,i) => (
        <rect key={i} x={c.x} y={c.y} width="0.9" height="0.9" fill={StewardBrand.ink}/>
      ))}
      {/* accent emerald cell */}
      <rect x="5" y="5" width="0.9" height="0.9" fill={StewardBrand.g600}/>
    </svg>
  );
}

/* ===== Dashboard stat card ===== */
function StatCard({ label, value, accent = StewardBrand.g600, suffix = '', width = 200 }) {
  return (
    <div style={{
      width, background:'#fff', borderRadius:14, padding:'18px 20px',
      border:'1px solid '+StewardBrand.n100,
      boxShadow:'0 14px 30px -22px rgba(0,0,0,0.35)',
    }}>
      <div style={{fontFamily:StewardBrand.mono, fontSize:10.5, color:StewardBrand.n400, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:8}}>{label}</div>
      <div style={{fontFamily:StewardBrand.display, fontWeight:600, fontSize:34, color:accent, letterSpacing:'-0.02em', lineHeight:1}}>
        {value}{suffix}
      </div>
    </div>
  );
}

/* ===== Scan reticle (4 corners) ===== */
function ScanReticle({ size = 280, color = StewardBrand.g400, thickness = 4, cornerLen = 56, animated = false }) {
  const { localTime } = useSprite();
  const pulse = animated ? 0.6 + 0.4 * Math.abs(Math.sin(localTime * 3)) : 1;
  const corners = [
    { top:0, left:0, br: 'none', bb: 'none', borderRadius:'6px 0 0 0' },
    { top:0, right:0, bl:'none', bb:'none', borderRadius:'0 6px 0 0' },
    { bottom:0, left:0, br:'none', bt:'none', borderRadius:'0 0 0 6px' },
    { bottom:0, right:0, bl:'none', bt:'none', borderRadius:'0 0 6px 0' },
  ];
  return (
    <div style={{position:'relative', width:size, height:size, opacity:pulse}}>
      {corners.map((c, i) => (
        <div key={i} style={{
          position:'absolute', width:cornerLen, height:cornerLen,
          borderTop: c.bt === 'none' ? 'none' : `${thickness}px solid ${color}`,
          borderBottom: c.bb === 'none' ? 'none' : `${thickness}px solid ${color}`,
          borderLeft: c.bl === 'none' ? 'none' : `${thickness}px solid ${color}`,
          borderRight: c.br === 'none' ? 'none' : `${thickness}px solid ${color}`,
          ...c,
        }}/>
      ))}
    </div>
  );
}

/* ===== Tag the video root's data-screen-label with current time ===== */
function TimestampLabel({ rootSelector = '[data-video-root]' }) {
  const t = useTime();
  const sec = Math.floor(t);
  React.useEffect(() => {
    const el = document.querySelector(rootSelector);
    if (el) el.setAttribute('data-screen-label', `t=${sec}s`);
  }, [sec, rootSelector]);
  return null;
}

/* ===== Logo lockup endcard (used at end of every video) ===== */
function EndCard({ tagline = 'Precision Inventory Management.', url = 'steward.app' }) {
  const { progress, localTime } = useSprite();
  const op = Easing.easeOutCubic(clamp(localTime / 0.6, 0, 1));
  const slide = (1 - op) * 12;
  return (
    <div style={{
      position:'absolute', inset:0,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      opacity: op, transform:`translateY(${slide}px)`, gap:32,
    }}>
      <StewardLockup tileSize={120} wordSize={84}/>
      <div style={{
        fontFamily:StewardBrand.display, fontWeight:400, fontSize:30, color:StewardBrand.n300,
        letterSpacing:'-0.015em', marginTop:8,
      }}>{tagline}</div>
      <div style={{
        fontFamily:StewardBrand.mono, fontSize:14, color:StewardBrand.g400,
        letterSpacing:'0.18em', textTransform:'uppercase', marginTop:6,
      }}>{url}</div>
    </div>
  );
}

Object.assign(window, {
  StewardBrand,
  KeystoneMark, KeystoneTile, StewardLockup,
  EmeraldGlow, GridBg, Eyebrow,
  CountUp, AssetTag, FauxQR, StatCard, ScanReticle,
  TimestampLabel, EndCard,
});
