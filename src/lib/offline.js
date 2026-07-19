const PROFILE_KEY = 'gamertabs.demo.profile.v1';

export function isBrowserOnline() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}

export function createOfflineSession() {
  return createDemoSession();
}

export function createDemoSession() {
  return {
    demoGuest: true,
    user: {
      id: 'demo-guest',
      email: null,
      user_metadata: { display_name: 'Demo Guest' },
    },
  };
}

export function isOfflineSession(session) {
  return !!session?.offlineGuest || !!session?.demoGuest;
}

export function loadOfflineProfile(session) {
  return buildDefaultProfile(session);
}

export function saveOfflineProfile(profile) {
  return profile;
}

export function clearOfflineProfile() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

function buildDefaultProfile(session) {
  const fallbackName = session?.user?.user_metadata?.display_name || 'Demo Guest';
  return {
    id: 'demo-guest',
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
