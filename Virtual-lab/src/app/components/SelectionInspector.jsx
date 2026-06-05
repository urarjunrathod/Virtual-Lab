// SelectionInspector — editable properties for the currently-selected body
import { Trash2, Copy, Lock, Unlock } from 'lucide-react';
import { MATERIALS } from './materials';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#22d3ee', '#a16207', '#9ca3af', '#14b8a6'];

export function SelectionInspector({ selection, onUpdate, onDelete, onDuplicate, onToggleStatic, api }) {
  if (!selection) {
    return (
      <div className="p-4 text-[11px] text-zinc-500 font-mono leading-relaxed">
        <div className="text-[10px] tracking-widest text-zinc-600 mb-2">INSPECTOR</div>
        <p>Click a body on the canvas to edit its properties.</p>
      </div>
    );
  }

  const s = selection;
  const setField = (k, v) => onUpdate({ ...s, [k]: v });

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] tracking-widest text-zinc-500 font-mono">INSPECTOR</div>
          <div className="text-sm text-zinc-100 font-mono">#{s.id} · {s.shape}</div>
        </div>
        <div className="flex gap-1">
          <button onClick={onDuplicate} title="Duplicate (Ctrl+D)"
            className="p-1.5 rounded border border-zinc-700 bg-zinc-800 hover:border-zinc-600 text-zinc-300">
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggleStatic} title="Toggle static/dynamic"
            className="p-1.5 rounded border border-zinc-700 bg-zinc-800 hover:border-zinc-600 text-zinc-300">
            {s.isStatic ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onDelete} title="Delete (Del)"
            className="p-1.5 rounded border border-red-900 bg-red-950/50 hover:bg-red-900/40 text-red-300">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-zinc-500 font-mono tracking-widest">LABEL</label>
        <input
          value={s.name || ''}
          onChange={e => setField('name', e.target.value)}
          className="mt-1 w-full px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="text-[10px] text-zinc-500 font-mono tracking-widest">MATERIAL PRESET</label>
        <select
          value={s.material || 'custom'}
          onChange={e => setField('material', e.target.value)}
          className="mt-1 w-full px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
        >
          {Object.entries(MATERIALS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      <NumberRow label="Mass" unit="kg" value={s.mass} min={0.1} max={50} step={0.1}
        onChange={v => setField('mass', v)} disabled={s.isStatic} />
      <NumberRow label="Density" unit="" value={s.density} min={0.0001} max={0.02} step={0.0001}
        onChange={v => setField('density', v)} disabled={s.isStatic} />
      <NumberRow label="Friction μ" unit="" value={s.friction} min={0} max={1} step={0.02}
        onChange={v => setField('friction', v)} />
      <NumberRow label="Restitution e" unit="" value={s.restitution} min={0} max={1} step={0.02}
        onChange={v => setField('restitution', v)} />
      <NumberRow label="Air drag" unit="" value={s.frictionAir ?? 0.01} min={0} max={0.2} step={0.001}
        onChange={v => setField('frictionAir', v)} />

      <div>
        <label className="text-[10px] text-zinc-500 font-mono tracking-widest">COLOR</label>
        <div className="mt-1 flex gap-1 flex-wrap">
          {COLORS.map(c => (
            <button key={c} onClick={() => setField('color', c)}
              className="w-6 h-6 rounded border-2 transition-transform hover:scale-110"
              style={{ background: c, borderColor: s.color === c ? '#fff' : 'transparent' }} />
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800 space-y-2">
        <div className="text-[10px] text-zinc-500 font-mono tracking-widest">TRANSFORM</div>
        <div className="grid grid-cols-2 gap-2">
          <NumField label="x" value={s.x} onChange={v => api?.current?.setPosition(v, s.y)} />
          <NumField label="y" value={s.y} onChange={v => api?.current?.setPosition(s.x, v)} />
        </div>
        <NumField label="rotation °" value={s.angle} onChange={v => api?.current?.setAngle(v)} />
        {s.shape === 'circle' ? (
          <div className="text-[10px] font-mono text-zinc-500">radius = {s.radius?.toFixed(1)} px</div>
        ) : (
          <div className="text-[10px] font-mono text-zinc-500">w × h = {s.width?.toFixed(0)} × {s.height?.toFixed(0)} px</div>
        )}
      </div>

      <div className="pt-2 border-t border-zinc-800 space-y-2">
        <div className="text-[10px] text-zinc-500 font-mono tracking-widest">BODY TYPE</div>
        <div className="grid grid-cols-3 gap-1">
          {['static', 'dynamic', 'kinematic'].map(t => (
            <button key={t} onClick={() => api?.current?.setBodyType(t)}
              className={`py-1 text-[10px] rounded border transition-colors ${s.bodyType === t
                ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800 space-y-2">
        <div className="text-[10px] text-zinc-500 font-mono tracking-widest">ADVANCED</div>
        <ToggleRow label="Lock rotation" value={!!s.lockRotation}
          onChange={v => api?.current?.setLockRotation(v)} />
        <ToggleRow label="Sensor (no collision)" value={!!s.isSensor}
          onChange={v => api?.current?.setSensor(v)} />
        <div>
          <label className="text-[10px] text-zinc-500 font-mono tracking-widest">COLLISION CATEGORY</label>
          <select
            value={s.collisionCategory || 1}
            onChange={e => api?.current?.setCollisionCategory(parseInt(e.target.value))}
            className="mt-1 w-full px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
          >
            {[1, 2, 4, 8, 16, 32].map(c => <option key={c} value={c}>Group {c}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 space-y-0.5">
        <div>v = ({s.vx?.toFixed(2)}, {s.vy?.toFixed(2)}) m/s</div>
        <div>ω = {s.angularVelocity?.toFixed(3)} rad/f</div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <div className="text-[10px] text-zinc-500 font-mono">{label}</div>
      <input
        type="number"
        value={Number(value ?? 0).toFixed(1)}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono focus:border-blue-500 outline-none"
      />
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-full flex items-center justify-between px-2 py-1.5 rounded border text-[11px] transition-colors ${value
        ? 'border-emerald-700 bg-emerald-900/20 text-emerald-300'
        : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
      <span>{label}</span>
      <span className={`w-8 h-4 rounded-full relative transition-colors ${value ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

function NumberRow({ label, unit, value, min, max, step, onChange, disabled }) {
  return (
    <div>
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-zinc-400">{label}</span>
        <span className="text-[10px] font-mono text-zinc-300 bg-zinc-700 px-1.5 py-0.5 rounded">
          {Number(value ?? 0).toFixed(step < 0.01 ? 4 : step < 1 ? 2 : 0)} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value ?? 0} disabled={disabled}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded appearance-none cursor-pointer accent-blue-500 disabled:opacity-40" />
    </div>
  );
}
