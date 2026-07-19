import { getAuthedUser, getAccessForUser, json } from './_helpers.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  try {
    const { user, supabase } = await getAuthedUser(req)
    const access = await getAccessForUser(supabase, user.id)
    return json(res, 200, access)
  } catch (error) {
    const status = error.statusCode || 500
    if (status === 401) return json(res, 401, { mode: 'demo', reason: error.reason || 'unauthorized' })
    return json(res, status, { mode: 'demo', reason: error.message || 'access_check_failed' })
  }
}
