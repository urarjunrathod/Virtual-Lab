import { useEffect, useState } from 'react';
import { Save, FolderOpen, Trash2, RefreshCw, FileText } from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../../../utils/supabase/client';

export function SavedExperiments({ getCurrentScene, onLoad, onSignInRequest }) {
  const { user, accessToken } = useAuth();
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [err, setErr] = useState(null);

  const refresh = async () => {
    if (!accessToken) return;
    setBusy(true); setErr(null);
    try {
      const { experiments } = await apiFetch('/experiments', { method: 'GET' }, accessToken);
      setList((experiments ?? []).sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally { setBusy(false); }
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  const save = async () => {
    if (!accessToken) return;
    const scene = getCurrentScene();
    if (!scene) { setErr('Nothing to save in the canvas.'); return; }
    const finalName = (name || `Experiment ${new Date().toLocaleString()}`).trim();
    setBusy(true); setErr(null);
    try {
      await apiFetch('/experiments', {
        method: 'POST',
        body: JSON.stringify({ name: finalName, scene }),
      }, accessToken);
      setName('');
      await refresh();
    } catch (e) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!accessToken) return;
    setBusy(true); setErr(null);
    try {
      await apiFetch(`/experiments/${id}`, { method: 'DELETE' }, accessToken);
      await refresh();
    } catch (e) { setErr(e.message ?? String(e)); }
    finally { setBusy(false); }
  };

  if (!user) {
    return (
      <div className="p-5 flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-center">
          <Save className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm text-zinc-200 font-medium">Cloud Saves</div>
          <div className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Sign in to save your experiments to the cloud and load them from any device.
          </div>
        </div>
        <button
          onClick={onSignInRequest}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5" /> Sign in to unlock
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <div className="space-y-2">
        <div className="text-[9px] font-mono text-zinc-500 tracking-widest">SAVE CURRENT SCENE</div>
        <div className="flex gap-2">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Experiment name"
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-blue-600"
          />
          <button
            onClick={save} disabled={busy}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
        {err && <div className="text-[10px] text-red-400">{err}</div>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-mono text-zinc-500 tracking-widest">MY EXPERIMENTS</div>
          <button
            onClick={refresh} disabled={busy}
            className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {list.length === 0 && (
          <div className="text-[11px] text-zinc-500 italic">No saved experiments yet.</div>
        )}

        <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
          {list.map((e) => (
            <div key={e.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 hover:border-zinc-700">
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-zinc-100 truncate">{e.name}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {new Date(e.updatedAt).toLocaleString()} · {e.scene?.bodies?.length ?? 0} bodies
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button
                  onClick={() => onLoad(e.scene, e.name)}
                  className="flex-1 px-2 py-1 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-800 rounded text-[10px] text-emerald-300 flex items-center justify-center gap-1"
                >
                  <FolderOpen className="w-3 h-3" /> Load
                </button>
                <button
                  onClick={() => remove(e.id)}
                  className="px-2 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900 rounded text-[10px] text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
