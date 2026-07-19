const BLOCKED_KEY_PATTERNS = [
  /^blackvault\.offline\./i,
  /^blackvault\.game\./i,
  /^gamertab_/i,
  /^gt/i,
  /save/i,
  /room/i,
  /game/i,
]

let originalSetItem = null
let originalRemoveItem = null
let active = false

function shouldBlock(key) {
  const text = String(key || '')
  return BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(text))
}

export function enableDemoStorageGuard() {
  if (typeof window === 'undefined' || !window.localStorage || active) return
  originalSetItem = window.localStorage.setItem.bind(window.localStorage)
  originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage)
  window.localStorage.setItem = (key, value) => {
    if (shouldBlock(key)) return undefined
    return originalSetItem(key, value)
  }
  window.localStorage.removeItem = (key) => {
    if (shouldBlock(key)) return undefined
    return originalRemoveItem(key)
  }
  active = true
}

export function disableDemoStorageGuard() {
  if (typeof window === 'undefined' || !window.localStorage || !active) return
  if (originalSetItem) window.localStorage.setItem = originalSetItem
  if (originalRemoveItem) window.localStorage.removeItem = originalRemoveItem
  originalSetItem = null
  originalRemoveItem = null
  active = false
}

export function clearDemoGameStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return
  const keys = []
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i)
    if (shouldBlock(key)) keys.push(key)
  }
  keys.forEach((key) => {
    try {
      if (originalRemoveItem) originalRemoveItem(key)
      else window.localStorage.removeItem(key)
    } catch {}
  })
}
