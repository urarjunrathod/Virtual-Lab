import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, AlertCircle, Eye, EyeOff, FlaskConical, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';

const PERKS = [
  'Save & restore experiments to the cloud',
  'Create & join live multiplayer rooms',
  'Share room codes with classmates',
  'Access analytics history',
];

export function AuthModal({ onClose, onSuccess, initialMode = 'signin' }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const switchMode = (m) => {
    setMode(m); setErr(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null); setBusy(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password, name || email.split('@')[0]);
      } else {
        await signIn(email, password);
      }
      setDone(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (e) {
      let msg = e.message ?? String(e);
      if (msg.includes('Invalid login credentials')) msg = 'Incorrect email or password.';
      if (msg.includes('User already registered')) msg = 'An account with this email already exists. Try signing in.';
      if (msg.includes('Password should be at least')) msg = 'Password must be at least 6 characters.';
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 12, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-zinc-900/60 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-700/50 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="font-mono tracking-widest text-xs text-zinc-100">VIRTUAL-LAB</div>
              <div className="text-[10px] text-zinc-500">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Mode tabs */}
          <div className="flex bg-zinc-900 rounded-xl p-1 mb-5 border border-zinc-800">
            {['signin', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium font-mono tracking-wide transition-all ${
                  mode === m
                    ? 'bg-zinc-700 text-zinc-100 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m === 'signin' ? 'SIGN IN' : 'SIGN UP'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-900/40 border border-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="text-sm text-zinc-100 font-medium">
                  {mode === 'signup' ? 'Account created!' : 'Signed in!'}
                </div>
                <div className="text-xs text-zinc-400">Launching your lab…</div>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: mode === 'signup' ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onSubmit={submit}
                className="space-y-4"
              >
                {mode === 'signup' && (
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 tracking-wide">DISPLAY NAME</label>
                    <input
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:border-blue-600 outline-none transition-colors placeholder-zinc-600"
                      placeholder="e.g. Ankit Sharma"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 tracking-wide">EMAIL</label>
                  <input
                    type="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 focus:border-blue-600 outline-none transition-colors placeholder-zinc-600"
                    placeholder="you@university.edu"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 tracking-wide">PASSWORD</label>
                  <div className="relative mt-1">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required minLength={6}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 pr-10 text-sm text-zinc-100 focus:border-blue-600 outline-none transition-colors placeholder-zinc-600"
                      placeholder="Min. 6 characters"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {err && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900/60 rounded-lg overflow-hidden"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-red-300 leading-relaxed">{err}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit" disabled={busy}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all mt-1"
                >
                  {busy ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : mode === 'signin' ? (
                    <><LogIn className="w-4 h-4" /> Sign In</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Create Account</>
                  )}
                </button>

                {mode === 'signup' && (
                  <div className="pt-1 space-y-1.5 border-t border-zinc-800">
                    <div className="text-[10px] font-mono text-zinc-500 tracking-wide pt-1">WITH AN ACCOUNT YOU GET</div>
                    {PERKS.map((p) => (
                      <div key={p} className="flex items-center gap-2 text-[11px] text-zinc-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
