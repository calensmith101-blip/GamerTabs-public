export default function AccessGate({ access, feature = 'this feature', children, navigate }) {
  if (access?.isFull) return children
  return (
    <div className="page access-locked-page">
      <div className="access-locked-card">
        <h2>Full access required</h2>
        <p>{feature} is available to active GamerTabs subscribers only.</p>
        <p>Demo mode still lets you try local and AI games with no cloud saves.</p>
        <div className="commercial-access-actions">
          <button onClick={() => navigate?.('games')}>Back to demo games</button>
          <button onClick={() => navigate?.('account')}>Sign in / upgrade</button>
        </div>
      </div>
    </div>
  )
}
