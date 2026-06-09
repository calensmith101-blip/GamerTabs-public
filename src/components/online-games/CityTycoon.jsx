/**
 * City Tycoon — GamerTab: Black Vault
 * Full Monopoly-style board game.
 * Uses CityTycoonBoard.jsx (SVG) + cityTycoon* lib files.
 * Self-contained: no OnlineGameShell dependency.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOnlineGame } from '../../hooks/useOnlineGame';
import CityTycoonBoard from './CityTycoonBoard';
import {
  cityTycoonReducer,
  initialCityTycoonState,
} from '../../lib/cityTycoonReducer';
import {
  getSpaceByIndex,
  isPurchasableSpace,
} from '../../lib/cityTycoonSpaces';
import {
  getPropertyPrice,
  getBuildCost,
  getRentAmount,
  canBuildOnSpace,
  getPlayerProperties,
  formatCredits,
  canAfford,
} from '../../lib/cityTycoonRules';
import { DISTRICTS, BUILDING_LEVELS, BUILDING_ICONS } from '../../lib/cityTycoonDistricts';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLAYER_COLORS = { X: '#dc2626', O: '#2563eb', P3: '#16a34a', P4: '#a855f7', P5: '#f97316' };
const PLAYER_NAMES  = { X: 'Player 1', O: 'Player 2', P3: 'Player 3', P4: 'Player 4', P5: 'Player 5' };
const PLAYER_IDS = ['X', 'O', 'P3', 'P4', 'P5'];

const PLAYER_PIECES = [
  { id: 'ute', label: 'Tradie Ute' },
  { id: 'train', label: 'Seaford Train' },
  { id: 'surfboard', label: 'Surfboard' },
  { id: 'toolbox', label: 'Toolbox' },
  { id: 'boot', label: 'Tradie Boot' },
  { id: 'turtle', label: 'Turtle' },
];
const DEFAULT_PIECES = { X: 'ute', O: 'train', P3: 'surfboard', P4: 'toolbox', P5: 'turtle' };
const BOARD_SIZE = 40;
function nextBoardStep(current, target) {
  if (current === target) return target;
  return (current + 1) % BOARD_SIZE;
}

// ─── HTP overlay ─────────────────────────────────────────────────────────────
function HTP({ onClose }) {
  return (
    <div className="htp-overlay" onClick={onClose}>
      <div className="htp-box" onClick={e => e.stopPropagation()}>
        <div className="htp-header">
          <p className="htp-title">How to Play — City Tycoon</p>
          <button className="bv-button secondary" onClick={onClose}>✕</button>
        </div>
        <div className="htp-body">
          <h4>Objective</h4>
          <p>Bankrupt your opponent by buying property, collecting rent, and building upgrades.</p>
          <h4>Turn Phases</h4>
          <ul>
            <li><b>Build Phase:</b> choose Build Properties or Skip Build. You may build only when you own the full colour group/district, then build evenly toward houses and hotels.</li>
            <li><b>Roll Phase:</b> Click Roll Dice to move your token around the 40-space board.</li>
            <li><b>Land Phase:</b> buy unowned property, auction/pass, pay rent, pay tax, or resolve a Chance card.</li>
            <li><b>End Turn:</b> Pass to the next player.</li>
          </ul>
          <h4>Properties & Districts</h4>
          <p>Each coloured district group has 2–3 properties. You must own the full colour set before building. Build evenly: one house on each card before a second house, then up to four houses and a hotel. Building cost is shown by the property rules; one house starts at the card's build cost.</p><h4>90% Sold Trade Auction</h4><p>Once per game, when 90% of ownable properties are sold, a trade auction unlocks. It helps players trade/buy cards to complete colour sets so houses can be built.</p>
          <h4>Transport & Utilities</h4>
          <p>Transport rent doubles with each transport you own (25→50→100→200). Utilities charge 4× or 10× your dice roll.</p>
          <h4>Doubles & Jail</h4><p>Rolling doubles gives another roll. Three doubles in a row sends you to Jail. To leave Jail, use a Get Out of Jail Free card or pay ⬡50.</p><h4>Winning</h4>
          <p>The game ends when only one player remains solvent.</p><h4>South Adelaide Board</h4><p>Properties are now based around Happy Valley to Seaford roads, with the train stations following the Adelaide CBD to Seaford line.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Die face SVG ─────────────────────────────────────────────────────────────
const PIP_POS = {
  1:[[50,50]], 2:[[25,25],[75,75]], 3:[[25,25],[50,50],[75,75]],
  4:[[25,25],[75,25],[25,75],[75,75]], 5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
  6:[[25,20],[75,20],[25,50],[75,50],[25,80],[75,80]],
};
function DieSVG({ value, size = 46 }) {
  const pips = PIP_POS[value] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x="4" y="4" width="92" height="92" rx="16" fill="#f0ede6" stroke="#c8c0b0" strokeWidth="2"/>
      {pips.map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="9" fill="#1a1a2a"/>)}
    </svg>
  );
}

// ─── Property card in side panel ──────────────────────────────────────────────
function PropertyRow({ space, state, currentPlayer, onSelect, selected }) {
  const d = DISTRICTS[space.district];
  const buildings = state.buildings[space.pos] || 0;
  const canBuild = canBuildOnSpace(space, currentPlayer, state) && canAfford(currentPlayer, getBuildCost(space), state);
  return (
    <div onClick={() => onSelect(space.pos)} style={{
      display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:7,
      background: selected ? 'rgba(232,184,0,.12)' : 'rgba(255,255,255,.03)',
      border: selected ? '1px solid rgba(232,184,0,.35)' : '1px solid rgba(255,255,255,.06)',
      cursor:'pointer', marginBottom:4,
    }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background: d?.colorHex||'#888', flexShrink:0 }}/>
      <span style={{ fontSize:12, color:'#e0e0e0', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {space.name}
      </span>
      <span style={{ fontSize:10, color:'#888' }}>{BUILDING_ICONS[buildings]||''}</span>
      {canBuild && <span style={{ fontSize:9, color:'#4caf50' }}>★</span>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CityTycoon({ gameMode, difficulty, game, playerCount = 2, roomCode, playerRole = 'X', onlineRoom, session, onBack, onExit }) {
  const exit = onBack || onExit || null;
  const modeText = String(gameMode || '').toLowerCase();
const isAI =
  modeText.includes('ai') ||
  modeText.includes('computer') ||
  modeText.includes('bot');
  const isOnline = (modeText.includes('online') || modeText.includes('live')) && !!roomCode;
  const roomSlots = Array.isArray(onlineRoom?.state?.playerSlots) ? onlineRoom.state.playerSlots : [];
  const roomSeatUsers = onlineRoom?.state?.playerSeats || {};
  const aiSeatsFromRoom = roomSlots.filter(s => s.kind === 'ai').map(s => s.seat);

  const initialCount = Math.min(5, Math.max(2, roomSlots.length || Number(playerCount) || (isAI || isOnline ? 4 : 2)));
  const [activePlayerCount, setActivePlayerCount] = useState(initialCount);
  const onlineInitial = { ...initialCityTycoonState, players: PLAYER_IDS.slice(0, initialCount) };
  const onlineGame = useOnlineGame(isOnline ? roomCode : null, onlineInitial);
  const [localState, setLocalState] = useState(initialCityTycoonState);
  const state = isOnline ? (onlineGame.gameState || onlineInitial) : localState;
  const setState = (updater) => {
    if (isOnline) {
      const next = typeof updater === 'function' ? updater(state) : updater;
      onlineGame.updateState(next);
      return;
    }
    setLocalState(updater);
  };
  const [log, setLog]     = useState([initialCityTycoonState.message]);
  const [showHelp, setShowHelp] = useState(false);
  const [playerPieces, setPlayerPieces] = useState(DEFAULT_PIECES);
  const [animatedPositions, setAnimatedPositions] = useState(initialCityTycoonState.positions);
  const [focusedSpace, setFocusedSpace] = useState(null);
  const lastMsg = useRef(initialCityTycoonState.message);

  // Track log
  useEffect(() => {
    const msg = state?.message || '';
    if (msg && msg !== lastMsg.current) {
      setLog(prev => [msg, ...prev].slice(0, 30));
      lastMsg.current = msg;
    }
  }, [state?.message]);

  const dispatch = (action) => {
    setState(prev => cityTycoonReducer(prev, action));
  };

  useEffect(() => {
    if (isOnline && roomSlots.length >= 2 && roomSlots.length !== activePlayerCount) {
      setActivePlayerCount(Math.min(5, roomSlots.length));
    }
  }, [isOnline, roomSlots.length, activePlayerCount]);

  useEffect(() => {
    if (!isOnline) dispatch({ type: 'SET_PLAYERS', count: activePlayerCount });
    setPlayerPieces(Object.fromEntries(PLAYER_IDS.slice(0, activePlayerCount).map((player, index) => [player, PLAYER_PIECES[index % PLAYER_PIECES.length].id])));
  }, [activePlayerCount, isOnline]);

  const reset = () => {
    const s = cityTycoonReducer(state, { type: 'SET_PLAYERS', count: activePlayerCount });
    setState(s);
    setLog([s.message]);
    setAnimatedPositions(s.positions);
    setFocusedSpace(null);
    setPlayerPieces(Object.fromEntries(PLAYER_IDS.slice(0, activePlayerCount).map((player, index) => [player, PLAYER_PIECES[index % PLAYER_PIECES.length].id])));
    lastMsg.current = s.message;
  };

  // ── Auto-move animation ────────────────────────────────────────────────────
  useEffect(() => {
    if (state.phase !== 'move' || state.pendingPosition === null) {
      setAnimatedPositions(state.positions || initialCityTycoonState.positions);
      // Keep the full board visible until a player actually rolls and the token is moving.
      setFocusedSpace(null);
      return undefined;
    }

    const movingPlayer = state.turn;
    let current = state.positions?.[movingPlayer] ?? 0;
    const target = state.pendingPosition;
    setAnimatedPositions({ ...(state.positions || {}), [movingPlayer]: current });
    setFocusedSpace(current);

    const interval = setInterval(() => {
      current = nextBoardStep(current, target);
      setAnimatedPositions(prev => ({ ...prev, [movingPlayer]: current }));
      setFocusedSpace(current);
      if (current === target) {
        clearInterval(interval);
        setTimeout(() => dispatch({ type: 'MOVE_PIECE' }), 180);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [state.phase, state.pendingPosition, state.turn]);

  // ── AI turn ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const aiPlayer = state.turn;
    const aiPlayers = state.players?.length ? state.players.slice(1) : ['O'];
    const shouldAutoPlay = !state.winner && (isOnline ? aiSeatsFromRoom.includes(aiPlayer) : isAI && aiPlayers.includes(aiPlayer));
    if (!shouldAutoPlay) return undefined;

    const t = setTimeout(() => {
      const currentState = state;
      const currentPlayer = currentState.turn;

      if (currentState.phase === 'build') {
        // If this AI starts a turn in jail, pay when affordable, otherwise roll for doubles.
        if (currentState.inJail?.[currentPlayer] && (currentState.cash?.[currentPlayer] || 0) >= 50) {
          dispatch({ type: 'PAY_TO_LEAVE_JAIL' });
          return;
        }

        // Try to build using the actual AI player id, not hard-coded Player 2/O.
        const buildable = getPlayerProperties(currentPlayer, currentState)
          .filter(sp => canBuildOnSpace(sp, currentPlayer, currentState) && canAfford(currentPlayer, getBuildCost(sp), currentState))
          .sort((a, b) => (getBuildCost(a) || 0) - (getBuildCost(b) || 0));

        if (buildable.length && (currentState.cash?.[currentPlayer] || 0) > getBuildCost(buildable[0]) + 250) {
          dispatch({ type: 'BUILD_PROPERTY', index: buildable[0].pos });
          return;
        }

        dispatch({ type: 'SKIP_BUILD' });
        return;
      }

      if (currentState.phase === 'roll') {
        dispatch({ type: 'ROLL_DICE' });
        return;
      }

      if (currentState.phase === 'land') {
        const landed = getSpaceByIndex(currentState.landedSpace);
        if (!landed) {
          dispatch({ type: 'RESOLVE_LAND' });
          return;
        }

        const owner = currentState.owned?.[currentState.landedSpace];
        if (isPurchasableSpace(landed) && !owner) {
          const price = getPropertyPrice(landed);
          const cashNow = currentState.cash?.[currentPlayer] || 0;
          // AI buys most affordable open properties but keeps a small rent buffer.
          if (price && canAfford(currentPlayer, price, currentState) && cashNow - price >= 150) {
            dispatch({ type: 'BUY_PROPERTY' });
          } else {
            dispatch({ type: 'AUCTION_PROPERTY' });
          }
          return;
        }

        if (isPurchasableSpace(landed) && owner && owner !== currentPlayer) {
          dispatch({ type: 'PAY_RENT' });
          return;
        }

        if (landed.type === 'event') {
          dispatch({ type: 'DRAW_OUTBREAK' });
          return;
        }

        if (landed.type === 'tax') {
          dispatch({ type: 'RESOLVE_LAND' });
          return;
        }

        dispatch({ type: 'END_TURN' });
        return;
      }

      if (currentState.phase === 'end') {
        dispatch({ type: 'END_TURN' });
      }
    }, 850);

    return () => clearTimeout(t);
  }, [isAI, isOnline, aiSeatsFromRoom.join('|'), state.winner, state.phase, state.turn, state.landedSpace, state.pendingPosition, state.message, state.players]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const { turn, phase, cash, positions, owned, buildings, lastRoll, winner, landedSpace, selectedSpace } = state;
  const players = state.players?.length ? state.players : PLAYER_IDS.slice(0, activePlayerCount);
  const landed  = getSpaceByIndex(landedSpace);
  const selected = getSpaceByIndex(selectedSpace);
  const localHumanSeats = isAI ? ['X'] : players;
  const isAIPlayer = (player) => isOnline ? aiSeatsFromRoom.includes(player) : (isAI && !localHumanSeats.includes(player));
  const ownsOnlineSeat = (player) => !isOnline || String(playerRole) === String(player) || String(roomSeatUsers?.[player]) === String(session?.user?.id);
  const isMyTurn = !isAIPlayer(turn) && ownsOnlineSeat(turn);

  const canRoll  = phase === 'roll'  && !winner && isMyTurn && !state.inJail?.[turn];
  const canUseJailCard = phase === 'roll' && !winner && isMyTurn && state.inJail?.[turn] && (state.getOutOfJailCards?.[turn] || 0) > 0;
  const canPayJail = phase === 'roll' && !winner && isMyTurn && state.inJail?.[turn] && canAfford(turn, 50, state);
  const canBuild = phase === 'build' && !winner && isMyTurn && selected && canBuildOnSpace(selected, turn, state) && canAfford(turn, getBuildCost(selected), state);
  const canBuy   = phase === 'land'  && !winner && isMyTurn && landed && isPurchasableSpace(landed) && !owned[landedSpace] && canAfford(turn, getPropertyPrice(landed), state);
  const canAuction = phase === 'land' && !winner && isMyTurn && landed && isPurchasableSpace(landed) && !owned[landedSpace];
  const canPayR  = phase === 'land'  && !winner && isMyTurn && landed && isPurchasableSpace(landed) && owned[landedSpace] && owned[landedSpace] !== turn;

  const groupByDistrict = (props) => {
    const map = {};
    props.forEach(sp => {
      const k = sp.district || 'misc';
      if (!map[k]) map[k] = { key:k, label:DISTRICTS[k]?.name||'Other', color:DISTRICTS[k]?.colorHex||'#888', spaces:[] };
      map[k].spaces.push(sp);
    });
    return Object.values(map);
  };

  const playerGroups = Object.fromEntries(players.map(player => [player, groupByDistrict(getPlayerProperties(player, state))]));
  const humanBuildOptions = getPlayerProperties(turn, state)
    .filter(sp => canBuildOnSpace(sp, turn, state))
    .map(sp => ({ ...sp, cost: getBuildCost(sp), level: state.buildings?.[sp.pos] || 0, affordable: canAfford(turn, getBuildCost(sp), state) }));

  const ownsFullGroup = (player, sp) => {
    if (!sp?.district) return false;
    const d = DISTRICTS[sp.district];
    if (!d) return false;
    return d.positions.every(pos => owned[pos] === player);
  };

  const buildCost = selected ? getBuildCost(selected) : 0;
  const choosePiece = (player, pieceId) => {
    setPlayerPieces(prev => {
      const taken = Object.entries(prev).find(([other, id]) => other !== player && id === pieceId);
      if (taken) return prev;
      return { ...prev, [player]: pieceId };
    });
  };

  const pieceTakenBy = (pieceId) => {
    const found = Object.entries(playerPieces).find(([, id]) => id === pieceId);
    return found?.[0] || null;
  };


  // ── Landed space card content ──────────────────────────────────────────────
  const renderLandCard = () => {
    if (phase !== 'land' || !landed) return null;
    const d = DISTRICTS[landed.district];
    const price = getPropertyPrice(landed);
    const ownerKey = owned[landedSpace];
    const ownerName = ownerKey ? (isAIPlayer(ownerKey) ? `${PLAYER_NAMES[ownerKey] || ownerKey} AI` : (PLAYER_NAMES[ownerKey] || ownerKey)) : null;
    let rentAmt = 0;
    if (ownerKey && ownerKey !== turn) {
      const ownerTransportCount = Object.entries(owned).filter(([pos,o]) => o === ownerKey && getSpaceByIndex(Number(pos))?.type === 'transport').length;
      rentAmt = getRentAmount(landed, buildings[landedSpace]||0, ownerTransportCount||1, lastRoll, state);
    }

    return (
      <div style={{
        padding:14, borderRadius:12, marginBottom:10,
        background:'rgba(255,255,255,.04)',
        border:`2px solid ${d?.colorHex||'rgba(232,184,0,.4)'}44`,
      }}>
        {d && <div style={{ height:8, borderRadius:'4px 4px 0 0', background:d.colorHex, margin:'-14px -14px 10px', width:'calc(100% + 28px)' }}/>}
        <div style={{ fontSize:14, color:'#e8b800', fontWeight:'bold' }}>{landed.name}</div>
        {d && <div style={{ fontSize:11, color:d.colorHex||'#888', marginBottom:6 }}>{d.name}</div>}
        {isPurchasableSpace(landed) && !ownerKey && price && (
          <div style={{ fontSize:12, color:'#888', marginBottom:8 }}>Price: <span style={{color:'#4caf50',fontWeight:'bold'}}>{formatCredits(price)}</span></div>
        )}
        {ownerKey && ownerKey !== turn && (
          <div style={{ fontSize:12, color:'#f44', marginBottom:8 }}>
            Owned by <b>{ownerName}</b> — Rent: <b>{formatCredits(rentAmt)}</b>
          </div>
        )}
        {ownerKey === turn && (
          <div style={{ fontSize:12, color:'#4caf50', marginBottom:8 }}>You own this.</div>
        )}
        {landed.type === 'event' && <div style={{ fontSize:12, color:'#f39c12' }}>Chance card space.</div>}
        {landed.type === 'tax' && <div style={{ fontSize:12, color:'#f44' }}>Tax: {formatCredits(landed.amount||0)}</div>}

        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
          {canAuction && isMyTurn && (
            <>
              <button
                className="bv-button"
                style={{fontSize:12, opacity: canBuy ? 1 : 0.55}}
                disabled={!canBuy}
                onClick={() => dispatch({ type:'BUY_PROPERTY' })}
                title={canBuy ? `Buy ${landed.name}` : 'Not enough cash to buy this property'}
              >
                Buy {formatCredits(price)}
              </button>
              <button
                className="bv-button secondary"
                style={{fontSize:12}}
                onClick={() => dispatch({ type:'AUCTION_PROPERTY' })}
              >
                Auction / Pass
              </button>
            </>
          )}
          {canPayR && isMyTurn && (
            <button className="bv-button" style={{fontSize:12,background:'rgba(244,67,54,.15)',borderColor:'rgba(244,67,54,.4)',color:'#f44'}}
              onClick={() => dispatch({ type:'PAY_RENT' })}>
              Pay Rent {formatCredits(rentAmt)}
            </button>
          )}
          {landed.type === 'event' && isMyTurn && (
            <button className="bv-button" style={{fontSize:12}} onClick={() => dispatch({ type:'DRAW_OUTBREAK' })}>Draw Card</button>
          )}
          {landed.type === 'tax' && isMyTurn && (
            <button className="bv-button" style={{fontSize:12}} onClick={() => dispatch({ type:'RESOLVE_LAND' })}>Pay Tax</button>
          )}
          {isMyTurn && !canAuction && (
            <button className="bv-button secondary" style={{fontSize:12}} onClick={() => dispatch({ type:'RESOLVE_LAND' })}>End / Skip</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="game-shell city-tycoon-fit" style={{ maxWidth:1100, margin:'0 auto', padding:'8px 6px 24px' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}

      {/* Header */}
      <div className="game-header">
        <h2 className="bv-title">🏙️ City Tycoon</h2>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {state.tradeAuctionAvailable && !state.tradeAuctionUsed && (
        <div className="bv-notice" style={{borderColor:'rgba(232,184,0,.55)'}}>
          🏁 90% of properties sold — one-time property trade auction unlocked.
          <button className="bv-button" style={{marginLeft:8, fontSize:12}} onClick={() => dispatch({ type:'RUN_TRADE_AUCTION' })}>Run Trade Auction</button>
        </div>
      )}

      {isOnline && (
        <div className="bv-notice">
          Online room {roomCode} · You are {playerRole}. Empty Player 3+ seats can be AI in the room setup.
        </div>
      )}

      {/* Winner banner */}
      {winner && (
        <div className="winner-banner">
          🏆 ${isAIPlayer(winner) ? `${PLAYER_NAMES[winner] || winner} AI` : (PLAYER_NAMES[winner] || winner)} Wins — City Secured!
        </div>
      )}

      {/* Turn indicator */}
      {!winner && (
        <div className="turn-indicator">
          {isAIPlayer(turn) ? `🤖 ${PLAYER_NAMES[turn] || turn} AI is playing…` :
           `Phase: ${phase.toUpperCase()} — ${(PLAYER_NAMES[turn] || turn)}'s turn`}
        </div>
      )}

      {/* Player piece selector */}
      <div className="bv-card" style={{ padding:12, marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div>
            <div style={{ color:'#e8b800', fontWeight:900, fontSize:14 }}>Choose player pieces</div>
            <div style={{ color:'#aaa', fontSize:12 }}>South Adelaide board tokens. AI gets its own piece automatically.</div>
          </div>
          <span style={{ color:'#60a5fa', fontSize:12 }}>{isAI ? 'AI players get pieces automatically.' : 'Each player chooses a piece.'}</span>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
          {[2,3,4,5].map(count => (
            <button key={count} className={activePlayerCount === count ? 'bv-button' : 'bv-button secondary'} disabled={isOnline && !ownsOnlineSeat('X')} onClick={() => setActivePlayerCount(count)} style={{ fontSize:11 }}>
              {count} players
            </button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginTop:10 }}>
          {players.filter(player => !isAIPlayer(player)).map(player => (
            <div key={player} style={{ border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:10, background:'rgba(255,255,255,.03)' }}>
              <div style={{ fontSize:12, color:PLAYER_COLORS[player], fontWeight:900, marginBottom:8 }}>
                {PLAYER_NAMES[player] || player} token
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {PLAYER_PIECES.map(piece => {
                  const taken = pieceTakenBy(piece.id);
                  const active = playerPieces[player] === piece.id;
                  const disabled = taken && taken !== player;
                  return (
                    <button
                      key={piece.id}
                      type="button"
                      className={active ? 'bv-button' : 'bv-button secondary'}
                      disabled={disabled}
                      onClick={() => choosePiece(player, piece.id)}
                      title={disabled ? 'Already chosen' : piece.label}
                      style={{ fontSize:11, opacity:disabled ? 0.35 : 1, padding:'6px 8px' }}
                    >
                      {piece.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main layout: board + side panel */}
      <div className="city-tycoon-play-layout" style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-start' }}>

        {/* ── BOARD ──────────────────────────────────────────────────── */}
        <div className="city-tycoon-main-board" style={{ flex:'1 1 540px', minWidth:300 }}>
          <CityTycoonBoard
            playerPositions={animatedPositions}
            playerPieces={playerPieces}
            owned={owned}
            buildings={buildings}
            selectedSpace={selectedSpace}
            focusedSpace={phase === 'move' ? focusedSpace : null}
            onSelectSpace={idx => dispatch({ type:'SELECT_SPACE', index:idx })}
          />
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
        <div className="city-tycoon-side-panel" style={{ flex:'0 0 280px', display:'flex', flexDirection:'column', gap:10 }}>

          {/* Cash balances */}
          <div className="bv-card" style={{ padding:12 }}>
            {players.map(p => (
              <div key={p} style={{
                display:'flex', alignItems:'center', gap:10, marginBottom:p==='X'?8:0,
                opacity: turn===p&&!winner ? 1 : 0.6,
              }}>
                <div style={{ width:12, height:12, borderRadius:'50%', background:PLAYER_COLORS[p] }}/>
                <span style={{ fontSize:13, color:'#e0e0e0', flex:1 }}>
                  {isAIPlayer(p) ? `🤖 ${PLAYER_NAMES[p] || p} AI` : (PLAYER_NAMES[p] || p)}
                  {turn===p&&!winner && <span style={{color:'#e8b800',marginLeft:4}}>◄</span>}
                </span>
                <span style={{ fontSize:15, fontWeight:'bold', color: cash[p]<200?'#f44':'#4caf50', fontFamily:'monospace' }}>
                  {formatCredits(cash[p]||0)}
                </span>
              </div>
            ))}
          </div>

          {/* Dice */}
          <div className="bv-card" style={{ padding:12, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#888', marginBottom:8 }}>
              {phase==='build' ? 'Build or Skip Build' : state.inJail?.[turn] ? 'Jail — Pay or Use Card' : phase==='roll' ? 'Roll Dice' : phase==='move' ? 'Moving…' : `${phase.toUpperCase()}`}
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:8 }}>
              <DieSVG value={lastRoll?.[0] || 1} />
              <DieSVG value={lastRoll?.[1] || 1} />
            </div>
            {lastRoll && (
              <div style={{ fontSize:12, color:'#e8b800', marginBottom:8 }}>
                Rolled: {lastRoll[0]} + {lastRoll[1]} = {lastRoll[0]+lastRoll[1]}
              </div>
            )}

            {/* Phase action buttons */}
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
              {phase === 'build' && isMyTurn && !winner && (
                <>
                  <button className="bv-button secondary" style={{fontSize:12}} onClick={() => dispatch({ type:'SKIP_BUILD' })}>
                    Skip Build / Roll Dice
                  </button>
                  {canBuild && selected ? (
                    <button className="bv-button" style={{fontSize:12,background:'rgba(39,174,96,.15)',borderColor:'rgba(39,174,96,.4)',color:'#4caf50'}}
                      onClick={() => dispatch({ type:'BUILD_PROPERTY' })}>
                      Build on {selected.name} — {formatCredits(buildCost)}
                    </button>
                  ) : (
                    <button className="bv-button" style={{fontSize:12, opacity:0.65}} disabled>
                      Build Properties
                    </button>
                  )}
                </>
              )}
              {phase === 'roll' && isMyTurn && !winner && (
                <>
                  {state.inJail?.[turn] && (
                    <div style={{width:'100%', fontSize:12, color:'#fca5a5', marginBottom:6}}>
                      You are in Jail. Use a card or pay ⬡50 before rolling.
                    </div>
                  )}
                  {canUseJailCard && (
                    <button className="bv-button" style={{fontSize:12}} onClick={() => dispatch({ type:'USE_GET_OUT_OF_JAIL_CARD' })}>
                      Use Get Out of Jail Free Card
                    </button>
                  )}
                  {canPayJail && (
                    <button className="bv-button secondary" style={{fontSize:12}} onClick={() => dispatch({ type:'PAY_TO_LEAVE_JAIL' })}>
                      Pay ⬡50 to Leave Jail
                    </button>
                  )}
                  <button className="bv-button" style={{fontSize:13,padding:'10px 24px'}} onClick={() => dispatch({ type:'ROLL_DICE' })} disabled={!canRoll}>
                    🎲 Roll Dice
                  </button>
                </>
              )}
              {phase === 'end' && isMyTurn && !winner && (
                <button className="bv-button" onClick={() => dispatch({ type:'END_TURN' })}>End Turn →</button>
              )}
            </div>
          </div>

          {phase === 'build' && isMyTurn && !winner && (
            <div className="bv-card" style={{ padding:12 }}>
              <div style={{ fontSize:12, color:'#e8b800', fontWeight:900, marginBottom:6 }}>Build Properties</div>
              <div style={{ fontSize:11, color:'#aaa', marginBottom:8 }}>
                Own a full colour group to build. Select a property from your holdings, then press Build.
              </div>
              {humanBuildOptions.length ? humanBuildOptions.map(sp => (
                <button
                  key={sp.pos}
                  className={selectedSpace === sp.pos ? 'bv-button' : 'bv-button secondary'}
                  disabled={!sp.affordable || sp.level >= 5}
                  onClick={() => dispatch({ type:'SELECT_SPACE', index: sp.pos })}
                  style={{ width:'100%', fontSize:11, marginBottom:5, opacity:(!sp.affordable || sp.level >= 5) ? 0.55 : 1 }}
                >
                  {sp.name} · Level {sp.level}/5 · {formatCredits(sp.cost)}
                </button>
              )) : (
                <div style={{ fontSize:11, color:'#777' }}>No buildable full colour groups yet.</div>
              )}
            </div>
          )}

          {/* Landed space card */}
          {renderLandCard()}

          {/* Selected property info */}
          {selected && phase === 'build' && (
            <div className="bv-card" style={{ padding:12 }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:4 }}>Selected</div>
              <div style={{ fontSize:14, color:'#e8b800', fontWeight:'bold' }}>{selected.name}</div>
              {DISTRICTS[selected.district] && (
                <div style={{ fontSize:11, color:DISTRICTS[selected.district].colorHex }}>{DISTRICTS[selected.district].name}</div>
              )}
              <div style={{ fontSize:11, color:'#888', marginTop:4 }}>
                Upgrades: {buildings[selectedSpace]||0}/5 · Build cost: {formatCredits(buildCost)}
              </div>
              {!ownsFullGroup(turn, selected) && (
                <div style={{ fontSize:11, color:'#f39c12', marginTop:4 }}>⚠ Own full district to build.</div>
              )}
              {buildings[selectedSpace] >= 5 && (
                <div style={{ fontSize:11, color:'#4caf50', marginTop:4 }}>🏨 Hotel built — fully upgraded!</div>
              )}
            </div>
          )}

          {/* Outbreak card result */}
          {state.outbreakCard && (
            <div className="bv-card" style={{ padding:12, borderColor:'rgba(244,67,54,.3)', background:'rgba(244,67,54,.05)' }}>
              <div style={{ fontSize:12, color:'#f44', fontWeight:'bold', marginBottom:4 }}>
                ☣ {state.outbreakCard.title}
              </div>
              <div style={{ fontSize:11, color:'#aaa' }}>{state.outbreakCard.text}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── PROPERTY HOLDINGS ─────────────────────────────────────── */}
      <div style={{ display:'flex', gap:12, marginTop:14, flexWrap:'wrap' }}>
        {players.map(player => {
          const label = isAIPlayer(player) ? `🤖 ${PLAYER_NAMES[player] || player} AI` : (PLAYER_NAMES[player] || player)
          const groups = playerGroups[player] || []
          return (
          <div key={player} className="bv-card" style={{ flex:'1 1 280px', padding:12, borderLeft:`3px solid ${PLAYER_COLORS[player]}` }}>
            <div style={{ color:PLAYER_COLORS[player], fontSize:13, fontWeight:'bold', marginBottom:8 }}>
              {label} — {formatCredits(cash[player]||0)}
            </div>
            {groups.length === 0 ? (
              <div style={{ color:'#555', fontSize:12 }}>No properties yet.</div>
            ) : groups.map(g => (
              <div key={g.key} style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, color:g.color, fontWeight:'bold', marginBottom:3, display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:g.color }}/>
                  {g.label}
                  {g.spaces.length === (DISTRICTS[g.key]?.positions?.length||0) && (
                    <span style={{ color:'#4caf50', fontSize:9 }}>✓ FULL</span>
                  )}
                </div>
                {g.spaces.map(sp => (
                  <PropertyRow key={sp.pos} space={sp} state={state}
                    currentPlayer={player} selected={selectedSpace===sp.pos}
                    onSelect={idx => dispatch({ type:'SELECT_SPACE', index:idx })}
                  />
                ))}
              </div>
            ))}
          </div>
        )})}
      </div>
    </div>
  );
}
