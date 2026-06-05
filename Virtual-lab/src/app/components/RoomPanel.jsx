import { useEffect, useRef, useState } from 'react';
import { Users, Plus, LogIn, LogOut, Copy, Check, Crown, MessageSquare, Send, BarChart2, RefreshCw, Activity } from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../../../utils/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '6px',
  fontSize: '10px',
  color: '#e4e4e7',
};

export function RoomPanel({
  room,
  presenceUsers,
  onRoomChange,
  chatMessages = [],
  onSendChat,
  onSignInRequest,
}) {
  const { user, accessToken } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [analyticsBusy, setAnalyticsBusy] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (copied) {
      const id = setTimeout(() => setCopied(false), 1200);
      return () => clearTimeout(id);
    }
  }, [copied]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!user) {
    return (
      <div className="p-5 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-violet-950/40 border border-violet-900/60 flex items-center justify-center">
          <Users className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <div className="text-sm text-zinc-200 font-medium">Multiplayer Rooms</div>
          <div className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Sign in to create or join a live room and simulate physics with classmates in real time.
          </div>
        </div>
        <button
          onClick={onSignInRequest}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" /> Sign in to unlock
        </button>
      </div>
    );
  }

  const create = async () => {
    setBusy(true); setErr(null);
    try {
      const { room } = await apiFetch('/rooms', { method: 'POST', body: '{}' }, accessToken);
      onRoomChange(room);
    } catch (e) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  };

  const join = async () => {
    if (!code.trim()) return;
    setBusy(true); setErr(null);
    try {
      const { room } = await apiFetch(
        `/rooms/${code.trim().toUpperCase()}/join`,
        { method: 'POST', body: '{}' },
        accessToken,
      );
      onRoomChange(room);
    } catch (e) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  };

  const leave = async () => {
    if (!room) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/rooms/${room.code}/leave`, { method: 'POST', body: '{}' }, accessToken);
      onRoomChange(null);
    } catch (e) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    onSendChat?.(chatInput.trim());
    setChatInput('');
  };

  const fetchAnalytics = async () => {
    if (!room || !accessToken) return;
    setAnalyticsBusy(true);
    try {
      const { samples, summary } = await apiFetch(`/analytics/${room.code}`, { method: 'GET' }, accessToken);
      setAnalyticsData(samples ?? []);
      setAnalyticsSummary(summary);
    } catch (e) {
      console.error('Analytics fetch error:', e);
    } finally {
      setAnalyticsBusy(false);
    }
  };

  if (!room) {
    return (
      <div className="p-3 space-y-3">
        <div className="text-[9px] font-mono text-zinc-500 tracking-widest">CREATE A ROOM</div>
        <button
          onClick={create} disabled={busy}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> New Room
        </button>

        <div className="text-[9px] font-mono text-zinc-500 tracking-widest pt-2">JOIN BY CODE</div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs font-mono tracking-widest text-zinc-100 outline-none focus:border-blue-600"
          />
          <button
            onClick={join} disabled={busy || code.length < 4}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" /> Join
          </button>
        </div>

        {err && <div className="text-[10px] text-red-400">{err}</div>}
      </div>
    );
  }

  const isHost = room.hostUserId === user.id;
  const presenceById = new Map(presenceUsers.map(p => [p.id, p]));
  const liveUsers = room.users.filter(u => presenceById.has(u.id));

  const chartData = analyticsData.length > 60
    ? analyticsData.filter((_, i) => i % Math.ceil(analyticsData.length / 60) === 0)
    : analyticsData;

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      {/* Room Code */}
      <div className="bg-blue-950/30 border border-blue-900 rounded-lg p-3">
        <div className="text-[9px] font-mono text-blue-300 tracking-widest mb-1">ROOM CODE</div>
        <div className="flex items-center justify-between">
          <span className="text-xl font-mono tracking-[0.3em] text-blue-200">{room.code}</span>
          <button
            onClick={copyCode}
            className="p-1.5 rounded bg-blue-900/40 hover:bg-blue-900/70 text-blue-200"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="text-[10px] text-blue-400/70 mt-1">Share this code with your classmates</div>
      </div>

      {/* Online Users */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <div className="text-[9px] font-mono text-zinc-500 tracking-widest">
            ONLINE ({liveUsers.length}/{room.users.length})
          </div>
        </div>
        <div className="space-y-1">
          {room.users.map(u => {
            const live = presenceById.has(u.id);
            const host = u.id === room.hostUserId;
            return (
              <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-xs text-zinc-200 truncate flex-1">{u.name}</span>
                {host && <Crown className="w-3 h-3 text-amber-400" title="Host" />}
                {u.id === user.id && <span className="text-[9px] text-zinc-500">you</span>}
              </div>
            );
          })}
        </div>
      </div>

      {isHost && (
        <div className="text-[10px] text-amber-300/80 bg-amber-950/20 border border-amber-900/40 rounded-lg p-2">
          👑 You are the host. Your scene snapshots are broadcast as authoritative state every 300ms, and saved to the KV store every 5s for late-joiners.
        </div>
      )}

      {/* Chat */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          <div className="text-[9px] font-mono text-zinc-500 tracking-widest">ROOM CHAT</div>
        </div>
        <div className="h-40 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-lg p-2 space-y-1">
          {chatMessages.length === 0 ? (
            <div className="text-[11px] text-zinc-600 italic text-center mt-12">No messages yet</div>
          ) : (
            chatMessages.map((m, i) => (
              <div key={i} className="text-[11px] break-words">
                <span className={`font-mono font-medium ${m.userId === user.id ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {m.userId === user.id ? 'You' : (m.userName?.split(' ')[0] ?? 'User')}:{' '}
                </span>
                <span className="text-zinc-300">{m.payload?.text}</span>
                <span className="text-zinc-600 ml-1 text-[9px]">
                  {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
            placeholder="Type a message…"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-violet-600"
          />
          <button
            onClick={sendChat}
            disabled={!chatInput.trim()}
            className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg text-xs flex items-center gap-1"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Session Analytics */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <button
          onClick={() => { setShowAnalytics(!showAnalytics); if (!showAnalytics) fetchAnalytics(); }}
          className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono text-zinc-400 tracking-widest">SESSION ANALYTICS</span>
          </div>
          <span className="text-[10px] text-zinc-500">{showAnalytics ? '▲' : '▼'}</span>
        </button>

        {showAnalytics && (
          <div className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-zinc-500 font-mono">Room: <span className="text-cyan-400">{room.code}</span></div>
              <button
                onClick={fetchAnalytics} disabled={analyticsBusy}
                className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${analyticsBusy ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {analyticsSummary && (
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                {[
                  { label: 'Samples', val: analyticsSummary.count },
                  { label: 'Avg KE', val: `${analyticsSummary.avgKE?.toFixed(2)} J` },
                  { label: 'Max KE', val: `${analyticsSummary.maxKE?.toFixed(2)} J` },
                  { label: 'Avg Energy', val: `${analyticsSummary.avgEnergy?.toFixed(2)} J` },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-zinc-800 rounded p-1.5">
                    <div className="text-[9px] text-zinc-500">{label}</div>
                    <div className="text-zinc-200">{val}</div>
                  </div>
                ))}
              </div>
            )}

            {chartData.length > 2 ? (
              <div>
                <div className="text-[9px] font-mono text-zinc-500 mb-1">ENERGY OVER SESSION</div>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={chartData} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="ts" tick={false} stroke="#3f3f46" />
                    <YAxis tick={{ fill: '#71717a', fontSize: 8 }} stroke="#3f3f46" />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => v.toFixed(2)} />
                    <Line type="monotone" dataKey="totalKE" name="KE" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="totalEnergy" name="E_total" stroke="#f59e0b" strokeWidth={1.5} dot={false} isAnimationActive={false} strokeDasharray="5 2" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex gap-3 justify-center mt-1">
                  {[['#3b82f6', 'KE'], ['#f59e0b', 'E_total']].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-1">
                      <div style={{ width: 12, height: 2, background: c, borderRadius: 1 }} />
                      <span className="text-[9px] text-zinc-500 font-mono">{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <Activity className="w-6 h-6 text-zinc-700 mx-auto mb-1" />
                <div className="text-[11px] text-zinc-600">
                  {analyticsBusy ? 'Loading…' : 'No session data yet. Run experiments to collect analytics.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={leave} disabled={busy}
        className="w-full py-2 bg-red-950/40 hover:bg-red-900/40 border border-red-900 rounded-lg text-xs text-red-300 flex items-center justify-center gap-1.5"
      >
        <LogOut className="w-3.5 h-3.5" /> Leave Room
      </button>

      {err && <div className="text-[10px] text-red-400">{err}</div>}
    </div>
  );
}
