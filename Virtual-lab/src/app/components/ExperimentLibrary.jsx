// ExperimentLibrary.jsx — plain JavaScript React (no TypeScript)
import { useState } from 'react';
import { ChevronRight, BookOpen, Waves, Atom, Cpu, FlaskConical, Sliders, RotateCcw } from 'lucide-react';
import { EXPERIMENTS } from './experimentDefinitions';

const CATEGORY_META = {
  "Newton's Laws": { icon: FlaskConical, color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-800', filterClass: 'active-newton' },
  'Oscillations & SHM': { icon: Waves, color: 'text-cyan-400', bg: 'bg-cyan-900/20', border: 'border-cyan-800', filterClass: 'active-osc' },
  'Rotational Motion': { icon: Atom, color: 'text-violet-400', bg: 'bg-violet-900/20', border: 'border-violet-800', filterClass: 'active-rot' },
  'Advanced Systems': { icon: Cpu, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-800', filterClass: 'active-adv' },
};

const LEVEL_COLOR = {
  'Undergrad I': 'text-green-400 bg-green-900/30 border-green-800',
  'Undergrad II': 'text-amber-400 bg-amber-900/30 border-amber-800',
  'Graduate': 'text-red-400 bg-red-900/30 border-red-800',
};

function ExperimentCard({ exp, onLoad }) {
  const [expanded, setExpanded] = useState(false);
  const [showParams, setShowParams] = useState(false);
  const defaults = (exp.parameters ?? []).reduce((acc, p) => { acc[p.key] = p.default; return acc; }, {});
  const [params, setParams] = useState(defaults);
  const meta = CATEGORY_META[exp.category];
  const Icon = meta.icon;
  const hasParams = (exp.parameters ?? []).length > 0;

  return (
    <div className={`rounded-xl border ${meta.border} bg-zinc-900 overflow-hidden transition-all`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${meta.bg} ${meta.border} border shrink-0`}>
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-medium text-zinc-100">{exp.name}</h3>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${LEVEL_COLOR[exp.level] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700'}`}>
                {exp.level}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{exp.description}</p>
          </div>
        </div>
      </div>

      {/* Concepts & Formulas toggle */}
      <div className="px-4 pb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-zinc-500 hover:text-zinc-400 flex items-center gap-1 transition-colors"
        >
          <BookOpen className="w-3 h-3" />
          {expanded ? 'Hide' : 'Show'} physics concepts
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            <div>
              <div className="text-[9px] font-mono text-zinc-500 tracking-widest mb-1">CONCEPTS</div>
              <div className="flex flex-wrap gap-1">
                {exp.concepts.map(c => (
                  <span key={c} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 border border-zinc-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-zinc-500 tracking-widest mb-1">KEY EQUATIONS</div>
              <div className="space-y-0.5">
                {exp.formulas.map(f => (
                  <div key={f} className="text-[10px] font-mono text-cyan-300/80 bg-zinc-800/50 px-2 py-1 rounded">
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parameters panel */}
      {hasParams && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowParams(!showParams)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3 h-3" />
            {showParams ? 'Hide' : 'Tune'} parameters ({exp.parameters.length})
          </button>
          {showParams && (
            <div className="mt-2 space-y-2 bg-zinc-950/50 border border-zinc-800 rounded-lg p-2.5">
              {exp.parameters.map((p) => (
                <div key={p.key}>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                    <span className="text-zinc-400">{p.label}</span>
                    <span className="text-cyan-300">{Number(params[p.key]).toFixed(p.step < 1 ? 2 : 0)}</span>
                  </div>
                  <input
                    type="range"
                    min={p.min} max={p.max} step={p.step}
                    value={params[p.key]}
                    onChange={(e) => setParams({ ...params, [p.key]: parseFloat(e.target.value) })}
                    className="w-full accent-blue-500 h-1"
                  />
                </div>
              ))}
              <button
                onClick={() => setParams(defaults)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 pt-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset to defaults
              </button>
            </div>
          )}
        </div>
      )}

      {/* Load button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onLoad(params)}
          className={`w-full py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${meta.bg} ${meta.border} border ${meta.color} hover:brightness-125`}
        >
          Load Experiment
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ExperimentLibrary({ onLoadExperiment, onClose }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    "Newton's Laws",
    'Oscillations & SHM',
    'Rotational Motion',
    'Advanced Systems',
  ];

  const filtered = activeCategory === 'All'
    ? EXPERIMENTS
    : EXPERIMENTS.filter(e => e.category === activeCategory);

  return (
    <div className="flex flex-col flex-1  h-full">
      {/* Category filter */}
      <div className="px-6 py-3 border-b border-zinc-800 flex gap-2 overflow-x-auto">
        {categories.map(cat => {
          const meta = cat !== 'All' ? CATEGORY_META[cat] : null;
          const isActive = activeCategory === cat;
          let activeClass = '';
          if (isActive) {
            if (cat === 'All') activeClass = 'bg-zinc-700 border-zinc-600 text-zinc-100';
            else activeClass = `${meta.bg} ${meta.border} ${meta.color}`;
          }
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive ? activeClass : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Experiment grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(exp => (
            <ExperimentCard
              key={exp.id}
              exp={exp}
              onLoad={(params) => { onLoadExperiment(exp.id, params); onClose(); }}
            />
          ))}
        </div>

        {/* Info footer */}
        <div className="mt-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <div className="text-[10px] font-mono text-zinc-500 tracking-widest mb-2">ABOUT VIRTUAL-LAB</div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            All simulations use Newton's equations of motion via Matter.js. Spring forces follow Hooke's Law (F = −kx),
            pulleys enforce inextensibility via constraint projection, and motors apply constant angular velocity (ω = τ/I).
            The analytics panel tracks kinetic energy (½mv²), potential energy (mgh), spring PE (½kx²),
            angular momentum (Iω), and total system energy in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
