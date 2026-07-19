import { createClient } from '@supabase/supabase-js'

export const APP_ID = 'gamertabs'
export const GRACE_DAYS = 5

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID_GAMERTABS

const buckets = new Map()

export function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function send(res, status, body = 'ok') {
  res.statusCode = status
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

export function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

export function normaliseAppUrl(value) {
  const raw = value || process.env.VITE_APP_URL || process.env.APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'http://localhost:5173'
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw.replace(/\/$/, '')
  return `https://${raw}`.replace(/\/$/, '')
}

export async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    const err = new Error('Invalid JSON body')
    err.statusCode = 400
    throw err
  }
}

export async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

export function getBearerToken(req) {
  const authHeader = req.headers.authorization || ''
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
}

export function requireServerConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const err = new Error('Server access is not configured')
    err.statusCode = 500
    throw err
  }
}

export function getAdminSupabase() {
  requireServerConfig()
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getAuthedUser(req) {
  const token = getBearerToken(req)
  if (!token) {
    const err = new Error('Sign in required')
    err.statusCode = 401
    err.reason = 'missing_token'
    throw err
  }

  const supabase = getAdminSupabase()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user?.id) {
    const err = new Error('Invalid session')
    err.statusCode = 401
    err.reason = 'invalid_token'
    throw err
  }

  return { user: data.user, token, supabase }
}

export function accessFromSubscription(sub) {
  if (!sub) return { mode: 'demo', reason: 'not_subscribed', subscriptionStatus: 'none' }

  const now = new Date()
  const status = sub.status || 'unknown'
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null
  const gracePeriodEnd = sub.grace_period_end
    ? new Date(sub.grace_period_end)
    : currentPeriodEnd
      ? addDays(currentPeriodEnd, GRACE_DAYS)
      : null

  if (['active', 'trialing'].includes(status)) {
    return {
      mode: 'full',
      reason: 'subscription_active',
      subscriptionStatus: status,
      currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
      gracePeriodEnd: gracePeriodEnd?.toISOString() || null,
    }
  }

  if (['past_due', 'unpaid', 'incomplete'].includes(status) && gracePeriodEnd && now <= gracePeriodEnd) {
    return {
      mode: 'full',
      reason: 'payment_grace_period',
      subscriptionStatus: status,
      isGrace: true,
      currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
      gracePeriodEnd: gracePeriodEnd?.toISOString() || null,
    }
  }

  return {
    mode: 'expired',
    reason: 'subscription_expired',
    subscriptionStatus: status,
    currentPeriodEnd: currentPeriodEnd?.toISOString() || null,
    gracePeriodEnd: gracePeriodEnd?.toISOString() || null,
  }
}

export async function getAccessForUser(supabase, userId) {
  const { data: sub, error } = await supabase
    .from('app_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('app_id', APP_ID)
    .maybeSingle()

  if (error) {
    const err = new Error('Subscription lookup failed')
    err.statusCode = 500
    throw err
  }

  return accessFromSubscription(sub)
}

export async function requireFullAccess(req) {
  const auth = await getAuthedUser(req)
  const access = await getAccessForUser(auth.supabase, auth.user.id)
  if (access.mode !== 'full') {
    const err = new Error('Active subscription required')
    err.statusCode = 403
    err.access = access
    throw err
  }
  return { ...auth, access }
}

export function rateLimit(req, { key = 'default', limit = 30, windowMs = 60_000 } = {}) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const bucketKey = `${key}:${ip}`
  const now = Date.now()
  const bucket = buckets.get(bucketKey) || { count: 0, resetAt: now + windowMs }
  if (bucket.resetAt < now) {
    bucket.count = 0
    bucket.resetAt = now + windowMs
  }
  bucket.count += 1
  buckets.set(bucketKey, bucket)
  if (bucket.count > limit) {
    const err = new Error('Too many requests')
    err.statusCode = 429
    throw err
  }
}
