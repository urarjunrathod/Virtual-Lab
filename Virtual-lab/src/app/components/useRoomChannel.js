import { useEffect, useRef } from 'react';
import { getSupabase } from '../../../utils/supabase/client';

export function useRoomChannel(roomCode, selfUserId, selfName, onEvent, onPresenceChange) {
  const handlerRef = useRef(onEvent);
  const presenceRef = useRef(onPresenceChange);
  const channelRef = useRef(null);

  useEffect(() => { handlerRef.current = onEvent; }, [onEvent]);
  useEffect(() => { presenceRef.current = onPresenceChange; }, [onPresenceChange]);

  useEffect(() => {
    if (!roomCode || !selfUserId) return;
    const supabase = getSupabase();
    const ch = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: selfUserId } },
    });

    ch.on('broadcast', { event: 'event' }, ({ payload }) => {
      const e = payload;
      if (e.userId === selfUserId) return;
      handlerRef.current?.(e);
    });

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const users = [];
      Object.entries(state).forEach(([id, metas]) => {
        const meta = Array.isArray(metas) && metas[0] ? metas[0] : {};
        users.push({ id, name: meta.name ?? 'Anonymous' });
      });
      presenceRef.current?.(users);
    });

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ name: selfName ?? 'Anonymous', joinedAt: Date.now() });
      }
    });

    channelRef.current = ch;
    return () => {
      try { ch.unsubscribe(); } catch { /* ignore */ }
      channelRef.current = null;
    };
  }, [roomCode, selfUserId, selfName]);

  const send = (type, payload) => {
    const ch = channelRef.current;
    if (!ch || !selfUserId) return;
    const e = {
      type, payload, ts: Date.now(),
      userId: selfUserId, userName: selfName ?? undefined,
    };
    ch.send({ type: 'broadcast', event: 'event', payload: e });
  };

  return { send };
}
