/**
 * useOnlineRoom — subscribe to a single room.
 * Handles: initial load, realtime updates, cleanup, reconnection.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { loadRoom, updateRoomState } from '../lib/roomUtils';

export function useOnlineRoom(roomCode) {
  const normalizedCode = roomCode?.toString().trim().toUpperCase() || null;
  const [room, setRoom]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [connected, setConnected] = useState(false);

  const channelRef  = useRef(null);
  const mountedRef  = useRef(true);

  const fetch = useCallback(async () => {
    if (!normalizedCode) return;
    try {
      const data = await loadRoom(normalizedCode);
      if (mountedRef.current) { setRoom(data); setError(null); }
    } catch (e) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [normalizedCode]);

  useEffect(() => {
    if (!roomCode) { setLoading(false); return; }
    mountedRef.current = true;
    setLoading(true);

    fetch();

    // Clean up any stale channel from a previous render
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Stable channel name — avoids duplicate subscriptions on re-render
    const chanName = `room_${normalizedCode}`;

    const channel = supabase
      .channel(chanName)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'game_rooms',
          // NOTE: NO SPACES in filter — this is a common bug
          filter: `room_code=eq.${normalizedCode}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          if (payload.eventType === 'DELETE') {
            setRoom(null);
          } else if (payload.new) {
            setRoom(payload.new);
          }
        }
      )
      .subscribe((status) => {
        if (!mountedRef.current) return;
        if (status === 'SUBSCRIBED') {
          setConnected(true);
          // Re-fetch after subscribing to catch any gap between first load + subscription
          fetch();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnected(false);
        }
      });

    channelRef.current = channel;

    // Re-fetch when tab becomes visible (handles background disconnect)
    const onVisible = () => { if (document.visibilityState === 'visible') fetch(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      mountedRef.current = false;
      document.removeEventListener('visibilitychange', onVisible);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomCode, fetch]);

  const makeMove = useCallback(async (newState, extra = {}) => {
    if (!roomCode) return;
    try {
      const updated = await updateRoomState(roomCode, newState, extra);
      if (mountedRef.current) setRoom(updated);
      return updated;
    } catch (e) {
      console.error('[useOnlineRoom] makeMove error:', e);
      throw e;
    }
  }, [roomCode]);

  return { room, loading, error, connected, refetch: fetch, makeMove };
}
