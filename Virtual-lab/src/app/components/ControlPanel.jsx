
import { Sliders } from 'lucide-react';

function Slider({ label, sublabel, unit, value, min, max, step, onChange, color = 'accent-blue-500' }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <div>
          <span className="text-xs text-zinc-300">{label}</span>
          {sublabel && <span className="text-[10px] text-zinc-500 ml-1">{sublabel}</span>}
        </div>
        <span className="text-xs font-mono text-zinc-300 bg-zinc-700 px-1.5 py-0.5 rounded">
          {value.toFixed(step < 1 ? 2 : step < 0.1 ? 3 : 1)} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className={`w-full h-1.5 bg-zinc-700 rounded appearance-none cursor-pointer ${color}`}
      />
    </div>
  );
}

export function ControlPanel({ params, onParamsChange }) {
  const set = (k, v) => onParamsChange({ ...params, [k]: v });

  return (
    <div className="border-t border-zinc-800 p-3">
      <div className="flex items-center gap-2 mb-3">
        <Sliders className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-[10px] font-mono text-zinc-500 tracking-widest">SIMULATION PARAMETERS</span>
      </div>

      <div className="space-y-3.5">
        <Slider label="Gravity" sublabel="g" unit="m/s²"
          value={params.gravity} min={0} max={9.8} step={0.05}
          onChange={v => set('gravity', v)} color="accent-blue-500" />
        <Slider label="Global Friction" sublabel="μ" unit=""
          value={params.friction} min={0} max={1} step={0.05}
          onChange={v => set('friction', v)} color="accent-amber-500" />
        <Slider label="Air Resistance" sublabel="b" unit=""
          value={params.airResistance} min={0} max={0.1} step={0.002}
          onChange={v => set('airResistance', v)} color="accent-teal-500" />
        <Slider label="Time Scale" sublabel="τ" unit="×"
          value={params.timeScale} min={0.05} max={3} step={0.05}
          onChange={v => set('timeScale', v)} color="accent-purple-500" />

        {/* Quick gravity presets */}
        <div>
          <div className="text-[10px] text-zinc-500 mb-1.5 font-mono">GRAVITY PRESETS</div>
          <div className="grid grid-cols-3 gap-1">
            {[
            //  { label: 'Moon', g: 0.18 },
              { label: 'Earth', g: 9.8 },
            //  { label: 'Jupiter', g: 2.53 },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => set('gravity', p.g)}
                className={`py-1 text-[10px] rounded border transition-colors ${
                  Math.abs(params.gravity - p.g) < 0.02
                    ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Zero gravity toggle */}
        <button
          onClick={() => set('gravity', params.gravity > 0 ? 0 : 1)}
          className={`w-full py-1.5 text-xs rounded border transition-colors ${
            params.gravity === 0
              ? 'border-green-600 bg-green-600/20 text-green-300'
              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
          }`}
        >
          {params.gravity === 0 ? '✓ Zero Gravity (Space)' : 'Toggle Zero Gravity'}
        </button>
      </div>
    </div>
  );
}
