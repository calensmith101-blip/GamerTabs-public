/**
 * GamerTab: Black Vault
 * Chess Trainer / Checkers — Dark board + animated pieces
 * Premium dark-horror aesthetic
 */

import React, { useState } from 'react';

/* ── Chess pieces (Unicode, styled) ──────────────────────────── */
const CHESS_PIECES = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
};

const DEFAULT_CHESS = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

function idx(r, c) { return r * 8 + c }

/* ── Chess board ─────────────────────────────────────────────── */
export function ChessBoard({ board = DEFAULT_CHESS, size = 320, selected: selectedProp, onSquareClick, lastMove: lastMoveProp, legalMoves = [] }) {
  const [selectedInternal, setSelectedInternal] = useState(null);
  const [lastMoveInternal, setLastMoveInternal] = useState(null);
  const board2D = Array.isArray(board[0]) ? board : Array.from({ length: 8 }, (_, row) => board.slice(row * 8, row * 8 + 8));
  const selected = selectedProp !== undefined
    ? typeof selectedProp === 'number'
      ? { row: Math.floor(selectedProp / 8), col: selectedProp % 8 }
      : selectedProp
    : selectedInternal;
  const lastMove = lastMoveProp !== undefined ? lastMoveProp : lastMoveInternal;
  const sq = size / 8;

  const handleClick = (row, col) => {
    if (onSquareClick) {
      onSquareClick(row, col);
      return;
    }
    if (selected) {
      setLastMoveInternal({ from: selected, to: { row, col } });
      setSelectedInternal(null);
      return;
    }
    if (board2D[row][col]) {
      setSelectedInternal({ row, col });
    }
  };

  const isSelected = (r,c) => selected && selected.row===r && selected.col===c;
  const isLastMove = (r,c) => lastMove && (
    (lastMove.from.row===r && lastMove.from.col===c) ||
    (lastMove.to.row===r && lastMove.to.col===c)
  );

  return (
    <div style={{
      display:'inline-block',
      border:'3px solid #2d2d3d',
      borderRadius:6,
      boxShadow:'0 0 0 1px rgba(200,16,16,.3), 0 0 30px rgba(200,16,16,.12), 0 12px 40px rgba(0,0,0,.8)',
      overflow:'hidden',
      position:'relative',
    }}>
      {/* Scanlines */}
      <div style={{
        position:'absolute',inset:0,zIndex:5,pointerEvents:'none',
        background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.05) 3px,rgba(0,0,0,.05) 4px)'
      }}/>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="pieceGlow">
            <feGaussianBlur stdDeviation="1.5" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
          <filter id="selGlow">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feComposite in="SourceGraphic" in2="b" operator="over"/>
          </filter>
        </defs>

        {Array.from({length:8}).map((_,row) =>
          Array.from({length:8}).map((_,col) => {
            const dark = (row+col)%2===1;
            const piece = board2D[row][col];
            const sel   = isSelected(row,col);
            const last  = isLastMove(row,col);
            const sqIdx = idx(row, col);
            const canMove = Array.isArray(legalMoves) && legalMoves.includes && legalMoves.includes(sqIdx);
            const x = col*sq, y = row*sq;
            const isWhite = typeof piece === 'string' && (piece.startsWith('w') || '♙♖♘♗♕♔'.includes(piece));
            const displayPiece = piece && CHESS_PIECES[piece] ? CHESS_PIECES[piece] : piece;

            return (
              <g key={`${row}${col}`} onClick={() => handleClick(row,col)}
                 style={{ cursor:'pointer' }}>
                {/* Square */}
                <rect x={x} y={y} width={sq} height={sq}
                      fill={sel ? 'rgba(200,16,16,.5)'
                                : last ? (dark?'rgba(200,16,16,.2)':'rgba(200,16,16,.12)')
                                : dark  ? '#180808' : '#2a1010'}/>
                {/* Last move highlight */}
                {last && <rect x={x} y={y} width={sq} height={sq} fill="rgba(200,16,16,.15)"/>}
                {/* Selection glow */}
                {sel && <rect x={x} y={y} width={sq} height={sq} fill="rgba(200,16,16,.35)"
                              filter="url(#selGlow)"/>}
                {/* Coordinate labels */}
                {col===0 && (
                  <text x={x+2} y={y+10} fontSize="7"
                        fontFamily="'Courier New',monospace"
                        fill="rgba(200,16,16,.35)">{8-row}</text>
                )}
                {row===7 && (
                  <text x={x+sq-8} y={y+sq-2} fontSize="7"
                        fontFamily="'Courier New',monospace"
                        fill="rgba(200,16,16,.35)">
                    {String.fromCharCode(97+col)}
                  </text>
                )}
                {/* Piece */}
                {piece && (
                  <g filter="url(#pieceGlow)">
                    <text x={x+sq/2} y={y+sq/2+9} textAnchor="middle"
                          fontSize={sq*0.7}
                          fill={isWhite ? '#e8e0d0' : '#1a0808'}
                          stroke={isWhite ? 'rgba(0,0,0,.6)' : 'rgba(255,80,80,.4)'}
                          strokeWidth=".5"
                          style={{
                            textShadow: isWhite
                              ? '0 1px 3px rgba(0,0,0,.8)'
                              : '0 0 6px rgba(200,0,0,.6)',
                            filter: sel
                              ? `drop-shadow(0 0 6px rgba(200,16,16,.9))`
                              : isWhite
                                ? 'drop-shadow(0 1px 2px rgba(0,0,0,.9))'
                                : 'drop-shadow(0 0 4px rgba(180,0,0,.5))'
                          }}>
                      {displayPiece}
                    </text>
                  </g>
                )}
                {/* legal-move indicator */}
                {canMove && !piece && (
                  <circle cx={x+sq/2} cy={y+sq/2} r={Math.max(4, sq*0.12)} fill="rgba(200,16,16,.85)" />
                )}
              </g>
            );
          })
        )}

        {/* Board border overlay */}
        <rect width={size} height={size} fill="none"
              stroke="rgba(200,16,16,.2)" strokeWidth="2"/>
      </svg>
    </div>
  );
}

/* ── Checkers board ──────────────────────────────────────────── */
const CHECKER_RED   = '🔴';
const CHECKER_BLACK = '⚫';
const CHECKER_RED_K = '👑';
const CHECKER_BLK_K = '💀';

function buildCheckers() {
  const board = Array.from({length:8},()=>Array(8).fill(null));
  for (let r=0; r<3; r++)
    for (let c=0; c<8; c++)
      if ((r+c)%2===1) board[r][c] = 'b';
  for (let r=5; r<8; r++)
    for (let c=0; c<8; c++)
      if ((r+c)%2===1) board[r][c] = 'r';
  return board;
}

export function CheckersBoard({ board: boardProp, size = 320, selected: selectedProp, onSquareClick, disabled = false }) {
  const [boardInternal, setBoardInternal] = useState(buildCheckers);
  const [selInternal, setSelInternal] = useState(null);
  const board = boardProp || boardInternal;
  const selected = selectedProp !== undefined ? selectedProp : selInternal;
  const sq = size / 8;

  const handleSq = (r, c) => {
    if (disabled) return;
    if (onSquareClick) {
      onSquareClick(r, c);
      return;
    }
    if (selected) {
      if ((r+c)%2===1 && !board[r][c]) {
        const next = board.map(row=>[...row]);
        next[r][c] = board[selected.r][selected.c];
        next[selected.r][selected.c] = null;
        setBoardInternal(next);
      }
      setSelInternal(null);
    } else if (board[r][c]) {
      setSelInternal({ r, c });
    }
  };

  return (
    <div style={{
      display:'inline-block',
      border:'3px solid #2d2d3d', borderRadius:6,
      boxShadow:'0 0 0 1px rgba(200,16,16,.3), 0 12px 40px rgba(0,0,0,.8)',
      overflow:'hidden',
    }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({length:8}).map((_,r) =>
          Array.from({length:8}).map((_,c) => {
            const dark   = (r+c)%2===1;
            const piece  = board[r][c];
            const isSel  = selected && selected.r===r && selected.c===c;
            const canDrop = selected && dark && !piece;
            const x = c*sq, y = r*sq;
            const emoji = piece==='r' ? CHECKER_RED : piece==='b' ? CHECKER_BLACK
                        : piece==='rk' ? CHECKER_RED_K : piece==='bk' ? CHECKER_BLK_K : '';

            return (
              <g key={`${r}${c}`} onClick={() => handleSq(r,c)} style={{cursor:'pointer'}}>
                <rect x={x} y={y} width={sq} height={sq}
                      fill={isSel ? 'rgba(200,16,16,.5)'
                                  : canDrop ? 'rgba(200,16,16,.2)'
                                  : dark ? '#180808' : '#2a1010'}/>
                {canDrop && <circle cx={x+sq/2} cy={y+sq/2} r={sq*.2}
                                    fill="rgba(200,16,16,.45)">
                  <animate attributeName="opacity" values=".4;.9;.4" dur="1s" repeatCount="indefinite"/>
                </circle>}
                {piece && (
                  <text x={x+sq/2} y={y+sq/2+9} textAnchor="middle"
                        fontSize={sq*.7} style={{
                          filter: isSel
                            ? 'drop-shadow(0 0 8px rgba(200,16,16,.9))'
                            : 'drop-shadow(0 2px 4px rgba(0,0,0,.8))'
                        }}>
                    {emoji}
                  </text>
                )}
              </g>
            );
          })
        )}
        <rect width={size} height={size} fill="none"
              stroke="rgba(200,16,16,.2)" strokeWidth="2"/>
      </svg>
    </div>
  );
}
