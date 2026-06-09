import { useOffline } from '../hooks/useOffline';

/**
 * OfflineBanner
 * Appears at the top of the screen when navigator.onLine === false.
 * Disappears automatically when connection is restored.
 * Zero deps beyond the hook — drop into any layout.
 */
export default function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     10000,
        background: 'linear-gradient(90deg, #2a1a00, #3a2800)',
        borderBottom: '2px solid rgba(232,184,0,.5)',
        padding:    '8px 16px',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap:        10,
        boxShadow:  '0 2px 12px rgba(0,0,0,.6)',
      }}
    >
      <span style={{ fontSize: 18 }}>📵</span>
      <span style={{
        fontSize:    13,
        fontWeight:  'bold',
        color:       '#e8b800',
        letterSpacing: 0.3,
      }}>
        Offline Mode Active
      </span>
      <span style={{
        fontSize:  12,
        color:     'rgba(232,184,0,.65)',
        borderLeft: '1px solid rgba(232,184,0,.3)',
        paddingLeft: 10,
      }}>
        Local &amp; AI games work · Multiplayer needs internet
      </span>
    </div>
  );
}
