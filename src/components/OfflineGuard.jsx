import { useOffline } from '../hooks/useOffline';

/**
 * OfflineGuard
 *
 * Renders children when online.
 * When offline, renders a styled "internet required" message instead.
 *
 * Props:
 *   children     - what to render when online
 *   message      - optional override message (default: "Internet required…")
 *   onBack       - optional back/navigate function for the "← Back" button
 *   softBlock    - if true, renders children anyway but also shows an inline
 *                  warning (useful for pages that partially work offline)
 *
 * Usage:
 *   <OfflineGuard onBack={() => navigate('games')}>
 *     <RoomsPage ... />
 *   </OfflineGuard>
 *
 *   // Soft block: show warning but still render the page
 *   <OfflineGuard softBlock>
 *     <GameSetupPage ... />
 *   </OfflineGuard>
 */
export default function OfflineGuard({
  children,
  message = 'Internet required for multiplayer',
  onBack,
  softBlock = false,
}) {
  const offline = useOffline();

  if (!offline) return children;

  if (softBlock) {
    return (
      <>
        <div style={bannerStyle}>
          <span>📵</span>
          <span style={{ fontWeight: 'bold', color: '#e8b800' }}>Offline</span>
          <span style={{ color: '#aaa', fontSize: 12 }}>—</span>
          <span style={{ fontSize: 12, color: '#ccc' }}>{message}</span>
        </div>
        {children}
      </>
    );
  }

  return (
    <div style={{
      minHeight:     '60vh',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      justifyContent: 'center',
      padding:       '32px 20px',
      textAlign:     'center',
      color:         '#e0e0e0',
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📵</div>

      <h2 style={{
        color:        '#e8b800',
        fontSize:     '1.4rem',
        margin:       '0 0 10px',
        fontWeight:   'bold',
      }}>
        You're offline
      </h2>

      <p style={{
        color:      '#888',
        fontSize:   14,
        maxWidth:   320,
        lineHeight: 1.6,
        margin:     '0 0 28px',
      }}>
        {message}.<br />
        Local and AI games still work without an internet connection.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {onBack && (
          <button
            onClick={onBack}
            style={btnStyle('#e8b800', 'rgba(232,184,0,.15)', 'rgba(232,184,0,.4)')}
          >
            ← Back
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          style={btnStyle('#888', 'rgba(255,255,255,.05)', 'rgba(255,255,255,.1)')}
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const bannerStyle = {
  display:        'flex',
  alignItems:     'center',
  gap:            8,
  padding:        '8px 14px',
  background:     'rgba(232,184,0,.08)',
  border:         '1px solid rgba(232,184,0,.25)',
  borderRadius:   8,
  margin:         '8px 0',
  fontSize:       13,
  flexWrap:       'wrap',
};

function btnStyle(color, bg, border) {
  return {
    padding:      '10px 22px',
    borderRadius: 10,
    background:   bg,
    border:       `1px solid ${border}`,
    color,
    fontSize:     14,
    cursor:       'pointer',
    fontWeight:   'bold',
  };
}
