/**
 * GamerTab: Black Vault
 * Mansion Mystery — Procedural SVG Floor Plan
 * 9 original rooms · 6 original suspects · custom clue tokens
 * All procedural — royalty-free safe
 */

import React, { useState } from 'react';

/* ── Room definitions ─────────────────────────────────────────── */
const ROOMS = [
  { id:'library',    name:'The Library',    icon:'📚', x:10,  y:10,  w:120, h:100, color:'#3a1a00' },
  { id:'kitchen',    name:'The Kitchen',    icon:'🔪', x:145, y:10,  w:110, h:100, color:'#1a1a00' },
  { id:'study',      name:'The Study',      icon:'🕯', x:270, y:10,  w:120, h:100, color:'#1a0a00' },
  { id:'ballroom',   name:'The Ballroom',   icon:'🎻', x:10,  y:125, w:160, h:120, color:'#0a001a' },
  { id:'hall',       name:'The Grand Hall', icon:'🏛', x:185, y:125, w:100, h:120, color:'#0a0a10' },
  { id:'greenhouse', name:'Greenhouse',     icon:'🌿', x:300, y:125, w:90,  h:120, color:'#001a05' },
  { id:'armory',     name:'The Armory',     icon:'⚔️', x:10,  y:260, w:120, h:110, color:'#1a0000' },
  { id:'crypt',      name:'The Crypt',      icon:'⚰️', x:145, y:260, w:110, h:110, color:'#0a0010' },
  { id:'laboratory', name:'Laboratory',     icon:'🧪', x:270, y:260, w:120, h:110, color:'#001a1a' },
];

/* ── Suspects ─────────────────────────────────────────────────── */
const SUSPECTS = [
  { id:'dr_volt',    name:'Dr. Volt',        icon:'⚡', color:'#cc8800' },
  { id:'ms_shade',   name:'Ms. Shade',       icon:'🌙', color:'#5500aa' },
  { id:'commander',  name:'The Commander',   icon:'🎖', color:'#cc2200' },
  { id:'chef_noir',  name:'Chef Noir',       icon:'🔪', color:'#444466' },
  { id:'lady_rust',  name:'Lady Rust',       icon:'🔩', color:'#885500' },
  { id:'dr_hollow',  name:'Dr. Hollow',      icon:'💀', color:'#006655' },
];

/* ── Weapons/Clues ────────────────────────────────────────────── */
const CLUES = [
  { id:'wrench',    name:'Iron Wrench',    icon:'🔧', color:'#888899' },
  { id:'vial',      name:'Toxin Vial',     icon:'🧪', color:'#22aa44' },
  { id:'blade',     name:'Ceremonial Blade',icon:'🗡', color:'#aaaaaa' },
  { id:'pistol',    name:'Modified Pistol',icon:'🔫', color:'#445566' },
  { id:'rope',      name:'Barbed Wire',    icon:'🔗', color:'#996633' },
  { id:'candlestick',name:'Lead Pipe',     icon:'🔩', color:'#666666' },
];

/* ── Room component ───────────────────────────────────────────── */
function Room({ room, selected, clueInRoom, suspectInRoom, onClick, disabled }) {
  const isSelected = selected === room.id || selected === room.index;
  return (
    <g style={{ cursor: disabled ? 'not-allowed' : 'pointer' }} onClick={() => !disabled && onClick(room.index ?? room.id)}>
      {/* Room floor */}
      <rect x={room.x} y={room.y} width={room.w} height={room.h}
            rx="4" fill={room.color}
            stroke={isSelected ? '#ff4444' : 'rgba(200,16,16,.28)'}
            strokeWidth={isSelected ? 2 : 1}/>
      {/* Floor texture lines */}
      {Array.from({length:4}).map((_,i) => (
        <line key={i}
              x1={room.x+4} y1={room.y + 16 + i*18}
              x2={room.x+room.w-4} y2={room.y + 16 + i*18}
              stroke="rgba(255,255,255,.04)" strokeWidth=".7"/>
      ))}
      {/* Glow if selected */}
      {isSelected && (
        <rect x={room.x} y={room.y} width={room.w} height={room.h}
              rx="4" fill="rgba(200,16,16,.1)"/>
      )}
      {/* Door gap indicator */}
      <rect x={room.x + room.w/2 - 6} y={room.y - 1} width={12} height={3}
            fill="#09090e"/>
      {/* Room label strip */}
      <rect x={room.x} y={room.y} width={room.w} height={20} rx="3"
            fill="rgba(0,0,0,.5)"/>
      {/* Icon */}
      <text x={room.x+10} y={room.y+14} fontSize="11" fontFamily="system-ui">{room.icon}</text>
      {/* Name */}
      <text x={room.x+24} y={room.y+14} fontSize="7.5"
            fontFamily="'Courier New',monospace" fill="#c0c0d0"
            letterSpacing=".5" style={{textTransform:'uppercase'}}>
        {room.name}
      </text>
      {/* Clue token */}
      {clueInRoom && (
        <g>
          <circle cx={room.x+room.w-16} cy={room.y+room.h-16} r="10"
                  fill="rgba(201,162,39,.2)" stroke="rgba(201,162,39,.6)" strokeWidth="1">
            <animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/>
          </circle>
          <text x={room.x+room.w-16} y={room.y+room.h-12} textAnchor="middle"
                fontSize="10" fontFamily="system-ui">{clueInRoom.icon}</text>
        </g>
      )}
      {/* Suspect token */}
      {suspectInRoom && (
        <circle cx={room.x+14} cy={room.y+room.h-14} r="9"
                fill={suspectInRoom.color} stroke="rgba(255,255,255,.4)" strokeWidth="1">
          <text>{suspectInRoom.icon}</text>
        </circle>
      )}
    </g>
  );
}

/* ── Investigation notepad ────────────────────────────────────── */
function InvestigationPad({ checked, onToggle }) {
  return (
    <div style={{
      background:'linear-gradient(160deg,#14141d,#0c0c12)',
      border:'1px solid rgba(200,16,16,.3)',
      borderRadius:8, padding:10, fontFamily:"'Courier New',monospace",
      fontSize:9, color:'#a0a0b8', minWidth:140
    }}>
      <div style={{ color:'#ff4444', fontWeight:700, letterSpacing:2,
                    textTransform:'uppercase', fontSize:10, marginBottom:8,
                    textShadow:'0 0 6px rgba(200,16,16,.5)' }}>
        ☠ CASE FILE
      </div>
      <div style={{ marginBottom:6, color:'#666680', letterSpacing:1, fontSize:8 }}>SUSPECTS</div>
      {SUSPECTS.map(s => (
        <div key={s.id} onClick={() => onToggle('s_'+s.id)}
             style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0',
                      cursor:'pointer', opacity:checked.has('s_'+s.id)?.4:1,
                      textDecoration:checked.has('s_'+s.id)?'line-through':'none' }}>
          <span>{s.icon}</span>
          <span>{s.name}</span>
        </div>
      ))}
      <div style={{ marginTop:8, marginBottom:6, color:'#666680', letterSpacing:1, fontSize:8 }}>WEAPONS</div>
      {CLUES.map(c => (
        <div key={c.id} onClick={() => onToggle('c_'+c.id)}
             style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0',
                      cursor:'pointer', opacity:checked.has('c_'+c.id)?.4:1,
                      textDecoration:checked.has('c_'+c.id)?'line-through':'none' }}>
          <span>{c.icon}</span>
          <span>{c.name}</span>
        </div>
      ))}
      <div style={{ marginTop:8, marginBottom:6, color:'#666680', letterSpacing:1, fontSize:8 }}>ROOMS</div>
      {ROOMS.map(r => (
        <div key={r.id} onClick={() => onToggle('r_'+r.id)}
             style={{ display:'flex', alignItems:'center', gap:6, padding:'2px 0',
                      cursor:'pointer', opacity:checked.has('r_'+r.id)?.4:1,
                      textDecoration:checked.has('r_'+r.id)?'line-through':'none' }}>
          <span>{r.icon}</span>
          <span>{r.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────── */
export default function MansionMysteryMap({
  cluePositions: propCluePositions,
  suspectPositions: propSuspectPositions,
  selected: selectedProp,
  onRoomSelect,
  checked: checkedProp,
  onToggle,
  disabled = false,
}) {
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(new Set());

  const cluePositions = propCluePositions || { wrench:'library', vial:'crypt' };
  const suspectPositions = propSuspectPositions || { dr_volt:'ballroom', ms_shade:'laboratory' };
  const currentSelected = selectedProp !== undefined ? selectedProp : selected;
  const currentChecked = checkedProp !== undefined ? checkedProp : checked;

  const handleClick = (id) => {
    if (disabled) return;
    if (onRoomSelect) {
      onRoomSelect(id);
      return;
    }
    setSelected(currentSelected === id ? null : id);
  };

  const handleToggle = (id) => {
    if (onToggle) {
      onToggle(id);
      return;
    }
    setChecked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{
      background:'#020203', padding:12, borderRadius:14,
      boxShadow:'0 0 0 1px rgba(200,16,16,.3), 0 20px 60px rgba(0,0,0,.9)',
      display:'flex', gap:12, alignItems:'flex-start'
    }}>
      <div>
        {/* Title */}
        <div style={{
          fontFamily:"'Courier New',monospace", fontSize:10, color:'rgba(200,16,16,.7)',
          letterSpacing:3, textTransform:'uppercase', marginBottom:6
        }}>
          ☠ Mansion Mystery — Floor Plan
        </div>

        <svg viewBox="0 0 400 380" width="100%" style={{ maxWidth:460, display:'block' }}
             xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="mmbg" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#0d0d14"/>
              <stop offset="100%" stopColor="#060609"/>
            </radialGradient>
          </defs>
          {/* Background */}
          <rect width="400" height="380" fill="url(#mmbg)" rx="6"/>
          {/* Grid floor pattern */}
          {Array.from({length:20}).map((_,i) => (
            <line key={`h${i}`} x1="0" y1={i*20} x2="400" y2={i*20}
                  stroke="rgba(255,255,255,.025)" strokeWidth=".5"/>
          ))}
          {Array.from({length:20}).map((_,i) => (
            <line key={`v${i}`} x1={i*20} y1="0" x2={i*20} y2="380"
                  stroke="rgba(255,255,255,.025)" strokeWidth=".5"/>
          ))}
          {/* Outer mansion wall */}
          <rect x="5" y="5" width="390" height="370" rx="5"
                fill="none" stroke="rgba(200,16,16,.35)" strokeWidth="1.5"/>
          <rect x="8" y="8" width="384" height="364" rx="4"
                fill="none" stroke="rgba(200,16,16,.08)" strokeWidth=".7"/>

          {/* Rooms */}
          {ROOMS.map((room, index) => {
            const clueId = Object.entries(cluePositions).find(([,r])=>r===room.id)?.[0];
            const suspId = Object.entries(suspectPositions).find(([,r])=>r===room.id)?.[0];
            return (
              <Room key={room.id} room={{ ...room, index }} selected={currentSelected}
                    clueInRoom={clueId ? CLUES.find(c=>c.id===clueId) : null}
                    suspectInRoom={suspId ? SUSPECTS.find(s=>s.id===suspId) : null}
                    onClick={handleClick} disabled={disabled}/>
            );
          })}

          {/* Corridor labels */}
          <text x="200" y="248" textAnchor="middle" fontSize="7"
                fontFamily="'Courier New',monospace" fill="rgba(255,255,255,.2)"
                letterSpacing="2" style={{textTransform:'uppercase'}}>
            ── MAIN CORRIDOR ──
          </text>

          {/* Compass rose */}
          <g transform="translate(375,360)">
            <circle cx="0" cy="0" r="10" fill="rgba(0,0,0,.5)"
                    stroke="rgba(200,16,16,.3)" strokeWidth=".8"/>
            <text x="0" y="-3" textAnchor="middle" fontSize="6"
                  fontFamily="'Courier New',monospace" fill="rgba(200,16,16,.7)">N</text>
            <line x1="0" y1="-9" x2="0" y2="-5" stroke="rgba(200,16,16,.6)" strokeWidth="1"/>
          </g>
        </svg>

        {/* Selected room info */}
        {selected && (() => {
          const room = ROOMS.find(r=>r.id===selected);
          const clueId = Object.entries(cluePositions).find(([,r])=>r===selected)?.[0];
          const suspId = Object.entries(suspectPositions).find(([,r])=>r===selected)?.[0];
          return room ? (
            <div style={{
              marginTop:8, background:'rgba(20,0,0,.9)',
              border:'1px solid rgba(200,16,16,.4)', borderRadius:8,
              padding:'8px 12px', fontFamily:"'Courier New',monospace",
              fontSize:10, color:'#e0e0ec', display:'flex', gap:10
            }}>
              <span style={{ fontSize:18 }}>{room.icon}</span>
              <div>
                <div style={{ color:'#ff5555', fontWeight:700, letterSpacing:2, marginBottom:2, textTransform:'uppercase' }}>
                  {room.name}
                </div>
                {clueId && <div>Clue: {CLUES.find(c=>c.id===clueId)?.name}</div>}
                {suspId && <div>Suspect: {SUSPECTS.find(s=>s.id===suspId)?.name}</div>}
                {!clueId && !suspId && <div style={{ color:'#666680' }}>Room clear</div>}
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Investigation notepad */}
      <InvestigationPad checked={checked} onToggle={handleToggle}/>
    </div>
  );
}
