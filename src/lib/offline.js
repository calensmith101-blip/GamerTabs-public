const PROFILE_KEY = 'blackvault.offline.profile.v1';

export function isBrowserOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export function createOfflineSession() {
  return {
    offlineGuest: true,
    user: {
      id: 'offline-guest',
      email: 'offline@blackvault.local',
      user_metadata: { display_name: 'Offline Guest' },
    },
  };
}

export function isOfflineSession(session) {
  return !!session?.offlineGuest;
}

export function loadOfflineProfile(session) {
  if (typeof localStorage === 'undefined') return buildDefaultProfile(session);
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      const created = buildDefaultProfile(session);
      saveOfflineProfile(created);
      return created;
    }
    const parsed = JSON.parse(raw);
    return { ...buildDefaultProfile(session), ...parsed };
  } catch {
    const created = buildDefaultProfile(session);
    saveOfflineProfile(created);
    return created;
  }
}

export function saveOfflineProfile(profile) {
  if (typeof localStorage === 'undefined') return profile;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export function clearOfflineProfile() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

function buildDefaultProfile(session) {
  const fallbackName = session?.user?.user_metadata?.display_name
    || session?.user?.email?.split('@')?.[0]
    || 'Offline Guest';
  return {
    id: 'offline-guest',
    username: fallbackName,
    display_name: fallbackName,
    town: '',
    state: '',
    country: '',
    points: 0,
    crowns: 0,
    level: 1,
    wins: 0,
    losses: 0,
    local_discovery_enabled: false,
    offline_mode_enabled: true,
  };
}
