import { useState } from 'react'
import { isDemoSession } from '../lib/accessControl'

export default function AccessBanner({ access, session, navigate }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const signedIn = !!session && !isDemoSession(session)

  async function startCheckout() {
    if (!signedIn) {
      navigate?.('account')
      return
    }

    setCheckoutLoading(true)
    try {
      const token = session?.access_token
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await response.json()
      if (data?.url) window.location.href = data.url
      else alert(data?.error || 'Checkout could not be started.')
    } catch (error) {
      alert('Checkout could not be started. Check your Stripe environment variables.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (access?.isFull) {
    return access.isGrace ? (
      <div className="commercial-access-banner warning">
        Payment needs attention. Full access is still active during the grace period.
      </div>
    ) : null
  }

  const expired = access?.isExpired

  return (
    <div className={`commercial-access-banner ${expired ? 'expired' : 'demo'}`}>
      <div>
        <strong>{expired ? 'Subscription expired' : 'GamerTabs demo mode'}</strong>
        <span>
          {expired
            ? ' Your saved data is kept safe. Full access unlocks again when payment resumes.'
            : ' Try local and AI play with sample/demo data. Online rooms, friends, chat, cloud saves and premium tools unlock with a subscription.'}
        </span>
      </div>
      <div className="commercial-access-actions">
        {!signedIn && <button onClick={() => navigate?.('account')}>Sign in / create account</button>}
        <button onClick={startCheckout} disabled={checkoutLoading}>{checkoutLoading ? 'Opening…' : 'Upgrade'}</button>
      </div>
    </div>
  )
}
