/**
 * GamerTab: Black Vault
 * Shared SVG Asset Library
 * - Player tokens (6 unique)
 * - Black Vault dice
 * - Credit/money icons
 * - Transport icons
 * - Event card backs
 * All procedural SVG — royalty-free safe
 */

import React, { useState, useRef } from 'react';

/* ════════════════════════════════════════════════════════
   PLAYER TOKENS  (6 unique character sigils)
════════════════════════════════════════════════════════ */

const TOKEN_DATA = [
  { id:1, name:'The Rat',       color:'#cc0000', dark:'#660000', sigil:'☠', glyph:'I'   },
  { id:2, name:'Iron Ghost',    color:'#2244cc', dark:'#001166', sigil:'👁', glyph:'II'  },
  { id:3, name:'Viper',         color:'#00aa33', dark:'#005518', sigil:'⚡', glyph:'III' },
  { id:4, name:'The Warden',    color:'#cc8800', dark:'#664400', sigil:'🔒', glyph:'IV'  },
  { id:5, name:'Phantom',       color:'#aa00aa', dark:'#550055', sigil:'👻', glyph:'V'   },
  { id:6, name:'Steel Wraith',  color:'#aaaaaa', dark:'#444455', sigil:'⚙', glyph:'VI'  },
];

export function PlayerToken({ tokenId = 1, size = 60, active = false }) {
  const t = TOKEN_DATA[tokenId - 1] || TOKEN_DATA[0];
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={`tg${tokenId}`} cx="38%" cy="32%">
          <stop offset="0%"   stopColor={t.color} stopOpacity=".9"/>
          <stop offset="60%"  stopColor={t.dark}/>
          <stop offset="100%" stopColor="#000"/>
        </radialGradient>
        <filter id={`tglow${tokenId}`}>
          <feGaussianBlur stdDeviation={active ? 4 : 2} result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      {/* Outer glow ring */}
      <circle cx="30" cy="30" r="28" fill="none" stroke={t.color}
              strokeWidth={active ? 2.5 : 1} opacity={active ? .9 : .5}>
        {active && <animate attributeName="opacity" values=".4;1;.4" dur="1.5s" repeatCount="indefinite"/>}
        {active && <animate attributeName="r" values="26;29;26" dur="1.5s" repeatCount="indefinite"/>}
      </circle>
      {/* Token body */}
      <circle cx="30" cy="30" r="24" fill={`url(#tg${tokenId})`}
              filter={`url(#tglow${tokenId})`}/>
      {/* Inner ring detail */}
      <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
      {/* Highlight sheen */}
      <ellipse cx="24" cy="20" rx="8" ry="5" fill="rgba(255,255,255,.12)" transform="rotate(-20 24 20)"/>
      {/* Sigil */}
      <text x="30" y="35" textAnchor="middle" fontSize="18" fontFamily="system-ui">{t.sigil}</text>
      {/* Glyph */}
      <text x="30" y="53" textAnchor="middle" fontSize="7"
            fontFamily="'Courier New',monospace" fill="rgba(255,255,255,.5)"
            letterSpacing="1">{t.glyph}</text>
    </svg>
  );
}

export function TokenRoster({ activeId }) {
  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
      {TOKEN_DATA.map(t => (
        <div key={t.id} style={{ textAlign:'center' }}>
          <PlayerToken tokenId={t.id} active={t.id === activeId} size={56}/>
          <div style={{ fontFamily:"'Courier New',monospace", fontSize:9,
                        color:'#808096', marginTop:4, textTransform:'uppercase',
                        letterSpacing:1 }}>{t.name}</div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DICE COMPONENT
════════════════════════════════════════════════════════ */

// Pip layouts for faces 1–6
const PIP_LAYOUTS = {
  1: [[1,1]],
  2: [[0,0],[2,2]],
  3: [[0,0],[1,1],[2,2]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
};

export function BlackVaultDie({ value = 1, rolling = false, onRoll, size = 64 }) {
  const pips = PIP_LAYOUTS[value] || PIP_LAYOUTS[1];

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"
         style={{ cursor:'pointer', userSelect:'none' }} onClick={onRoll}>
      <defs>
        <linearGradient id="dieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2d2d3d"/>
          <stop offset="50%"  stopColor="#1a1a25"/>
          <stop offset="100%" stopColor="#25252f"/>
        </linearGradient>
        <filter id="dieGlow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
        <filter id="pipGlow">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>
      {/* Outer glow */}
      <rect x="2" y="2" width="60" height="60" rx="13"
            fill="rgba(200,16,16,.15)" filter="url(#dieGlow)"/>
      {/* Die body */}
      <rect x="4" y="4" width="56" height="56" rx="12" fill="url(#dieGrad)"/>
      {/* Engraved border */}
      <rect x="4" y="4" width="56" height="56" rx="12" fill="none"
            stroke="rgba(200,16,16,.5)" strokeWidth="1.5"/>
      {/* Top sheen */}
      <rect x="7" y="7" width="50" height="22" rx="9" fill="rgba(255,255,255,.05)"/>
      {/* Corner screw details */}
      {[[14,14],[50,14],[14,50],[50,50]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="rgba(255,255,255,.06)"
                stroke="rgba(255,255,255,.08)" strokeWidth=".5"/>
      ))}
      {/* Pips */}
      {pips.map(([row,col],i) => {
        const cx = 20 + col * 12;
        const cy = 20 + row * 12;
        return (
          <g key={i}>
            {/* Glow behind pip */}
            <circle cx={cx} cy={cy} r="5" fill="rgba(200,16,16,.35)" filter="url(#pipGlow)"/>
            {/* Pip */}
            <circle cx={cx} cy={cy} r="4" fill="#ee2222"/>
            <circle cx={cx-1} cy={cy-1} r="1.5" fill="rgba(255,150,150,.5)"/>
          </g>
        );
      })}
      {/* Rolling flash overlay */}
      {rolling && (
        <rect x="4" y="4" width="56" height="56" rx="12"
              fill="rgba(200,16,16,.3)">
          <animate attributeName="opacity" values="0;.5;0" dur=".15s" repeatCount="4"/>
        </rect>
      )}
    </svg>
  );
}

export function DicePair({ values = [1,1], onRoll }) {
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      onRoll?.([
        Math.ceil(Math.random()*6),
        Math.ceil(Math.random()*6),
      ]);
    }, 700);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <div style={{ display:'flex', gap:12 }}>
        <BlackVaultDie value={values[0]} rolling={rolling} size={60}/>
        <BlackVaultDie value={values[1]} rolling={rolling} size={60}/>
      </div>
      <button onClick={handleRoll} disabled={rolling}
              style={{
                background:'linear-gradient(140deg,#5a0000,#8b0000)',
                border:'1px solid rgba(200,16,16,.6)',
                borderRadius:6, color:'#fff',
                fontFamily:"'Courier New',monospace",
                fontSize:10, fontWeight:700, letterSpacing:2,
                textTransform:'uppercase', padding:'7px 18px',
                cursor:rolling?'not-allowed':'pointer',
                opacity:rolling?.6:1,
                boxShadow:'0 0 10px rgba(200,16,16,.4)',
              }}>
        {rolling ? '// ROLLING //' : '▶ ROLL DICE'}
      </button>
      {!rolling && (
        <div style={{ fontFamily:"'Courier New',monospace", fontSize:12,
                      color:'#c9a227', fontWeight:700,
                      textShadow:'0 0 8px rgba(201,162,39,.6)' }}>
          TOTAL: {values[0]+values[1]}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   CREDIT / MONEY SYSTEM
════════════════════════════════════════════════════════ */

export function CreditBill({ amount }) {
  const color = amount >= 500 ? '#6a007a'
              : amount >= 200 ? '#003d7a'
              : amount >= 100 ? '#007a1a'
              : amount >= 50  ? '#7a6200'
              : '#5a0000';
  const bright = amount >= 500 ? '#cc66ff'
               : amount >= 200 ? '#66aaff'
               : amount >= 100 ? '#55ff77'
               : amount >= 50  ? '#ffcc44'
               : '#ff6666';
  return (
    <svg viewBox="0 0 120 60" width="120" height="60" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`billG${amount}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity=".9"/>
          <stop offset="100%" stopColor="#000" stopOpacity=".95"/>
        </linearGradient>
      </defs>
      <rect rx="5" width="120" height="60" fill={`url(#billG${amount})`}/>
      <rect rx="5" x=".5" y=".5" width="119" height="59" fill="none" stroke={bright} strokeWidth=".8" opacity=".6"/>
      <rect rx="4" x="4" y="4" width="112" height="52" fill="none" stroke={bright} strokeWidth=".4" opacity=".3"/>
      {/* Guilloché pattern */}
      {Array.from({length:8}).map((_,i)=>(
        <line key={i} x1={i*16} y1="0" x2={i*16+8} y2="60" stroke={bright} strokeWidth=".3" opacity=".12"/>
      ))}
      <text x="60" y="36" textAnchor="middle" fontSize="22" fontWeight="900"
            fontFamily="'Courier New',monospace" fill={bright}
            style={{ filter:`drop-shadow(0 0 4px ${bright})` }}>
        ⬡{amount}
      </text>
      <text x="8" y="14" fontSize="7" fontFamily="'Courier New',monospace"
            fill={bright} opacity=".7" letterSpacing="1" style={{textTransform:'uppercase'}}>
        BLACK VAULT CREDIT
      </text>
      <text x="112" y="54" textAnchor="end" fontSize="6"
            fontFamily="'Courier New',monospace" fill={bright} opacity=".4">
        BVC-{amount.toString().padStart(4,'0')}
      </text>
    </svg>
  );
}

export function CreditStack({ amounts = [500,100,50,20,10] }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
      {amounts.map(a => <CreditBill key={a} amount={a}/>)}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TRANSPORT / SPECIAL SPACE ICONS
════════════════════════════════════════════════════════ */

export function TransportIcon({ type }) {
  const icons = {
    metro:   { emoji:'🚇', label:'METRO HUB',      color:'#003d7a' },
    freight: { emoji:'🚂', label:'FREIGHT STATION', color:'#663300' },
    harbor:  { emoji:'⚓', label:'HARBOR',          color:'#004d4d' },
    airfield:{ emoji:'✈️', label:'AIRFIELD',        color:'#1a1a3d' },
  };
  const t = icons[type] || icons.metro;
  return (
    <svg viewBox="0 0 80 80" width="80" height="80">
      <rect width="80" height="80" rx="8" fill={t.color} opacity=".8"/>
      <rect x=".5" y=".5" width="79" height="79" rx="7.5" fill="none"
            stroke="rgba(255,255,255,.2)" strokeWidth="1"/>
      <text x="40" y="46" textAnchor="middle" fontSize="28" fontFamily="system-ui">{t.emoji}</text>
      <text x="40" y="68" textAnchor="middle" fontSize="6.5"
            fontFamily="'Courier New',monospace" fill="rgba(255,255,255,.7)"
            letterSpacing="1" style={{textTransform:'uppercase'}}>
        {t.label}
      </text>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════
   EVENT CARD BACK
════════════════════════════════════════════════════════ */

export function EventCardBack({ width=100, height=160 }) {
  return (
    <svg viewBox="0 0 100 160" width={width} height={height}>
      <defs>
        <radialGradient id="ebg" cx="50%" cy="50%">
          <stop offset="0%"   stopColor="#1a0000"/>
          <stop offset="100%" stopColor="#050000"/>
        </radialGradient>
      </defs>
      <rect width="100" height="160" rx="8" fill="url(#ebg)"/>
      <rect x=".5" y=".5" width="99" height="159" rx="7.5" fill="none"
            stroke="rgba(200,16,16,.7)" strokeWidth="1.5"/>
      <rect x="5" y="5" width="90" height="150" rx="5" fill="none"
            stroke="rgba(200,16,16,.2)" strokeWidth=".7"/>
      {/* Pattern */}
      {Array.from({length:6}).map((_,r)=>
        Array.from({length:4}).map((_,c)=>(
          <text key={`${r}${c}`} x={14+c*24} y={28+r*24}
                fontSize="12" fontFamily="system-ui" opacity=".12">☣️</text>
        ))
      )}
      <text x="50" y="88" textAnchor="middle" fontSize="24" fontFamily="system-ui"
            style={{filter:'drop-shadow(0 0 6px rgba(200,16,16,.8))'}}>☣️</text>
      <text x="50" y="108" textAnchor="middle" fontSize="9"
            fontFamily="'Courier New',monospace" fill="rgba(200,16,16,.8)"
            letterSpacing="2" style={{textTransform:'uppercase'}}>OUTBREAK</text>
      <text x="50" y="120" textAnchor="middle" fontSize="7"
            fontFamily="'Courier New',monospace" fill="rgba(200,16,16,.5)"
            letterSpacing="1">EVENT</text>
    </svg>
  );
}
