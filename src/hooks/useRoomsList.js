/**
 * useRoomsList — live list of open rooms with realtime + poll fallback.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { listOpenRooms } from '../lib/roomUtils';

const POLL_MS = 8000; // fallback poll interval

export function useRoomsList(gameType = null) {
  const [rooms, setRooms]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const channelRef = useRef(null);
  const pollRef    = useRef(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    try {
      const data = await listOpenRooms(gameType);
      if (mountedRef.current) { setRooms(data); setError(null); }
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [gameType]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Subscribe to ALL game_rooms changes (no filter — we want full list updates)
    const channel = supabase
      .channel('rooms_list_global')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'game_rooms',
      }, () => { if (mountedRef.current) fetch(); })
      .subscribe((status) => {
        // If realtime fails, rely on poll
        if (status === 'CHANNEL_ERROR') console.warn('[useRoomsList] realtime unavailable, using poll');
      });

    channelRef.current = channel;

    // Poll as safety net (covers realtime gaps)
    pollRef.current = setInterval(fetch, POLL_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(pollRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetch]);

  return { rooms, loading, error, refetch: fetch };
}
