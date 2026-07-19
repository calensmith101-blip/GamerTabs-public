import Stripe from 'stripe'
import { APP_ID, STRIPE_PRICE_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, addDays, getAdminSupabase, readRawBody, send } from './_helpers.js'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_GAMERTABS

function subscriptionContainsGamerTabsPrice(subscription) {
  if (!STRIPE_PRICE_ID) return true
  return !!subscription?.items?.data?.some(item => item?.price?.id === STRIPE_PRICE_ID)
}

async function retrieveSubscriptionFromInvoice(invoice) {
  const subscriptionId = invoice.subscription || invoice.parent?.subscription_details?.subscription || null
  if (!subscriptionId || !stripe) return null
  return stripe.subscriptions.retrieve(subscriptionId)
}

async function upsertSubscription(subscription, fallbackUserId = null) {
  if (!subscription || !subscriptionContainsGamerTabsPrice(subscription)) return

  const userId = subscription.metadata?.user_id || fallbackUserId
  const appId = subscription.metadata?.app_id || APP_ID
  if (!userId || appId !== APP_ID) return

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null
  const gracePeriodEnd = currentPeriodEnd ? addDays(currentPeriodEnd, 5) : null

  const supabase = getAdminSupabase()
  await supabase.from('app_subscriptions').upsert({
    user_id: userId,
    app_id: APP_ID,
    stripe_customer_id: String(subscription.customer || ''),
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    current_period_end: currentPeriodEnd?.toISOString() || null,
    grace_period_end: gracePeriodEnd?.toISOString() || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,app_id' })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, 'Method not allowed')
  if (!stripe || !webhookSecret || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return send(res, 500, 'Webhook not configured')

  const rawBody = await readRawBody(req)
  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, req.headers['stripe-signature'], webhookSecret)
  } catch (err) {
    return send(res, 400, `Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        await upsertSubscription(subscription, session.metadata?.user_id)
      }
    }

    if (event.type.startsWith('customer.subscription.')) {
      await upsertSubscription(event.data.object)
    }

    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
      const subscription = await retrieveSubscriptionFromInvoice(event.data.object)
      await upsertSubscription(subscription)
    }
  } catch (error) {
    console.error('[stripe-webhook] handler failed:', error)
    return send(res, 500, 'Webhook handler failed')
  }

  return send(res, 200, 'received')
}
