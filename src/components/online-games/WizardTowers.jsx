import React, { useState, useEffect, useRef } from 'react';

/* Wizard Towers — Tower Defense
 * 8-wide path grid. Enemies spawn left, walk right. Place towers to stop them.
 * Towers cost mana, have range + damage. Survive 10 waves.
 */

const COLS = 10, ROWS = 5;
const PATH_ROW = 2; // enemies walk along row 2

const TOWERS = [
  { id: 'frost',  name: 'Frost Tower',  icon: '🧊', cost: 80,  dmg: 1, range: 2, rate: 1.2, color: '#2980b9' },
  { id: 'fire',   name: 'Fire Tower',   icon: '🔥', cost: 120, dmg: 3, range: 2, rate: 0.8, color: '#c0392b' },
  { id: 'arcane', name: 'Arcane Tower', icon: '⚡', cost: 200, dmg: 5, range: 3, rate: 0.6, color: '#8e44ad' },
  { id: 'void',   name: 'Void Tower',   icon: '🌀', cost: 350, dmg: 10,range: 4, rate: 0.5, color: '#2c3e50' },
];

function initState() {
  return {
    grid: Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => ({
        r, c, tower: null,
        isPath: r === PATH_ROW, isSpawn: r === PATH_ROW && c === 0,
      }))
    ),
    enemies: [],
    wave: 1, mana: 300, lives: 20,
    score: 0, phase: 'prep', // prep | battle | gameover | win
    spawnQueue: [],
    tick: 0,
  };
}

const HTP = ({ onClose }) => (
  <div className="htp-overlay" onClick={onClose}>
    <div className="htp-box" onClick={e => e.stopPropagation()}>
      <div className="htp-header"><p className="htp-title">Wizard Towers</p><button className="bv-button secondary" onClick={onClose}>✕</button></div>
      <div className="htp-body">
        <h4>Objective</h4><p>Defend the vault from 10 waves of enemies.</p>
        <h4>How to Play</h4><ul>
          <li>Select a tower type from the panel, then click a non-path cell to place it.</li>
          <li>Towers auto-attack enemies that enter their range.</li>
          <li>Click <b>Start Wave</b> when ready.</li>
          <li>Enemies that reach the right side cost you lives.</li>
          <li>Earn mana by killing enemies — use it for more towers.</li>
        </ul>
        <h4>Towers</h4><ul>
          <li>🧊 Frost — cheap, slows enemies.</li>
          <li>🔥 Fire — balanced damage.</li>
          <li>⚡ Arcane — high damage, wide range.</li>
          <li>🌀 Void — massive damage, very expensive.</li>
        </ul>
      </div>
    </div>
  </div>
);

export default function WizardTowers({ game, onBack, onExit }) {
  const exit = onBack || onExit || null;
  const [gs, setGs] = useState(initState);
  const [selected, setSelected] = useState(TOWERS[0]);
  const [showHelp, setShowHelp] = useState(false);
  const tickRef = useRef(null);

  const reset = () => { clearInterval(tickRef.current); setGs(initState()); };

  const startWave = () => {
    setGs(prev => {
      if (prev.phase !== 'prep') return prev;
      const count = 3 + prev.wave * 2;
      const hp = 2 + prev.wave * 3;
      const speed = Math.max(0.5, 1.2 - prev.wave * 0.05);
      const q = Array.from({ length: count }, (_, i) => ({
        id: `${prev.wave}-${i}`, col: -1, hp, maxHp: hp, speed,
        delay: i * 1.2, x: -1,
      }));
      return { ...prev, phase: 'battle', spawnQueue: q };
    });
  };

  useEffect(() => {
    if (gs.phase !== 'battle') return;
    tickRef.current = setInterval(() => {
      setGs(prev => {
        if (prev.phase !== 'battle') return prev;
        let { enemies, spawnQueue, grid, mana, lives, score, wave } = prev;
        let newMana = mana, newLives = lives, newScore = score;

        // Spawn enemies
        const newQ = [...spawnQueue];
        const toSpawn = newQ.filter(e => e.delay <= 0 && e.col === -1);
        toSpawn.forEach(e => { e.col = 0; e.x = 0; });
        const stillPending = newQ.filter(e => e.delay > 0);
        stillPending.forEach(e => { e.delay -= 0.2; });
        const remaining = newQ.filter(e => e.delay > 0 || e.col >= 0);

        // Move enemies
        let newEnemies = [...enemies, ...toSpawn].map(e => {
          if (e.col < 0) return e;
          return { ...e, x: e.x + e.speed * 0.12 };
        }).filter(e => {
          if (e.x >= COLS) { newLives--; return false; }
          return true;
        });
        // Move col tracking
        newEnemies = newEnemies.map(e => ({ ...e, col: Math.floor(e.x) }));

        // Tower attacks
        const gridTowers = grid.flatMap(row => row.filter(c => c.tower));
        newEnemies = newEnemies.map(e => {
          let hp = e.hp;
          gridTowers.forEach(cell => {
            const dist = Math.abs(cell.c - e.col);
            if (dist <= cell.tower.range) {
              hp -= cell.tower.dmg * 0.04;
            }
          });
          return { ...e, hp };
        }).filter(e => {
          if (e.hp <= 0) { newMana += 20; newScore += 10; return false; }
          return true;
        });

        // Check wave over
        const allSpawned = remaining.length === 0;
        if (allSpawned && newEnemies.length === 0) {
          const nextWave = wave + 1;
          if (nextWave > 10) return { ...prev, enemies: [], score: newScore + 200, mana: newMana, lives: newLives, phase: 'win' };
          return { ...prev, enemies: [], mana: Math.min(newMana + 50, 9999), lives: newLives, score: newScore, wave: nextWave, phase: 'prep', spawnQueue: [] };
        }

        if (newLives <= 0) return { ...prev, enemies: [], lives: 0, score: newScore, phase: 'gameover' };

        return { ...prev, enemies: newEnemies, mana: newMana, lives: newLives, score: newScore, spawnQueue: remaining };
      });
    }, 200);
    return () => clearInterval(tickRef.current);
  }, [gs.phase]);

  const placeTower = (r, c) => {
    if (gs.phase === 'battle') return;
    const cell = gs.grid[r][c];
    if (cell.isPath) return;
    if (cell.tower) return;
    if (gs.mana < selected.cost) return;
    setGs(prev => {
      const ng = prev.grid.map(row => row.map(x => ({ ...x })));
      ng[r][c].tower = { ...selected };
      return { ...prev, grid: ng, mana: prev.mana - selected.cost };
    });
  };

  return (
    <div className="game-shell" style={{ maxWidth: 600, margin: '0 auto' }}>
      {showHelp && <HTP onClose={() => setShowHelp(false)} />}
      <div className="game-header">
        <h2 className="bv-title">{game?.icon || '🧙'} Wizard Towers</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="bv-button secondary" onClick={() => setShowHelp(true)}>? Rules</button>
          <button className="bv-button" onClick={reset}>New Game</button>
          {exit && <button className="bv-button secondary" onClick={exit}>Exit</button>}
        </div>
      </div>

      {gs.phase === 'win' && <div className="winner-banner">🏆 All 10 waves defeated! Score: {gs.score}</div>}
      {gs.phase === 'gameover' && <div className="winner-banner" style={{ color: '#f44' }}>💀 Overrun! Score: {gs.score}</div>}

      <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
          <span style={{ color: '#4caf50' }}>💜 {gs.mana} mana</span>
          <span style={{ color: '#e8b800' }}>❤️ {gs.lives} lives</span>
          <span style={{ color: '#2980b9' }}>Wave {gs.wave}/10</span>
          <span style={{ color: '#888' }}>Score {gs.score}</span>
        </div>
        {gs.phase === 'prep' && (
          <button className="bv-button" onClick={startWave}>▶ Start Wave {gs.wave}</button>
        )}
        {gs.phase === 'battle' && (
          <div style={{ color: '#f39c12', fontSize: 12 }}>⚔️ Wave in progress… {gs.enemies.length + gs.spawnQueue.length} remaining</div>
        )}
      </div>

      {/* Tower selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {TOWERS.map(t => (
          <button key={t.id} onClick={() => setSelected(t)} style={{
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12,
            background: selected.id === t.id ? `${t.color}33` : 'rgba(255,255,255,.04)',
            border: `1px solid ${selected.id === t.id ? t.color : 'rgba(255,255,255,.1)'}`,
            color: selected.id === t.id ? '#fff' : '#888',
          }}>
            {t.icon} {t.name} ({t.cost}💜)
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ border: '2px solid #2a2a4a', borderRadius: 8, overflow: 'hidden', background: '#0a0a14', position: 'relative' }}>
        {gs.grid.map((row, r) => (
          <div key={r} style={{ display: 'flex', borderBottom: r < ROWS - 1 ? '1px solid rgba(255,255,255,.05)' : 'none' }}>
            {row.map((cell, c) => {
              const hasEnemy = gs.enemies.some(e => e.col === c && Math.floor(e.x) === c);
              const canPlace = !cell.isPath && !cell.tower && gs.phase !== 'battle';
              return (
                <div key={c} onClick={() => canPlace && placeTower(r, c)} style={{
                  flex: 1, aspectRatio: '1', minWidth: 0,
                  background: cell.isPath
                    ? (r === PATH_ROW ? 'rgba(100,60,0,.4)' : 'transparent')
                    : cell.tower ? `${cell.tower.color}22` : 'transparent',
                  border: canPlace ? '1px solid rgba(232,184,0,.2)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canPlace ? 'pointer' : 'default', fontSize: 20,
                  position: 'relative',
                }}>
                  {cell.tower && <span>{cell.tower.icon}</span>}
                  {cell.isPath && !cell.tower && (hasEnemy ? '🧟' : r === PATH_ROW ? '·' : '')}
                </div>
              );
            })}
          </div>
        ))}
        {/* Enemy health bars */}
        {gs.enemies.map(e => (
          <div key={e.id} style={{
            position: 'absolute', top: `${PATH_ROW * (100 / ROWS)}%`,
            left: `${(e.x / COLS) * 100}%`,
            width: 36, height: 6,
            background: '#f44336',
            borderRadius: 3,
            transform: 'translateY(-24px)',
            transition: 'left .2s linear',
            zIndex: 10,
          }}>
            <div style={{ height: '100%', width: `${(e.hp / e.maxHp) * 100}%`, background: '#4caf50', borderRadius: 3 }} />
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 6 }}>
        Path runs left → right (middle row) · Click non-path cells to place towers
      </div>
    </div>
  );
}
