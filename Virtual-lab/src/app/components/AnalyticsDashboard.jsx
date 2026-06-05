import { useState, useRef, useEffect } from 'react';
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Activity, Zap, TrendingUp, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

const MAX_HISTORY = 120;

function MiniLineChart({ data, dataKey, color, label }) {
  if (!data || data.length < 2) return null;
  const vals = data.map(d => d[dataKey] ?? 0).filter(v => isFinite(v));
  if (vals.length < 2) return null;

  const W = 280, H = 72, padL = 30, padB = 14, padT = 4, padR = 4;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = Math.max(...vals), minV = Math.min(...vals);
  const range = maxV - minV || 1;

  const toX = (i) => padL + (i / Math.max(data.length - 1, 1)) * plotW;
  const toY = (v) => padT + plotH - (((v - minV) / range) * plotH);
  const path = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d[dataKey] ?? minV).toFixed(1)}`
  ).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#3f3f46" strokeWidth="0.75" />
      <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#3f3f46" strokeWidth="0.75" />
      <text x={padL - 3} y={padT + 6} fill="#52525b" fontSize="8" textAnchor="end">{maxV.toFixed(0)}</text>
      <text x={padL - 3} y={padT + plotH} fill="#52525b" fontSize="8" textAnchor="end">{minV.toFixed(0)}</text>
      <path d={path} stroke={color} fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x={W / 2} y={H - 2} fill="#52525b" fontSize="8" textAnchor="middle" fontFamily="monospace">{label}</text>
    </svg>
  );
}

function MiniEnergyChart({ data }) {
  if (!data || data.length < 2) return null;

  const W = 280, H = 140, padL = 32, padB = 18, padT = 6, padR = 6;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const allVals = data.flatMap(d => [d.totalKE, d.totalPE, d.totalE])
    .filter(v => v != null && !isNaN(v) && isFinite(v));
  const maxV = Math.max(...allVals, 0.001);
  const minV = Math.min(...allVals, 0);
  const range = maxV - minV || 1;

  const toX = (i) => padL + (i / Math.max(data.length - 1, 1)) * plotW;
  const toY = (v) => padT + plotH - ((((v ?? 0) - minV) / range) * plotH);

  const makePath = (key) =>
    data
      .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`)
      .join(' ');

  const series = [
    { key: 'totalKE', color: '#3b82f6', label: 'KE' },
    { key: 'totalPE', color: '#10b981', label: 'PE' },
    { key: 'totalE', color: '#f59e0b', label: 'E_total', dash: '5 2' },
  ];

  const gridYs = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible', display: 'block' }}>
        {gridYs.map(t => (
          <line
            key={`gh-${t}`}
            x1={padL} y1={padT + t * plotH}
            x2={W - padR} y2={padT + t * plotH}
            stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3"
          />
        ))}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#3f3f46" strokeWidth="0.75" />
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#3f3f46" strokeWidth="0.75" />
        <text x={padL - 3} y={padT + 5} fill="#52525b" fontSize="8" textAnchor="end">{maxV.toFixed(1)}</text>
        <text x={padL - 3} y={padT + plotH + 1} fill="#52525b" fontSize="8" textAnchor="end">{minV.toFixed(1)}</text>
        {series.map(s => (
          <path
            key={s.key}
            d={makePath(s.key)}
            stroke={s.color}
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dash}
          />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '6px' }}>
        {series.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '14px', height: '2px', background: s.color, borderRadius: '1px', flexShrink: 0 }} />
            <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, unit, color, icon: Icon }) {
  return (
    <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[10px] text-zinc-400 truncate">{label}</span>
      </div>
      <div className={`text-lg font-mono ${color} leading-none`}>{value}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5">{unit}</div>
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 hover:bg-zinc-800 transition-colors"
      >
        <span className="text-[10px] font-mono text-zinc-400 tracking-widest">{title}</span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
          : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  );
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #3f3f46',
  borderRadius: '6px',
  fontSize: '11px',
  color: '#e4e4e7',
};

export function AnalyticsDashboard({ data }) {
  const [selectedBodyIdx, setSelectedBodyIdx] = useState(0);
  const historyRef = useRef([]);
  const tickRef = useRef(0);
  const [, setRenderTick] = useState(0);

  useEffect(() => {
    if (!data) return;
    tickRef.current++;
    const body = data.bodies[selectedBodyIdx];
    historyRef.current.push({
      t: tickRef.current,
      totalKE: data.totalKE,
      totalPE: data.totalPE,
      totalE: data.totalEnergy,
      speed: body?.speed,
      angle: body?.angle,
      bodyX: body?.x,
      bodyY: body?.y,
      vx: body?.vx,
      springExt: data.springs[0]?.extension,
    });
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    if (tickRef.current % 3 === 0) setRenderTick(n => n + 1);
  }, [data]);

  const history = historyRef.current.slice(-80);
  const bodies = data?.bodies ?? [];
  const springs = data?.springs ?? [];
  const selBody = bodies[selectedBodyIdx] ?? null;

  return (
    <div className="p-3 space-y-3 overflow-y-auto h-full">
      <div className="text-[10px] font-mono text-zinc-500 tracking-widest">REAL-TIME ANALYTICS</div>

      {/* System Energy Cards */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard label="Kinetic Energy" value={(data?.totalKE ?? 0).toFixed(2)} unit="J" color="text-blue-400" icon={Zap} />
        <MetricCard label="Potential Energy" value={(data?.totalPE ?? 0).toFixed(2)} unit="J" color="text-green-400" icon={TrendingUp} />
        <MetricCard label="Spring PE" value={(data?.totalSpringPE ?? 0).toFixed(3)} unit="J" color="text-cyan-400" icon={Activity} />
        <MetricCard label="Total Energy" value={(data?.totalEnergy ?? 0).toFixed(2)} unit="J" color="text-amber-400" icon={Zap} />
      </div>

      {/* Angular Momentum */}
      <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] text-zinc-400">Angular Momentum L</span>
        </div>
        <span className="font-mono text-sm text-violet-300">
          {(data?.totalAngularMomentum ?? 0).toFixed(3)} kg·m²/s
        </span>
      </div>

      {/* Momentum */}
      <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono">
        <div className="text-[10px] text-zinc-500 mb-1.5">SYSTEM MOMENTUM</div>
        <div className="flex gap-4 text-zinc-300">
          <span>pₓ = <span className="text-blue-300">{(data?.totalMomentumX ?? 0).toFixed(3)}</span></span>
          <span>pᵧ = <span className="text-blue-300">{(data?.totalMomentumY ?? 0).toFixed(3)}</span></span>
        </div>
      </div>

      {/* Energy History Chart */}
      <CollapsibleSection title="ENERGY vs TIME">
        {history.length > 2 ? (
          <MiniEnergyChart data={history} />
        ) : (
          <div className="text-center text-xs text-zinc-600 py-6">
            Run a simulation to see energy graph
          </div>
        )}
      </CollapsibleSection>

      {/* Per-Body Inspector */}
      {bodies.length > 0 && (
        <CollapsibleSection title="BODY INSPECTOR">
          <div className="flex gap-1 flex-wrap mb-3">
            {bodies.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setSelectedBodyIdx(i)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                  selectedBodyIdx === i
                    ? 'border-blue-600 bg-blue-600/20 text-blue-300'
                    : 'border-zinc-700 text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {b.name.length > 12 ? b.name.slice(0, 12) + '…' : b.name}
              </button>
            ))}
          </div>

          {selBody && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {[
                  { label: 'Mass (m)', val: `${selBody.mass.toFixed(2)} kg` },
                  { label: 'Speed |v|', val: `${selBody.speed.toFixed(2)} px/s` },
                  { label: 'vₓ', val: `${selBody.vx.toFixed(2)}` },
                  { label: 'vᵧ', val: `${selBody.vy.toFixed(2)}` },
                  { label: 'Angle θ', val: `${selBody.angle.toFixed(1)}°` },
                  { label: 'ω (angular)', val: `${selBody.angularVelocity.toFixed(3)} r/f` },
                  { label: 'KE (trans.)', val: `${selBody.kineticEnergy.toFixed(3)} J` },
                  { label: 'KE (rot.)', val: `${selBody.rotationalKE.toFixed(3)} J` },
                  { label: 'PE (grav.)', val: `${selBody.potentialEnergy.toFixed(3)} J` },
                  { label: 'E_total', val: `${selBody.totalEnergy.toFixed(3)} J` },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-zinc-800 rounded p-1.5">
                    <div className="text-[9px] text-zinc-500">{label}</div>
                    <div className="text-zinc-200 truncate">{val}</div>
                  </div>
                ))}
              </div>

              {history.length > 2 && (
                <div className="mt-2">
                  <div className="text-[10px] text-zinc-500 mb-1 font-mono">SPEED vs TIME</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <LineChart
                      id="vlab-speed-chart"
                      data={history}
                      margin={{ top: 2, right: 4, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis key="xa" dataKey="t" tick={false} stroke="#3f3f46" />
                      <YAxis key="ya" tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" />
                      <Tooltip key="tt" contentStyle={CHART_TOOLTIP_STYLE} />
                      <Line key="ln" type="monotone" dataKey="speed" name="speed" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {history.length > 3 && (
                <div className="mt-2">
                  <div className="text-[10px] text-zinc-500 mb-1 font-mono">X POSITION vs TIME</div>
                  <MiniLineChart data={history} dataKey="bodyX" color="#a855f7" label="x(t)" />
                </div>
              )}
              {history.length > 3 && (
                <div className="mt-1">
                  <div className="text-[10px] text-zinc-500 mb-1 font-mono">vₓ vs TIME</div>
                  <MiniLineChart data={history} dataKey="vx" color="#f59e0b" label="vₓ(t)" />
                </div>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Spring Data */}
      {springs.length > 0 && (
        <CollapsibleSection title="SPRING DATA">
          {springs.map((s, i) => (
            <div key={s.id} className="mb-3 last:mb-0">
              <div className="text-[10px] text-cyan-400 mb-1.5 font-mono">
                Spring #{i + 1} · k = {s.k} N/m
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                {[
                  { label: 'Natural L₀', val: `${s.naturalLength.toFixed(0)} px` },
                  { label: 'Current L', val: `${s.currentLength.toFixed(1)} px` },
                  { label: 'Extension x', val: `${s.extension.toFixed(1)} px` },
                  { label: 'Spring F', val: `${s.force.toFixed(2)} N` },
                  { label: 'Spring PE', val: `${s.springPE.toFixed(4)} J` },
                  { label: 'Status', val: s.extension > 0 ? '↔ stretched' : '↕ compressed' },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-zinc-800 rounded p-1.5">
                    <div className="text-[9px] text-zinc-500">{label}</div>
                    <div className={`truncate ${Math.abs(s.extension) > s.naturalLength * 0.3 ? 'text-red-400' : 'text-zinc-200'}`}>{val}</div>
                  </div>
                ))}
              </div>

              {history.length > 2 && (
                <div className="mt-2">
                  <div className="text-[10px] text-zinc-500 mb-1 font-mono">EXTENSION vs TIME</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart
                      id={`vlab-spring-chart-${i}`}
                      data={history}
                      margin={{ top: 2, right: 4, left: -16, bottom: 0 }}
                    >
                      <XAxis key="xa" dataKey="t" tick={false} stroke="#3f3f46" />
                      <YAxis key="ya" tick={{ fill: '#71717a', fontSize: 9 }} stroke="#3f3f46" />
                      <CartesianGrid key="cg" strokeDasharray="3 3" stroke="#27272a" />
                      <Tooltip key="tt" contentStyle={CHART_TOOLTIP_STYLE} />
                      <Line key="ln" type="monotone" dataKey="springExt" name="extension" stroke="#22d3ee" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Empty state */}
      {bodies.length === 0 && (
        <div className="rounded-lg border border-zinc-800 p-6 text-center">
          <Activity className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
          <p className="text-xs text-zinc-600">Load an experiment to see live physics data</p>
        </div>
      )}
    </div>
  );
}
