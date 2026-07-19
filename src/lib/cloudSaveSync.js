const SYNC_KEY_PATTERNS = [
  /^bv:/i,
  /^blackvault\.offline\./i,
  /^blackvault\.game\./i,
  /^gamertab_/i,
  /^gt[A-Z_:-]/i,
  /save/i,
  /room/i,
  /game/i,
]

let originalSetItem = null
let originalRemoveItem = null
let active = false
let bearerToken = null
let queue = []
let flushTimer = null

function shouldSync(key) {
  const text = String(key || '')
  if (!text) return false
  if (/supabase|auth|token|password|stripe|secret|settings/i.test(text)) return false
  return SYNC_KEY_PATTERNS.some(pattern => pattern.test(text))
}

function parseValue(value) {
  if (value === undefined) return null
  if (value === null) return null
  try { return JSON.parse(value) } catch { return value }
}

async function sendSave(saveKey, payload) {
  if (!bearerToken || !saveKey) return
  await fetch('/api/cloud-saves', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ save_key: saveKey, payload }),
  }).catch(() => {})
}

async function sendDelete(saveKey) {
  if (!bearerToken || !saveKey) return
  await fetch('/api/cloud-saves', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ save_key: saveKey }),
  }).catch(() => {})
}

function scheduleFlush() {
  if (flushTimer) return
  flushTimer = setTimeout(async () => {
    const batch = queue.splice(0, 30)
    flushTimer = null
    for (const item of batch) {
      if (item.type === 'delete') await sendDelete(item.key)
      else await sendSave(item.key, item.payload)
    }
    if (queue.length) scheduleFlush()
  }, 700)
}

function enqueue(item) {
  queue.push(item)
  if (queue.length > 200) queue = queue.slice(-200)
  scheduleFlush()
}

export async function restoreCloudSaves(token) {
  if (typeof window === 'undefined' || !window.localStorage || !token) return
  try {
    const res = await fetch('/api/cloud-saves', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return
    const data = await res.json()
    const saves = Array.isArray(data?.saves) ? data.saves : []
    saves.forEach(save => {
      if (!save?.save_key || !shouldSync(save.save_key)) return
      const value = typeof save.payload === 'string' ? save.payload : JSON.stringify(save.payload)
      try { window.localStorage.setItem(save.save_key, value) } catch {}
    })
  } catch {}
}

export function enableCloudSaveSync(token) {
  if (typeof window === 'undefined' || !window.localStorage) return
  bearerToken = token
  if (active) return

  originalSetItem = window.localStorage.setItem.bind(window.localStorage)
  originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage)

  window.localStorage.setItem = (key, value) => {
    const result = originalSetItem(key, value)
    if (shouldSync(key)) enqueue({ type: 'save', key: String(key), payload: parseValue(value) })
    return result
  }

  window.localStorage.removeItem = (key) => {
    const result = originalRemoveItem(key)
    if (shouldSync(key)) enqueue({ type: 'delete', key: String(key) })
    return result
  }

  active = true
}

export function disableCloudSaveSync() {
  if (typeof window === 'undefined' || !window.localStorage) return
  if (active) {
    if (originalSetItem) window.localStorage.setItem = originalSetItem
    if (originalRemoveItem) window.localStorage.removeItem = originalRemoveItem
  }
  active = false
  originalSetItem = null
  originalRemoveItem = null
  bearerToken = null
}
