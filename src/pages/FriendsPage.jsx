export default function FriendsPage({ navigate }) {
  return (
    <div className="page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('home')}>Back</button>
        <h2 className="page-title">Social Play Removed</h2>
      </div>
      <section className="setup-section">
        <h3 className="setup-heading">Friends, chat, invites and rooms are turned off</h3>
        <p className="setup-desc">
          The old communication system has been removed from the visible app for now.
          Local same-device and AI games still work from the Games screen.
        </p>
        <button className="btn-primary" onClick={() => navigate('games')}>Play Games</button>
      </section>
    </div>
  )
}
