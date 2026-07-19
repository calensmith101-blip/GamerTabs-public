import { APP_ID, json, readJson, requireFullAccess, rateLimit } from './_helpers.js'

const MAX_KEY_LENGTH = 160
const MAX_PAYLOAD_CHARS = 250_000

function cleanSaveKey(value) {
  const key = String(value || '').trim()
  if (!key || key.length > MAX_KEY_LENGTH) return null
  if (!/^[a-zA-Z0-9_.:\-]+$/.test(key)) return null
  return key
}

export default async function handler(req, res) {
  try {
    rateLimit(req, { key: 'cloud-saves', limit: 120, windowMs: 60_000 })
    const { user, supabase } = await requireFullAccess(req)

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('game_saves')
        .select('save_key,payload,updated_at')
        .eq('user_id', user.id)
        .eq('app_id', APP_ID)
        .order('updated_at', { ascending: false })
        .limit(500)

      if (error) throw error
      return json(res, 200, { saves: data || [] })
    }

    if (req.method === 'POST') {
      const body = await readJson(req)
      const saveKey = cleanSaveKey(body.save_key)
      if (!saveKey) return json(res, 400, { error: 'Invalid save key' })

      const payload = body.payload ?? null
      const payloadString = JSON.stringify(payload)
      if (payloadString.length > MAX_PAYLOAD_CHARS) return json(res, 413, { error: 'Save payload too large' })

      const { error } = await supabase.from('game_saves').upsert({
        user_id: user.id,
        app_id: APP_ID,
        save_key: saveKey,
        payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,app_id,save_key' })

      if (error) throw error
      return json(res, 200, { ok: true })
    }

    if (req.method === 'DELETE') {
      const body = await readJson(req)
      const saveKey = cleanSaveKey(body.save_key)
      if (!saveKey) return json(res, 400, { error: 'Invalid save key' })

      const { error } = await supabase
        .from('game_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('app_id', APP_ID)
        .eq('save_key', saveKey)

      if (error) throw error
      return json(res, 200, { ok: true })
    }

    return json(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    return json(res, error.statusCode || 500, { error: error.message || 'Cloud save failed', access: error.access || undefined })
  }
}
