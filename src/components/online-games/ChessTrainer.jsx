import React, { useCallback, useEffect, useState } from 'react';
import { useOnlineGame } from '../../hooks/useOnlineGame';

const INIT = [
  ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
  ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
  ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

const U = {
  wK: '\u2654', wQ: '\u2655', wR: '\u2656', wB: '\u2657', wN: '\u2658', wP: '\u2659',
  bK: '\u265A', bQ: '\u265B', bR: '\u265C', bB: '\u265D', bN: '\u265E', bP: '\u265F',
};

const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
const col = p => p ? p[0] : null;
const opp = c => c === 'w' ? 'b' : 'w';
const clone = b => b.map(r => [...r]);

function freshState() {
  return {
    board: clone(INIT),
    turn: 'w',
    status: '',
    over: false,
    check: false,
    captured: { w: [], b: [] },
    moveCount: 0,
  };
}

function normalizeState(state) {
  const base = freshState();
  if (!state || !Array.isArray(state.board)) return base;
  return {
    ...base,
    ...state,
    board: state.board.map(r => Array.isArray(r) ? [...r] : []),
    captured: {
      w: Array.isArray(state.captured?.w) ? state.captured.w : [],
      b: Array.isArray(state.captured?.b) ? state.captured.b : [],
    },
  };
}

function rawMoves(board, r, c) {
  const p = board[r][c];
  if (!p) return [];
  const [pc, pt] = [p[0], p[1]];
  const en = opp(pc);
  const mv = [];
  if (pt === 'P') {
    const dir = pc === 'w' ? -1 : 1;
    const sr = pc === 'w' ? 6 : 1;
    if (inB(r + dir, c) && !board[r + dir][c]) {
      mv.push([r + dir, c]);
      if (r === sr && !board[r + 2 * dir][c]) mv.push([r + 2 * dir, c]);
    }
    for (const dc of [-1, 1]) {
      if (inB(r + dir, c + dc) && col(board[r + dir][c + dc]) === en) mv.push([r + dir, c + dc]);
    }
  }
  if (pt === 'N') {
    for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
      const [nr, nc] = [r + dr, c + dc];
      if (inB(nr, nc) && col(board[nr][nc]) !== pc) mv.push([nr, nc]);
    }
  }
  if (pt === 'K') {
    for (const [dr, dc] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
      const [nr, nc] = [r + dr, c + dc];
      if (inB(nr, nc) && col(board[nr][nc]) !== pc) mv.push([nr, nc]);
    }
  }
  const sl = {
    R: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    B: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    Q: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
  };
  if (sl[pt]) {
    for (const [dr, dc] of sl[pt]) {
      let [nr, nc] = [r + dr, c + dc];
      while (inB(nr, nc)) {
        if (board[nr][nc]) {
          if (col(board[nr][nc]) === en) mv.push([nr, nc]);
          break;
        }
        mv.push([nr, nc]);
        nr += dr;
        nc += dc;
      }
    }
  }
  return mv;
}

function findKing(board, colour) {
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (board[r][c] === colour + 'K') return [r, c];
    }
  }
  return null;
}

function inCheck(board, colour) {
  const k = findKing(board, colour);
  if (!k) return false;
  const [kr, kc] = k;
  for (let r = 0; r < 8; r += 1) {
    for (let cc = 0; cc < 8; cc += 1) {
      if (col(board[r][cc]) === opp(colour) && rawMoves(board, r, cc).some(([mr, mc]) => mr === kr && mc === kc)) return true;
    }
  }
  return false;
}

function legalMoves(board, r, c) {
  const p = board[r][c];
  if (!p) return [];
  const pc = p[0];
  return rawMoves(board, r, c).filter(([tr, tc]) => {
    const nb = clone(board);
    nb[tr][tc] = p;
    nb[r][c] = null;
    return !inCheck(nb, pc);
  });
}

function allMoves(board, pc) {
  const all = [];
  for (let r = 0; r < 8; r += 1) {
    for (let c = 0; c < 8; c += 1) {
      if (col(board[r][c]) === pc) legalMoves(board, r, c).forEach(([tr, tc]) => all.push({ from: [r, c], to: [tr, tc] }));
    }
  }
  return all;
}

function applyMove(board, fr, fc, tr, tc, promo) {
  const nb = clone(board);
  let p = nb[fr][fc];
  if (p && p[1] === 'P' && (tr === 0 || tr === 7)) p = p[0] + (promo || 'Q');
  nb[tr][tc] = p;
  nb[fr][fc] = null;
  return nb;
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">How to Play - Crown Gambit</p><button className="bv-button secondary" onClick={onClose}>Close</button></div>
      <div className="htp-body">
        <h4>Pieces</h4>
        <ul>
          <li>Pawn: forward, captures diagonal, promotes at the back rank.</li>
          <li>Knight: L-shape and can jump over pieces.</li>
          <li>Bishop: diagonal lines.</li>
          <li>Rook: horizontal and vertical lines.</li>
          <li>Queen: rook and bishop moves combined.</li>
          <li>King: one square any direction and cannot move into check.</li>
        </ul>
      </div>
    </div>
  </div>
);

const PromoDlg = ({ colour, onChoose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.88)', zIndex: 9001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: '#0f0f1a', border: '2px solid #e8b800', borderRadius: 14, padding: 28, textAlign: 'center' }}>
      <div style={{ color: '#e8b800', fontSize: 15, marginBottom: 16, fontWeight: 'bold' }}>Promote pawn to:</div>
      <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
        {['Q', 'R', 'B', 'N'].map(t => (
          <button key={t} className="bv-button" onClick={() => onChoose(t)} style={{ width: 60, height: 60, fontSize: 36, padding: 0 }}>
            {U[colour + t]}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default function ChessTrainer(props) {
  const { onBack, onExit, gameMode, game, roomCode, playerRole = 'X' } = props || {};
  const exit = onBack || onExit || null;
  const isOnline = (gameMode === 'online' || gameMode === 'localLive' || String(gameMode || '').includes('online')) && !!roomCode;
  const isAI = !isOnline && (gameMode === 'ai' || gameMode === 'computer');
  const { gameState, updateState, loading } = useOnlineGame(isOnline ? roomCode : null, freshState());
  const [localState, setLocalState] = useState(() => freshState());
  const shared = normalizeState(isOnline ? gameState : localState);

  const board = shared.board;
  const turn = shared.turn;
  const status = shared.status;
  const over = !!shared.over;
  const check = !!shared.check;
  const captured = shared.captured;
  const myColour = isOnline ? (playerRole === 'O' ? 'b' : 'w') : turn;
  const canMoveOnline = !isOnline || turn === myColour;

  const [sel, setSel] = useState(null);
  const [legal, setLegal] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [promo, setPromo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const saveState = useCallback((next) => {
    const clean = normalizeState(next);
    if (isOnline) updateState(clean);
    else setLocalState(clean);
  }, [isOnline, updateState]);

  const reset = () => {
    saveState(freshState());
    setSel(null);
    setLegal([]);
    setThinking(false);
    setFlipped(false);
    setPromo(null);
  };

  const afterMove = useCallback((state, nb, nextT) => {
    const isCheckNow = inCheck(nb, nextT);
    const moves = allMoves(nb, nextT);
    if (moves.length === 0) {
      if (isCheckNow) return { ...state, status: `Checkmate! ${nextT === 'w' ? 'Black' : 'White'} wins!`, over: true, check: false };
      return { ...state, status: 'Stalemate - Draw!', over: true, check: false };
    }
    if (isCheckNow) return { ...state, status: `${nextT === 'w' ? 'White' : 'Black'} is in check!`, over: false, check: true };
    return { ...state, status: '', over: false, check: false };
  }, []);

  const completePromo = useCallback((pieceType) => {
    if (!promo) return;
    const { r, c, colour, fromR, fromC, cap } = promo;
    const nb = clone(board);
    nb[r][c] = colour + pieceType;
    nb[fromR][fromC] = null;
    const next = opp(colour);
    const nextCaptured = cap ? { ...captured, [colour]: [...(captured[colour] || []), cap] } : captured;
    const nextState = afterMove({ ...shared, board: nb, turn: next, captured: nextCaptured, moveCount: (shared.moveCount || 0) + 1 }, nb, next);
    saveState(nextState);
    setPromo(null);
  }, [afterMove, board, captured, promo, saveState, shared]);

  const doMove = useCallback((fr, fc, tr, tc) => {
    const p = board[fr][fc];
    if (!p) return;
    const pc = p[0];
    const cap = board[tr][tc];
    const nb = applyMove(board, fr, fc, tr, tc);
    const nextCaptured = cap ? { ...captured, [pc]: [...(captured[pc] || []), cap] } : captured;

    if (p[1] === 'P' && (tr === 0 || tr === 7)) {
      saveState({ ...shared, board: nb, captured: nextCaptured });
      setSel(null);
      setLegal([]);
      setPromo({ r: tr, c: tc, colour: pc, fromR: fr, fromC: fc, cap: cap || null });
      return;
    }

    setSel(null);
    setLegal([]);
    const next = opp(pc);
    const nextState = afterMove({ ...shared, board: nb, turn: next, captured: nextCaptured, moveCount: (shared.moveCount || 0) + 1 }, nb, next);
    saveState(nextState);
  }, [afterMove, board, captured, saveState, shared]);

  const handleSq = (r, c) => {
    if (over || thinking || promo) return;
    if (isOnline && !canMoveOnline) return;
    if (isAI && turn === 'b') return;
    if (sel) {
      const [sr, sc] = sel;
      if (legal.some(([tr, tc]) => tr === r && tc === c)) {
        doMove(sr, sc, r, c);
        return;
      }
      if (col(board[r][c]) === turn) {
        setSel([r, c]);
        setLegal(legalMoves(board, r, c));
        return;
      }
      setSel(null);
      setLegal([]);
      return;
    }
    if (col(board[r][c]) === turn) {
      setSel([r, c]);
      setLegal(legalMoves(board, r, c));
    }
  };

  useEffect(() => {
    if (!isAI || turn !== 'b' || over || promo) return undefined;
    setThinking(true);
    const t = setTimeout(() => {
      const mv = allMoves(board, 'b');
      if (!mv.length) {
        setThinking(false);
        return;
      }
      const caps = mv.filter(({ to: [tr, tc] }) => board[tr][tc]);
      const pick = caps.length ? caps[Math.floor(Math.random() * caps.length)] : mv[Math.floor(Math.random() * mv.length)];
      doMove(pick.from[0], pick.from[1], pick.to[0], pick.to[1]);
      setThinking(false);
    }, 500);
    return () => clearTimeout(t);
  }, [board, doMove, isAI, over, promo, turn]);

  const isDark = (r, c) => (r + c) % 2 === 1;
  const kPos = findKing(board, turn);
  const CS = 50;

  return (
    <div className="game-shell" style={{ maxWidth: 520, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}
      {promo && <PromoDlg colour={promo.colour} onChoose={completePromo} />}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || U.bP} Crown Gambit</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>Rules</button>
          <button className="bv-button secondary" onClick={() => setFlipped(f => !f)}>Flip</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {status
        ? <div className={over ? 'winner-banner' : 'turn-indicator'} style={over ? {} : { color: check ? '#f44336' : '#e8b800', fontWeight: 'bold' }}>{status}</div>
        : <div className="turn-indicator">{thinking ? 'AI thinking...' : `${turn === 'w' ? 'White' : 'Black'}'s turn${isAI && turn === 'b' ? ' (AI)' : ''}${isOnline ? ` - You are ${myColour === 'w' ? 'White' : 'Black'}` : ''}`}</div>}

      {isOnline && loading && <div className="bv-notice">Connecting chess board to room {roomCode}...</div>}
      {isOnline && !canMoveOnline && !over && <div className="bv-notice">Waiting for the other player to move.</div>}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <div className="chess-grid">
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingLeft: 20, marginBottom: 3 }}>
            {(flipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']).map(f => (
              <div key={f} style={{ width: CS, textAlign: 'center', color: '#555', fontSize: 10 }}>{f}</div>
            ))}
          </div>
          {(flipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]).map(rowIdx => (
            <div key={rowIdx} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 18, color: '#555', fontSize: 10, textAlign: 'right', marginRight: 2 }}>{rowIdx + 1}</div>
              {(flipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]).map(colIdx => {
                const r = rowIdx;
                const c = colIdx;
                const dark = isDark(r, c);
                const isSel = sel && sel[0] === r && sel[1] === c;
                const isLeg = legal.some(([lr, lc]) => lr === r && lc === c);
                const isChk = check && kPos && kPos[0] === r && kPos[1] === c;
                const piece = board[r][c];
                return (
                  <button key={c} onClick={() => handleSq(r, c)} style={{
                    width: CS, height: CS, padding: 0,
                    background: isSel ? '#e8b800' : isChk ? '#8b0000' : dark ? '#2d2d4a' : '#4a4a6a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: (!over && (!isOnline || canMoveOnline)) ? 'pointer' : 'default',
                    position: 'relative',
                    border: isSel ? '2px solid #fff' : '1px solid transparent',
                    borderRadius: 0,
                    userSelect: 'none',
                  }}>
                    {isLeg && <div style={{ position: 'absolute', width: piece ? '100%' : '38%', height: piece ? '100%' : '38%', borderRadius: piece ? 0 : '50%', background: piece ? 'rgba(192,57,43,.38)' : 'rgba(232,184,0,.5)', border: piece ? '3px solid rgba(232,184,0,.8)' : 'none', zIndex: 1, pointerEvents: 'none' }} />}
                    {piece && <span style={{ fontSize: CS * 0.62, lineHeight: 1, color: col(piece) === 'w' ? '#fff' : '#0a0a0a', textShadow: col(piece) === 'w' ? '0 1px 4px rgba(0,0,0,.9)' : '0 1px 4px rgba(255,255,255,.35)', zIndex: 2 }}>{U[piece]}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#666' }}>White cap: {captured.w.map((p, i) => <span key={i} style={{ fontSize: 14 }}>{U[p]}</span>)}</span>
        <span style={{ fontSize: 12, color: '#666' }}>Black cap: {captured.b.map((p, i) => <span key={i} style={{ fontSize: 14 }}>{U[p]}</span>)}</span>
      </div>
    </div>
  );
}
