/**
 * GamerTab: Black Vault
 * City Tycoon — Full Board SVG Component
 *
 * Original property names — no Monopoly assets used.
 * All procedural SVG. Royalty-free safe.
 */

import React, { useState, useEffect } from 'react';
import { SPACES, getSpaceByIndex } from '../../lib/cityTycoonSpaces';
import { DISTRICTS } from '../../lib/cityTycoonDistricts';

/* ── Board constants ─────────────────────────────────────────── */
const B = 900;          // board size
const C = 108;          // corner size
const N = 9;            // spaces per side
const SW = (B - C * 2) / N;  // space width = 76

// Map pos (0-39) to board index (0-35) for getSpaceRect
// Corners are at pos 0, 10, 20, 30 (handled separately)
// Sides are at pos 1-9, 11-19, 21-29, 31-39
function posToRectIndex(pos) {
  if (pos === 0 || pos === 10 || pos === 20 || pos === 30) return null; // corners
  if (pos >= 1 && pos <= 9) return pos - 1; // bottom row: 0-8
  if (pos >= 11 && pos <= 19) return 9 + (pos - 11); // right: 9-17
  if (pos >= 21 && pos <= 29) return 18 + (pos - 21); // top: 18-26
  if (pos >= 31 && pos <= 39) return 27 + (pos - 31); // left: 27-35
  return null;
}

function getSpaceRect(idx) {
  const s = SW;
  if (idx < 9) return { x: C + idx * s, y: B - C, w: s, h: C, side: 'B' };
  if (idx < 18) return { x: B - C, y: B - C - (idx - 8) * s, w: C, h: s, side: 'R' };
  if (idx < 27) return { x: B - C - (idx - 17) * s, y: 0, w: s, h: C, side: 'T' };
  return { x: 0, y: C + (idx - 27) * s, w: C, h: s, side: 'L' };
}

function getCornerRect(pos) {
  if (pos === 0) return { x: 0, y: B - C, w: C, h: C, side: 'C' };
  if (pos === 10) return { x: B - C, y: B - C, w: C, h: C, side: 'C' };
  if (pos === 20) return { x: B - C, y: 0, w: C, h: C, side: 'C' };
  if (pos === 30) return { x: 0, y: 0, w: C, h: C, side: 'C' };
  return null;
}

function getRectForPos(pos) {
  const corner = getCornerRect(pos);
  if (corner) return corner;
  const idx = posToRectIndex(pos);
  return idx === null ? null : getSpaceRect(idx);
}

function getZoomViewBox(focusedSpace) {
  const pos = Number(focusedSpace);
  if (!Number.isFinite(pos)) return `0 0 ${B} ${B}`;
  const rect = getRectForPos(pos);
  if (!rect) return `0 0 ${B} ${B}`;
  const pad = 170;
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const size = 430;
  const x = Math.max(0, Math.min(B - size, cx - size / 2));
  const y = Math.max(0, Math.min(B - size, cy - size / 2));
  return `${x} ${y} ${size} ${size}`;
}

function getWrappedLabel(rawText, maxChars = 12) {
  const text = (rawText || '').replace(/\s+/g, ' ').trim()
  const words = text.split(' ')
  const lines = []
  let current = ''

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars || !current) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  })

  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function getDisplayLabelLines(space) {
  const displayName = space.label || space.name || ''
  if (displayName.includes('/') || displayName.includes('\n')) {
    return displayName.split(/\s*\/\s*|\n/).flatMap((part) => getWrappedLabel(part, 12))
  }
  return getWrappedLabel(displayName, sideIsVertical(space) ? 10 : 12)
}

function sideIsVertical(space) {
  const pos = space.pos
  return pos > 10 && pos < 20 || pos > 30
}

function getTokenPosition(pos, offsetIndex = 0) {
  const offsets = [-18, 0, 18, -9, 9];
  const offset = offsets[offsetIndex % offsets.length] || 0;
  if (pos === 0) return { cx: C + 20 + offset, cy: B - C + 20 };
  if (pos === 10) return { cx: B - C + 20, cy: B - C + 20 + offset };
  if (pos === 20) return { cx: B - C + 20 - offset, cy: 20 };
  if (pos === 30) return { cx: 20, cy: C + 20 - offset };
  const rectIdx = posToRectIndex(pos);
  if (rectIdx === null) return { cx: C + 20, cy: B - C + 20 };
  const rect = getSpaceRect(rectIdx);
  if (rect.side === 'B' || rect.side === 'T') {
    return { cx: rect.x + rect.w / 2 + offset, cy: rect.y + rect.h / 2 };
  }
  return { cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2 + offset };
}

function Space({ space, rect, selected, owner, buildings, onClick }) {
  const { side, x, y, w, h } = rect;
  const d = DISTRICTS[space.district];
  const stripH = 18;
  const ownerColor = owner === 'X' ? '#dc2626' : owner === 'O' ? '#2563eb' : null;

  const rot = side === 'R' ? `rotate(-90 ${x + w / 2} ${y + h / 2})`
            : side === 'L' ? `rotate(90 ${x + w / 2} ${y + h / 2})`
            : side === 'T' ? `rotate(180 ${x + w / 2} ${y + h / 2})`
            : '';

  const stripRect = side === 'B'
    ? { x, y, w, h: stripH }
    : side === 'T'
    ? { x, y: y + h - stripH, w, h: stripH }
    : side === 'R'
    ? { x, y, w: stripH, h }
    : { x: x + w - stripH, y, w: stripH, h };

  const labelLines = getDisplayLabelLines(space);
  const textSize = side === 'R' || side === 'L' ? 10 : 12;
  const lineHeight = textSize + 4;
  const textOffset = space.icon ? 16 : 0;
  const startY = y + h / 2 + textOffset - ((labelLines.length - 1) * lineHeight) / 2;

  const bgColor = space.type === 'event'     ? '#180808'
                : space.type === 'transport'  ? '#0a0a18'
                : space.type === 'tax'        ? '#141008'
                : space.type === 'utility'    ? '#081408'
                : '#0f0f16';

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect x={x} y={y} width={w} height={h} fill={bgColor}
            stroke={selected ? '#ff4444' : 'rgba(200,16,16,.25)'} strokeWidth={selected ? 2 : 1} />
      {d && (
        <rect className="city-district-strip" x={stripRect.x} y={stripRect.y} width={stripRect.w} height={stripRect.h}
              fill={d.colorHex || d.color || '#777'} />
      )}
      <g transform={rot}>
        {space.icon && (
          <text x={x + w / 2} y={y + h / 2 - 6} textAnchor="middle"
                className="city-space-icon"
                fontSize={18} fontFamily="system-ui">{space.icon}</text>
        )}
        {labelLines.map((line, li) => (
          <text key={li} x={x + w / 2}
                y={startY + li * lineHeight}
                textAnchor="middle" fontSize={textSize}
                className="city-space-label"
                letterSpacing="0.04em"
                style={{ textTransform: 'uppercase' }}>
            {line}
          </text>
        ))}
        {(space.price || space.amount) && (
          <text x={x + w / 2} y={y + h - 10} textAnchor="middle"
                className="city-space-price"
                fontSize={10} fontFamily="'Courier New',monospace">
            {space.price ? `⬡${space.price}` : `${space.amount ? `⬡${space.amount}` : ''}`}
          </text>
        )}
      </g>
      {selected && (
        <rect x={x} y={y} width={w} height={h} fill="rgba(200,16,16,.12)" />
      )}
      {ownerColor && (
        <circle cx={x + 14} cy={y + 14} r={7} fill={ownerColor} stroke="#fff" strokeWidth={1.5} />
      )}
      {buildings > 0 && (
        <g>
          {Array.from({ length: Math.min(buildings, 4) }).map((_, pip) => (
            <rect key={pip}
                  x={x + 10 + pip * 10}
                  y={y + h - 18}
                  width={8}
                  height={4}
                  rx={1}
                  fill={ownerColor || '#999'} />
          ))}
          {buildings > 4 && (
            <text x={x + 10} y={y + h - 22} fontSize={6} fill="#f8f8fc"
                  fontFamily="'Courier New',monospace">
              +{buildings - 4}
            </text>
          )}
        </g>
      )}
    </g>
  );
}

function Corner({ position, label, icon, sublabel, bg }) {
  const positions = {
    BL: { x: 0, y: B - C },
    BR: { x: B - C, y: B - C },
    TR: { x: B - C, y: 0 },
    TL: { x: 0, y: 0 },
  };
  const { x, y } = positions[position];
  return (
    <g>
      <rect x={x} y={y} width={C} height={C} fill={bg || '#0a0a10'} stroke="rgba(200,16,16,.4)" strokeWidth={1} />
      <line x1={x} y1={y} x2={x + C} y2={y + C} stroke="rgba(200,16,16,.12)" strokeWidth={1} />
      <text x={x + C / 2} y={y + C / 2 - 12} textAnchor="middle" className="city-space-icon" fontSize="24" fontFamily="system-ui">{icon}</text>
      <text x={x + C / 2} y={y + C / 2 + 6} textAnchor="middle" fontSize="11" className="city-space-label"
            fontFamily="'Courier New',monospace" fontWeight="800"
            style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
        {label}
      </text>
      {sublabel && (
        <text x={x + C / 2} y={y + C / 2 + 18} textAnchor="middle" fontSize="7" fill="#ff4444"
              fontFamily="'Courier New',monospace" letterSpacing="0.5">
          {sublabel}
        </text>
      )}
    </g>
  );
}

function CenterArt() {
  const cx = B / 2;
  const cy = B / 2;
  return (
    <g>
      <rect x={C} y={C} width={B - C * 2} height={B - C * 2} fill="url(#centerGrad)" />
      <circle cx={cx} cy={cy} r={250} fill="none" stroke="rgba(200,16,16,.12)" strokeWidth={60} />
      <circle cx={cx} cy={cy} r={250} fill="none" stroke="rgba(200,16,16,.22)" strokeWidth={1} />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = i * 60 * (Math.PI / 180);
        return (
          <line key={i} x1={cx} y1={cy} x2={cx + 200 * Math.cos(a)} y2={cy + 200 * Math.sin(a)}
                stroke="rgba(200,16,16,.08)" strokeWidth={1} strokeDasharray="4 8" />
        );
      })}
      <circle cx={cx} cy={cy} r={110} fill="rgba(8,0,0,.8)" stroke="rgba(200,16,16,.5)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={95} fill="none" stroke="rgba(200,16,16,.2)" strokeWidth={8} />
      <text x={cx} y={cy - 30} textAnchor="middle" fontSize="11" fill="rgba(200,16,16,.6)"
            fontFamily="'Courier New',monospace" letterSpacing="6" style={{ textTransform: 'uppercase' }}>
        GAMERTAB
      </text>
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="22" fill="#e8eec"
            fontFamily="'Courier New',monospace" fontWeight="900" letterSpacing="2">
        CITY TYCOON
      </text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize="9" fill="rgba(200,16,16,.8)"
            fontFamily="'Courier New',monospace" letterSpacing="8">
        BLACK VAULT
      </text>
      <circle cx={cx} cy={cy + 40} r={4} fill="#cc1010" opacity={0.8}>
        <animate attributeName="opacity" values=".3;1;.3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
      </circle>
      {Object.entries(DISTRICTS).map(([key, d], i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const lx = cx - 160 + col * 170;
        const ly = cy + 65 + row * 18;
        return (
          <g key={key}>
            <rect x={lx - 14} y={ly - 8} width={10} height={10} rx={2} fill={d.colorHex || d.color || '#777'} />
            <text x={lx} y={ly} fontSize="7.5" fill="#808096" fontFamily="'Courier New',monospace"
                  letterSpacing="0.5" style={{ textTransform: 'uppercase' }}>
              {d.name}
            </text>
          </g>
        );
      })}
      <rect x={C + 2} y={C + 2} width={B - C * 2 - 4} height={B - C * 2 - 4}
            fill="none" stroke="rgba(200,16,16,.18)" strokeWidth={1} strokeDasharray="6 14">
        <animate attributeName="stroke-dashoffset" from="0" to="-80" dur="4s" repeatCount="indefinite" />
      </rect>
    </g>
  );
}


function PlayerPiece({ type = 'ute', x, y, color = '#dc2626' }) {
  const stroke = 'rgba(255,255,255,.85)';
  const dark = '#111827';

  if (type === 'ute') {
    return (
      <g transform={`translate(${x - 18} ${y - 12})`}>
        <rect x="2" y="7" width="32" height="14" rx="4" fill={color} stroke={stroke} strokeWidth="1.4" />
        <rect x="8" y="2" width="13" height="9" rx="3" fill={color} stroke={stroke} strokeWidth="1.2" />
        <rect x="22" y="8" width="10" height="8" rx="2" fill="rgba(255,255,255,.16)" />
        <circle cx="9" cy="23" r="4" fill={dark} stroke={stroke} strokeWidth="1" />
        <circle cx="27" cy="23" r="4" fill={dark} stroke={stroke} strokeWidth="1" />
      </g>
    );
  }
  if (type === 'train') {
    return (
      <g transform={`translate(${x - 15} ${y - 16})`}>
        <rect x="3" y="2" width="24" height="27" rx="5" fill={color} stroke={stroke} strokeWidth="1.5" />
        <rect x="7" y="6" width="16" height="8" rx="2" fill="rgba(255,255,255,.8)" />
        <circle cx="10" cy="21" r="3" fill="#facc15" />
        <circle cx="20" cy="21" r="3" fill="#facc15" />
        <path d="M7 31h16" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      </g>
    );
  }
  if (type === 'surfboard') {
    return (
      <g transform={`translate(${x} ${y}) rotate(-25)`}>
        <ellipse cx="0" cy="0" rx="8" ry="24" fill={color} stroke={stroke} strokeWidth="1.6" />
        <path d="M0 -19 C4 -7 4 7 0 19" stroke="rgba(255,255,255,.75)" strokeWidth="2" fill="none" />
      </g>
    );
  }
  if (type === 'toolbox') {
    return (
      <g transform={`translate(${x - 16} ${y - 13})`}>
        <path d="M11 7v-3h10v3" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        <rect x="3" y="7" width="26" height="18" rx="4" fill={color} stroke={stroke} strokeWidth="1.5" />
        <path d="M3 14h26" stroke="rgba(255,255,255,.55)" strokeWidth="1.5" />
        <rect x="13" y="12" width="6" height="4" rx="1" fill="#facc15" />
      </g>
    );
  }
  if (type === 'boot') {
    return (
      <g transform={`translate(${x - 15} ${y - 15})`}>
        <path d="M9 3h11v15h8c2 0 4 2 4 4v4H4v-7h5z" fill={color} stroke={stroke} strokeWidth="1.6" />
        <path d="M8 26h24" stroke={dark} strokeWidth="3" strokeLinecap="round" />
        <path d="M12 7h7M12 12h7" stroke="rgba(255,255,255,.65)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    );
  }
  if (type === 'turtle') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <ellipse cx="0" cy="0" rx="14" ry="10" fill={color} stroke={stroke} strokeWidth="1.5" />
        <circle cx="17" cy="0" r="5" fill={color} stroke={stroke} strokeWidth="1.2" />
        <circle cx="19" cy="-1" r="1" fill="#111" />
        <path d="M-9 -6l18 12M-9 6L9 -6" stroke="rgba(255,255,255,.35)" strokeWidth="1.2" />
        <circle cx="-9" cy="-9" r="3" fill={color} stroke={stroke} strokeWidth="1" />
        <circle cx="-9" cy="9" r="3" fill={color} stroke={stroke} strokeWidth="1" />
      </g>
    );
  }
  return <circle cx={x} cy={y} r={12} fill={color} stroke={stroke} strokeWidth="1.5" />;
}

export default function CityTycoonBoard({ playerPositions = {}, playerPieces = {}, owned = {}, buildings = {}, selectedSpace = null, focusedSpace = null, onSelectSpace = () => {} }) {
  const [selected, setSelected] = useState(selectedSpace);

  useEffect(() => {
    setSelected(selectedSpace);
  }, [selectedSpace]);

  const handleClick = (idx) => {
    setSelected(idx === selected ? null : idx);
    onSelectSpace(idx);
  };

  const ownerColor = (owner) => {
    if (owner === 'X') return '#dc2626';
    if (owner === 'O') return '#2563eb';
    if (owner === 'P3') return '#16a34a';
    if (owner === 'P4') return '#a855f7';
    if (owner === 'P5') return '#f97316';
    return '#777';
  };

  return (
    <div className="city-tycoon-board-canvas">
      <div className="city-tycoon-board-overlay" />

      <svg key={focusedSpace == null ? 'full-board' : `zoom-${focusedSpace}`} viewBox={focusedSpace == null ? `0 0 ${B} ${B}` : getZoomViewBox(focusedSpace)} width="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style={{ transition: 'all .35s ease' }}>
        <defs>
          <linearGradient id="centerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#09090e" />
            <stop offset="50%" stopColor="#050508" />
            <stop offset="100%" stopColor="#09090e" />
          </linearGradient>
          <filter id="glow-red">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width={B} height={B} fill="#050508" rx={4} />
        <rect x={1} y={1} width={B - 2} height={B - 2} fill="none" stroke="rgba(200,16,16,.45)" strokeWidth={2} rx={3} />
        <rect x={6} y={6} width={B - 12} height={B - 12} fill="none" stroke="rgba(200,16,16,.1)" strokeWidth={1} rx={2} />
        <CenterArt />

        {SPACES
          .filter(space => space.type !== 'corner')
          .map((space) => {
            const rectIdx = posToRectIndex(space.pos);
            if (rectIdx === null) return null;
            const rect = getSpaceRect(rectIdx);
            return (
              <g key={space.pos}>
                <Space
                  space={space}
                  rect={rect}
                  selected={selected === space.pos || focusedSpace === space.pos}
                  owner={owned[space.pos]}
                  buildings={buildings[space.pos] || 0}
                  onClick={() => handleClick(space.pos)}
                />
              </g>
            );
          })}

        {(() => {
          const corners = [
            { pos: 0, position: 'BL' },
            { pos: 10, position: 'BR' },
            { pos: 20, position: 'TR' },
            { pos: 30, position: 'TL' },
          ];
          return corners.map(({ pos, position }) => {
            const space = getSpaceByIndex(pos);
            return space ? (
              <Corner
                key={pos}
                position={position}
                label={space.name}
                icon={space.icon}
                sublabel={space.sub}
                bg={space.bg}
              />
            ) : null;
          });
        })()}

        {Object.entries(playerPositions).map(([player, pos], index) => {
          const { cx, cy } = getTokenPosition(pos, index)
          const colors = { X: '#dc2626', O: '#2563eb', P3: '#16a34a', P4: '#a855f7', P5: '#f97316' }
          return (
            <g key={player} className="city-player-token" style={{ transition: 'transform .28s ease' }} filter="url(#glow-red)">
              <PlayerPiece type={playerPieces[player] || (player === 'X' ? 'ute' : 'train')} x={cx} y={cy} color={colors[player] || '#aaa'} />
            </g>
          );
        })}
      </svg>

    </div>
  );
}
