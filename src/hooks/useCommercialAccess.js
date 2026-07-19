import { useEffect, useState } from 'react'
import { buildDemoAccess, buildExpiredAccess, buildFullAccess, isDemoSession } from '../lib/accessControl'

export function useCommercialAccess(session) {
  const [access, setAccess] = useState(() => buildDemoAccess('loading'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadAccess() {
      if (!session || isDemoSession(session)) {
        setAccess(buildDemoAccess('anonymous'))
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const token = session?.access_token
        if (!token) {
          setAccess(buildDemoAccess('missing_session_token'))
          return
        }

        const res = await fetch('/api/access', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
          setAccess(buildDemoAccess('access_check_failed'))
          return
        }

        const data = await res.json()
        if (cancelled) return

        if (data.mode === 'full') {
          setAccess(buildFullAccess(data))
        } else if (data.mode === 'expired') {
          setAccess(buildExpiredAccess(data))
        } else {
          setAccess(buildDemoAccess(data.reason || 'not_subscribed'))
        }
      } catch (error) {
        if (!cancelled) setAccess(buildDemoAccess('access_check_error'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAccess()
    const interval = setInterval(loadAccess, 5 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [session])

  return { access, loading }
}
