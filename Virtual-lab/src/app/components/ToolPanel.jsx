
import { Square, Circle, Triangle, Minus, Link, Anchor, Zap, RotateCcw, Hexagon, GitCommitHorizontal, ArrowRightToLine } from 'lucide-react';
import { MATERIALS } from './materials';

const toolCategories = [
  {
    label: 'RIGID BODIES',
    colorClass: 'text-blue-400',
    tools: [
      { id: 'block', name: 'Mass Block', icon: Square, desc: 'Rectangular rigid body' },
      { id: 'disk', name: 'Disk / Cylinder', icon: Circle, desc: 'Circular body, I = ½mR²' },
      { id: 'wedge', name: 'Wedge', icon: Triangle, desc: 'Triangular rigid body' },
      { id: 'hexagon', name: 'Hexagon', icon: Hexagon, desc: 'Regular 6-sided polygon' },
      { id: 'rod', name: 'Thin Rod', icon: Minus, desc: 'Elongated rod, I = mL²/12' },
    ],
  },
  {
    label: 'CONNECTIONS',
    colorClass: 'text-cyan-400',
    tools: [
      { id: 'spring', name: 'Spring (k)', icon: Link, desc: "Hooke's Law: F = -kx" },
      { id: 'rope', name: 'Rope / Drive-Rope', icon: Anchor, desc: 'Rope between bodies. Click a Motor first to create a winding drive-rope 🔄' },
      { id: 'rigid-rod', name: 'Rigid Rod', icon: GitCommitHorizontal, desc: 'Fixed-distance rigid link' },
      { id: 'hinge', name: 'Pivot / Hinge', icon: RotateCcw, desc: 'Fixed-point rotation joint' },
    ],
  },
  {
    label: 'ACTUATORS',
    colorClass: 'text-violet-400',
    tools: [
      { id: 'motor', name: 'Motor Disk', icon: RotateCcw, desc: 'Driven angular velocity' },
      { id: 'conveyor', name: 'Conveyor Belt', icon: ArrowRightToLine, desc: 'Moving surface at speed v' },
      { id: 'force', name: 'Apply Impulse', icon: Zap, desc: 'Click body to apply force' },
    ],
  },
];

function Slider({ label, unit, value, min, max, step, onChange }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="text-xs font-mono text-zinc-300 bg-zinc-700 px-1.5 py-0.5 rounded">
          {value.toFixed(step < 1 ? 2 : 0)} {unit}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

export function ToolPanel({ selectedTool, onSelectTool, toolParams, onToolParamsChange }) {
  const set = (key, val) => onToolParamsChange({ ...toolParams, [key]: val });

  const isSpringTool = selectedTool === 'spring';
  const isMotorTool = selectedTool === 'motor';

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Tools */}
      <div className="p-3 space-y-4 flex-1">
        {toolCategories.map(cat => (
          <div key={cat.label}>
            <div className={`text-[10px] font-mono ${cat.colorClass} tracking-widest mb-2`}>{cat.label}</div>
            <div className="space-y-1">
              {cat.tools.map(tool => {
                const Icon = tool.icon;
                const active = selectedTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onSelectTool(active ? null : tool.id)}
                    className={`w-full px-3 py-2 rounded-lg border transition-all text-left flex items-center gap-2.5 ${
                      active
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-zinc-800/60 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : 'text-zinc-500'}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{tool.name}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{tool.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tool Parameters */}
      <div className="border-t border-zinc-800 p-3 space-y-3">
        <div className="text-[10px] font-mono text-zinc-500 tracking-widest">TOOL PARAMETERS</div>

        <div>
          <div className="text-[10px] text-zinc-400 mb-1">Material</div>
          <select
            value={toolParams.material || 'custom'}
            onChange={e => {
              const key = e.target.value;
              const m = MATERIALS[key];
              onToolParamsChange({
                ...toolParams,
                material: key,
                friction: m.friction,
                restitution: m.restitution,
                density: m.density,
                color: m.color,
              });
            }}
            className="w-full px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100"
          >
            {Object.entries(MATERIALS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        <Slider label="Default Mass" unit="kg" value={toolParams.mass} min={0.5} max={20} step={0.5}
          onChange={v => set('mass', v)} />
        <Slider label="Body Size" unit="px" value={toolParams.bodySize} min={20} max={120} step={5}
          onChange={v => set('bodySize', v)} />
        <Slider label="Restitution (e)" unit="" value={toolParams.restitution} min={0} max={1} step={0.05}
          onChange={v => set('restitution', v)} />
        <Slider label="Friction (μ)" unit="" value={toolParams.friction} min={0} max={1} step={0.05}
          onChange={v => set('friction', v)} />

        {/* Spring-specific */}
        <div className={`space-y-3 rounded-lg border p-2.5 transition-all ${isSpringTool ? 'border-cyan-800 bg-cyan-950/20' : 'border-zinc-800 bg-zinc-900/30'}`}>
          <div className="text-[10px] font-mono text-cyan-400 tracking-widest">SPRING PARAMS</div>
          <Slider label="Spring Constant k" unit="N/m" value={toolParams.springK} min={10} max={500} step={10}
            onChange={v => set('springK', v)} />
          <Slider label="Damping ζ" unit="%" value={toolParams.springDamping} min={0} max={100} step={5}
            onChange={v => set('springDamping', v)} />
          <div className="text-[10px] text-zinc-500 leading-relaxed">
            ω₀ = √(k/m) · Period T = 2π/ω₀
          </div>
        </div>

        {/* Motor-specific */}
        <div className={`space-y-3 rounded-lg border p-2.5 transition-all ${isMotorTool ? 'border-violet-800 bg-violet-950/20' : 'border-zinc-800 bg-zinc-900/30'}`}>
          <div className="text-[10px] font-mono text-violet-400 tracking-widest">MOTOR PARAMS</div>
          <Slider label="Angular Speed" unit="°/frame" value={toolParams.motorSpeed} min={0.5} max={10} step={0.5}
            onChange={v => set('motorSpeed', v)} />
          <div className="text-[10px] text-zinc-500 leading-relaxed">
            ω = {(toolParams.motorSpeed * 60 * Math.PI / 180).toFixed(1)} rad/s @ 60fps
          </div>
        </div>
      </div>
    </div>
  );
}
