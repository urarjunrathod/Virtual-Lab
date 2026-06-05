import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FlaskConical, Zap, Users, Save, BarChart3, Globe2,
  ChevronRight, ArrowRight, Atom, Waves, GitBranch,
} from 'lucide-react';
import { AuthModal } from './AuthModal';

const FEATURES = [
  { icon: FlaskConical, color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-900', label: '17 Experiments', desc: "From Hooke's Law to Kepler orbits" },
  { icon: Users, color: 'text-violet-400', bg: 'bg-violet-950/40 border-violet-900', label: 'Live Multiplayer', desc: 'Simulate with classmates in real time' },
  { icon: Save, color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-900', label: 'Cloud Saves', desc: 'Save & restore your scenes anytime' },
  { icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-900', label: 'Live Analytics', desc: 'Energy, momentum, trajectory charts' },
];

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 4,
  dur: Math.random() * 6 + 4,
}));

export function WelcomeScreen({ onContinueAsGuest }) {
  const [authMode, setAuthMode] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-zinc-950 flex items-center justify-center overflow-hidden"
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-blue-600/20"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size * 4, height: p.size * 4 }}
            animate={{ y: [0, -30, 0], opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.03 }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center gap-8">
        {/* Logo + Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-700/50 flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-blue-400" />
              </div>
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-950"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </div>
          <h1 className="font-mono tracking-[0.3em] text-3xl text-zinc-100">VIRTUAL-LAB</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded">
              PHYSICS ENGINE v2
            </span>
            <span className="text-[10px] font-mono text-blue-400 border border-blue-800 bg-blue-950/30 px-2 py-0.5 rounded">
              UNIVERSITY-LEVEL
            </span>
          </div>
          <p className="text-zinc-400 max-w-sm mt-1" style={{ fontSize: '13px' }}>
            Interactive 2D physics simulations with real-world accuracy —
            from spring oscillations to orbital mechanics.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-3 w-full"
        >
          {FEATURES.map(({ icon: Icon, color, bg, label, desc }) => (
            <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border ${bg}`}>
              <div className="w-8 h-8 rounded-lg bg-zinc-900/80 flex items-center justify-center shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <div className="text-xs text-zinc-100 font-medium">{label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Auth buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col items-center gap-3 w-full max-w-xs"
        >
          <button
            onClick={() => setAuthMode('signup')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
          >
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAuthMode('signin')}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            Sign In to Existing Account
          </button>
          <button
            onClick={onContinueAsGuest}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 pt-1"
          >
            Continue as Guest <ChevronRight className="w-3 h-3" />
          </button>
          <p className="text-[10px] text-zinc-600 text-center mt-1">
            Guest mode has limited features — no cloud saves or multiplayer rooms.
          </p>
        </motion.div>

        {/* Experiment icons strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-3"
        >
          {[Atom, Waves, Globe2, GitBranch, Zap].map((Icon, i) => (
            <div key={i} className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-zinc-600" />
            </div>
          ))}
          <span className="text-[10px] text-zinc-600 font-mono">+ 12 more simulations</span>
        </motion.div>
      </div>

      {/* Auth Modal */}
      <AnimatePresence>
        {authMode && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setAuthMode(null)}
            onSuccess={onContinueAsGuest}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
