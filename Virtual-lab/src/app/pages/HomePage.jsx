import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  FlaskConical, Zap, Users, Save, BarChart3,
  ArrowRight, Waves, ChevronDown, Layers, Cpu,
  LogIn, UserPlus, CheckCircle, Menu, X, ExternalLink, Activity,
  RefreshCw, MousePointer2, Orbit, Play, Star, BookOpen,
  SlidersHorizontal, GitBranch,
} from 'lucide-react';
import { AuthProvider, useAuth } from '../components/AuthContext';
import { AuthModal } from '../components/AuthModal';

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'newtons',
    icon: Zap,
    title: "Newton's Laws",
    count: 6,
    desc: 'Forces, collisions, projectiles, and constraint systems.',
    experiments: ["Atwood's Machine", 'Projectile Motion', "Newton's Cradle", 'Elastic Collisions'],
    formula: 'F = ma',
    gradient: 'linear-gradient(to bottom right, rgba(37,99,235,0.2), rgba(30,58,138,0.1))',
    borderColor: 'rgba(30,58,138,0.5)',
    accent: '#60a5fa',
    tagStyle: { background: 'rgba(23,37,84,0.6)', color: '#93c5fd', border: '1px solid rgba(30,64,175,0.8)' },
  },
  {
    id: 'shm',
    icon: Waves,
    title: 'Oscillations & SHM',
    count: 4,
    desc: 'Spring–mass systems, pendulums, and coupled oscillators.',
    experiments: ['Spring–Mass (Vertical)', 'Simple Pendulum', 'Coupled Oscillators', 'Horizontal SHM'],
    formula: 'x(t) = A cos(ωt + φ)',
    gradient: 'linear-gradient(to bottom right, rgba(109,40,217,0.2), rgba(76,29,149,0.1))',
    borderColor: 'rgba(91,33,182,0.5)',
    accent: '#a78bfa',
    tagStyle: { background: 'rgba(46,16,101,0.6)', color: '#c4b5fd', border: '1px solid rgba(91,33,182,0.8)' },
  },
  {
    id: 'rotation',
    icon: RefreshCw,
    title: 'Rotational Motion',
    count: 3,
    desc: 'Rigid-body dynamics, angular momentum, and chaos.',
    experiments: ['Compound Pendulum', 'Motorised Disk', 'Double Pendulum (Chaotic)'],
    formula: 'τ = Iα',
    gradient: 'linear-gradient(to bottom right, rgba(8,145,178,0.2), rgba(22,78,99,0.1))',
    borderColor: 'rgba(21,94,117,0.5)',
    accent: '#22d3ee',
    tagStyle: { background: 'rgba(8,51,68,0.6)', color: '#67e8f9', border: '1px solid rgba(21,94,117,0.8)' },
  },
  {
    id: 'advanced',
    icon: Layers,
    title: 'Advanced Systems',
    count: 4,
    desc: 'Orbital mechanics, thermodynamics, and complex machines.',
    experiments: ["Kepler's Orbital Motion", 'Pulley & Spring', 'Bifilar Pendulum', 'Free Fall & Terminal Velocity'],
    formula: 'E = −GMm/2a',
    gradient: 'linear-gradient(to bottom right, rgba(217,119,6,0.2), rgba(120,53,15,0.1))',
    borderColor: 'rgba(146,64,14,0.5)',
    accent: '#fbbf24',
    tagStyle: { background: 'rgba(69,26,3,0.6)', color: '#fcd34d', border: '1px solid rgba(146,64,14,0.8)' },
  },
];

const FEATURES = [
  { icon: Cpu, title: 'Matter.js Physics Engine', desc: 'Rigid-body dynamics with real collision detection, constraints, springs, and motors — no approximations.', color: '#60a5fa', bg: { background: 'rgba(23,37,84,0.3)', border: '1px solid rgba(30,58,138,0.5)' } },
  { icon: Users, title: 'Live Multiplayer Rooms', desc: 'Share a 6-digit room code. Every drag, force application, and experiment load syncs in real time via Supabase Realtime.', color: '#a78bfa', bg: { background: 'rgba(46,16,101,0.3)', border: '1px solid rgba(76,29,149,0.5)' } },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Live charts for kinetic energy, potential energy, momentum, and trajectories update at 60 fps.', color: '#34d399', bg: { background: 'rgba(6,46,37,0.3)', border: '1px solid rgba(6,78,59,0.5)' } },
  { icon: MousePointer2, title: 'Interactive Bodies', desc: 'Drag, throw, and apply impulses to every body with your mouse. Attach springs, ropes, and motors on the fly.', color: '#fbbf24', bg: { background: 'rgba(69,26,3,0.3)', border: '1px solid rgba(120,53,15,0.5)' } },
  { icon: Save, title: 'Cloud Experiment Saves', desc: 'Save any scene to your account and restore it from any device. Full scene state serialization.', color: '#f472b6', bg: { background: 'rgba(80,7,36,0.3)', border: '1px solid rgba(131,24,67,0.5)' } },
  { icon: BookOpen, title: 'Exact Physical Formulas', desc: "Each experiment shows the governing equations — Hooke's Law, Kepler's Third Law, Euler–Lagrange, and more.", color: '#22d3ee', bg: { background: 'rgba(8,51,68,0.3)', border: '1px solid rgba(21,94,117,0.5)' } },
];

const STEPS = [
  { n: '01', title: 'Choose an Experiment', desc: 'Browse 16 university-level simulations across mechanics, oscillations, and orbital physics.' },
  { n: '02', title: 'Tune Parameters', desc: 'Adjust mass, spring constant, gravity, damping, and more with live sliders that update the simulation instantly.' },
  { n: '03', title: 'Interact & Observe', desc: 'Drag bodies, apply forces, attach springs — watch the analytics charts respond in real time.' },
  { n: '04', title: 'Collaborate', desc: 'Create a room, share the code with classmates, and simulate together from anywhere.' },
];

const FLOATING_EQUATIONS = [
  { text: 'F = ma', x: '7%', y: '22%', delay: 0, size: '0.9rem' },
  { text: 'E = ½mv²', x: '84%', y: '60%', delay: 1.8, size: '0.85rem' },
  { text: 'τ = Iα', x: '10%', y: '70%', delay: 0.6, size: '0.8rem' },
  { text: 'T = 2π√(L/g)', x: '72%', y: '18%', delay: 2.2, size: '0.78rem' },
  { text: 'p = mv', x: '60%', y: '82%', delay: 1.1, size: '0.82rem' },
  { text: 'a = v²/r', x: '88%', y: '38%', delay: 3, size: '0.77rem' },
  { text: 'F = -kx', x: '3%', y: '45%', delay: 1.5, size: '0.8rem' },
];

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV_LINKS = ['Features', 'Simulations', 'How it Works'];

function Navbar({ onSignIn, onSignUp }) {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <motion.nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        transition: 'all 0.3s',
        background: scrolled ? 'rgba(9,9,11,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : undefined,
        borderBottom: scrolled ? '1px solid rgba(39,39,42,0.7)' : 'none',
        boxShadow: scrolled ? '0 25px 50px rgba(0,0,0,0.5)' : 'none',
      }}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
          <div style={{ position: 'relative', width: 36, height: 36, borderRadius: 12, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(29,78,216,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical style={{ width: 18, height: 18, color: '#60a5fa' }} />
            <motion.div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid rgba(59,130,246,0.3)' }}
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.18em', color: '#f4f4f5', fontSize: '0.92rem' }}>VIRTUAL-LAB</span>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#52525b', letterSpacing: '0.2em' }}>PHYSICS ENGINE v2</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="md:flex" style={{ display: 'none', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map((label) => (
            <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#a1a1aa', borderRadius: 8, textDecoration: 'none', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f4f4f5'; e.currentTarget.style.background = 'rgba(39,39,42,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.background = 'transparent'; }}
            >{label}</a>
          ))}
        </div>

        {/* Auth */}
        <div className="md:flex" style={{ display: 'none', alignItems: 'center', gap: 12 }}>
          {loading ? (
            <div style={{ width: 16, height: 16, border: '2px solid #52525b', borderTopColor: '#a1a1aa', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          ) : user ? (
            <>
              <span style={{ fontSize: 12, color: '#71717a', fontFamily: 'monospace', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name ?? user.email}</span>
              <motion.button onClick={() => navigate('/lab')}
                style={{ padding: '8px 20px', background: '#2563eb', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', cursor: 'pointer' }}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                Open Lab <ArrowRight style={{ width: 14, height: 14 }} />
              </motion.button>
              <button onClick={signOut} style={{ fontSize: 12, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#a1a1aa'}
                onMouseLeave={e => e.currentTarget.style.color = '#52525b'}>Sign out</button>
            </>
          ) : (
            <>
              <button onClick={onSignIn}
                style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f4f4f5'}
                onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
                <LogIn style={{ width: 14, height: 14 }} /> Sign In
              </button>
              <motion.button onClick={onSignUp}
                style={{ padding: '8px 20px', background: '#2563eb', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                Get Started <ArrowRight style={{ width: 14, height: 14 }} />
              </motion.button>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden"
          style={{ padding: 8, color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer' }}>
          {menuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="md:hidden"
            style={{ background: 'rgba(9,9,11,0.98)', borderTop: '1px solid #27272a', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
            {NAV_LINKS.map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: '0.875rem', color: '#a1a1aa', textDecoration: 'none', padding: '4px 0' }}>
                {l}
              </a>
            ))}
            <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: '1px solid #27272a' }}>
              <button onClick={() => { onSignIn(); setMenuOpen(false); }}
                style={{ flex: 1, padding: '10px 0', border: '1px solid #3f3f46', borderRadius: 8, fontSize: '0.875rem', color: '#d4d4d8', background: 'none', cursor: 'pointer' }}>
                Sign In
              </button>
              <button onClick={() => { onSignUp(); setMenuOpen(false); }}
                style={{ flex: 1, padding: '10px 0', background: '#2563eb', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, color: '#fff', border: 'none', cursor: 'pointer' }}>
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// ─── Animated Physics Background ──────────────────────────────────────────────

function PhysicsBackground({ mouseX, mouseY }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}>

      {/* Base grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(96,165,250,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.07) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 90% 75% at 50% 40%, transparent 30%, rgba(0,0,0,0.6) 65%, black 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 75% at 50% 40%, transparent 30%, rgba(0,0,0,0.6) 65%, black 100%)',
      }} />

      {/* Cursor-reactive grid reveal */}
      <div style={{
        position: 'absolute', inset: 0, transition: 'opacity 0.3s',
        backgroundImage: 'linear-gradient(rgba(96,165,250,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.18) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: mouseX > 0 ? `radial-gradient(280px circle at ${mouseX}px ${mouseY}px, black, transparent)` : 'none',
        WebkitMaskImage: mouseX > 0 ? `radial-gradient(280px circle at ${mouseX}px ${mouseY}px, black, transparent)` : 'none',
        opacity: mouseX > 0 ? 1 : 0,
      }} />

      {/* Cursor glow */}
      {mouseX > 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(500px circle at ${mouseX}px ${mouseY}px, rgba(59,130,246,0.055), transparent 60%)`,
        }} />
      )}

      {/* Ambient glow orbs */}
      <div style={{ position: 'absolute', top: '33%', left: '50%', transform: 'translate(-50%, -50%)', width: 700, height: 360, background: 'rgba(37,99,235,0.07)', borderRadius: '50%', filter: 'blur(110px)' }} />
      <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: 320, height: 320, background: 'rgba(109,40,217,0.05)', borderRadius: '50%', filter: 'blur(90px)' }} />

      {/* ── Animated Pendulum (right bg) ── */}
      <div style={{ position: 'absolute', right: '9%', top: '12%', opacity: 0.06 }}>
        <svg width="160" height="280" viewBox="0 0 160 280">
          <line x1="80" y1="0" x2="80" y2="20" stroke="#60a5fa" strokeWidth="1.5" />
          <circle cx="80" cy="20" r="7" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
          <motion.g style={{ originX: '80px', originY: '20px' }}
            animate={{ rotate: [30, -30, 30] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
            <line x1="80" y1="20" x2="80" y2="200" stroke="#60a5fa" strokeWidth="1.5" />
            <circle cx="80" cy="200" r="22" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5" />
          </motion.g>
          <path d="M 27 116 A 100 100 0 0 1 133 116" fill="none" stroke="#60a5fa" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.4" />
        </svg>
      </div>

      {/* ── Animated Spring–mass (left bg) ── */}
      <div style={{ position: 'absolute', left: '6%', top: '30%', opacity: 0.05 }}>
        <svg width="80" height="260" viewBox="0 0 80 260">
          <rect x="20" y="0" width="40" height="6" rx="2" fill="#60a5fa" />
          <motion.g animate={{ scaleY: [1, 1.25, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} style={{ originX: '40px', originY: '6px' }}>
            {[0, 12, 24, 36, 48, 60, 72, 84].map((y, i) => (
              <path key={i} d={`M 25 ${6 + y} Q 55 ${12 + y} 25 ${18 + y}`} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
            ))}
          </motion.g>
          <motion.rect x="15" y="110" width="50" height="40" rx="4" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5"
            animate={{ y: [110, 142, 110] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} />
        </svg>
      </div>

      {/* ── Sine wave (bottom) ── */}
      <div style={{ position: 'absolute', bottom: '18%', left: 0, right: 0, overflow: 'hidden', opacity: 0.045 }}>
        <svg width="200%" height="70" viewBox="0 0 2400 70" preserveAspectRatio="none">
          <motion.path d="M 0 35 C 200 0, 200 70, 400 35 C 600 0, 600 70, 800 35 C 1000 0, 1000 70, 1200 35 C 1400 0, 1400 70, 1600 35 C 1800 0, 1800 70, 2000 35 C 2200 0, 2200 70, 2400 35"
            fill="none" stroke="#60a5fa" strokeWidth="2" animate={{ x: [0, -1200] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />
          <motion.path d="M 0 35 C 200 0, 200 70, 400 35 C 600 0, 600 70, 800 35 C 1000 0, 1000 70, 1200 35 C 1400 0, 1400 70, 1600 35 C 1800 0, 1800 70, 2000 35 C 2200 0, 2200 70, 2400 35"
            fill="none" stroke="#a78bfa" strokeWidth="1.5" opacity="0.6" animate={{ x: [-300, -1500] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />
        </svg>
      </div>

      {/* ── Orbit circle (top-left) ── */}
      <div style={{ position: 'absolute', left: '5%', top: '8%', opacity: 0.05 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <ellipse cx="70" cy="70" rx="60" ry="60" fill="none" stroke="#60a5fa" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="70" cy="10" r="7" fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5" />
          <motion.g style={{ originX: '70px', originY: '70px' }} animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}>
            <circle cx="70" cy="10" r="6" fill="#2563eb" stroke="#60a5fa" strokeWidth="1" />
          </motion.g>
          <circle cx="70" cy="70" r="12" fill="#1e3a5f" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      </div>

      {/* ── Floating physics equations ── */}
      {FLOATING_EQUATIONS.map(({ text, x, y, delay, size }) => (
        <motion.div key={text} style={{ position: 'absolute', left: x, top: y, fontSize: size, opacity: 0, fontFamily: 'monospace', color: '#60a5fa', pointerEvents: 'none' }}
          animate={{ opacity: [0.04, 0.13, 0.04], y: [0, -12, 0] }}
          transition={{ duration: 7, delay, repeat: Infinity, ease: 'easeInOut' }}>
          {text}
        </motion.div>
      ))}

      {/* ── Small floating particles ── */}
      {Array.from({ length: 18 }, (_, i) => ({
        id: i, x: 10 + (i * 73) % 80, y: 5 + (i * 47) % 90,
        r: 1.5 + (i % 3) * 0.8, dur: 8 + (i % 5) * 2, delay: i * 0.7, drift: ((i % 7) - 3) * 20,
      })).map((p) => (
        <motion.div key={p.id}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.r * 2, height: p.r * 2, borderRadius: '50%', background: '#60a5fa', opacity: 0 }}
          animate={{ y: [0, p.drift, 0], opacity: [0.06, 0.2, 0.06] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ onSignUp, onSignIn }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const contentY = useTransform(scrollY, [0, 600], [0, 80]);
  const contentOpacity = useTransform(scrollY, [0, 380], [1, 0]);

  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '80px 24px 24px' }}
      onMouseMove={handleMouseMove}>
      <PhysicsBackground mouseX={mouse.x} mouseY={mouse.y} />

      <motion.div style={{ y: contentY, opacity: contentOpacity, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '56rem', gap: 32 }}>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.5 }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: 'rgba(24,24,27,0.9)', border: '1px solid rgba(63,63,70,0.8)', borderRadius: 9999, backdropFilter: 'blur(4px)' }}>
          <motion.span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'block' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#d4d4d8', letterSpacing: '0.2em' }}>16 EXPERIMENTS · MATTER.JS · REAL-TIME MULTIPLAYER</span>
        </motion.div>

        {/* Headline */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.65 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <h1 style={{ fontFamily: 'monospace', color: '#f4f4f5', fontSize: 'clamp(2.6rem, 6.5vw, 4.8rem)', lineHeight: 0.95, letterSpacing: '-0.04em', margin: 0 }}>
            Run Real Physics<br />Simulations
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <div style={{ height: 1, width: 32, background: 'rgba(59,130,246,0.5)' }} />
            <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: 'clamp(1.1rem, 2.8vw, 2rem)', letterSpacing: '-0.02em' }}>directly in your browser</span>
            <div style={{ height: 1, width: 32, background: 'rgba(59,130,246,0.5)' }} />
          </div>
        </motion.div>

        {/* Sub-headline */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.6 }}
          style={{ color: '#a1a1aa', maxWidth: 520, lineHeight: 1.625, fontSize: '1.05rem', margin: 0 }}>
          University-level 2D mechanics built on exact physical formulas.
          Tune parameters, interact with every body, and collaborate with classmates live.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.55 }}
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          {user ? (
            <motion.button onClick={() => navigate('/lab')}
              style={{ padding: '16px 36px', background: '#2563eb', borderRadius: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
              whileHover={{ y: -2, boxShadow: '0 0 32px rgba(59,130,246,0.4)' }} whileTap={{ scale: 0.97 }}>
              <Play style={{ width: 16, height: 16 }} /> Open Lab
              <ArrowRight style={{ width: 16, height: 16 }} />
            </motion.button>
          ) : (
            <>
              <motion.button onClick={onSignUp}
                style={{ padding: '16px 36px', background: '#2563eb', borderRadius: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.28)', position: 'relative', overflow: 'hidden' }}
                whileHover={{ y: -2, boxShadow: '0 0 36px rgba(59,130,246,0.45)' }} whileTap={{ scale: 0.97 }}>
                <UserPlus style={{ width: 16, height: 16 }} />
                Start Experimenting Free
                <ArrowRight style={{ width: 16, height: 16 }} />
              </motion.button>
              <motion.button onClick={() => navigate('/lab')}
                style={{ padding: '16px 32px', background: 'rgba(24,24,27,0.8)', border: '1px solid #3f3f46', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, color: '#d4d4d8', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Play style={{ width: 16, height: 16, color: '#a1a1aa' }} />
                Explore Simulations
              </motion.button>
            </>
          )}
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.55 }}
          style={{ display: 'flex', alignItems: 'stretch', marginTop: 8 }}>
          {[
            { v: '16+', l: 'Experiments', icon: FlaskConical },
            { v: '60', l: 'FPS Physics', icon: Zap },
            { v: '4', l: 'Domains', icon: Layers },
            { v: '∞', l: 'Parameters', icon: SlidersHorizontal },
          ].map(({ v, l, icon: Icon }, i, arr) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon style={{ width: 14, height: 14, color: 'rgba(59,130,246,0.7)' }} />
                  <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '1.35rem', letterSpacing: '-0.03em' }}>{v}</span>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#52525b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{l}</span>
              </div>
              {i < arr.length - 1 && <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(39,39,42,0.8)', margin: '4px 0' }} />}
            </div>
          ))}
        </motion.div>

        {/* Trust line */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {['No installation', 'Free to start', 'Real-time multiplayer'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#52525b' }}>
              <CheckCircle style={{ width: 12, height: 12, color: '#16a34a' }} />
              {t}
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 6, 0] }}
        transition={{ delay: 1, duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#3f3f46', letterSpacing: '0.2em' }}>SCROLL</span>
        <ChevronDown style={{ width: 16, height: 16, color: '#3f3f46' }} />
      </motion.div>
    </section>
  );
}

// ─── Lab Preview ─────────────────────────────────────────────────────────────

function LabPreview() {
  const navigate = useNavigate();
  return (
    <section style={{ position: 'relative', padding: '96px 24px' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ position: 'relative', borderRadius: 16, border: '1px solid #27272a', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
          {/* Mock toolbar */}
          <div style={{ background: '#18181b', borderBottom: '1px solid #27272a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(239,68,68,0.7)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(245,158,11,0.7)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(52,211,153,0.7)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                <FlaskConical style={{ width: 16, height: 16, color: '#60a5fa' }} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#d4d4d8', letterSpacing: '0.2em' }}>VIRTUAL-LAB · PHYSICS ENGINE v2</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 96, height: 6, borderRadius: 9999, background: '#27272a', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: '#3b82f6', borderRadius: 9999 }}
                  animate={{ width: ['0%', '100%', '60%'] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a' }}>RUNNING</span>
            </div>
          </div>

          {/* Mock lab body */}
          <div style={{ background: '#09090b', display: 'flex', height: 380 }}>
            <div style={{ width: 224, background: 'rgba(24,24,27,0.6)', borderRight: '1px solid #27272a', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#52525b', letterSpacing: '0.2em' }}>TOOLS &amp; PARAMETERS</div>
              {['Mass Block', 'Circle', 'Spring', 'Rope'].map((t) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: '#18181b', border: '1px solid #27272a' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(59,130,246,0.6)' }} />
                  <span style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'monospace' }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#52525b', letterSpacing: '0.2em' }}>SIMULATION</div>
                {[{ l: 'Gravity', v: '9.81 m/s²' }, { l: 'Friction', v: '0.10' }, { l: 'Time Scale', v: '1.00×' }].map(({ l, v }) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#71717a' }}>{l}</span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#60a5fa' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Canvas area */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', backgroundImage: 'linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
              <svg width="200" height="220" viewBox="0 0 200 220">
                <line x1="100" y1="10" x2="100" y2="30" stroke="#3f3f46" strokeWidth="2" />
                <circle cx="100" cy="30" r="6" fill="#52525b" />
                <motion.g style={{ originX: '100px', originY: '30px' }} animate={{ rotate: [28, -28, 28] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
                  <line x1="100" y1="30" x2="100" y2="170" stroke="#60a5fa" strokeWidth="2" />
                  <circle cx="100" cy="170" r="16" fill="#3b82f6" />
                  <text x="100" y="174" textAnchor="middle" fontSize="10" fill="white">m</text>
                </motion.g>
                {[-28, -14, 0, 14].map((a, i) => {
                  const rad = (a * Math.PI) / 180;
                  const x = 100 + 140 * Math.sin(rad);
                  const y = 30 + 140 * Math.cos(rad);
                  return <circle key={i} cx={x} cy={y} r={2.5 - i * 0.4} fill="#3b82f6" opacity={(4 - i) * 0.15} />;
                })}
                <text x="10" y="30" fontSize="9" fill="#3f3f46">T = 2π√(L/g)</text>
              </svg>
              <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(24,24,27,0.8)', border: '1px solid #27272a', borderRadius: 9999 }}>
                <motion.div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#a1a1aa' }}>LIVE</span>
              </div>
            </div>

            {/* Right panel */}
            <div style={{ width: 256, background: 'rgba(24,24,27,0.6)', borderLeft: '1px solid #27272a', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#52525b', letterSpacing: '0.2em' }}>REAL-TIME ANALYTICS</div>
              {[
                { label: 'Kinetic Energy', v: '4.32', unit: 'J', color: '#60a5fa' },
                { label: 'Potential Energy', v: '2.18', unit: 'J', color: '#34d399' },
                { label: 'Total Energy', v: '6.50', unit: 'J', color: '#fbbf24' },
              ].map(({ label, v, unit, color }) => (
                <div key={label} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 8 }}>
                  <div style={{ fontSize: 9, color: '#71717a' }}>{label}</div>
                  <div style={{ fontFamily: 'monospace', color, fontSize: '1.2rem' }}>{v} <span style={{ fontSize: 10, color: '#52525b' }}>{unit}</span></div>
                </div>
              ))}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, padding: 8, marginTop: 'auto' }}>
                <div style={{ fontSize: 9, color: '#71717a', marginBottom: 8 }}>ENERGY vs TIME</div>
                <svg width="100%" height="50" viewBox="0 0 200 50">
                  <motion.path d="M 0 40 C 20 30, 40 10, 60 25 C 80 40, 100 15, 120 28 C 140 41, 160 12, 200 22"
                    fill="none" stroke="#3b82f6" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                  <motion.path d="M 0 20 C 20 38, 40 45, 60 30 C 80 15, 100 38, 120 25 C 140 12, 160 40, 200 30"
                    fill="none" stroke="#10b981" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, delay: 0.5, repeat: Infinity, ease: 'linear' }} />
                </svg>
              </div>
            </div>
          </div>

          {/* Overlay CTA */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(9,9,11,0.85), transparent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 32 }}>
            <motion.button onClick={() => navigate('/lab')}
              style={{ padding: '14px 32px', background: '#2563eb', borderRadius: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 10, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
              whileHover={{ y: -2, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
              <Play style={{ width: 16, height: 16 }} /> Launch the Lab
              <ExternalLink style={{ width: 14, height: 14, opacity: 0.7 }} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Experiments Section ──────────────────────────────────────────────────────

function ExperimentsSection() {
  const navigate = useNavigate();
  return (
    <section id="simulations" style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: 9999, marginBottom: 16 }}>
            <FlaskConical style={{ width: 14, height: 14, color: '#60a5fa' }} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#d4d4d8', letterSpacing: '0.05em' }}>EXPERIMENT LIBRARY</span>
          </div>
          <h2 style={{ fontFamily: 'monospace', color: '#f4f4f5', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', margin: '12px 0 0' }}>
            16 University-Level Simulations
          </h2>
          <p style={{ color: '#a1a1aa', marginTop: 12, maxWidth: 576, marginLeft: 'auto', marginRight: 'auto', fontSize: '0.95rem' }}>
            Each experiment uses real governing equations — no hand-wavy approximations.
          </p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }}
                style={{ background: cat.gradient, border: `1px solid ${cat.borderColor}`, borderRadius: 16, padding: 24, cursor: 'pointer' }}
                onClick={() => navigate('/lab')}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(24,24,27,0.8)', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: 20, height: 20, color: cat.accent }} />
                    </div>
                    <div>
                      <div style={{ color: '#f4f4f5', fontWeight: 500 }}>{cat.title}</div>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#71717a', marginTop: 2 }}>{cat.count} EXPERIMENTS</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 4, ...cat.tagStyle }}>{cat.formula}</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginBottom: 16, margin: '0 0 16px' }}>{cat.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {cat.experiments.map((e) => (
                    <span key={e} style={{ fontSize: 10, color: '#a1a1aa', background: 'rgba(24,24,27,0.6)', border: '1px solid #27272a', padding: '2px 8px', borderRadius: 9999 }}>{e}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16, fontSize: 11, color: cat.accent, opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
                  Open in Lab <ArrowRight style={{ width: 12, height: 12 }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section id="features" style={{ padding: '96px 24px', background: 'rgba(24,24,27,0.3)', borderTop: '1px solid rgba(39,39,42,0.5)', borderBottom: '1px solid rgba(39,39,42,0.5)' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: 9999, marginBottom: 16 }}>
            <Star style={{ width: 14, height: 14, color: '#fbbf24' }} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#d4d4d8', letterSpacing: '0.05em' }}>PLATFORM FEATURES</span>
          </div>
          <h2 style={{ fontFamily: 'monospace', color: '#f4f4f5', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', margin: '12px 0 0' }}>
            Built for Serious Physics
          </h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                style={{ padding: 20, borderRadius: 12, ...f.bg }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(24,24,27,0.8)', border: '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon style={{ width: 16, height: 16, color: f.color }} />
                </div>
                <div style={{ fontSize: '0.875rem', color: '#f4f4f5', fontWeight: 500, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: '#a1a1aa', lineHeight: 1.625 }}>{f.desc}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How it Works ─────────────────────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section id="how-it-works" style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: 9999, marginBottom: 16 }}>
            <Activity style={{ width: 14, height: 14, color: '#34d399' }} />
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#d4d4d8', letterSpacing: '0.05em' }}>HOW IT WORKS</span>
          </div>
          <h2 style={{ fontFamily: 'monospace', color: '#f4f4f5', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', margin: '12px 0 0' }}>
            From Zero to Orbit in 4 Steps
          </h2>
        </motion.div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 28, top: 32, bottom: 32, width: 1, background: '#27272a' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: 16, background: '#18181b', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
                  <span style={{ fontFamily: 'monospace', color: '#60a5fa', fontSize: '0.8rem' }}>{s.n}</span>
                </div>
                <div style={{ paddingTop: 12 }}>
                  <div style={{ color: '#f4f4f5', fontWeight: 500, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: '0.875rem', color: '#a1a1aa', lineHeight: 1.625 }}>{s.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CtaBanner({ onSignUp }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <section style={{ padding: '96px 24px' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ position: 'relative', borderRadius: 16, border: '1px solid rgba(30,58,138,0.6)', background: 'linear-gradient(to bottom right, rgba(23,37,84,0.4), rgba(24,24,27,0.4))', padding: 56, textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 384, height: 192, background: 'rgba(37,99,235,0.1)', borderRadius: '50%', filter: 'blur(64px)' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <Orbit style={{ width: 40, height: 40, color: '#60a5fa', margin: '0 auto 20px' }} />
            <h2 style={{ fontFamily: 'monospace', color: '#f4f4f5', fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)', letterSpacing: '-0.03em', margin: '0 0 12px' }}>
              Ready to Run Your First Experiment?
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: 36, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', fontSize: '0.95rem' }}>
              Free to use. No install required. Sign up for cloud saves and multiplayer — or dive in as a guest.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {user ? (
                <motion.button onClick={() => navigate('/lab')}
                  style={{ padding: '14px 36px', background: '#2563eb', borderRadius: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', cursor: 'pointer' }}
                  whileHover={{ y: -2, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
                  <Play style={{ width: 16, height: 16 }} /> Open Lab
                </motion.button>
              ) : (
                <>
                  <motion.button onClick={onSignUp}
                    style={{ padding: '14px 36px', background: '#2563eb', borderRadius: 12, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
                    whileHover={{ y: -2, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}>
                    <UserPlus style={{ width: 16, height: 16 }} /> Start Experimenting Free
                  </motion.button>
                  <motion.button onClick={() => navigate('/lab')}
                    style={{ padding: '14px 36px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#d4d4d8', cursor: 'pointer' }}
                    whileHover={{ y: -2 }}>
                    <Play style={{ width: 16, height: 16, color: '#a1a1aa' }} /> Explore Simulations
                  </motion.button>
                </>
              )}
            </div>
            {!user && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 24 }}>
                {['No credit card', 'Auto-confirmed signup', 'Multiplayer rooms'].map((p) => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717a' }}>
                    <CheckCircle style={{ width: 14, height: 14, color: '#16a34a' }} /> {p}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const navigate = useNavigate();
  return (
    <footer style={{ borderTop: '1px solid rgba(39,39,42,0.7)', padding: '40px 24px' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(29,78,216,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical style={{ width: 14, height: 14, color: '#60a5fa' }} />
          </div>
          <span style={{ fontFamily: 'monospace', letterSpacing: '0.2em', fontSize: '0.875rem', color: '#71717a' }}>VIRTUAL-LAB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {NAV_LINKS.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ fontSize: 12, color: '#52525b', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#d4d4d8'}
              onMouseLeave={e => e.currentTarget.style.color = '#52525b'}>
              {l}
            </a>
          ))}
          <button onClick={() => navigate('/lab')} style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#93c5fd'}
            onMouseLeave={e => e.currentTarget.style.color = '#3b82f6'}>
            Open Lab <ExternalLink style={{ width: 12, height: 12 }} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#3f3f46', fontFamily: 'monospace', letterSpacing: '0.2em' }}>PHYSICS ENGINE v2 · 2026</div>
      </div>
    </footer>
  );
}

// ─── Page Root ────────────────────────────────────────────────────────────────

function HomeContent() {
  const [authMode, setAuthMode] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = () => { if (user) { navigate('/lab'); return; } setAuthMode('signup'); };
  const handleSignIn = () => { if (user) { navigate('/lab'); return; } setAuthMode('signin'); };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#f4f4f5', overflowY: 'auto', overflowX: 'hidden' }}>
      <Navbar onSignIn={handleSignIn} onSignUp={handleSignUp} />
      <Hero onSignUp={handleSignUp} onSignIn={handleSignIn} />
      <LabPreview />
      <ExperimentsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaBanner onSignUp={handleSignUp} />
      <Footer />

      <AnimatePresence>
        {authMode && (
          <AuthModal
            initialMode={authMode}
            onClose={() => setAuthMode(null)}
            onSuccess={() => { setAuthMode(null); navigate('/lab'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}
