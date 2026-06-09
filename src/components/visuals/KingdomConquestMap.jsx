/**
 * GamerTab: Black Vault
 * Kingdom Conquest — Hex Territory Map + Battle UI
 * 5 original factions · procedural hexagonal map
 * All original art — royalty-free safe
 */

import React, { useState } from 'react';

/* ── Factions ─────────────────────────────────────────────────── */
const FACTIONS = {
  iron:   { name:'Iron Throne',    color:'#cc1111', dark:'#5a0000', symbol:'⚔', army:'💀' },
  shadow: { name:'Shadow Syndicate',color:'#5500aa', dark:'#220044', symbol:'👁', army:'🕷' },
  steel:  { name:'Steel Legion',   color:'#3355cc', dark:'#001166', symbol:'🛡', army:'⚙' },
  ember:  { name:'Ember Covenant', color:'#cc6600', dark:'#663300', symbol:'🔥', army:'🏹' },
  void:   { name:'Void Dominion',  color:'#00aa88', dark:'#004433', symbol:'💎', army:'✦' },
  neutral:{ name:'Unclaimed',      color:'#333344', dark:'#1a1a22', symbol:'',   army:''  },
};

/* ── Hex grid math ────────────────────────────────────────────── */
const HEX_SIZE = 36;
const HEX_W = HEX_SIZE * 2;
const HEX_H = Math.sqrt(3) * HEX_SIZE;

function hexCorners(cx, cy, size) {
  return Array.from({length:6}, (_,i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`;
  }).join(' ');
}

function axialToPixel(q, r) {
  const x = HEX_SIZE * (3/2 * q);
  const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
  return { x: x + 220, y: y + 200 };
}

/* ── Territory definitions (hex grid) ───────────────────────────*/
const TERRITORIES = [
  // centre
  { id:'t0',  q:0,  r:0,  name:'The Citadel',   faction:'iron',   armies:4, type:'fortress' },
  // ring 1
  { id:'t1',  q:1,  r:0,  name:'Iron Gate',      faction:'iron',   armies:2, type:'plains'   },
  { id:'t2',  q:1,  r:-1, name:'Crimson Pass',   faction:'iron',   armies:2, type:'mountain' },
  { id:'t3',  q:0,  r:-1, name:'The Spire Peak', faction:'neutral',armies:0, type:'mountain' },
  { id:'t4',  q:-1, r:0,  name:'Shadow Keep',    faction:'shadow', armies:3, type:'fortress' },
  { id:'t5',  q:-1, r:1,  name:'Dark Wood',      faction:'shadow', armies:1, type:'forest'   },
  { id:'t6',  q:0,  r:1,  name:'River Delta',    faction:'neutral',armies:0, type:'water'    },
  // ring 2
  { id:'t7',  q:2,  r:0,  name:'Forge District', faction:'steel',  armies:3, type:'plains'   },
  { id:'t8',  q:2,  r:-1, name:'Anvil Ridge',    faction:'steel',  armies:2, type:'mountain' },
  { id:'t9',  q:2,  r:-2, name:'Steel Bastion',  faction:'steel',  armies:4, type:'fortress' },
  { id:'t10', q:1,  r:-2, name:'Ember Crossing', faction:'ember',  armies:2, type:'plains'   },
  { id:'t11', q:0,  r:-2, name:'Ashfield',       faction:'ember',  armies:3, type:'plains'   },
  { id:'t12', q:-1, r:-1, name:'Scorched Vale',  faction:'ember',  armies:1, type:'wasteland'},
  { id:'t13', q:-2, r:0,  name:'Void Gate',      faction:'void',   armies:3, type:'fortress' },
  { id:'t14', q:-2, r:1,  name:'Teal Marsh',     faction:'void',   armies:2, type:'water'    },
  { id:'t15', q:-2, r:2,  name:'Crystal Caves',  faction:'void',   armies:2, type:'mountain' },
  { id:'t16', q:-1, r:2,  name:'The Shallows',   faction:'neutral',armies:0, type:'water'    },
  { id:'t17', q:0,  r:2,  name:'Lowland Fields', faction:'neutral',armies:0, type:'plains'   },
  { id:'t18', q:1,  r:1,  name:'Outpost Bravo',  faction:'iron',   armies:1, type:'plains'   },
];

/* ── Terrain colours ─────────────────────────────────────────── */
const TERRAIN = {
  plains:   { fill:'#0a1a08', stroke:'rgba(60,120,30,.4)' },
  mountain: { fill:'#1a1620', stroke:'rgba(120,100,80,.4)' },
  water:    { fill:'#081820', stroke:'rgba(20,80,140,.4)' },
  forest:   { fill:'#081408', stroke:'rgba(20,100,20,.4)' },
  fortress: { fill:'#1a0808', stroke:'rgba(160,20,20,.4)' },
  wasteland:{ fill:'#18140a', stroke:'rgba(120,80,20,.4)' },
};

/* ── Hex territory ────────────────────────────────────────────── */
function HexTerritory({ territory, selected, attacking, onClick }) {
  const { x, y } = axialToPixel(territory.q, territory.r);
  const fac = FACTIONS[territory.faction] || FACTIONS.neutral;
  const terrain = TERRAIN[territory.type] || TERRAIN.plains;
  const isSel = selected === territory.id || selected === territory.index;
  const isAtk = attacking === territory.id || attacking === territory.index;
  const armyCount = typeof territory.armies === 'number'
    ? territory.armies
    : territory.armies && typeof territory.armies === 'object'
      ? (territory.armies.X || 0) + (territory.armies.O || 0)
      : 0;
  const ownerColor = territory.owned === 'X' ? '#cc3333' : territory.owned === 'O' ? '#3366cc' : null;
  const strokeColor = ownerColor || (isAtk ? '#ffdd00' : isSel ? '#ff4444' : fac.color);
  const fillColor = territory.owned ? 'rgba(255,255,255,.05)' : `${fac.dark}cc`;

  const innerSize = HEX_SIZE - 4;

  return (
    <g style={{ cursor:'pointer' }} onClick={() => onClick(territory.index ?? territory.id)}>
      {/* Outer hex (terrain) */}
      <polygon points={hexCorners(x, y, HEX_SIZE)}
               fill={terrain.fill} stroke={terrain.stroke} strokeWidth="1"/>
      {/* Faction colour hex */}
      <polygon points={hexCorners(x, y, innerSize)}
               fill={fillColor}
               stroke={strokeColor}
               strokeWidth={isAtk || isSel ? 2.5 : 1.5}
               opacity={territory.faction === 'neutral' ? .5 : .9}>
        {(isSel || isAtk) && (
          <animate attributeName="opacity" values=".7;1;.7" dur="1s" repeatCount="indefinite"/>
        )}
      </polygon>
      {/* Faction symbol */}
      {fac.symbol && (
        <text x={x} y={y+5} textAnchor="middle" fontSize="14"
              fontFamily="system-ui"
              style={{ filter: isSel ? `drop-shadow(0 0 5px ${fac.color})` : 'none' }}>
          {fac.symbol}
        </text>
      )}
      {/* Army count badge */}
      {armyCount > 0 && (
        <g>
          <circle cx={x+18} cy={y-18} r="9"
                  fill={fac.dark} stroke={fac.color} strokeWidth="1"/>
          <text x={x+18} y={y-14} textAnchor="middle"
                fontSize="9" fontWeight="700"
                fontFamily="'Courier New',monospace" fill={fac.color}>
            {armyCount}
          </text>
        </g>
      )}
      {/* Territory name */}
      <text x={x} y={y+22} textAnchor="middle" fontSize="5.5"
            fontFamily="'Courier New',monospace"
            fill="rgba(200,200,220,.5)" letterSpacing=".5">
        {territory.name.toUpperCase()}
      </text>
    </g>
  );
}

/* ── Battle resolution UI ─────────────────────────────────────── */
function BattleUI({ attacker, defender, onClose }) {
  const [resolved, setResolved] = useState(false);
  const [atkRoll] = useState(() => Array.from({length:3},()=>Math.ceil(Math.random()*6)).sort((a,b)=>b-a));
  const [defRoll] = useState(() => Array.from({length:2},()=>Math.ceil(Math.random()*6)).sort((a,b)=>b-a));

  const atk = FACTIONS[attacker?.faction] || FACTIONS.iron;
  const def = FACTIONS[defender?.faction] || FACTIONS.neutral;

  return (
    <div style={{
      background:'linear-gradient(160deg,#1a0000,#0a0000)',
      border:'2px solid rgba(200,16,16,.6)',
      borderRadius:12, padding:16,
      fontFamily:"'Courier New',monospace",
      boxShadow:'0 0 30px rgba(200,16,16,.3)',
      minWidth:260,
    }}>
      <div style={{ color:'#ff4444', fontSize:11, fontWeight:700,
                    letterSpacing:3, textTransform:'uppercase', marginBottom:12,
                    textShadow:'0 0 8px rgba(200,16,16,.6)' }}>
        ⚔ BATTLE ⚔
      </div>

      {/* Combatants */}
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12, gap:8 }}>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:20 }}>{atk.symbol}</div>
          <div style={{ color:atk.color, fontSize:9, textTransform:'uppercase', letterSpacing:1 }}>
            {atk.name}
          </div>
          <div style={{ color:'#808096', fontSize:8 }}>{attacker?.name}</div>
        </div>
        <div style={{ color:'#ff4444', fontSize:16, alignSelf:'center' }}>VS</div>
        <div style={{ flex:1, textAlign:'center' }}>
          <div style={{ fontSize:20 }}>{def.symbol}</div>
          <div style={{ color:def.color, fontSize:9, textTransform:'uppercase', letterSpacing:1 }}>
            {def.name}
          </div>
          <div style={{ color:'#808096', fontSize:8 }}>{defender?.name}</div>
        </div>
      </div>

      {/* Dice rolls */}
      <div style={{ display:'flex', justifyContent:'space-between', gap:8, marginBottom:12 }}>
        <div>
          <div style={{ fontSize:8, color:'#808096', marginBottom:4 }}>ATTACKER ({atk.army}{atk.army}{atk.army})</div>
          <div style={{ display:'flex', gap:4 }}>
            {atkRoll.map((v,i) => (
              <div key={i} style={{
                width:28, height:28, borderRadius:5,
                background:'linear-gradient(135deg,#220000,#110000)',
                border:`1px solid ${atk.color}`, display:'flex',
                alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:900, color:atk.color,
              }}>{v}</div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize:8, color:'#808096', marginBottom:4 }}>DEFENDER</div>
          <div style={{ display:'flex', gap:4 }}>
            {defRoll.map((v,i) => (
              <div key={i} style={{
                width:28, height:28, borderRadius:5,
                background:'linear-gradient(135deg,#000022,#000011)',
                border:`1px solid ${def.color}`, display:'flex',
                alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:900, color:def.color,
              }}>{v}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Result */}
      <div style={{ marginBottom:10 }}>
        {atkRoll.slice(0,2).map((atk,i) => {
          const d = defRoll[i];
          if (!d) return null;
          const win = atk > d;
          return (
            <div key={i} style={{ display:'flex', justifyContent:'space-between',
                                  padding:'3px 0', borderBottom:'1px solid rgba(255,255,255,.05)',
                                  fontSize:9, color: win?'#55ff77':'#ff5555' }}>
              <span>{atk} vs {d}</span>
              <span>{win ? '⚔ Attacker wins' : '🛡 Defender wins'}</span>
            </div>
          );
        })}
      </div>

      <button onClick={onClose}
              style={{
                width:'100%', padding:'8px', borderRadius:6,
                background:'linear-gradient(135deg,#5a0000,#8b0000)',
                border:'1px solid rgba(200,16,16,.5)',
                color:'#fff', fontFamily:"'Courier New',monospace",
                fontSize:9, fontWeight:700, letterSpacing:2,
                cursor:'pointer', textTransform:'uppercase',
              }}>
        CONFIRM
      </button>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────── */
export default function KingdomConquestMap({
  territories: propTerritories,
  selected: selectedProp,
  onTerritoryClick,
  battle: battleProp,
  onBattleClose,
  disabled = false,
}) {
  const [selected, setSelected] = useState(null);
  const [battle, setBattle] = useState(null);

  const territories = propTerritories || TERRITORIES;
  const currentSelected = selectedProp !== undefined ? selectedProp : selected;
  const currentBattle = battleProp !== undefined ? battleProp : battle;
  const selectedTerritory = territories.find(
    (t) => t.id === currentSelected || t.index === currentSelected
  );

  const handleClick = (id) => {
    if (disabled) return;
    if (onTerritoryClick) {
      onTerritoryClick(id);
      return;
    }

    if (currentSelected && id !== currentSelected) {
      const sel = territories.find(
        (t) => t.id === currentSelected || t.index === currentSelected
      );
      const target = territories.find((t) => t.id === id || t.index === id);
      if (sel && target && sel.faction !== target.faction && target.faction !== 'neutral') {
        setBattle({ attacker: sel, defender: target });
        return;
      }
    }
    setSelected(id === currentSelected ? null : id);
  };

  return (
    <div style={{
      background:'#020203', padding:12, borderRadius:14,
      boxShadow:'0 0 0 1px rgba(200,16,16,.3), 0 20px 60px rgba(0,0,0,.9)',
    }}>
      <div style={{
        fontFamily:"'Courier New',monospace", fontSize:10,
        color:'rgba(200,16,16,.7)', letterSpacing:3,
        textTransform:'uppercase', marginBottom:8
      }}>
        ⚔ Kingdom Conquest — Territory Map
      </div>

      <div style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
        {/* Map */}
        <div style={{ position:'relative' }}>
          <svg viewBox="0 0 440 440" width="100%" style={{ maxWidth:440 }}>
            <defs>
              <radialGradient id="kcbg" cx="50%" cy="50%">
                <stop offset="0%" stopColor="#0d0d14"/>
                <stop offset="100%" stopColor="#060609"/>
              </radialGradient>
            </defs>
            <rect width="440" height="440" fill="url(#kcbg)" rx="8"/>
            {/* Grid dots */}
            {Array.from({length:12}).map((_,r)=>
              Array.from({length:12}).map((_,c)=>(
                <circle key={`${r}${c}`} cx={20+c*36} cy={20+r*36} r=".8"
                        fill="rgba(200,16,16,.08)"/>
              ))
            )}
            {/* Territories */}
            {territories.map((t, index) => (
              <HexTerritory key={t.id ?? index} territory={{ ...t, index }}
                            selected={currentSelected} attacking={null}
                            onClick={handleClick}/>
            ))}
            {/* Map title */}
            <text x="220" y="430" textAnchor="middle" fontSize="8"
                  fontFamily="'Courier New',monospace"
                  fill="rgba(200,16,16,.3)" letterSpacing="4">
              THE SHATTERED REALMS
            </text>
          </svg>
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, minWidth:160 }}>
          {/* Faction legend */}
          <div style={{
            background:'rgba(14,14,20,.95)', border:'1px solid rgba(200,16,16,.25)',
            borderRadius:8, padding:10,
            fontFamily:"'Courier New',monospace", fontSize:9,
          }}>
            <div style={{ color:'#ff4444', fontWeight:700, letterSpacing:2,
                          textTransform:'uppercase', marginBottom:8 }}>FACTIONS</div>
            {Object.entries(FACTIONS).filter(([k])=>k!=='neutral').map(([key,fac])=>(
              <div key={key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:fac.color }}/>
                <span style={{ color:fac.color }}>{fac.symbol}</span>
                <span style={{ color:'#a0a0b8' }}>{fac.name}</span>
                <span style={{ color:'#555566', marginLeft:'auto' }}>
                  {TERRITORIES.filter(t=>t.faction===key).length}t
                </span>
              </div>
            ))}
          </div>

          {/* Selected territory info */}
          {selectedTerritory && (
            <div style={{
              background:'rgba(20,0,0,.9)', border:'1px solid rgba(200,16,16,.4)',
              borderRadius:8, padding:10,
              fontFamily:"'Courier New',monospace", fontSize:9,
            }}>
              <div style={{ color:'#ff4444', fontWeight:700, letterSpacing:2,
                            textTransform:'uppercase', marginBottom:6 }}>
                TERRITORY INFO
              </div>
              <div style={{ color:'#e0e0ec', marginBottom:3 }}>{selectedTerritory.name}</div>
              <div style={{ color:FACTIONS[selectedTerritory.faction]?.color }}>
                {FACTIONS[selectedTerritory.faction]?.name}
              </div>
              <div style={{ color:'#808096', marginTop:4 }}>
                Armies: {typeof selectedTerritory.armies === 'number' ? selectedTerritory.armies : (selectedTerritory.armies?.X || 0) + (selectedTerritory.armies?.O || 0)}<br/>
                Terrain: {selectedTerritory.type}
              </div>
              {selectedTerritory.faction !== 'neutral' && (
                <div style={{ color:'#808096', fontSize:8, marginTop:6 }}>
                  Select another faction's territory to attack
                </div>
              )}
            </div>
          )}

          {/* Battle UI */}
          {currentBattle && (
            <BattleUI attacker={currentBattle.attacker} defender={currentBattle.defender}
                      onClose={() => {
                        if (onBattleClose) onBattleClose();
                        else { setBattle(null); setSelected(null); }
                      }}/>
          )}
        </div>
      </div>
    </div>
  );
}
