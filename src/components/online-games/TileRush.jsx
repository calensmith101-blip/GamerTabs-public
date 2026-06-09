import React, { useState, useEffect, useCallback } from 'react';

const SIZE = 4;

function emptyGrid() {
  return Array(SIZE).fill(null).map(() => Array(SIZE).fill(0));
}

function addRandomTile(grid) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!grid[r][c]) empty.push([r, c]);
  if (!empty.length) return grid;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const ng = grid.map(row => [...row]);
  ng[r][c] = Math.random() < 0.9 ? 2 : 4;
  return ng;
}

function initGrid() {
  let g = emptyGrid();
  g = addRandomTile(g);
  g = addRandomTile(g);
  return g;
}

function slideRow(row) {
  const nums = row.filter(v => v !== 0);
  const merged = [];
  let i = 0;
  while (i < nums.length) {
    if (nums[i + 1] !== undefined && nums[i] === nums[i + 1]) {
      merged.push(nums[i] * 2);
      i += 2;
    } else { merged.push(nums[i]); i++; }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function move(grid, dir) {
  let ng = grid.map(r => [...r]);
  let changed = false;

  if (dir === 'left') {
    for (let r = 0; r < SIZE; r++) {
      const row = slideRow(ng[r]);
      if (row.some((v, i) => v !== ng[r][i])) changed = true;
      ng[r] = row;
    }
  } else if (dir === 'right') {
    for (let r = 0; r < SIZE; r++) {
      const row = slideRow([...ng[r]].reverse()).reverse();
      if (row.some((v, i) => v !== ng[r][i])) changed = true;
      ng[r] = row;
    }
  } else if (dir === 'up') {
    for (let c = 0; c < SIZE; c++) {
      const col = slideRow(ng.map(r => r[c]));
      for (let r = 0; r < SIZE; r++) {
        if (col[r] !== ng[r][c]) changed = true;
        ng[r][c] = col[r];
      }
    }
  } else if (dir === 'down') {
    for (let c = 0; c < SIZE; c++) {
      const col = slideRow(ng.map(r => r[c]).reverse()).reverse();
      for (let r = 0; r < SIZE; r++) {
        if (col[r] !== ng[r][c]) changed = true;
        ng[r][c] = col[r];
      }
    }
  }
  return { grid: ng, changed };
}

function calcScore(grid) {
  return grid.flat().reduce((a, b) => a + b, 0);
}

function isOver(grid) {
  // No empty cells
  if (grid.flat().some(v => v === 0)) return false;
  // No adjacent merges
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
    if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
  }
  return true;
}

function hasWon(grid) { return grid.flat().some(v => v >= 2048); }

const TILE_COLORS = {
  0: '#1a1a2e', 2: '#2d3561', 4: '#1e3a5f', 8: '#0d4f8b', 16: '#1a5e8c',
  32: '#1e6f5c', 64: '#2d8a3e', 128: '#d4a017', 256: '#c8842d',
  512: '#c0392b', 1024: '#9b2226', 2048: '#8b0000', 4096: '#6b0000',
};
const tileColor = v => TILE_COLORS[v] || '#5a0000';
const textColor = v => v >= 8 ? '#fff' : '#aaa';

export default function TileRush(props) {
  const { onBack, onExit, game } = props || {};
  const exit = onBack || onExit || null;

  const [grid, setGrid] = useState(initGrid);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [over, setOver] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const touchStart = React.useRef(null);

  const reset = () => {
    const g = initGrid();
    setGrid(g); setScore(0); setWon(false); setOver(false); setKeepPlaying(false);
  };

  const doMove = useCallback((dir) => {
    if ((over || (won && !keepPlaying))) return;
    setGrid(prev => {
      const { grid: ng, changed } = move(prev, dir);
      if (!changed) return prev;
      const ng2 = addRandomTile(ng);
      const s = calcScore(ng2);
      setScore(s);
      setBest(b => Math.max(b, s));
      if (!won && hasWon(ng2)) setWon(true);
      if (isOver(ng2)) setOver(true);
      return ng2;
    });
  }, [over, won, keepPlaying]);

  useEffect(() => {
    const handler = (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
        doMove(map[e.key]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [doMove]);

  // Touch swipe
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy)) { doMove(dx > 30 ? 'right' : 'left'); }
    else if (Math.abs(dy) > 30) { doMove(dy > 0 ? 'down' : 'up'); }
    touchStart.current = null;
  };

  return (
    <div className="game-shell" style={{ maxWidth: 420, margin: '0 auto' }}>
      {showHelp && (
        <div className="htp-overlay" onClick={() => setShowHelp(false)}>
          <div className="htp-box" onClick={e => e.stopPropagation()}>
            <div className="htp-header"><p className="htp-title">Tile Rush — 2048</p><button className="bv-button secondary" onClick={() => setShowHelp(false)}>✕</button></div>
            <div className="htp-body">
              <h4>Objective</h4><p>Combine matching tiles to reach 2048!</p>
              <h4>How to Play</h4><ul>
                <li>Use <b>arrow keys</b> or <b>swipe</b> to slide all tiles.</li>
                <li>Matching tiles that collide <b>merge</b> into one with double the value.</li>
                <li>A new tile (2 or 4) appears after each move.</li>
                <li>Reach 2048 to win. No moves left = game over.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🔢'} Tile Rush</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
        <div className="bv-card" style={{ padding: '6px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, color: '#e8b800', fontWeight: 'bold' }}>{score}</div>
          <div style={{ fontSize: 10, color: '#888' }}>Score</div>
        </div>
        <div className="bv-card" style={{ padding: '6px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, color: '#7c6af7', fontWeight: 'bold' }}>{best}</div>
          <div style={{ fontSize: 10, color: '#888' }}>Best</div>
        </div>
      </div>

      {won && !keepPlaying && (
        <div className="winner-banner">
          🏆 You reached 2048!
          <button className="bv-button" style={{ marginLeft: 12, fontSize: 11 }} onClick={() => setKeepPlaying(true)}>Keep Going</button>
        </div>
      )}
      {over && <div className="winner-banner" style={{ color: '#f44' }}>💀 No more moves! Final: {score}</div>}

      <div
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{ background: '#12121e', borderRadius: 12, padding: 10, margin: '0 auto', maxWidth: 340, border: '2px solid #2a2a4a' }}>
        {grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 10, marginBottom: r < SIZE - 1 ? 10 : 0 }}>
            {row.map((val, c) => (
              <div key={c} style={{
                flex: 1, aspectRatio: '1', borderRadius: 10,
                background: tileColor(val),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: val >= 1000 ? 16 : val >= 100 ? 20 : 26,
                fontWeight: 'bold', color: textColor(val),
                transition: 'background .1s',
                minHeight: 70,
              }}>
                {val || ''}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#555' }}>
        Arrow keys or swipe to move · Merge matching tiles
      </div>

      {/* Arrow buttons for mobile */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 16 }}>
        <button className="bv-button secondary" style={{ padding: '6px 24px' }} onClick={() => doMove('up')}>▲</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="bv-button secondary" style={{ padding: '6px 20px' }} onClick={() => doMove('left')}>◀</button>
          <button className="bv-button secondary" style={{ padding: '6px 20px' }} onClick={() => doMove('down')}>▼</button>
          <button className="bv-button secondary" style={{ padding: '6px 20px' }} onClick={() => doMove('right')}>▶</button>
        </div>
      </div>
    </div>
  );
}
