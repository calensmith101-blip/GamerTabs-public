export const ACCESS_MODES = {
  DEMO: 'demo',
  FULL: 'full',
  EXPIRED: 'expired',
}

export const DEMO_LIMITS = {
  allowCloudSaves: false,
  allowOnlineRooms: false,
  allowChat: false,
  allowFriends: false,
  allowLocalSaves: false,
  allowPremiumTools: false,
  maxDemoGames: 10,
}

export function buildDemoAccess(reason = 'anonymous') {
  return {
    mode: ACCESS_MODES.DEMO,
    reason,
    isDemo: true,
    isFull: false,
    isExpired: false,
    isGrace: false,
    subscriptionStatus: 'none',
    ...DEMO_LIMITS,
  }
}

export function buildFullAccess(extra = {}) {
  return {
    mode: ACCESS_MODES.FULL,
    reason: extra.reason || 'subscription_active',
    isDemo: false,
    isFull: true,
    isExpired: false,
    isGrace: !!extra.isGrace,
    subscriptionStatus: extra.subscriptionStatus || 'active',
    allowCloudSaves: true,
    allowOnlineRooms: true,
    allowChat: true,
    allowFriends: true,
    allowLocalSaves: true,
    allowPremiumTools: true,
    currentPeriodEnd: extra.currentPeriodEnd || null,
    gracePeriodEnd: extra.gracePeriodEnd || null,
  }
}

export function buildExpiredAccess(extra = {}) {
  return {
    ...buildDemoAccess(extra.reason || 'subscription_expired'),
    mode: ACCESS_MODES.EXPIRED,
    isExpired: true,
    subscriptionStatus: extra.subscriptionStatus || 'expired',
    currentPeriodEnd: extra.currentPeriodEnd || null,
    gracePeriodEnd: extra.gracePeriodEnd || null,
  }
}

export function isDemoSession(session) {
  return !!session?.demoGuest || !!session?.offlineGuest
}

export function isFullAccess(access) {
  return access?.mode === ACCESS_MODES.FULL
}
