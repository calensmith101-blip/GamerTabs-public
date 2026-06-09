import React, { useState, useEffect, useCallback } from 'react';

/* ================================================================
   CLUEDO-STYLE MYSTERY — Black Vault Edition
   Classic Cluedo rules: suspects, weapons, rooms, board movement,
   suggestions, deduction notepad, accusations.
================================================================ */

const SUSPECTS = [
  { id:'scarlett', name:'Miss Scarlett',   color:'#c0392b', icon:'👩‍🦰' },
  { id:'mustard',  name:'Col. Mustard',    color:'#e8b800', icon:'👴' },
  { id:'white',    name:'Mrs. White',      color:'#ecf0f1', icon:'👩‍🦳' },
  { id:'green',    name:'Rev. Green',      color:'#27ae60', icon:'🧑' },
  { id:'peacock',  name:'Mrs. Peacock',    color:'#2980b9', icon:'👩' },
  { id:'plum',     name:'Prof. Plum',      color:'#8e44ad', icon:'👨‍🦲' },
];

const WEAPONS = [
  { id:'candlestick', name:'Candlestick',  icon:'🕯️' },
  { id:'knife',       name:'Knife',         icon:'🔪' },
  { id:'pipe',        name:'Lead Pipe',     icon:'🔩' },
  { id:'revolver',    name:'Revolver',      icon:'🔫' },
  { id:'rope',        name:'Rope',          icon:'🪢' },
  { id:'wrench',      name:'Wrench',        icon:'🔧' },
];

const ROOMS = [
  { id:'kitchen',    name:'Kitchen',        icon:'🍳', row:0, col:0 },
  { id:'ballroom',   name:'Ballroom',       icon:'💃', row:0, col:1 },
  { id:'conserv',   name:'Conservatory',   icon:'🌿', row:0, col:2 },
  { id:'billiard',   name:'Billiard Room',  icon:'🎱', row:1, col:0 },
  { id:'library',    name:'Library',        icon:'📚', row:1, col:1 },
  { id:'study',      name:'Study',          icon:'🖊️', row:1, col:2 },
  { id:'hall',       name:'Hall',           icon:'🚪', row:2, col:0 },
  { id:'lounge',     name:'Lounge',         icon:'🛋️', row:2, col:1 },
  { id:'dining',     name:'Dining Room',    icon:'🍽️', row:2, col:2 },
];

// Adjacent rooms (by room id)
const ADJACENCY = {
  kitchen:  ['ballroom','billiard'],
  ballroom: ['kitchen','conserv','library'],
  conserv:  ['ballroom','study'],
  billiard: ['kitchen','library','hall'],
  library:  ['ballroom','billiard','study','lounge'],
  study:    ['conserv','library','dining'],
  hall:     ['billiard','lounge'],
  lounge:   ['library','hall','dining'],
  dining:   ['study','lounge'],
};

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function initGame(numAI = 2) {
  // Pick secret solution
  const secSuspect = SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)];
  const secWeapon  = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
  const secRoom    = ROOMS[Math.floor(Math.random() * ROOMS.length)];

  // All non-solution cards
  const remaining = shuffle([
    ...SUSPECTS.filter(s => s.id !== secSuspect.id).map(s => ({ type:'suspect', id:s.id, name:s.name })),
    ...WEAPONS.filter(w => w.id !== secWeapon.id).map(w => ({ type:'weapon',  id:w.id, name:w.name })),
    ...ROOMS.filter(r => r.id !== secRoom.id).map(r => ({ type:'room',    id:r.id, name:r.name })),
  ]);

  // Deal to players
  const totalPlayers = 1 + numAI;
  const hands = Array.from({ length: totalPlayers }, () => []);
  remaining.forEach((c, i) => hands[i % totalPlayers].push(c));

  // AI players — each gets a room to start in
  const aiRooms = shuffle([...ROOMS]).slice(0, numAI).map(r => r.id);

  return {
    solution: { suspect: secSuspect.id, weapon: secWeapon.id, room: secRoom.id },
    hands,
    playerRoom: 'hall',
    aiRooms,
    notes: {}, // key: cardId → 'safe' | 'suspect' | 'shown-by-N'
    log: ['🕵️ Case opened. Find the culprit, weapon, and room!'],
    turn: 0,    // 0=player
    phase: 'move', // move | suggest | accuse | gameover
    winner: null,
    eliminated: [],  // player indices eliminated
    aiNotes: Array.from({ length: numAI }, () => ({})), // AI deduction notebooks
    numAI,
  };
}

// AI suggestion logic: pick something it hasn't eliminated yet
function aiMakeSuggestion(g, aiIdx, roomId) {
  const aiNote = g.aiNotes[aiIdx];
  const safe = new Set(Object.entries(aiNote).filter(([,v]) => v === 'safe').map(([k]) => k));
  const unknownSuspects = SUSPECTS.filter(s => !safe.has(s.id));
  const unknownWeapons  = WEAPONS.filter(w => !safe.has(w.id));
  const suspect = unknownSuspects[Math.floor(Math.random() * unknownSuspects.length)];
  const weapon  = unknownWeapons[Math.floor(Math.random() * unknownWeapons.length)];
  return { suspect: suspect.id, weapon: weapon.id, room: roomId };
}

// Find who shows a card for a suggestion
function processsuggestion(g, suggestingPlayerIdx, suggestion) {
  const total = 1 + g.numAI;
  let showingPlayer = null;
  let shownCard = null;

  for (let offset = 1; offset < total; offset++) {
    const idx = (suggestingPlayerIdx + offset) % total;
    const hand = g.hands[idx];
    const matches = hand.filter(c =>
      c.id === suggestion.suspect || c.id === suggestion.weapon || c.id === suggestion.room
    );
    if (matches.length > 0) {
      showingPlayer = idx;
      shownCard = matches[Math.floor(Math.random() * matches.length)];
      break;
    }
  }
  return { showingPlayer, shownCard };
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Mansion Mystery</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4>
        <p>Deduce the <b>Suspect</b>, <b>Weapon</b>, and <b>Room</b> in the sealed Incident Envelope.</p>
        <h4>Setup</h4>
        <p>One of each is sealed in the envelope. All other cards are dealt to players (including AI).</p>
        <h4>On Your Turn</h4>
        <ul>
          <li><b>Move</b> to an adjacent room by clicking it (highlighted in gold).</li>
          <li>Once in a room, click <b>Make Suggestion</b> to name a suspect + weapon in that room.</li>
          <li>Each other player in clockwise order must show you one card from the suggestion if they hold it.</li>
          <li>Cards shown = NOT in the envelope. Mark them in your Notepad.</li>
        </ul>
        <h4>Accusation</h4>
        <p>When confident, click <b>Make Accusation</b>. Name all three. Correct = you win! Wrong = you're eliminated.</p>
        <h4>Notepad</h4>
        <p>Use the Notepad tab to cross off eliminated suspects, weapons and rooms.</p>
      </div>
    </div>
  </div>
);

export default function MansionMystery(props) {
  const { onBack, onExit, gameMode, game } = props || {};
  const exit = onBack || onExit || null;

  const NUM_AI = 2;
  const [g, setG] = useState(() => initGame(NUM_AI));
  const [tab, setTab] = useState('board');
  const [sug, setSug] = useState({ suspect: SUSPECTS[0].id, weapon: WEAPONS[0].id });
  const [acc, setAcc] = useState({ suspect: SUSPECTS[0].id, weapon: WEAPONS[0].id, room: ROOMS[0].id });
  const [showHelp, setShowHelp] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const addLog = (msg, state) => ({
    ...state,
    log: [msg, ...(state.log || [])].slice(0, 20),
  });

  const reset = () => {
    setG(initGame(NUM_AI));
    setTab('board');
    setSug({ suspect: SUSPECTS[0].id, weapon: WEAPONS[0].id });
    setAcc({ suspect: SUSPECTS[0].id, weapon: WEAPONS[0].id, room: ROOMS[0].id });
  };

  // ── Player: move to adjacent room ─────────────────────────────────────────
  const handleMove = (roomId) => {
    if (g.phase !== 'move' || g.turn !== 0) return;
    const adj = ADJACENCY[g.playerRoom] || [];
    if (!adj.includes(roomId)) return;
    setG(prev => addLog(`🚶 You moved to the ${ROOMS.find(r => r.id === roomId)?.name}.`, {
      ...prev, playerRoom: roomId, phase: 'suggest',
    }));
  };

  // ── Player: make suggestion ───────────────────────────────────────────────
  const handleSuggest = () => {
    if (g.phase !== 'suggest' || g.turn !== 0) return;
    const { showingPlayer, shownCard } = processsuggestion(g, 0, { ...sug, room: g.playerRoom });
    const suspName = SUSPECTS.find(s => s.id === sug.suspect)?.name;
    const weapName = WEAPONS.find(w => w.id === sug.weapon)?.name;
    const roomName = ROOMS.find(r => r.id === g.playerRoom)?.name;

    let msg = `🔍 You suggest: ${suspName}, with the ${weapName}, in the ${roomName}.`;
    let notes = { ...g.notes };

    if (shownCard) {
      msg += ` → Player ${showingPlayer} shows you: "${shownCard.name}" ✓`;
      notes[shownCard.id] = 'safe';
    } else {
      msg += ' → No one can disprove! 😮';
    }

    setG(prev => addLog(msg, { ...prev, notes, phase: 'move', turn: 1 }));
    setTab('board');
  };

  // ── Player: accusation ────────────────────────────────────────────────────
  const handleAccuse = () => {
    const { solution } = g;
    const correct = acc.suspect === solution.suspect && acc.weapon === solution.weapon && acc.room === solution.room;
    if (correct) {
      const s = SUSPECTS.find(x => x.id === solution.suspect);
      const w = WEAPONS.find(x => x.id === solution.weapon);
      const r = ROOMS.find(x => x.id === solution.room);
      setG(prev => addLog(`🏆 CORRECT! It was ${s.name}, with the ${w.name}, in the ${r.name}!`, {
        ...prev, phase: 'gameover', winner: 0,
      }));
    } else {
      setG(prev => addLog('❌ Wrong accusation — you are eliminated! AI continues...', {
        ...prev, eliminated: [...prev.eliminated, 0], phase: 'move', turn: 1,
      }));
    }
    setTab('board');
  };

  // ── AI turns ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (g.turn === 0 || g.phase === 'gameover') return;
    if (aiThinking) return;
    setAiThinking(true);

    const t = setTimeout(() => {
      setG(prev => {
        if (prev.turn === 0 || prev.phase === 'gameover') return prev;
        const aiIdx = prev.turn - 1;
        const currentRoom = prev.aiRooms[aiIdx];
        const adj = ADJACENCY[currentRoom] || [];

        // Move to random adjacent room
        const newRoom = adj[Math.floor(Math.random() * adj.length)] || currentRoom;
        const newAiRooms = [...prev.aiRooms];
        newAiRooms[aiIdx] = newRoom;
        const roomName = ROOMS.find(r => r.id === newRoom)?.name;

        // Make suggestion
        const suggestion = aiMakeSuggestion(prev, aiIdx, newRoom);
        const { showingPlayer, shownCard } = processsuggestion(prev, prev.turn, suggestion);

        const suspName = SUSPECTS.find(s => s.id === suggestion.suspect)?.name;
        const weapName = WEAPONS.find(w => w.id === suggestion.weapon)?.name;

        let msg = `🤖 AI ${aiIdx + 1} moves to ${roomName} → suggests ${suspName} + ${weapName}.`;
        let newAiNotes = prev.aiNotes.map(n => ({ ...n }));

        if (shownCard) {
          msg += ` Card shown: ${shownCard.name}.`;
          newAiNotes[aiIdx][shownCard.id] = 'safe';
        } else {
          msg += ' Nobody disproved!';
        }

        // AI accusation: if it thinks it knows the answer (has eliminated many cards)
        const aiNote = newAiNotes[aiIdx];
        const safeCount = Object.values(aiNote).filter(v => v === 'safe').length;
        const totalNonSolution = SUSPECTS.length + WEAPONS.length + ROOMS.length - 3;

        let state = addLog(msg, { ...prev, aiRooms: newAiRooms, aiNotes: newAiNotes });

        if (safeCount >= totalNonSolution - 2 && Math.random() > 0.5) {
          // AI tries to accuse - use solution (AI "knows" by process of elimination)
          const { solution } = prev;
          const s = SUSPECTS.find(x => x.id === solution.suspect);
          const w = WEAPONS.find(x => x.id === solution.weapon);
          const r = ROOMS.find(x => x.id === solution.room);
          state = addLog(`🤖 AI ${aiIdx + 1} makes accusation: ${s?.name}, ${w?.name}, ${r?.name}!`, state);
          state = addLog(`🤖 AI ${aiIdx + 1} is correct — AI wins!`, { ...state, phase: 'gameover', winner: prev.turn });
          setAiThinking(false);
          return state;
        }

        // Next turn
        const nextTurn = (prev.turn % (1 + prev.numAI)) + 1;
        state = { ...state, turn: nextTurn > prev.numAI ? 0 : nextTurn };
        setAiThinking(false);
        return state;
      });
    }, 1200);

    return () => {
      clearTimeout(t);
      setAiThinking(false);
    };
  }, [g.turn, g.phase]);

  // ── Render helpers ────────────────────────────────────────────────────────
  const adj = ADJACENCY[g.playerRoom] || [];
  const playerHand = g.hands[0] || [];
  const solution = g.solution;

  const noteColor = { safe: '#4caf50', suspect: '#f44336', '': '#555' };

  return (
    <div className="game-shell" style={{ maxWidth: 700, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🏚️'} Mansion Mystery</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['board', 'notepad', 'accuse'].map(t => (
            <button key={t} className={`bv-button${tab === t ? '' : ' secondary'}`}
              style={{ fontSize: 11, textTransform: 'capitalize' }}
              onClick={() => setTab(t)}>{t}</button>
          ))}
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {g.phase === 'gameover' && (
        <div className="winner-banner">
          {g.winner === 0
            ? `🏆 You solved it! ${SUSPECTS.find(s => s.id === solution.suspect)?.name}, ${WEAPONS.find(w => w.id === solution.weapon)?.name}, ${ROOMS.find(r => r.id === solution.room)?.name}.`
            : `🤖 AI ${g.winner} cracked the case! It was: ${SUSPECTS.find(s => s.id === solution.suspect)?.name}, ${WEAPONS.find(w => w.id === solution.weapon)?.name}, ${ROOMS.find(r => r.id === solution.room)?.name}.`}
        </div>
      )}

      {g.phase !== 'gameover' && (
        <div className="turn-indicator">
          {aiThinking ? '🤖 AI investigating…' :
            g.turn === 0
              ? g.phase === 'move' ? '🚶 Your turn — click an adjacent room to move'
              : g.phase === 'suggest' ? `💬 You're in the ${ROOMS.find(r => r.id === g.playerRoom)?.name} — make a suggestion!`
              : ''
              : `🤖 AI ${g.turn} is investigating…`}
        </div>
      )}

      {/* ── BOARD TAB ─────────────────────────────────────────────────────── */}
      {tab === 'board' && (
        <div>
          {/* Room grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {ROOMS.map(room => {
              const isPlayerHere = g.playerRoom === room.id;
              const aiHere = g.aiRooms.map((r, i) => r === room.id ? i : -1).filter(i => i >= 0);
              const isAdj = adj.includes(room.id);
              const canMove = g.phase === 'move' && g.turn === 0 && isAdj && !isPlayerHere;

              return (
                <div key={room.id}
                  onClick={() => canMove && handleMove(room.id)}
                  style={{
                    padding: '12px 8px', borderRadius: 10, textAlign: 'center',
                    background: isPlayerHere
                      ? 'rgba(232,184,0,.18)' : canMove
                      ? 'rgba(232,184,0,.07)' : 'rgba(255,255,255,.03)',
                    border: isPlayerHere ? '2px solid #e8b800'
                      : canMove ? '2px dashed rgba(232,184,0,.5)'
                      : '1px solid rgba(255,255,255,.08)',
                    cursor: canMove ? 'pointer' : 'default',
                    transition: 'all .15s',
                    minHeight: 80,
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>{room.icon}</div>
                  <div style={{ fontSize: 11, color: isPlayerHere ? '#e8b800' : '#e0e0e0', fontWeight: isPlayerHere ? 'bold' : 'normal' }}>
                    {room.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                    {isPlayerHere && <span title="You" style={{ fontSize: 14 }}>🔵</span>}
                    {aiHere.map(i => <span key={i} title={`AI ${i + 1}`} style={{ fontSize: 14 }}>🔴</span>)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Suggestion panel */}
          {g.phase === 'suggest' && g.turn === 0 && (
            <div className="bv-card" style={{ padding: 14, marginBottom: 12 }}>
              <div style={{ color: '#e8b800', fontSize: 13, fontWeight: 'bold', marginBottom: 10 }}>
                💬 Suggestion — in {ROOMS.find(r => r.id === g.playerRoom)?.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <select value={sug.suspect} onChange={e => setSug(s => ({ ...s, suspect: e.target.value }))}
                  style={{ background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a', borderRadius: 6, padding: '8px 10px', fontSize: 12, flex: 1, minWidth: 140 }}>
                  {SUSPECTS.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <select value={sug.weapon} onChange={e => setSug(s => ({ ...s, weapon: e.target.value }))}
                  style={{ background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a', borderRadius: 6, padding: '8px 10px', fontSize: 12, flex: 1, minWidth: 140 }}>
                  {WEAPONS.map(w => <option key={w.id} value={w.id}>{w.icon} {w.name}</option>)}
                </select>
              </div>
              <button className="bv-button" onClick={handleSuggest}>Make Suggestion</button>
            </div>
          )}

          {/* Your hand */}
          <div className="bv-card" style={{ padding: 12, marginBottom: 10 }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>Your Hand (cards you hold = NOT in the envelope)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {playerHand.map(c => (
                <div key={c.id} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11,
                  background: c.type === 'suspect' ? 'rgba(192,57,43,.2)' : c.type === 'weapon' ? 'rgba(41,128,185,.2)' : 'rgba(39,174,96,.2)',
                  border: c.type === 'suspect' ? '1px solid rgba(192,57,43,.5)' : c.type === 'weapon' ? '1px solid rgba(41,128,185,.5)' : '1px solid rgba(39,174,96,.5)',
                  color: '#e0e0e0',
                }}>{c.name}</div>
              ))}
            </div>
          </div>

          {/* Log */}
          <div className="bv-card" style={{ padding: 10, maxHeight: 180, overflowY: 'auto' }}>
            <div style={{ color: '#e8b800', fontSize: 11, marginBottom: 5 }}>Case Log</div>
            {g.log.map((l, i) => (
              <div key={i} style={{ fontSize: 11, color: i === 0 ? '#e0e0e0' : '#666', marginBottom: 3 }}>{l}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── NOTEPAD TAB ───────────────────────────────────────────────────── */}
      {tab === 'notepad' && (
        <div>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 12 }}>Click any card to toggle: unknown → safe → suspect</div>
          {[
            { label: 'Suspects', items: SUSPECTS.map(s => ({ id: s.id, name: s.name, sub: s.icon })) },
            { label: 'Weapons',  items: WEAPONS.map(w => ({ id: w.id, name: w.name, sub: w.icon })) },
            { label: 'Rooms',    items: ROOMS.map(r => ({ id: r.id, name: r.name, sub: r.icon })) },
          ].map(section => (
            <div key={section.label} className="bv-card" style={{ padding: 12, marginBottom: 10 }}>
              <div style={{ color: '#e8b800', fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>{section.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {section.items.map(item => {
                  const inHand = playerHand.some(c => c.id === item.id);
                  const note = inHand ? 'safe' : (g.notes[item.id] || '');
                  const cycle = () => {
                    if (inHand) return;
                    const next = note === '' ? 'safe' : note === 'safe' ? 'suspect' : '';
                    setG(prev => ({ ...prev, notes: { ...prev.notes, [item.id]: next } }));
                  };
                  return (
                    <div key={item.id} onClick={cycle} style={{
                      padding: '6px 12px', borderRadius: 8, cursor: inHand ? 'default' : 'pointer',
                      background: note === 'safe' ? 'rgba(76,175,80,.15)' : note === 'suspect' ? 'rgba(192,57,43,.2)' : 'rgba(255,255,255,.04)',
                      border: note === 'safe' ? '1px solid rgba(76,175,80,.5)' : note === 'suspect' ? '1px solid rgba(192,57,43,.5)' : '1px solid rgba(255,255,255,.08)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span>{item.sub}</span>
                      <span style={{ fontSize: 12, color: note === 'safe' ? '#4caf50' : note === 'suspect' ? '#f44336' : '#e0e0e0' }}>
                        {item.name}
                      </span>
                      {note === 'safe' && <span style={{ fontSize: 10, color: '#4caf50' }}>✓</span>}
                      {note === 'suspect' && <span style={{ fontSize: 10, color: '#f44336' }}>⚠</span>}
                      {inHand && <span style={{ fontSize: 9, color: '#4caf50' }}>YOURS</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACCUSATION TAB ────────────────────────────────────────────────── */}
      {tab === 'accuse' && g.phase !== 'gameover' && (
        <div className="bv-card" style={{ padding: 18 }}>
          <div style={{ color: '#c0392b', fontSize: 15, fontWeight: 'bold', marginBottom: 14 }}>
            ⚠️ Final Accusation — You must be certain!
          </div>
          <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
            A wrong accusation eliminates you. Make sure your notepad backs this up.
          </p>
          {[
            { label: 'Suspect', items: SUSPECTS.map(s => ({ value: s.id, label: `${s.icon} ${s.name}` })), key: 'suspect' },
            { label: 'Weapon',  items: WEAPONS.map(w => ({ value: w.id, label: `${w.icon} ${w.name}` })), key: 'weapon' },
            { label: 'Room',    items: ROOMS.map(r => ({ value: r.id, label: `${r.icon} ${r.name}` })), key: 'room' },
          ].map(({ label, items, key }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</div>
              <select value={acc[key]} onChange={e => setAcc(a => ({ ...a, [key]: e.target.value }))}
                style={{ width: '100%', background: '#1a1a2e', color: '#e0e0e0', border: '1px solid #2a2a4a', borderRadius: 8, padding: '10px 12px', fontSize: 13 }}>
                {items.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
          ))}
          <button className="bv-button"
            style={{ width: '100%', background: 'rgba(139,0,0,.3)', borderColor: 'rgba(192,57,43,.5)', color: '#f44' }}
            onClick={handleAccuse}>
            🔍 Make Final Accusation
          </button>
        </div>
      )}
    </div>
  );
}
