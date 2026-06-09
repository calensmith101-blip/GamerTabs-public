import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Deck & helpers ───────────────────────────────────────────────────────────
const COLORS = ['red','blue','green','yellow'];
const C = { red:'#D91F26', blue:'#0060A8', green:'#1B8A2E', yellow:'#FFD900' };
const CD = { red:'#8B0000', blue:'#003080', green:'#0A5010', yellow:'#9A8000' };

function makeDeck() {
  const d = []; let id = 0;
  for (const col of COLORS) {
    d.push({ id:id++, color:col, value:'0' });
    for (const v of ['1','2','3','4','5','6','7','8','9','Skip','Reverse','Draw2']) {
      d.push({ id:id++, color:col, value:v });
      d.push({ id:id++, color:col, value:v });
    }
  }
  for (let i = 0; i < 4; i++) {
    d.push({ id:id++, color:null, value:'Wild' });
    d.push({ id:id++, color:null, value:'WildDraw4' });
  }
  return shuffle(d); // 108 cards
}
function shuffle(a) {
  const b=[...a];
  for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}
  return b;
}
function canPlay(card, top, activeColor) {
  if (card.value === 'Wild' || card.value === 'WildDraw4') return true;
  const col = activeColor || top.color;
  if (card.color === col) return true;
  if (card.value === top.value) return true;
  return false;
}
function drawFrom(deck, n) {
  const d = [...deck], drawn = [];
  for (let i = 0; i < n; i++) {
    if (!d.length) break;
    drawn.push(d.pop());
  }
  return { deck: d, drawn };
}

// ─── Card SVG ─────────────────────────────────────────────────────────────────
const DISP = { Skip:'⊘', Reverse:'⇄', Draw2:'+2', Wild:'', WildDraw4:'+4' };
function dispOf(v) { return DISP[v] !== undefined ? DISP[v] : v; }

function UnoCardSVG({ card, w=68, h=100, selected, dim, glow }) {
  const bg = card.color ? C[card.color] : '#111';
  const isWild = !card.color;
  const rx = Math.round(w*0.12), cx=w/2, cy=h/2;
  const disp = dispOf(card.value);
  const uid = `c${card.id}`;
  const ovalRx = w*0.37, ovalRy = h*0.42;
  const cornerFs = Math.max(9, h*0.1);
  const centerFs = disp.length > 2 ? h*0.17 : h*0.28;

  return (
    <div style={{
      display:'inline-block', flexShrink:0,
      transform: selected ? 'translateY(-18px) scale(1.06)' : 'none',
      transition: 'transform .2s, opacity .2s, filter .2s',
      opacity: dim ? 0.38 : 1,
      filter: glow ? `drop-shadow(0 0 12px ${bg}) drop-shadow(0 2px 6px rgba(0,0,0,.5))` :
              selected ? 'drop-shadow(0 0 8px rgba(255,255,255,.7)) drop-shadow(0 3px 6px rgba(0,0,0,.5))' :
              'drop-shadow(0 2px 4px rgba(0,0,0,.6))',
      cursor: 'pointer',
    }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
        <defs>
          <clipPath id={`oval-${uid}`}>
            <ellipse cx={cx} cy={cy} rx={ovalRx} ry={ovalRy} transform={`rotate(-25 ${cx} ${cy})`}/>
          </clipPath>
          <radialGradient id={`bg-${uid}`} cx="50%" cy="40%">
            <stop offset="0%" stopColor={isWild?'#333':bg} stopOpacity="1"/>
            <stop offset="100%" stopColor={isWild?'#000':CD[card.color]||bg} stopOpacity="1"/>
          </radialGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={w} height={h} rx={rx} fill={`url(#bg-${uid})`}/>
        <rect x="0" y="0" width={w} height={h} rx={rx} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth="1"/>
        {/* Inner white border ring */}
        <rect x="3" y="3" width={w-6} height={h-6} rx={rx-2} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.5"/>

        {isWild ? (
          /* Wild: 4 coloured quadrants clipped to oval */
          <g>
            <ellipse cx={cx} cy={cy} rx={ovalRx+1} ry={ovalRy+1} fill="white" transform={`rotate(-25 ${cx} ${cy})`}/>
            <rect x="0" y="0" width={cx} height={cy} fill={C.red}   clipPath={`url(#oval-${uid})`}/>
            <rect x={cx} y="0" width={cx} height={cy} fill={C.blue}  clipPath={`url(#oval-${uid})`}/>
            <rect x="0" y={cy} width={cx} height={cy} fill={C.yellow} clipPath={`url(#oval-${uid})`}/>
            <rect x={cx} y={cy} width={cx} height={cy} fill={C.green} clipPath={`url(#oval-${uid})`}/>
            {card.value==='WildDraw4' && (
              <text x={cx} y={cy+h*.07} textAnchor="middle" dominantBaseline="middle"
                fontSize={h*.18} fontWeight="900" fill="white"
                stroke="rgba(0,0,0,.6)" strokeWidth="1" fontFamily="Arial Black,sans-serif">+4</text>
            )}
          </g>
        ) : (
          /* Coloured card: white oval + symbol */
          <g>
            <ellipse cx={cx} cy={cy} rx={ovalRx} ry={ovalRy} fill="white" transform={`rotate(-25 ${cx} ${cy})`}/>
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
              fontSize={centerFs} fontWeight="900" fill={bg}
              fontFamily="Arial Black,sans-serif">{disp}</text>
          </g>
        )}

        {/* Top-left corner */}
        <text x="5" y={cornerFs+2} fontSize={cornerFs} fontWeight="bold" fill="white"
          fontFamily="Arial,sans-serif" dominantBaseline="auto">{disp||'W'}</text>

        {/* Bottom-right corner rotated 180° */}
        <g transform={`rotate(180 ${w/2} ${h/2})`}>
          <text x="5" y={cornerFs+2} fontSize={cornerFs} fontWeight="bold" fill="white"
            fontFamily="Arial,sans-serif">{disp||'W'}</text>
        </g>
      </svg>
    </div>
  );
}

function CardBack({ w=68, h=100 }) {
  const rx = Math.round(w*.12), cx=w/2, cy=h/2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block',flexShrink:0}}>
      <defs>
        <radialGradient id="backgrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2a2a3a"/>
          <stop offset="100%" stopColor="#0a0a12"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width={w} height={h} rx={rx} fill="url(#backgrad)"/>
      <rect x="3" y="3" width={w-6} height={h-6} rx={rx-2} fill="none" stroke={C.red} strokeWidth="2"/>
      <ellipse cx={cx} cy={cy} rx={w*.3} ry={h*.38} fill={C.red} transform={`rotate(-25 ${cx} ${cy})`}/>
      <text x={cx} y={cy+2} textAnchor="middle" dominantBaseline="middle"
        fontSize={h*.15} fontWeight="900" fill="white" fontStyle="italic"
        fontFamily="Arial Black,sans-serif">UNO</text>
    </svg>
  );
}

// ─── Color picker overlay ────────────────────────────────────────────────────
function ColorPicker({ onPick }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'#1a1a2e', borderRadius:16, padding:24, textAlign:'center', border:'1px solid #2a2a4a' }}>
        <p style={{ color:'#e8b800', fontWeight:'bold', marginBottom:18, fontSize:15 }}>Choose a colour:</p>
        <div style={{ display:'flex', gap:12 }}>
          {COLORS.map(col => (
            <div key={col} onClick={() => onPick(col)} style={{
              width:60, height:60, borderRadius:12, background:C[col],
              cursor:'pointer', border:'3px solid rgba(255,255,255,.3)',
              boxShadow:`0 0 20px ${C[col]}66`,
              transition:'transform .15s',
            }}
            onMouseOver={e=>e.currentTarget.style.transform='scale(1.15)'}
            onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HTP ─────────────────────────────────────────────────────────────────────
const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e=>e.stopPropagation()}>
      <div className="htp-header">
        <p className="htp-title">How to Play — Uno Rush</p>
        <button className="bv-button secondary" onClick={onClose}>✕</button>
      </div>
      <div className="htp-body">
        <h4>Objective</h4><p>Be first to empty your hand. Shout UNO with 1 card left!</p>
        <h4>Playing a Card</h4>
        <ul>
          <li>Match the <b>colour</b> OR <b>number/symbol</b> of the top pile card.</li>
          <li>Tap a card to select (it lifts up), tap again to play it.</li>
          <li>If you can't play — press <b>Draw Card</b>. If drawn card is playable you may play it.</li>
        </ul>
        <h4>Special Cards</h4>
        <ul>
          <li><b>⊘ Skip</b> — opponent's turn is skipped.</li>
          <li><b>⇄ Reverse</b> — in 2-player, acts like Skip.</li>
          <li><b>+2 Draw Two</b> — opponent draws 2 and loses their turn.</li>
          <li><b>🌈 Wild</b> — play any time, choose the new colour.</li>
          <li><b>🌈+4 Wild Draw Four</b> — opponent draws 4 and loses turn, you choose colour.</li>
        </ul>
        <h4>UNO Rule</h4>
        <p>Press <b>UNO!</b> when you have 1 card. If caught not saying it, draw 2 penalty.</p>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
function initGame() {
  let deck = makeDeck();
  const { deck:d1, drawn:playerHand } = drawFrom(deck, 7); deck=d1;
  const { deck:d2, drawn:aiHand }     = drawFrom(deck, 7); deck=d2;
  // Find first non-wild top card
  let top = null, rest = [...deck];
  while (!top) {
    const c = rest.pop();
    if (c && c.color) { top = c; }
    else if (c) { rest.unshift(c); } // put wild back at bottom
    if (!rest.length) break;
  }
  return {
    deck: rest, playerHand, aiHand,
    pile: top ? [top] : [],
    activeColor: top?.color || 'red',
    turn: 'player',
    drawnCard: null,      // card drawn this turn (may or may not be playable)
    drawPending: 0,       // how many cards the next player must draw
    turnToken: 0,         // advances when action cards keep the same turn active
    unoCallout: false,    // player said UNO
    over: false, winner: null,
    log: top ? [`Game started! First card: ${top.color} ${dispOf(top.value)}`] : [],
  };
}

function applyPlayCard(gs, card, byPlayer, chosenColor) {
  const isPlayer = byPlayer === 'player';
  let { deck, playerHand, aiHand, pile, activeColor, turn, drawPending, log } = gs;
  const hand = isPlayer ? [...playerHand] : [...aiHand];
  const idx = hand.findIndex(c => c.id === card.id);
  if (idx < 0) return gs;
  hand.splice(idx, 1);

  const newPile = [...pile, card];
  let newColor = card.color || chosenColor || activeColor;
  let nextTurn = isPlayer ? 'ai' : 'player';
  let msg = `${isPlayer ? '🧑 You' : '🤖 AI'} played ${card.color||'WILD'} ${dispOf(card.value)||'Wild'}`;
  let nextDrawPending = 0;

  if (card.value === 'Skip' || card.value === 'Reverse') {
    nextTurn = byPlayer; // go again
    msg += ' — skipped opponent!';
  }
  if (card.value === 'Draw2') {
    nextDrawPending = 2;
    msg += ' — opponent draws 2!';
  }
  if (card.value === 'WildDraw4') {
    nextDrawPending = 4;
    msg += ` — opponent draws 4! Colour → ${newColor}`;
  }
  if (card.value === 'Wild') {
    msg += ` — colour → ${newColor}`;
  }

  // Apply pending draw to next player
  const nextHand = nextTurn === 'player' ? [...playerHand] : [...aiHand];
  let d = [...deck];
  if (nextDrawPending > 0) {
    for (let i = 0; i < nextDrawPending; i++) {
      if (!d.length) d = shuffle([...newPile.slice(0,-1)]);
      if (d.length) nextHand.push(d.pop());
    }
    // Skip next turn
    nextTurn = byPlayer;
    msg += ` [drew ${nextDrawPending}]`;
  }

  const newPH = nextTurn === 'player' ? nextHand : (isPlayer ? hand : playerHand);
  const newAH = nextTurn === 'ai'     ? nextHand : (isPlayer ? aiHand : hand);
  // Fix: if nextTurn === byPlayer (went again), the OPPONENT got the draw
  const finalPH = isPlayer ? hand : (nextDrawPending > 0 ? nextHand : playerHand);
  const finalAH = isPlayer ? (nextDrawPending > 0 ? nextHand : aiHand) : hand;

  const over = hand.length === 0;
  const winner = over ? byPlayer : null;

  return {
    ...gs, deck: d,
    playerHand: finalPH, aiHand: finalAH,
    pile: newPile, activeColor: newColor,
    turn: nextTurn, drawPending: 0,
    drawnCard: null, unoCallout: false,
    over, winner,
    turnToken: (gs.turnToken || 0) + 1,
    log: [msg, ...log].slice(0, 14),
  };
}

export default function UnoRush(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const [gs, setGs] = useState(initGame);
  const [selected, setSelected] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWild, setPendingWild] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [dealing, setDealing] = useState(true);
  const [playAnim, setPlayAnim] = useState(null); // card id being animated to pile
  const animRef = useRef(false);

  // Dealing animation
  useEffect(() => { const t = setTimeout(() => setDealing(false), 1200); return () => clearTimeout(t); }, []);

  const reset = () => { setGs(initGame()); setSelected(null); setDealing(true); setAiThinking(false); setTimeout(() => setDealing(false), 1200); };

  const topCard = gs.pile[gs.pile.length - 1];
  const activeColor = gs.activeColor;

  // ── Player: tap card ────────────────────────────────────────────────────────
  const handleCardTap = (card) => {
    if (gs.turn !== 'player' || gs.over || aiThinking) return;
    const playable = canPlay(card, topCard, activeColor);
    if (!playable) { setSelected(selected?.id === card.id ? null : null); return; }

    if (selected?.id === card.id) {
      // Second tap: play it
      if (card.value === 'Wild' || card.value === 'WildDraw4') {
        setPendingWild(card);
        setShowColorPicker(true);
      } else {
        animatePlay(card, null);
      }
      setSelected(null);
    } else {
      setSelected(card);
    }
  };

  const animatePlay = (card, color) => {
    setPlayAnim(card.id);
    setTimeout(() => {
      setGs(prev => applyPlayCard(prev, card, 'player', color));
      setPlayAnim(null);
    }, 350);
  };

  const handleColorPick = (col) => {
    setShowColorPicker(false);
    if (pendingWild) {
      animatePlay(pendingWild, col);
      setPendingWild(null);
    }
  };

  // ── Player: draw card ────────────────────────────────────────────────────────
  const handleDraw = () => {
    if (gs.turn !== 'player' || gs.over || gs.drawnCard || aiThinking) return;
    setGs(prev => {
      let d = [...prev.deck];
      if (!d.length) d = shuffle([...prev.pile.slice(0,-1)]);
      if (!d.length) return { ...prev, turn:'ai', turnToken: (prev.turnToken || 0) + 1 };
      const card = d.pop();
      const playable = canPlay(card, prev.pile[prev.pile.length-1], prev.activeColor);
      return {
        ...prev, deck:d,
        playerHand: [...prev.playerHand, card],
        drawnCard: { card, playable },
        turnToken: (prev.turnToken || 0) + 1,
        log: [`🧑 You drew ${card.color||'WILD'} ${dispOf(card.value)||'Wild'}${playable?' — playable!':' — no match'}`, ...prev.log].slice(0,14),
      };
    });
  };

  const handleKeepDrawn = () => {
    setGs(prev => ({ ...prev, drawnCard: null, turn: 'ai', turnToken: (prev.turnToken || 0) + 1 }));
  };

  const handlePlayDrawn = () => {
    const { card } = gs.drawnCard || {};
    if (!card) return;
    if (card.value === 'Wild' || card.value === 'WildDraw4') {
      setPendingWild(card);
      setShowColorPicker(true);
      setGs(prev => ({ ...prev, drawnCard: null }));
    } else {
      setGs(prev => applyPlayCard({ ...prev, drawnCard: null }, card, 'player', null));
    }
  };

  // ── UNO callout ─────────────────────────────────────────────────────────────
  const handleUNO = () => {
    setGs(prev => ({ ...prev, unoCallout: true, log: ['🧑 UNO!', ...prev.log].slice(0,14) }));
  };

  // ── AI turn ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (gs.turn !== 'ai' || gs.over || aiThinking) return;
    if (animRef.current) return;
    animRef.current = true;
    setAiThinking(true);

    const t = setTimeout(() => {
      setGs(prev => {
        if (prev.turn !== 'ai' || prev.over) { animRef.current=false; setAiThinking(false); return prev; }
        const top2 = prev.pile[prev.pile.length-1];
        const playable = prev.aiHand.filter(c => canPlay(c, top2, prev.activeColor));

        if (playable.length) {
          // Strategy: prefer +4 > +2 > Skip > Reverse > Wild > matching
          const priority = ['WildDraw4','Draw2','Skip','Reverse','Wild'];
          let card = null;
          for (const pv of priority) {
            card = playable.find(c => c.value === pv);
            if (card) break;
          }
          if (!card) card = playable[Math.floor(Math.random()*playable.length)];
          const chosenColor = card.color === null ? COLORS[Math.floor(Math.random()*4)] : null;
          const newGs = applyPlayCard(prev, card, 'ai', chosenColor);
          animRef.current=false; setAiThinking(false);
          return newGs;
        } else {
          // Draw
          let d = [...prev.deck];
          if (!d.length) d = shuffle([...prev.pile.slice(0,-1)]);
          if (!d.length) { animRef.current=false; setAiThinking(false); return { ...prev, turn:'player', log:['🤖 AI has no card to draw', ...prev.log].slice(0,14) }; }
          const drawn = d.pop();
          const canPlayDrawn = canPlay(drawn, top2, prev.activeColor);
          if (canPlayDrawn) {
            const color2 = drawn.color === null ? COLORS[Math.floor(Math.random()*4)] : null;
            const newGs2 = applyPlayCard({ ...prev, deck:d, aiHand:[...prev.aiHand, drawn] }, drawn, 'ai', color2);
            newGs2.log = [`🤖 AI drew and played ${drawn.color||'WILD'} ${dispOf(drawn.value)||'Wild'}`, ...newGs2.log.slice(1)].slice(0,14);
            animRef.current=false; setAiThinking(false);
            return newGs2;
          }
          animRef.current=false; setAiThinking(false);
          return { ...prev, deck:d, aiHand:[...prev.aiHand, drawn], turn:'player', log:[`🤖 AI drew — no match`, ...prev.log].slice(0,14) };
        }
      });
    }, 1000);
    return () => { clearTimeout(t); animRef.current=false; setAiThinking(false); };
  }, [gs.turn, gs.over, gs.turnToken]);

  const playableCards = gs.playerHand.filter(c => canPlay(c, topCard, activeColor));
  const canDraw = gs.turn === 'player' && !gs.over && !gs.drawnCard && !aiThinking;

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="game-shell" style={{ maxWidth: 540, margin:'0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}
      {showColorPicker && <ColorPicker onPick={handleColorPick} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon||'🃏'} Uno Rush</h2>
        <div style={{ display:'flex', gap:6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {gs.over && (
        <div className="winner-banner">
          {gs.winner==='player' ? '🏆 UNO — You Win!' : '🤖 AI wins! Better luck next time.'}
        </div>
      )}

      {/* ── AI hand (face down) ──────────────────────────────────── */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:'#888', marginBottom:5 }}>
          🤖 AI — {gs.aiHand.length} card{gs.aiHand.length!==1?'s':''}
          {gs.aiHand.length===1 && <span style={{color:'#D91F26',fontWeight:'bold',marginLeft:6}}>UNO!</span>}
        </div>
        <div style={{
          display:'flex', gap:dealing?2:-10, flexWrap:'nowrap', overflow:'hidden',
          minHeight:58, alignItems:'center', paddingLeft:4,
          transition:'gap .4s',
        }}>
          {gs.aiHand.map((c, i) => (
            <div key={c.id} style={{
              opacity: dealing ? 0 : 1, transform: dealing ? 'translateY(-30px)' : 'none',
              transition:`opacity .3s ${i*60}ms, transform .3s ${i*60}ms`,
              flexShrink:0,
            }}>
              <CardBack w={42} h={62} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Table centre ─────────────────────────────────────────────── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:28,
        margin:'18px 0', padding:'18px 0',
        background:'radial-gradient(ellipse at center, rgba(232,184,0,.04) 0%, transparent 70%)',
        borderTop:'1px solid rgba(255,255,255,.05)', borderBottom:'1px solid rgba(255,255,255,.05)',
      }}>
        {/* Active colour indicator */}
        <div style={{ textAlign:'center' }}>
          <div style={{
            width:40, height:40, borderRadius:'50%', background:C[activeColor]||'#333',
            border:'3px solid rgba(255,255,255,.4)', margin:'0 auto 4px',
            boxShadow:`0 0 20px ${C[activeColor]||'#333'}88`,
          }}/>
          <div style={{ fontSize:10, color:'#888' }}>Colour</div>
        </div>

        {/* Pile */}
        <div style={{ textAlign:'center', position:'relative' }}>
          <div style={{ fontSize:11, color:'#888', marginBottom:5 }}>Pile ({gs.pile.length})</div>
          {/* Stack effect */}
          {gs.pile.length > 1 && (
            <div style={{ position:'absolute', top:22, left:'50%', transform:'translateX(-50%) rotate(8deg)', opacity:.5 }}>
              <UnoCardSVG card={gs.pile[gs.pile.length-2]} w={68} h={100}/>
            </div>
          )}
          <div style={{ position:'relative', zIndex:1 }}>
            {topCard && <UnoCardSVG card={topCard} w={68} h={100} glow/>}
          </div>
        </div>

        {/* Draw pile */}
        <div style={{ textAlign:'center', cursor: canDraw ? 'pointer' : 'default' }} onClick={canDraw ? handleDraw : undefined}>
          <div style={{ fontSize:11, color:'#888', marginBottom:5 }}>Deck ({gs.deck.length})</div>
          <div style={{
            transition: 'transform .15s',
            transform: canDraw ? undefined : 'none',
          }}
          onMouseOver={e=>{ if(canDraw) e.currentTarget.style.transform='translateY(-4px)'; }}
          onMouseOut={e=>{ e.currentTarget.style.transform='none'; }}>
            <CardBack w={68} h={100}/>
          </div>
          {canDraw && <div style={{ fontSize:10, color:'#e8b800', marginTop:4 }}>tap to draw</div>}
        </div>
      </div>

      {/* ── Turn / drawn card indicator ────────────────────────────── */}
      {!gs.over && (
        <div style={{ textAlign:'center', marginBottom:10 }}>
          {aiThinking && <div className="turn-indicator">🤖 AI is thinking…</div>}
          {!aiThinking && gs.turn==='player' && !gs.drawnCard && (
            <div className="turn-indicator">
              🧑 Your turn — {playableCards.length} playable card{playableCards.length!==1?'s':''}
            </div>
          )}
          {!aiThinking && gs.drawnCard && (
            <div className="bv-card" style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:12, color:'#888' }}>Drew:</span>
              <UnoCardSVG card={gs.drawnCard.card} w={46} h={66}/>
              {gs.drawnCard.playable ? (
                <>
                  <button className="bv-button" style={{ fontSize:12 }} onClick={handlePlayDrawn}>Play It</button>
                  <button className="bv-button secondary" style={{ fontSize:12 }} onClick={handleKeepDrawn}>Keep & Pass</button>
                </>
              ) : (
                <button className="bv-button secondary" style={{ fontSize:12 }} onClick={handleKeepDrawn}>Pass Turn</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Player hand ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, color:'#888' }}>
            🧑 Your Hand ({gs.playerHand.length})
            {gs.playerHand.length===1 && !gs.unoCallout && (
              <button onClick={handleUNO} style={{
                marginLeft:8, padding:'2px 10px', borderRadius:6, fontSize:11, fontWeight:'bold',
                background:'#D91F26', border:'none', color:'white', cursor:'pointer', animation:'pulse 1s infinite',
              }}>UNO!</button>
            )}
            {gs.playerHand.length===1 && gs.unoCallout && <span style={{color:'#D91F26',fontWeight:'bold',marginLeft:6}}>UNO!</span>}
          </div>
          {selected && gs.turn==='player' && !gs.over && (
            <span style={{ fontSize:11, color:'#e8b800' }}>Tap again to play ↑</span>
          )}
        </div>
        <div style={{
          display:'flex', gap:4, flexWrap:'wrap', paddingBottom:4,
          minHeight:108, alignItems:'flex-end',
        }}>
          {gs.playerHand.map((card, i) => {
            const isPlayable = gs.turn==='player' && !gs.over && !gs.drawnCard && canPlay(card, topCard, activeColor);
            const isSel = selected?.id === card.id;
            const isAnimating = playAnim === card.id;
            return (
              <div key={card.id} onClick={() => isPlayable && handleCardTap(card)}
                style={{
                  opacity: dealing ? 0 : 1,
                  transform: dealing ? 'translateY(30px)' : 'none',
                  transition: `opacity .3s ${i*50}ms, transform .3s ${i*50}ms`,
                  outline: isPlayable ? `2px solid rgba(232,184,0,.8)` : 'none',
                  outlineOffset: 3, borderRadius: 8,
                }}>
                <UnoCardSVG
                  card={card} w={58} h={86}
                  selected={isSel}
                  dim={!isPlayable && gs.turn==='player' && !gs.over && !gs.drawnCard}
                  glow={isAnimating}
                />
              </div>
            );
          })}
        </div>
        <div style={{ fontSize:10, color:'#555', marginTop:4 }}>
          Tap to select · tap again to play · gold border = playable
        </div>
      </div>

      {/* ── Log ──────────────────────────────────────────────────────── */}
      <div className="bv-card" style={{ padding:8, marginTop:12, maxHeight:90, overflowY:'auto' }}>
        {gs.log.map((l,i) => <div key={i} style={{ fontSize:11, color:i===0?'#e0e0e0':'#555', marginBottom:2 }}>{l}</div>)}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
    </div>
  );
}
