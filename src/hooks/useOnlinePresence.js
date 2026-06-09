/**
 * useOnlinePresence — manage own online status + list visible players.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { setOnlineStatus } from '../lib/roomUtils';

export function useOnlinePresence(userId, discoveryEnabled = false) {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const channelRef = useRef(null);
  const mountedRef = useRef(true);

  const fetchOnline = useCallback(async () => {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, town, state, country, is_online, last_seen, local_discovery_enabled')
      .or('local_discovery_enabled.eq.true,is_online.eq.true')
      .neq('id', userId || 'none')
      .order('last_seen', { ascending: false });
    if (error) {
      console.warn('[useOnlinePresence] fetch error', error.message);
      if (mountedRef.current) setOnlineUsers([]);
      return;
    }

    const filtered = (data || []).filter((profile) => {
      if (profile.local_discovery_enabled) return true;
      if (profile.is_online && profile.last_seen) {
        return new Date(profile.last_seen) >= cutoff;
      }
      return false;
    });

    if (mountedRef.current) setOnlineUsers(filtered);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    mountedRef.current = true;

    // Mark self online
    setOnlineStatus(userId, true, discoveryEnabled);

    fetchOnline();

    // Heartbeat every 60s
    const heartbeat = setInterval(() => {
      setOnlineStatus(userId, true, discoveryEnabled);
      fetchOnline();
    }, 60000);

    // Subscribe to presence changes
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const chan = supabase
      .channel('presence_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
        () => { if (mountedRef.current) fetchOnline(); })
      .subscribe();
    channelRef.current = chan;

    // Mark offline on cleanup
    return () => {
      mountedRef.current = false;
      clearInterval(heartbeat);
      setOnlineStatus(userId, false, false);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [userId, discoveryEnabled, fetchOnline]);

  return { onlineUsers, refetch: fetchOnline };
}
