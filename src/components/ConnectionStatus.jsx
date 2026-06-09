/**
 * ConnectionStatus — small indicator for realtime connection health.
 * Drop into any multiplayer page.
 */
import React from 'react';

export default function ConnectionStatus({ connected, onRetry, style = {} }) {
  const font = "'Courier New', monospace";
  if (connected) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4caf50', boxShadow: '0 0 5px #4caf50' }}/>
        <span style={{ fontFamily: font, fontSize: 10, color: '#808096' }}>Live</span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#cc1111', boxShadow: '0 0 5px #cc1111' }}/>
      <span style={{ fontFamily: font, fontSize: 10, color: '#ff4444' }}>Reconnecting…</span>
      {onRetry && (
        <button onClick={onRetry}
          style={{ background: 'none', border: 'none', color: '#cc1111', fontFamily: font, fontSize: 10, cursor: 'pointer', padding: '0 4px' }}>
          ↺
        </button>
      )}
    </div>
  );
}
