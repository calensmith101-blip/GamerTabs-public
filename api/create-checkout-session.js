import Stripe from 'stripe'
import { APP_ID, STRIPE_PRICE_ID, getAuthedUser, json, normaliseAppUrl, rateLimit } from './_helpers.js'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    rateLimit(req, { key: 'checkout', limit: 10, windowMs: 60_000 })

    if (!stripe || !STRIPE_PRICE_ID) {
      return json(res, 500, { error: 'Stripe checkout is not configured' })
    }

    const { user } = await getAuthedUser(req)
    const appUrl = normaliseAppUrl(process.env.APP_URL)

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: user.email || undefined,
      success_url: `${appUrl}?checkout=success`,
      cancel_url: `${appUrl}?checkout=cancelled`,
      allow_promotion_codes: true,
      metadata: { user_id: user.id, app_id: APP_ID },
      subscription_data: { metadata: { user_id: user.id, app_id: APP_ID } },
    })

    return json(res, 200, { url: checkout.url })
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || 'Checkout could not be started' })
  }
}
