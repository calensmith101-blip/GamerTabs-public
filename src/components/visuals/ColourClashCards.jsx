/**
 * GamerTab: Black Vault
 * Colour Clash — Full Card Design System
 * Original card designs. No UNO assets.
 * Supports: Number cards (0-9), Skip, Reverse, Draw2, Wild, WildDraw4
 */

import React, { useState } from 'react';

/* ── Card colour palettes ─────────────────────────────────────── */
const COLOURS = {
  red:    { bg:['#3d0808','#1a0303'], border:'rgba(220,40,40,.75)', glow:'rgba(200,0,0,.45)', text:'#ff6666', accent:'#ff2222', dark:'#7a0000' },
  blue:   { bg:['#08082e','#04041a'], border:'rgba(40,80,230,.75)',  glow:'rgba(0,40,200,.45)', text:'#6699ff', accent:'#2244ff', dark:'#001177' },
  green:  { bg:['#0a2a0a','#041404'], border:'rgba(40,190,40,.75)', glow:'rgba(0,170,0,.45)',  text:'#55ee77', accent:'#00cc22', dark:'#005511' },
  yellow: { bg:['#2a1e08','#140e04'], border:'rgba(230,200,30,.75)',glow:'rgba(200,170,0,.45)', text:'#ffdd44', accent:'#ffbb00', dark:'#665500' },
  wild:   { bg:['#1a0020','#0a0014'], border:'rgba(200,80,220,.6)', glow:'rgba(160,0,180,.4)', text:'#dd88ff', accent:'#cc00ff', dark:'#440055' },
};

/* ── Special symbol SVGs ──────────────────────────────────────── */
const SpecialSymbol = ({ type, col, size=42 }) => {
  const c = col?.text || '#fff';
  const s = size;
  if (type === 'skip')    return (
    <svg width={s} height={s} viewBox="0 0 42 42">
      <circle cx="21" cy="21" r="18" fill="none" stroke={c} strokeWidth="3"/>
      <line x1="8" y1="8" x2="34" y2="34" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <text x="21" y="27" textAnchor="middle" fontSize="20" fill={c} fontWeight="900">✕</text>
    </svg>
  );
  if (type === 'reverse') return (
    <svg width={s} height={s} viewBox="0 0 42 42">
      <path d="M10,16 A14,14 0 0,1 32,16" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <path d="M10,26 A14,14 0 0,0 32,26" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"/>
      <polygon points="6,12 10,20 14,12" fill={c}/>
      <polygon points="36,22 32,30 28,22" fill={c}/>
    </svg>
  );
  if (type === 'draw2')   return (
    <svg width={s} height={s} viewBox="0 0 42 42">
      <rect x="7" y="6" width="20" height="28" rx="3" fill="rgba(0,0,0,.4)" stroke={c} strokeWidth="2"/>
      <rect x="14" y="11" width="20" height="28" rx="3" fill="rgba(0,0,0,.6)" stroke={c} strokeWidth="2"/>
      <text x="24" y="30" textAnchor="middle" fontSize="12" fill={c} fontWeight="900">+2</text>
    </svg>
  );
  if (type === 'wild')    return (
    <svg width={s} height={s} viewBox="0 0 42 42">
      {[['#cc0000',0],['#0044cc',90],['#00aa22',180],['#ccaa00',270]].map(([clr,angle])=>(
        <path key={angle}
              d="M21,21 L21,4 A17,17 0 0,1 34,9 Z"
              fill={clr} transform={`rotate(${angle} 21 21)`} opacity=".9"/>
      ))}
      <circle cx="21" cy="21" r="7" fill="#000"/>
      <text x="21" y="25" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="900">WILD</text>
    </svg>
  );
  if (type === 'draw4')   return (
    <svg width={s} height={s} viewBox="0 0 42 42">
      {[['#cc0000',0],['#0044cc',90],['#00aa22',180],['#ccaa00',270]].map(([clr,angle])=>(
        <path key={angle}
              d="M21,21 L21,4 A17,17 0 0,1 34,9 Z"
              fill={clr} transform={`rotate(${angle} 21 21)`} opacity=".9"/>
      ))}
      <circle cx="21" cy="21" r="8" fill="#000"/>
      <text x="21" y="25" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="900">+4</text>
    </svg>
  );
  return null;
};

/* ── Card back design ─────────────────────────────────────────── */
export function CardBack({ width=80, height=120 }) {
  return (
    <svg viewBox="0 0 80 120" width={width} height={height}>
      <defs>
        <radialGradient id="cbg" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#1a0020"/>
          <stop offset="100%" stopColor="#05000a"/>
        </radialGradient>
      </defs>
      <rect width="80" height="120" rx="10" fill="url(#cbg)"/>
      <rect x=".5" y=".5" width="79" height="119" rx="9.5"
            fill="none" stroke="rgba(200,0,200,.5)" strokeWidth="1.5"/>
      <rect x="5" y="5" width="70" height="110" rx="7"
            fill="none" stroke="rgba(200,0,200,.18)" strokeWidth=".8"/>
      {/* Star pattern */}
      {Array.from({length:5}).map((_,r)=>
        Array.from({length:3}).map((_,c)=>(
          <text key={`${r}${c}`} x={14+c*26} y={22+r*22}
                fontSize="11" fontFamily="system-ui" opacity=".12"
                textAnchor="middle">✦</text>
        ))
      )}
      <text x="40" y="66" textAnchor="middle" fontSize="18" fontFamily="system-ui"
            style={{ filter:'drop-shadow(0 0 5px rgba(200,0,200,.7))' }}>✦</text>
      <text x="40" y="84" textAnchor="middle" fontSize="7.5"
            fontFamily="'Courier New',monospace" fill="rgba(200,80,220,.7)"
            letterSpacing="2" style={{ textTransform:'uppercase' }}>COLOUR CLASH</text>
    </svg>
  );
}

/* ── Main card component ──────────────────────────────────────── */
export function ClashCard({ colour, color, value, type, faceDown=false, size=1 }) {
  if (faceDown) return <CardBack width={80*size} height={120*size}/>;

  const finalColour = (colour || color || 'red').toString().toLowerCase();
  const col = COLOURS[finalColour] || COLOURS.red;
  const isWild = finalColour === 'wild';
  const w = 80, h = 120;

  const isNum = typeof value === 'number';
  const isSpecial = !!type;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w*size} height={h*size}>
      <defs>
        <linearGradient id={`cg${colour}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={col.bg[0]}/>
          <stop offset="100%" stopColor={col.bg[1]}/>
        </linearGradient>
        <filter id={`cgl${colour}`}>
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feComposite in="SourceGraphic" in2="b" operator="over"/>
        </filter>
      </defs>

      {/* Card shadow glow */}
      <rect x="2" y="4" width={w-4} height={h-6} rx="10"
            fill={col.glow} filter={`url(#cgl${colour})`}/>

      {/* Card body */}
      <rect width={w} height={h} rx="10" fill={`url(#cg${colour})`}/>

      {/* Outer border */}
      <rect x=".5" y=".5" width={w-1} height={h-1} rx="9.5"
            fill="none" stroke={col.border} strokeWidth="2"/>

      {/* Inner oval */}
      <ellipse cx={w/2} cy={h/2} rx="28" ry="42"
               fill={`${col.dark}bb`} stroke={col.border} strokeWidth="1" opacity=".7"/>

      {/* Corner values — top-left */}
      <text x="7" y="18" fontSize="13" fontWeight="900"
            fontFamily="'Courier New',monospace" fill={col.text}>
        {isNum ? value : type === 'skip' ? '⊘' : type === 'reverse' ? '⇄' : type === 'draw2' ? '+2' : type === 'wild' ? '★' : type === 'draw4' ? '+4' : ''}
      </text>

      {/* Main centre value */}
      {isNum && (
        <text x={w/2} y={h/2+14} textAnchor="middle"
              fontSize="40" fontWeight="900"
              fontFamily="'Courier New',monospace" fill={col.text}
              style={{ filter:`drop-shadow(0 0 8px ${col.accent})` }}>
          {value}
        </text>
      )}

      {/* Special symbol */}
      {isSpecial && (
        <g transform={`translate(${w/2-21} ${h/2-21})`}>
          <SpecialSymbol type={type} col={col} size={42}/>
        </g>
      )}

      {/* Corner values — bottom-right (rotated) */}
      <text x={w-7} y={h-7} fontSize="13" fontWeight="900"
            fontFamily="'Courier New',monospace" fill={col.text}
            textAnchor="middle"
            transform={`rotate(180 ${w-7} ${h-11})`}>
        {isNum ? value : type === 'skip' ? '⊘' : type === 'reverse' ? '⇄' : type === 'draw2' ? '+2' : type === 'wild' ? '★' : type === 'draw4' ? '+4' : ''}
      </text>

      {/* Holographic sheen */}
      <rect x="3" y="3" width={w-6} height="40" rx="8"
            fill="rgba(255,255,255,.07)"/>

      {/* Colour label */}
      {!isWild && (
        <text x={w/2} y={h-8} textAnchor="middle" fontSize="5.5"
              fontFamily="'Courier New',monospace" fill={col.text}
              letterSpacing="2" style={{ textTransform:'uppercase', opacity:.5 }}>
          {colour}
        </text>
      )}
    </svg>
  );
}

/* ── Draw / Discard Pile ──────────────────────────────────────── */
export function CardPile({ label='DRAW', count=52, topCard }) {
  return (
    <div style={{ position:'relative', width:80, height:120 }}>
      {/* Stack effect */}
      {[6,4,2,0].map(offset => (
        <div key={offset} style={{
          position:'absolute', left:offset, top:-offset,
          opacity: offset===0 ? 1 : .4-offset*.05
        }}>
          <CardBack width={80} height={120}/>
        </div>
      ))}
      {/* Count badge */}
      <div style={{
        position:'absolute', top:-8, right:-8,
        background:'linear-gradient(135deg,#5a0000,#8b0000)',
        border:'1px solid rgba(200,16,16,.7)',
        borderRadius:'50%', width:22, height:22,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:"'Courier New',monospace", fontSize:9, color:'#fff',
        fontWeight:700, boxShadow:'0 0 6px rgba(200,16,16,.5)',
      }}>{count}</div>
      {/* Label */}
      <div style={{
        position:'absolute', bottom:-18,
        fontFamily:"'Courier New',monospace", fontSize:8, color:'#808096',
        width:'100%', textAlign:'center', letterSpacing:2,
        textTransform:'uppercase'
      }}>{label}</div>
    </div>
  );
}

/* ── Card hand demo ───────────────────────────────────────────── */
export function CardHand({ cards = [] }) {
  const [selected, setSelected] = useState(null);
  const defaultCards = [
    { colour:'red',    value:7    },
    { colour:'blue',   value:3    },
    { colour:'green',  type:'skip' },
    { colour:'yellow', value:0    },
    { colour:'wild',   type:'wild' },
    { colour:'red',    type:'draw2'},
  ];
  const hand = cards.length ? cards : defaultCards;

  return (
    <div style={{
      display:'flex', justifyContent:'center',
      gap: selected !== null ? 8 : -12,
      paddingTop:40, position:'relative',
    }}>
      {hand.map((card, i) => {
        const isSel = selected === i;
        return (
          <div key={i}
               onClick={() => setSelected(isSel ? null : i)}
               style={{
                 transform: isSel
                   ? 'translateY(-20px) scale(1.08)'
                   : `translateY(${Math.abs(i-hand.length/2)*2}px) rotate(${(i-hand.length/2)*3}deg)`,
                 transition:'transform 200ms ease',
                 cursor:'pointer', zIndex: isSel ? 10 : i,
                 marginLeft: i>0 ? -24 : 0,
               }}>
            <ClashCard {...card} size={0.9}/>
          </div>
        );
      })}
    </div>
  );
}
