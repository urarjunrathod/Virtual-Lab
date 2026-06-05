
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { PhysicsCanvas } from '../components/PhysicsCanvas';
import { ToolPanel } from '../components/ToolPanel';
import { ControlPanel } from '../components/ControlPanel';
import {AnalyticsDashboard} from '../components/AnalyticsDashboard.jsx';
import { ExperimentLibrary } from '../components/ExperimentLibrary';
import { SelectionInspector } from '../components/SelectionInspector';
import { AuthProvider, useAuth } from '../components/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { WelcomeScreen } from '../components/WelcomeScreen';
import { SavedExperiments } from '../components/SavedExperiments';
import { RoomPanel } from '../components/RoomPanel';
import { useRoomChannel } from '../components/useRoomChannel';
import { apiFetch } from '../../../utils/supabase/client';
import {
  X, FlaskConical, Grid, ChevronLeft, ChevronRight, Info, Save, Upload, Camera,
  Crosshair, Magnet, BarChart3, Settings2, Globe, Eraser, LogIn, LogOut, User,
  FolderOpen, Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EXPERIMENTS } from '../components/experimentDefinitions';

export default function LabPage() {
  return (
    <AuthProvider>
      <LabShell />
    </AuthProvider>
  );
}

function LabShell() {
  const { user, accessToken, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [welcomeDismissed, setWelcomeDismissed] = useState(() => {
    return localStorage.getItem('vlab-lab-entered') === '1';
  });

  const dismissWelcome = () => {
    localStorage.setItem('vlab-lab-entered', '1');
    setWelcomeDismissed(true);
  };

  useEffect(() => {
    if (user && !welcomeDismissed) dismissWelcome();
  }, [user]);

  const [selectedTool, setSelectedTool] = useState(null);
  const [showExperiments, setShowExperiments] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [physicsData, setPhysicsData] = useState(null);
  const [experimentToLoad, setExperimentToLoad] = useState(null);
  const [experimentParams, setExperimentParams] = useState(null);

  const [showAxes, setShowAxes] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [selectedBodyId, setSelectedBodyId] = useState(null);
  const [selectionData, setSelectionData] = useState(null);
  const [rightTab, setRightTab] = useState('analytics');

  const [room, setRoom] = useState(null);
  const [presenceUsers, setPresenceUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);

  const handleRoomChange = (r) => {
    setRoom(r);
    if (!r) { setChatMessages([]); setPresenceUsers([]); }
  };

  const canvasApi = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (selectedBodyId == null) { setSelectionData(null); return; }
    const id = setInterval(() => {
      const d = canvasApi.current?.getSelected?.();
      setSelectionData(d);
    }, 120);
    return () => clearInterval(id);
  }, [selectedBodyId]);

  useEffect(() => {
    if (selectedBodyId != null) setRightTab('inspector');
  }, [selectedBodyId]);

  const handleLoadFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result || '{}'));
        canvasApi.current?.loadScene(data);
      } catch (err) { console.error('Load file parse error:', err); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [simulationParams, setSimulationParams] = useState({
    gravity: 1, friction: 0.1, restitution: 0.5, timeScale: 1, airResistance: 0.002,
  });
  const [toolParams, setToolParams] = useState({
    mass: 2, bodySize: 50, springK: 80, springDamping: 10, motorSpeed: 2,
    restitution: 0.5, friction: 0.1,
  });

  const handleLoadExperiment = (id, params) => {
    setExperimentParams(params || null);
    setExperimentToLoad(id);
    setShowExperiments(false);
    setSelectedTool(null);
  };

  const isHost = !!(room && user && room.hostUserId === user.id);

  const handleRoomEvent = useCallback((e) => {
    if (e.type === 'chat') {
      setChatMessages(prev => [...prev.slice(-99), e]);
      return;
    }
    if (!canvasApi.current) return;
    if (e.type === 'objectMoved') {
      canvasApi.current.applyMove?.(e.payload);
    } else if (e.type === 'objectAdded') {
      canvasApi.current.addRemoteBody?.(e.payload);
    } else if (e.type === 'objectDeleted') {
      canvasApi.current.removeRemoteBody?.(e.payload.netId);
    } else if (e.type === 'applyForce') {
      canvasApi.current.applyForceToBody?.(e.payload);
    } else if (e.type === 'syncState') {
      if (!isHost) canvasApi.current.applyAuthoritativeState?.(e.payload);
    } else if (e.type === 'experimentLoaded') {
      if (!isHost && e.payload?.id) {
        setExperimentParams(e.payload.params || null);
        setExperimentToLoad(e.payload.id);
      }
    }
  }, [isHost]);

  const { send } = useRoomChannel(
    room?.code ?? null,
    user?.id ?? null,
    user?.name ?? null,
    handleRoomEvent,
    setPresenceUsers,
  );

  const lastSentMoveRef = useRef({});
  const handleBodyMoved = useCallback((p) => {
    if (!room || !user) return;
    const now = Date.now();
    const last = lastSentMoveRef.current[p.netId] ?? 0;
    if (now - last < 33) return;
    lastSentMoveRef.current[p.netId] = now;
    send('objectMoved', p);
  }, [room, user, send]);

  const handleBodyAdded = useCallback((snapshot) => {
    if (!room || !user) return;
    send('objectAdded', snapshot);
  }, [room, user, send]);

  const handleBodyDeleted = useCallback((data) => {
    if (!room || !user) return;
    send('objectDeleted', data);
  }, [room, user, send]);

  const handleBodyApplyForce = useCallback((data) => {
    if (!room || !user) return;
    send('applyForce', data);
  }, [room, user, send]);

  const sendChat = useCallback((text) => {
    if (!room || !user || !text.trim()) return;
    setChatMessages(prev => [...prev.slice(-99), {
      type: 'chat',
      payload: { text: text.trim() },
      userId: user.id,
      userName: user.name ?? user.email ?? 'You',
      ts: Date.now(),
    }]);
    send('chat', { text: text.trim() });
  }, [room, user, send]);

  useEffect(() => {
    if (!room || !isHost) return;
    const id = setInterval(() => {
      const state = canvasApi.current?.getFullState?.();
      if (state) send('syncState', state);
    }, 300);
    return () => clearInterval(id);
  }, [room, isHost, send]);

  useEffect(() => {
    if (!room || !isHost || !accessToken) return;
    const id = setInterval(() => {
      const state = canvasApi.current?.getFullState?.();
      if (!state) return;
      apiFetch(`/rooms/${room.code}/state`, {
        method: 'POST',
        body: JSON.stringify(state),
      }, accessToken).catch((err) => console.error('KV state push error:', err));
    }, 5000);
    return () => clearInterval(id);
  }, [room, isHost, accessToken]);

  useEffect(() => {
    if (!room || !isHost || !experimentToLoad) return;
    send('experimentLoaded', { id: experimentToLoad, params: experimentParams });
  }, [experimentToLoad, experimentParams, isHost, room, send]);

  useEffect(() => {
    if (!room || !accessToken || !physicsData) return;
    const id = setInterval(() => {
      apiFetch(`/analytics/${room.code}/sample`, {
        method: 'POST',
        body: JSON.stringify({
          totalKE: physicsData.totalKE,
          totalPE: physicsData.totalPE,
          totalEnergy: physicsData.totalEnergy,
          totalMomentumX: physicsData.totalMomentumX,
          totalMomentumY: physicsData.totalMomentumY,
          bodyCount: physicsData.bodies?.length ?? 0,
        }),
      }, accessToken).catch((err) => console.error('analytics sample error:', err));
    }, 5000);
    return () => clearInterval(id);
  }, [room, accessToken, physicsData]);

  const showWelcome = !authLoading && !welcomeDismissed;

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col">

      <AnimatePresence>
        {showWelcome && <WelcomeScreen onContinueAsGuest={dismissWelcome} />}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <FlaskConical className="w-5 h-5 text-blue-400" />
            <span className="font-mono tracking-widest text-lg">VIRTUAL-LAB</span>
            <span className="text-[9px] font-mono text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded">PHYSICS ENGINE v2</span>
          </div>
          {room && (
            <span className="text-[10px] font-mono text-blue-300 border border-blue-800 bg-blue-950/40 px-2 py-0.5 rounded flex items-center gap-1">
              <Users className="w-3 h-3" /> ROOM {room.code} · {presenceUsers.length} online
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowGrid(!showGrid)} title="Toggle grid"
            className={`p-2 rounded-lg border transition-colors text-sm ${showGrid ? 'border-blue-700 bg-blue-900/20 text-blue-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setSnapToGrid(!snapToGrid)} title="Snap to grid"
            className={`p-2 rounded-lg border transition-colors text-sm ${snapToGrid ? 'border-emerald-700 bg-emerald-900/20 text-emerald-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
            <Magnet className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAxes(!showAxes)} title="Toggle coordinate axes"
            className={`p-2 rounded-lg border transition-colors text-sm ${showAxes ? 'border-cyan-700 bg-cyan-900/20 text-cyan-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
            <Crosshair className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1" />
          <button onClick={() => canvasApi.current?.saveScene()} title="Save scene to JSON file"
            className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Load scene from JSON file"
            className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600">
            <Upload className="w-4 h-4" />
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleLoadFile} className="hidden" />
          <button onClick={() => canvasApi.current?.screenshot()} title="Export screenshot"
            className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600">
            <Camera className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1" />
          <button onClick={() => {
            const g = simulationParams.gravity > 0 ? 0 : 1;
            setSimulationParams({ ...simulationParams, gravity: g });
          }} title="Toggle gravity"
            className={`p-2 rounded-lg border transition-colors text-sm ${simulationParams.gravity > 0 ? 'border-violet-700 bg-violet-950/20 text-violet-300' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>
            <Globe className="w-4 h-4" />
          </button>
          <button onClick={() => canvasApi.current?.clearScene()} title="Clear scene"
            className="p-2 rounded-lg border border-red-900 bg-red-950/40 text-red-300 hover:bg-red-900/40">
            <Eraser className="w-4 h-4" />
          </button>
          <button onClick={() => setShowExperiments(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Experiment Library
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1" />

          {authLoading ? (
            <span className="text-[10px] text-zinc-500 font-mono">…</span>
          ) : user ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg">
              <div className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-700/50 flex items-center justify-center">
                <User className="w-3 h-3 text-blue-300" />
              </div>
              <span className="text-[11px] font-mono text-zinc-200 max-w-[120px] truncate">{user.name ?? user.email}</span>
              <button onClick={signOut} title="Sign out" className="text-zinc-500 hover:text-red-300 transition-colors ml-1">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
              <LogIn className="w-4 h-4" /> Sign in
            </button>
          )}

          <button onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg border transition-colors ${showInfo ? 'border-zinc-600 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-600'}`}>
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Info Banner */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-blue-950/50 border-b border-blue-900 px-6 py-3 overflow-hidden">
            <div className="flex justify-between items-start gap-4">
              <div className="text-xs text-blue-200 leading-relaxed max-w-4xl">
                <strong>VIRTUAL-LAB Physics Engine</strong> — University-level 2D mechanics simulation with multiplayer rooms.
                Sign in to save experiments and create rooms. Share a room code with classmates to simulate together.
              </div>
              <button onClick={() => setShowInfo(false)} className="text-blue-400 hover:text-blue-200 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <motion.div animate={{ width: leftCollapsed ? 0 : 272 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden shrink-0">
          {!leftCollapsed && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-3 pt-3 pb-1">
                <div className="text-[9px] font-mono text-zinc-600 tracking-widest">TOOLS &amp; PARAMETERS</div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ToolPanel selectedTool={selectedTool} onSelectTool={setSelectedTool}
                  toolParams={toolParams} onToolParamsChange={setToolParams} />
              </div>
              <ControlPanel params={simulationParams} onParamsChange={setSimulationParams} />
            </div>
          )}
        </motion.div>

        <button onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="w-5 bg-zinc-900 border-r border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-600 shrink-0">
          {leftCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PhysicsCanvas
            selectedTool={selectedTool}
            onClearTool={() => setSelectedTool(null)}
            simulationParams={simulationParams}
            toolParams={toolParams}
            experimentToLoad={experimentToLoad}
            experimentParams={experimentParams}
            onExperimentLoaded={() => setExperimentToLoad(null)}
            onPhysicsData={setPhysicsData}
            showGrid={showGrid}
            showAxes={showAxes}
            snapToGrid={snapToGrid}
            onSelectBody={setSelectedBodyId}
            canvasApi={canvasApi}
            onBodyMoved={handleBodyMoved}
            onBodyAdded={handleBodyAdded}
            onBodyDeleted={handleBodyDeleted}
            onBodyApplyForce={handleBodyApplyForce}
          />
        </div>

        <button onClick={() => setRightCollapsed(!rightCollapsed)}
          className="w-5 bg-zinc-900 border-l border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-600 shrink-0">
          {rightCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {/* Right Panel */}
        <motion.div animate={{ width: rightCollapsed ? 0 : 320 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden shrink-0">
          {!rightCollapsed && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex border-b border-zinc-800 shrink-0">
                <TabBtn active={rightTab === 'analytics'} onClick={() => setRightTab('analytics')}
                  icon={<BarChart3 className="w-3.5 h-3.5" />} label="ANALYTICS" color="blue" />
                <TabBtn active={rightTab === 'inspector'} onClick={() => setRightTab('inspector')}
                  icon={<Settings2 className="w-3.5 h-3.5" />} label="INSPECTOR" color="amber" />
                <TabBtn active={rightTab === 'saved'} onClick={() => setRightTab('saved')}
                  icon={<FolderOpen className="w-3.5 h-3.5" />} label="SAVED" color="emerald" />
                <TabBtn active={rightTab === 'room'} onClick={() => setRightTab('room')}
                  icon={<Users className="w-3.5 h-3.5" />} label="ROOM" color="violet" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {rightTab === 'analytics' && <AnalyticsDashboard data={physicsData} />}
                {rightTab === 'inspector' && (
                  <SelectionInspector
                    selection={selectionData}
                    api={canvasApi}
                    onUpdate={(patch) => { canvasApi.current?.updateSelected(patch); setSelectionData(patch); }}
                    onDelete={() => canvasApi.current?.deleteSelected()}
                    onDuplicate={() => canvasApi.current?.duplicateSelected()}
                    onToggleStatic={() => canvasApi.current?.toggleStaticSelected()}
                  />
                )}
                {rightTab === 'saved' && (
                  <SavedExperiments
                    getCurrentScene={() => canvasApi.current?.getFullState?.()}
                    onLoad={(scene) => {
                      canvasApi.current?.clearScene?.();
                      canvasApi.current?.applyAuthoritativeState?.(scene);
                    }}
                    onSignInRequest={() => setShowAuth(true)}
                  />
                )}
                {rightTab === 'room' && (
                  <RoomPanel
                    room={room}
                    presenceUsers={presenceUsers}
                    onRoomChange={handleRoomChange}
                    chatMessages={chatMessages}
                    onSendChat={sendChat}
                    onSignInRequest={() => setShowAuth(true)}
                  />
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Experiment Library Modal */}
      <AnimatePresence>
        {showExperiments && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={(e) => { if (e.target === e.currentTarget) setShowExperiments(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-4xl flex flex-col" style={{ height: '85vh' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-5 h-5 text-blue-400" />
                  <div>
                    <h2 className="font-mono tracking-widest text-sm">EXPERIMENT LIBRARY</h2>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{EXPERIMENTS.length} university-level physics simulations</p>
                  </div>
                </div>
                <button onClick={() => setShowExperiments(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ExperimentLibrary onLoadExperiment={handleLoadExperiment} onClose={() => setShowExperiments(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, color }) {
  const colorMap = {
    blue: 'text-blue-400 border-blue-500',
    amber: 'text-amber-400 border-amber-500',
    emerald: 'text-emerald-400 border-emerald-500',
    violet: 'text-violet-400 border-violet-500',
  };
  return (
    <button onClick={onClick}
      className={`flex-1 px-2 py-2 text-[10px] font-mono tracking-widest flex items-center justify-center gap-1 transition-colors ${active ? `${colorMap[color]} border-b-2 bg-zinc-800/40` : 'text-zinc-500 hover:text-zinc-300'}`}>
      {icon} {label}
    </button>
  );
}
