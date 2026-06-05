// PhysicsCanvas.jsx — plain JavaScript React (no TypeScript)
import { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { Play, Pause, RotateCcw, Trash2, SkipForward, FastForward, Save, Upload, Camera, Copy, Ruler, Timer } from 'lucide-react';
import { EXPERIMENTS } from './experimentDefinitions';

// ─── Drawing Helpers ────────────────────────────────────────────────────────

function drawCoilSpring(ctx, x1, y1, x2, y2, coils = 8, amplitude = 9, color = '#22d3ee', lineWidth = 2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 4) return;
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;
  const steps = 60;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const coilOffset = amplitude * Math.sin(t * coils * 2 * Math.PI);
    ctx.lineTo(x1 + ux * len * t + nx * coilOffset, y1 + uy * len * t + ny * coilOffset);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function getConstraintEndpoints(c) {
  const pA = c.pointA ?? { x: 0, y: 0 };
  const pB = c.pointB ?? { x: 0, y: 0 };
  let ax, ay, bx, by;
  if (c.bodyA) {
    const cos = Math.cos(c.bodyA.angle), sin = Math.sin(c.bodyA.angle);
    ax = c.bodyA.position.x + pA.x * cos - pA.y * sin;
    ay = c.bodyA.position.y + pA.x * sin + pA.y * cos;
  } else { ax = pA.x; ay = pA.y; }
  if (c.bodyB) {
    const cos = Math.cos(c.bodyB.angle), sin = Math.sin(c.bodyB.angle);
    bx = c.bodyB.position.x + pB.x * cos - pB.y * sin;
    by = c.bodyB.position.y + pB.x * sin + pB.y * cos;
  } else { bx = pB.x; by = pB.y; }
  return { ax, ay, bx, by };
}

function drawAxes(ctx, width, height) {
  const ox = 40, oy = height - 40;
  ctx.strokeStyle = 'rgba(56,189,248,0.6)';
  ctx.fillStyle = 'rgba(56,189,248,0.9)';
  ctx.lineWidth = 1.2;
  ctx.font = '10px monospace';
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(width - 20, oy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, 20); ctx.stroke();
  for (let x = ox + 50; x < width - 20; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, oy - 3); ctx.lineTo(x, oy + 3); ctx.stroke();
  }
  for (let y = oy - 50; y > 20; y -= 50) {
    ctx.beginPath(); ctx.moveTo(ox - 3, y); ctx.lineTo(ox + 3, y); ctx.stroke();
  }
  ctx.fillText('x', width - 14, oy + 4);
  ctx.fillText('y', ox - 10, 18);
  ctx.fillText('0', ox - 12, oy + 12);
}

function drawGrid(ctx, width, height) {
  const spacing = 50;
  ctx.strokeStyle = 'rgba(63,63,70,0.35)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= width; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
}

function drawBodyLabel(ctx, body, text) {
  const x = body.position.x;
  const y = body.position.y - (body.circleRadius ?? 30) - 16;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(15,15,15,0.75)';
  ctx.fillRect(x - tw / 2 - 4, y - 12, tw + 8, 16);
  ctx.fillStyle = '#e4e4e7';
  ctx.fillText(text, x, y);
}

function drawVelocityVector(ctx, body) {
  const scale = 6;
  const vx = body.velocity.x * scale;
  const vy = body.velocity.y * scale;
  const len = Math.sqrt(vx * vx + vy * vy);
  if (len < 2) return;
  const x1 = body.position.x, y1 = body.position.y;
  const x2 = x1 + vx, y2 = y1 + vy;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = 'rgba(34,211,238,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const angle = Math.atan2(vy, vx);
  const hs = 6;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(angle - 0.4), y2 - hs * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - hs * Math.cos(angle + 0.4), y2 - hs * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = 'rgba(34,211,238,0.7)';
  ctx.fill();
}

function drawMotorIndicator(ctx, body, angularSpeed) {
  const { x, y } = body.position;
  const r = (body.circleRadius ?? 40) - 4;
  for (let i = 0; i < 6; i++) {
    const a = body.angle + (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    ctx.strokeStyle = 'rgba(99,102,241,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  const dir = angularSpeed > 0 ? 1 : -1;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.55, body.angle, body.angle + dir * Math.PI * 0.9, dir < 0);
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.stroke();
  const endA = body.angle + dir * Math.PI * 0.9;
  const ahs = 6;
  ctx.beginPath();
  ctx.moveTo(x + (r * 0.55) * Math.cos(endA), y + (r * 0.55) * Math.sin(endA));
  ctx.lineTo(
    x + (r * 0.55 - ahs) * Math.cos(endA - dir * 0.4),
    y + (r * 0.55 - ahs) * Math.sin(endA - dir * 0.4)
  );
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawPulleyRope(ctx, info) {
  const { pulleyBody, mass1, mass2 } = info;
  const px = pulleyBody.position.x, py = pulleyBody.position.y;
  const r = pulleyBody.circleRadius ?? 28;
  ctx.setLineDash([]);
  ctx.strokeStyle = '#a1a1aa';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(mass1.position.x, mass1.position.y - 30);
  ctx.lineTo(px - r * 0.4, py);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mass2.position.x, mass2.position.y - 30);
  ctx.lineTo(px + r * 0.4, py);
  ctx.stroke();
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PhysicsCanvas({
  selectedTool,
  onClearTool,
  simulationParams,
  toolParams,
  experimentToLoad,
  experimentParams,
  onExperimentLoaded,
  onPhysicsData,
  showGrid,
  showAxes = false,
  snapToGrid = false,
  onSelectBody,
  canvasApi,
  onBodyMoved,
  onBodyAdded,
  onBodyDeleted,
  onBodyApplyForce,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);

  const springInfosRef = useRef([]);
  const pulleysRef = useRef([]);
  const motorsRef = useRef([]);
  const motorRopesRef = useRef([]); // motor-driven winch ropes
  const addHistoryRef = useRef([]); // undo history stack
  const conveyorsRef = useRef([]);
  const bodyLabelsRef = useRef(new Map());
  const experimentUpdateRef = useRef(null);
  const trajectoriesRef = useRef(new Map()); // body ID → trail points

  // isMotorAttachment + rimPoint: set when rope-tool first click lands on a motor
  const toolStateRef = useRef({
    step: 0, firstPoint: null, firstBodyId: null, firstStaticAnchor: null,
    isMotorAttachment: false, rimPoint: null,
  });
  const hoverRef = useRef(null);
  const showGridRef = useRef(showGrid);
  const showAxesRef = useRef(showAxes);
  const snapRef = useRef(snapToGrid);
  const selectedIdRef = useRef(null);
  const selectedIdsRef = useRef(new Set());
  const timerRef = useRef({ running: false, start: 0, accum: 0 });
  const viewRef = useRef({ zoom: 1 });
  const panStateRef = useRef({ panning: false, spaceDown: false, startX: 0, startY: 0 });
  const boxSelectRef = useRef(null);

  const [isPaused, setIsPaused] = useState(true);
  const isPausedRef = useRef(true);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  const [objectCount, setObjectCount] = useState(0);
  const [toolMessage, setToolMessage] = useState('');
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [timerDisplay, setTimerDisplay] = useState(0);
  const [mouseCoord, setMouseCoord] = useState({ x: 0, y: 0 });

  useEffect(() => { showGridRef.current = showGrid; }, [showGrid]);
  useEffect(() => { showAxesRef.current = showAxes; }, [showAxes]);
  useEffect(() => { snapRef.current = snapToGrid; }, [snapToGrid]);

  // ── Live parameter tuning — k and damping update without full reload ───────
  // This lets the user drag sliders and see the oscillation change in real-time.
  const prevParamsRef = useRef({});
  useEffect(() => {
    if (!currentExperiment || !engineRef.current || !experimentParams) return;
    const engine = engineRef.current;
    const prev = prevParamsRef.current;
    const curr = experimentParams;

    // Spring constant k → update all spring infos immediately
    if (curr.k !== undefined && curr.k !== prev.k && springInfosRef.current.length > 0) {
      springInfosRef.current.forEach(si => { si.k = curr.k; });
    }
    // Gravity → apply immediately to engine
    if (curr.gravity !== undefined && curr.gravity !== prev.gravity) {
      engine.gravity.y = curr.gravity;
    }
    // Damping → update frictionAir on spring-attached bodies.
    // Use ω_sim-calibrated formula so ζ stays < 1 (underdamped SHM).
    // frictionAir = 2ζω_sim, where ζ = damping/30 (slider fraction).
    if (curr.damping !== undefined && curr.damping !== prev.damping) {
      // Build a map of body → spring ω_sim from current spring infos
      const bodyOmega = new Map();
      springInfosRef.current.forEach(si => {
        const attached = (si.constraint.bodyB && !si.constraint.bodyB.isStatic)
          ? si.constraint.bodyB
          : (si.constraint.bodyA && !si.constraint.bodyA.isStatic ? si.constraint.bodyA : null);
        if (!attached) return;
        const omega = Math.sqrt(si.k * 1e-6 / Math.max(attached.mass, 0.1));
        bodyOmega.set(attached.id, Math.max(bodyOmega.get(attached.id) ?? 0, omega));
      });
      Matter.Composite.allBodies(engine.world).forEach(b => {
        if (b.isStatic) return;
        const omega = bodyOmega.get(b.id);
        if (omega) {
          b.frictionAir = Math.max(curr.damping * 2.0 * omega, 0.0002);
        } else {
          // non-spring bodies: use a small baseline
          b.frictionAir = Math.max(curr.damping * 0.0002, 0.0002);
        }
      });
    }
    prevParamsRef.current = { ...curr };
  }, [experimentParams, currentExperiment]);

  const snap = (v) => snapRef.current ? Math.round(v / 50) * 50 : v;

  // ── Net-ID tagging for realtime sync ─────────────────────────────────────
  const ensureNetId = (b) => {
    if (!b.plugin) b.plugin = {};
    if (!b.plugin.netId) {
      b.plugin.netId = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    }
    return b.plugin.netId;
  };

  // Serialise a body into a network snapshot
  const getBodySnapshot = (b) => {
    ensureNetId(b);
    const isCircle = b.circleRadius != null;
    const w = b.bounds.max.x - b.bounds.min.x;
    const h = b.bounds.max.y - b.bounds.min.y;
    return {
      netId: b.plugin.netId,
      shape: isCircle ? 'circle' : 'rect',
      radius: b.circleRadius ?? null,
      w, h,
      x: b.position.x, y: b.position.y, angle: b.angle,
      vx: b.velocity.x, vy: b.velocity.y, av: b.angularVelocity,
      mass: b.mass, friction: b.friction, restitution: b.restitution,
      isStatic: b.isStatic,
      color: b.render?.fillStyle ?? '#3b82f6',
      label: b.label,
      name: bodyLabelsRef.current.get(b.id) ?? '',
      ts: Date.now(),
    };
  };

  const onBodyMovedRef = useRef(onBodyMoved);
  const onBodyAddedRef = useRef(onBodyAdded);
  const onBodyDeletedRef = useRef(onBodyDeleted);
  const onBodyApplyForceRef = useRef(onBodyApplyForce);
  useEffect(() => { onBodyMovedRef.current = onBodyMoved; }, [onBodyMoved]);
  useEffect(() => { onBodyAddedRef.current = onBodyAdded; }, [onBodyAdded]);
  useEffect(() => { onBodyDeletedRef.current = onBodyDeleted; }, [onBodyDeleted]);
  useEffect(() => { onBodyApplyForceRef.current = onBodyApplyForce; }, [onBodyApplyForce]);

  // ── Clear World ───────────────────────────────────────────────────────────
  const clearWorld = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const mc = mouseConstraintRef.current;
    const mcConstraint = mc?.constraint;
    const boundaryLabels = new Set(['ground', 'wall-left', 'wall-right', 'ceiling']);
    const bodiesToRemove = Matter.Composite.allBodies(engine.world)
      .filter(b => !boundaryLabels.has(b.label ?? ''));
    bodiesToRemove.forEach(b => Matter.World.remove(engine.world, b));
    const allC = Matter.Composite.allConstraints(engine.world);
    allC.filter(c => c !== mcConstraint).forEach(c => Matter.World.remove(engine.world, c));
    springInfosRef.current = [];
    pulleysRef.current = [];
    motorsRef.current = [];
    motorRopesRef.current = [];
    conveyorsRef.current = [];
    bodyLabelsRef.current = new Map();
    trajectoriesRef.current.clear();
    experimentUpdateRef.current = null;
    addHistoryRef.current = [];
    toolStateRef.current = {
      step: 0, firstPoint: null, firstBodyId: null, firstStaticAnchor: null,
      isMotorAttachment: false, rimPoint: null,
    };
    setCurrentExperiment(null);
  }, []);

  // ── Undo helpers ──────────────────────────────────────────────────────────
  const pushHistory = (action) => {
    addHistoryRef.current.push({
      bodies:         action.bodies         ?? [],
      constraints:    action.constraints    ?? [],
      springInfos:    action.springInfos    ?? [],
      motorInfos:     action.motorInfos     ?? [],
      motorRopeInfos: action.motorRopeInfos ?? [],
      conveyorInfos:  action.conveyorInfos  ?? [],
    });
    if (addHistoryRef.current.length > 30) addHistoryRef.current.shift();
  };

  const undoLast = useCallback(() => {
    if (!engineRef.current || addHistoryRef.current.length === 0) return;
    const action = addHistoryRef.current.pop();
    const mc = mouseConstraintRef.current?.constraint;
    const world = engineRef.current.world;
    // Remove constraints first (avoids dangling body-ref errors)
    (action.constraints ?? []).forEach((c) => {
      if (c !== mc) { try { Matter.World.remove(world, c); } catch (_) {} }
    });
    // Remove bodies
    (action.bodies ?? []).forEach((b) => {
      try { Matter.World.remove(world, b); } catch (_) {}
      bodyLabelsRef.current.delete(b.id);
    });
    // Prune metadata arrays by reference equality
    springInfosRef.current  = springInfosRef.current.filter(si => !(action.springInfos ?? []).includes(si));
    motorsRef.current       = motorsRef.current.filter(m  => !(action.motorInfos ?? []).includes(m));
    motorRopesRef.current   = motorRopesRef.current.filter(mr => !(action.motorRopeInfos ?? []).includes(mr));
    conveyorsRef.current    = conveyorsRef.current.filter(cv => !(action.conveyorInfos ?? []).includes(cv));
  }, []);

  // ── Load Experiment ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!experimentToLoad || !engineRef.current || !renderRef.current) return;
    const def = EXPERIMENTS.find(e => e.id === experimentToLoad);
    if (!def) return;
    clearWorld();
    const { width, height } = renderRef.current.options;
    const epParams = experimentParams || {};
    const result = def.setup(
      engineRef.current,
      width ?? 900,
      height ?? 600,
      {
        k: epParams.k ?? toolParams.springK,
        damping: epParams.damping ?? toolParams.springDamping,
        ...epParams,
      }
    );
    Matter.World.add(engineRef.current.world, result.bodies);
    Matter.World.add(engineRef.current.world, result.constraints);
    springInfosRef.current = result.springInfos;
    pulleysRef.current = result.pulleys;
    motorsRef.current = result.motors;
    bodyLabelsRef.current = result.labels;
    experimentUpdateRef.current = result.customUpdate ?? null;

    // Apply parameter values: use user override if present, otherwise use the
    // experiment's own default so experiments always start in a correct physical state.
    if (def.parameters && Array.isArray(def.parameters)) {
      def.parameters.forEach((p) => {
        const val = epParams[p.key] ?? p.default; // fall back to experiment default
        if (val == null || !p.target) return;
        const { type, label } = p.target;
        if (type === 'gravity') {
          engineRef.current.gravity.y = val;
          return;
        }
        const body = result.bodies.find(b => b.label === label);
        if (!body) return;
        if (type === 'mass') {
          Matter.Body.setMass(body, val);
          const existing = bodyLabelsRef.current.get(body.id) || '';
          bodyLabelsRef.current.set(body.id, existing.replace(/\d+(\.\d+)?\s*kg/, `${val} kg`) || `${val} kg`);
        } else if (type === 'friction') {
          body.friction = val;
        } else if (type === 'frictionAir') {
          body.frictionAir = val;
        } else if (type === 'restitution') {
          body.restitution = val;
        } else if (type === 'velocityX') {
          Matter.Body.setVelocity(body, { x: val, y: body.velocity.y });
        } else if (type === 'angle') {
          Matter.Body.setAngle(body, (val * Math.PI) / 180);
        }
      });
    }

    setCurrentExperiment(def.name);
    onExperimentLoaded();
  }, [experimentToLoad]);

  // ── Engine Setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 900;
    const H = containerRef.current.clientHeight || 600;

    const engine = Matter.Engine.create({
      positionIterations: 20,   // high = very aggressive overlap resolution (no sinking)
      velocityIterations: 10,
      constraintIterations: 8,  // high = rigid constraints (strings, hinges stay tight)
      enableSleeping: false,    // never sleep — kills oscillators and pendulums
    });
    // Start frozen so the user can place objects freely; Play unfreezes.
    engine.timing.timeScale = 0;
    engineRef.current = engine;
    engine.gravity.y = simulationParams.gravity;

    const render = Matter.Render.create({
      canvas: canvasRef.current,
      engine,
      options: { width: W, height: H, wireframes: false, background: '#09090b' },
    });
    renderRef.current = render;

    // Thick walls prevent tunneling; slop:0 = zero penetration tolerance
    const thick = 100;
    const wallOpts = {
      isStatic: true,
      restitution: 0.1,
      slop: 0,            // absolute zero tolerance — objects never sink into walls
      friction: 0.3,
      frictionStatic: 0.4,
    };
    const walls = [
      // Ground top-surface at exactly H - 10
      Matter.Bodies.rectangle(W / 2, H - 10 + thick / 2, W + 200, thick, {
        ...wallOpts, label: 'ground',
        render: { fillStyle: '#27272a' }, friction: simulationParams.friction,
      }),
      Matter.Bodies.rectangle(-thick / 2 + 2, H / 2, thick, H + 200, {
        ...wallOpts, label: 'wall-left', render: { fillStyle: '#27272a' },
      }),
      Matter.Bodies.rectangle(W + thick / 2 - 2, H / 2, thick, H + 200, {
        ...wallOpts, label: 'wall-right', render: { fillStyle: '#27272a' },
      }),
      Matter.Bodies.rectangle(W / 2, -thick / 2 + 2, W + 200, thick, {
        ...wallOpts, label: 'ceiling', render: { fillStyle: '#27272a' },
      }),
    ];
    Matter.World.add(engine.world, walls);

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    const mouse = Matter.Mouse.create(render.canvas);
    const mc = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.35, damping: 0.4, render: { visible: false } },
      // mask: 0xFFFFFFFF lets the mouse grab bodies of ANY collision category,
      // including pendulum bobs (0x0004), experiment bodies (0x0001), etc.
      collisionFilter: { mask: 0xFFFFFFFF },
    });
    mouseConstraintRef.current = mc;
    Matter.World.add(engine.world, mc);

    Matter.Events.on(engine, 'beforeUpdate', () => {
      // ── Explicit Hooke's Law spring forces ─────────────────────────────────
      // F = −k·(L − L₀) along spring axis gives REAL SHM: T = 2π√(m/k).
      // SPRING_K_SCALE = 1e-6 converts displayed k (N/m) → sim-force per pixel,
      // calibrated so T_sim matches T_real = 2π√(m/k) in wall-clock seconds.
      const SPRING_K_SCALE = 1e-6;
      const getWPt = (body, lp) => {
        const lx = lp?.x ?? 0, ly = lp?.y ?? 0;
        if (!body || body.isStatic) return { x: (body?.position?.x ?? 0) + lx, y: (body?.position?.y ?? 0) + ly };
        const c = Math.cos(body.angle), s = Math.sin(body.angle);
        return { x: body.position.x + lx * c - ly * s, y: body.position.y + lx * s + ly * c };
      };
      springInfosRef.current.forEach(({ constraint, k, naturalLength }) => {
        const bA = constraint.bodyA, bB = constraint.bodyB;
        if (!bA || !bB) return;
        const pA = getWPt(bA, constraint.pointA), pB = getWPt(bB, constraint.pointB);
        const dx = pB.x - pA.x, dy = pB.y - pA.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.5) return;
        const ext = dist - naturalLength;
        const mag = k * SPRING_K_SCALE * ext;
        const ux = dx / dist, uy = dy / dist;
        if (!bA.isStatic) Matter.Body.applyForce(bA, pA, { x:  mag * ux, y:  mag * uy });
        if (!bB.isStatic) Matter.Body.applyForce(bB, pB, { x: -mag * ux, y: -mag * uy });
      });

      motorsRef.current.forEach(({ body, angularSpeed }) => {
        Matter.Body.setAngularVelocity(body, angularSpeed);
      });

      // ── Motor drive-rope winch: shorten/lengthen rope as drum rotates ──────
      motorRopesRef.current.forEach(mr => {
        const { constraint, motorBody, drumRadius, baseAngle, baseLength } = mr;
        const deltaAngle = motorBody.angle - baseAngle;
        // arc-length wound = drumRadius * Δangle  (positive CW = shorten)
        const wound = drumRadius * deltaAngle * 0.4;
        constraint.length = Math.max(6, baseLength - wound);
      });
      // Conveyor belts: drive surface velocity on bodies touching top face
      conveyorsRef.current.forEach(({ body, surfaceVel }) => {
        const top = body.bounds.min.y;
        Matter.Composite.allBodies(engine.world).forEach(other => {
          if (other === body || other.isStatic) return;
          if (other.position.y < top + 6 && other.position.y > top - 60 &&
              other.position.x > body.bounds.min.x && other.position.x < body.bounds.max.x) {
            Matter.Body.setVelocity(other, { x: surfaceVel, y: other.velocity.y });
          }
        });
      });
      // Velocity clamp + kinematic bodies
      const MAX_V = 40;
      Matter.Composite.allBodies(engine.world).forEach(b => {
        if (b.isStatic) return;
        if (b.plugin?.kinematic) {
          b.force.x = 0; b.force.y = 0;
          const kv = b.plugin.kinematicVel || { x: 0, y: 0 };
          Matter.Body.setVelocity(b, kv);
          return;
        }
        // Clamp translational velocity to prevent tunneling
        const vx = b.velocity.x, vy = b.velocity.y;
        const sp = Math.hypot(vx, vy);
        if (sp > MAX_V) {
          const s = MAX_V / sp;
          Matter.Body.setVelocity(b, { x: vx * s, y: vy * s });
        }
        // Only cap truly runaway angular velocity — 0.8 was breaking pendulums
        if (Math.abs(b.angularVelocity) > 4.0) {
          Matter.Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * 4.0);
        }
      });
      // Run experiment-specific per-tick logic (e.g. Y-lock, Atwood tension).
      // Always pass the engine so customUpdate can read gravity.
      if (!isPausedRef.current && experimentUpdateRef.current) {
        experimentUpdateRef.current(engine);
      }

      // Realtime: broadcast position of a body the local user is dragging
      const held = mouseConstraintRef.current?.body;
      if (held && !held.isStatic && onBodyMovedRef.current) {
        ensureNetId(held);
        onBodyMovedRef.current({
          netId: held.plugin.netId,
          x: held.position.x, y: held.position.y,
          vx: held.velocity.x, vy: held.velocity.y,
          angle: held.angle, av: held.angularVelocity,
          dragging: true,
        });
      }
    });

    Matter.Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      if (!ctx) return;
      const { width: rw = 900, height: rh = 600 } = render.options;

      if (showGridRef.current) drawGrid(ctx, rw, rh);
      if (showAxesRef.current) drawAxes(ctx, rw, rh);

      // Multi-select highlights
      if (selectedIdsRef.current.size > 0) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        selectedIdsRef.current.forEach((id) => {
          const b = Matter.Composite.allBodies(engine.world).find(x => x.id === id);
          if (!b) return;
          const w = b.bounds.max.x - b.bounds.min.x;
          const h = b.bounds.max.y - b.bounds.min.y;
          ctx.strokeRect(b.bounds.min.x - 2, b.bounds.min.y - 2, w + 4, h + 4);
        });
        ctx.setLineDash([]);
      }

      // Box select preview
      if (boxSelectRef.current) {
        const { x0, y0, x1, y1 } = boxSelectRef.current;
        ctx.fillStyle = 'rgba(96,165,250,0.12)';
        ctx.strokeStyle = 'rgba(96,165,250,0.8)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.fillRect(Math.min(x0,x1), Math.min(y0,y1), Math.abs(x1-x0), Math.abs(y1-y0));
        ctx.strokeRect(Math.min(x0,x1), Math.min(y0,y1), Math.abs(x1-x0), Math.abs(y1-y0));
        ctx.setLineDash([]);
      }

      // Selection highlight
      if (selectedIdRef.current != null) {
        const b = Matter.Composite.allBodies(engine.world).find(x => x.id === selectedIdRef.current);
        if (b) {
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          const r = (b.bounds.max.x - b.bounds.min.x) / 2 + 4;
          ctx.beginPath();
          ctx.arc(b.position.x, b.position.y, r + 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      springInfosRef.current.forEach(({ constraint, k, naturalLength, color }) => {
        const { ax, ay, bx, by } = getConstraintEndpoints(constraint);
        const currentLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
        const ext = currentLen - naturalLength;
        const extRatio = Math.abs(ext) / Math.max(naturalLength, 1);
        // Colour: cyan at rest, red when stretched >20% of natural length
        const springColor = extRatio > 0.2 ? '#f87171' : (color ?? '#22d3ee');
        // Coil count scales with k: stiffer spring = more coils (visual cue)
        const coils = Math.max(6, Math.round(k / 20));
        drawCoilSpring(ctx, ax, ay, bx, by, coils, 8, springColor);

        // Real spring force: F = k·|Δx| with 1 px = 0.01 m → k in N/m, Δx in m
        const F_N = k * Math.abs(ext) * 0.01; // Newtons
        // Theoretical period for the body attached (bodyB or bodyA if B is static)
        const attachedBody = (constraint.bodyB && !constraint.bodyB.isStatic)
          ? constraint.bodyB : constraint.bodyA;
        const m = (!attachedBody?.isStatic) ? (attachedBody?.mass ?? 1) : null;
        const T_s = m ? (2 * Math.PI * Math.sqrt(m / k)).toFixed(2) : null;

        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        ctx.font = '10px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = extRatio > 0.2 ? '#f87171' : '#22d3ee';
        ctx.fillText(`F = ${F_N.toFixed(1)} N`, mx + 20, my - 4);
        if (T_s) {
          ctx.fillStyle = '#a78bfa';
          ctx.fillText(`T = ${T_s} s`, mx + 20, my + 9);
        }
      });

      // Conveyor arrows
      conveyorsRef.current.forEach(({ body, surfaceVel }) => {
        const y = body.bounds.min.y - 10;
        const dir = surfaceVel >= 0 ? 1 : -1;
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        for (let x = body.bounds.min.x + 20; x < body.bounds.max.x - 10; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + 20 * dir, y); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + 20 * dir, y);
          ctx.lineTo(x + 14 * dir, y - 4);
          ctx.lineTo(x + 14 * dir, y + 4);
          ctx.closePath(); ctx.fill();
        }
      });

      pulleysRef.current.forEach(info => drawPulleyRope(ctx, info));
      motorsRef.current.forEach(({ body, angularSpeed }) => drawMotorIndicator(ctx, body, angularSpeed));

      // Motor drive-rope: draw orange rope + glowing rim attachment dot
      motorRopesRef.current.forEach(({ constraint, motorBody, rimPoint }) => {
        const { ax, ay, bx, by } = getConstraintEndpoints(constraint);
        // Rope line
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
        ctx.stroke();
        // Glowing attachment dot on rim
        const cos = Math.cos(motorBody.angle), sin = Math.sin(motorBody.angle);
        const wx = motorBody.position.x + rimPoint.x * cos - rimPoint.y * sin;
        const wy = motorBody.position.y + rimPoint.x * sin + rimPoint.y * cos;
        ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b'; ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.5; ctx.stroke();
        // Length indicator
        const ropLen = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
        ctx.font = '10px monospace'; ctx.fillStyle = '#f59e0b'; ctx.textAlign = 'center';
        ctx.fillText(`L = ${ropLen.toFixed(0)} px`, (ax + bx) / 2 + 14, (ay + by) / 2 - 6);
      });

      // ── Trajectory trails ──────────────────────────────────────────────────
      // Accumulate position history while the simulation is running, then draw
      // a two-tone fading polyline behind each dynamic body.
      const TRAIL_MAX = 120;
      const allDynamic = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);

      if (!isPausedRef.current) {
        allDynamic.forEach(body => {
          const trail = trajectoriesRef.current.get(body.id);
          if (!trail) {
            trajectoriesRef.current.set(body.id, [{ x: body.position.x, y: body.position.y }]);
          } else {
            trail.push({ x: body.position.x, y: body.position.y });
            if (trail.length > TRAIL_MAX) trail.shift();
          }
        });
      }

      ctx.setLineDash([]);
      trajectoriesRef.current.forEach((trail, bodyId) => {
        if (trail.length < 3) return;
        const body = allDynamic.find(b => b.id === bodyId);
        if (!body) { trajectoriesRef.current.delete(bodyId); return; }
        const col = body.render?.fillStyle ?? '#71717a';
        const mid = Math.floor(trail.length / 2);
        // Older half — dimmer
        if (mid > 1) {
          ctx.beginPath();
          ctx.moveTo(trail[0].x, trail[0].y);
          for (let pi = 1; pi <= mid; pi++) ctx.lineTo(trail[pi].x, trail[pi].y);
          ctx.strokeStyle = col + '28';
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
        // Newer half — brighter
        if (trail.length - mid > 1) {
          ctx.beginPath();
          ctx.moveTo(trail[mid].x, trail[mid].y);
          for (let pi = mid + 1; pi < trail.length; pi++) ctx.lineTo(trail[pi].x, trail[pi].y);
          ctx.strokeStyle = col + '70';
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
      });

      const dynamicBodies = allDynamic;
      dynamicBodies.forEach(body => {
        const label = bodyLabelsRef.current.get(body.id) || body.label;
        if (label && label !== 'Body') drawBodyLabel(ctx, body, label);
        drawVelocityVector(ctx, body);
      });

      const ts = toolStateRef.current;
      if (ts.step === 1 && hoverRef.current) {
        const fp = ts.firstPoint;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(34,211,238,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fp.x, fp.y);
        ctx.lineTo(hoverRef.current.x, hoverRef.current.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    const dataInterval = setInterval(() => {
      const bodies = Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);
      setObjectCount(bodies.length);

      let totalKE = 0, totalPE = 0, totalRotKE = 0;
      let totalMomX = 0, totalMomY = 0, totalAngMom = 0;
      // Ground surface top = canvas H + thick/2 - 10 - thick/2 = H - 10
      // PE is zero-referenced at ground level; measure from bottom of each body
      const groundSurfaceY = (render.options.height ?? 600) - 10;
      const bodyDataArr = bodies.slice(0, 8).map(body => {
        const spd = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        const ke = 0.5 * body.mass * spd ** 2;
        const rotKe = 0.5 * (body.inertia ?? 0) * body.angularVelocity ** 2;
        // Height above ground = how far the body's lowest point is above the ground surface
        const heightAboveGround = Math.max(0, groundSurfaceY - body.bounds.max.y);
        const pe = body.mass * Math.abs(engine.gravity.y) * heightAboveGround;
        totalKE += ke; totalPE += pe; totalRotKE += rotKe;
        totalMomX += body.mass * body.velocity.x;
        totalMomY += body.mass * body.velocity.y;
        totalAngMom += (body.inertia ?? 0) * body.angularVelocity;
        return {
          id: body.id,
          name: bodyLabelsRef.current.get(body.id) || body.label || `Body ${body.id}`,
          x: parseFloat(body.position.x.toFixed(1)),
          y: parseFloat(body.position.y.toFixed(1)),
          vx: parseFloat(body.velocity.x.toFixed(2)),
          vy: parseFloat(body.velocity.y.toFixed(2)),
          speed: parseFloat(spd.toFixed(2)),
          angle: parseFloat(((body.angle * 180) / Math.PI).toFixed(1)),
          angularVelocity: parseFloat(body.angularVelocity.toFixed(3)),
          mass: body.mass,
          kineticEnergy: parseFloat(ke.toFixed(3)),
          rotationalKE: parseFloat(rotKe.toFixed(3)),
          potentialEnergy: parseFloat(pe.toFixed(3)),
          totalEnergy: parseFloat((ke + rotKe + pe).toFixed(3)),
        };
      });

      let totalSpringPE = 0;
      const springDataArr = springInfosRef.current.map((si, idx) => {
        const { ax, ay, bx, by } = getConstraintEndpoints(si.constraint);
        const cur = Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
        const ext = cur - si.naturalLength;
        // Real spring force: F = k [N/m] × |ext| [px × 0.01 m/px]
        const f_N = si.k * Math.abs(ext) * 0.01;
        // Real PE: ½kx² with x in metres
        const x_m = ext * 0.01;
        const spe = 0.5 * si.k * x_m * x_m;
        totalSpringPE += spe;
        // Theoretical period (SI)
        const bB = si.constraint.bodyB;
        const m_kg = (bB && !bB.isStatic) ? bB.mass : null;
        const T_s = m_kg ? 2 * Math.PI * Math.sqrt(m_kg / si.k) : null;
        return {
          id: `spring-${idx}`,
          k: si.k,
          naturalLength: si.naturalLength,
          currentLength: parseFloat(cur.toFixed(1)),
          extension: parseFloat(ext.toFixed(1)),
          force: parseFloat(f_N.toFixed(3)),
          springPE: parseFloat(spe.toFixed(4)),
          period: T_s ? parseFloat(T_s.toFixed(3)) : null,
        };
      });

      onPhysicsData({
        totalKE: parseFloat((totalKE + totalRotKE).toFixed(3)),
        totalPE: parseFloat(totalPE.toFixed(3)),
        totalSpringPE: parseFloat(totalSpringPE.toFixed(3)),
        totalEnergy: parseFloat((totalKE + totalRotKE + totalPE + totalSpringPE).toFixed(3)),
        totalMomentumX: parseFloat(totalMomX.toFixed(3)),
        totalMomentumY: parseFloat(totalMomY.toFixed(3)),
        totalAngularMomentum: parseFloat(totalAngMom.toFixed(3)),
        bodies: bodyDataArr,
        springs: springDataArr,
        time: Date.now(),
      });
    }, 80);

    return () => {
      clearInterval(dataInterval);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, []);

  // ── Simulation params sync ────────────────────────────────────────────────
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.gravity.y = simulationParams.gravity;
    // Only apply timeScale if running; paused keeps world frozen.
    if (!isPausedRef.current) {
      engineRef.current.timing.timeScale = simulationParams.timeScale;
    }
    // Collect spring-attached body IDs — their frictionAir is calibrated for damping ratio ζ
    // and must NOT be overwritten by the global air-resistance slider.
    const springBodyIds = new Set();
    springInfosRef.current.forEach(si => {
      if (si.constraint.bodyA && !si.constraint.bodyA.isStatic) springBodyIds.add(si.constraint.bodyA.id);
      if (si.constraint.bodyB && !si.constraint.bodyB.isStatic) springBodyIds.add(si.constraint.bodyB.id);
    });
    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    bodies.forEach(b => {
      if (!b.isStatic && !springBodyIds.has(b.id)) b.frictionAir = simulationParams.airResistance;
    });
  }, [simulationParams]);

  // ── Freeze / unfreeze on pause ────────────────────────────────────────────
  useEffect(() => {
    if (!engineRef.current) return;
    if (isPaused) {
      // Freeze time only — do NOT zero velocities.
      // Zeroing velocities destroys the physics state of oscillators and
      // pendulums so they never move again after resuming.
      engineRef.current.timing.timeScale = 0;
    } else {
      engineRef.current.timing.timeScale = simulationParams.timeScale;
    }
  }, [isPaused]);

  // ── Canvas click ──────────────────────────────────────────────────────────
  const getCanvasXY = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getBodyAtPoint = (x, y) => {
    if (!engineRef.current) return null;
    const bodies = Matter.Query.point(Matter.Composite.allBodies(engineRef.current.world), { x, y });
    return bodies.find(b => !b.isStatic) ?? null;
  };

  const handleCanvasClick = (e) => {
    if (!engineRef.current) return;
    const raw = getCanvasXY(e);

    // No tool active: selection mode
    if (!selectedTool) {
      const body = getBodyAtPoint(raw.x, raw.y);
      selectedIdRef.current = body ? body.id : null;
      if (onSelectBody) onSelectBody(body ? body.id : null);
      return;
    }

    // Snap only for plain shape placement — not for constraint targeting
    const isShape = ['block','disk','wedge','rod','motor','hexagon'].includes(selectedTool);
    const x = isShape ? snap(raw.x) : raw.x;
    const y = isShape ? snap(raw.y) : raw.y;
    const engine = engineRef.current;
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    switch (selectedTool) {
      case 'block': {
        const sz = toolParams.bodySize;
        const b = Matter.Bodies.rectangle(x, y, sz, sz, {
          mass: toolParams.mass, restitution: toolParams.restitution,
          friction: toolParams.friction, frictionAir: simulationParams.airResistance,
          render: { fillStyle: color }, label: `Block`,
        });
        Matter.World.add(engine.world, b);
        bodyLabelsRef.current.set(b.id, `m = ${toolParams.mass} kg`);
        ensureNetId(b); onBodyAddedRef.current?.(getBodySnapshot(b));
        pushHistory({ bodies: [b] });
        onClearTool();
        break;
      }
      case 'disk': {
        const r = toolParams.bodySize / 2;
        const b = Matter.Bodies.circle(x, y, r, {
          mass: toolParams.mass, restitution: toolParams.restitution,
          friction: toolParams.friction, frictionAir: simulationParams.airResistance,
          render: { fillStyle: color }, label: `Disk`,
        });
        Matter.World.add(engine.world, b);
        bodyLabelsRef.current.set(b.id, `m = ${toolParams.mass} kg`);
        ensureNetId(b); onBodyAddedRef.current?.(getBodySnapshot(b));
        pushHistory({ bodies: [b] });
        onClearTool();
        break;
      }
      case 'hexagon': {
        const sz = toolParams.bodySize;
        const b = Matter.Bodies.polygon(x, y, 6, sz * 0.55, {
          mass: toolParams.mass, restitution: toolParams.restitution,
          friction: toolParams.friction, frictionAir: simulationParams.airResistance,
          render: { fillStyle: color }, label: `Hexagon`,
        });
        Matter.World.add(engine.world, b);
        bodyLabelsRef.current.set(b.id, `m = ${toolParams.mass} kg`);
        ensureNetId(b); onBodyAddedRef.current?.(getBodySnapshot(b));
        pushHistory({ bodies: [b] });
        onClearTool();
        break;
      }
      case 'wedge': {
        const sz = toolParams.bodySize;
        const b = Matter.Bodies.polygon(x, y, 3, sz * 0.6, {
          mass: toolParams.mass, restitution: toolParams.restitution,
          friction: toolParams.friction, frictionAir: simulationParams.airResistance,
          render: { fillStyle: color }, label: `Wedge`,
        });
        Matter.World.add(engine.world, b);
        bodyLabelsRef.current.set(b.id, `m = ${toolParams.mass} kg`);
        ensureNetId(b); onBodyAddedRef.current?.(getBodySnapshot(b));
        pushHistory({ bodies: [b] });
        onClearTool();
        break;
      }
      case 'rod': {
        const len = toolParams.bodySize * 1.8;
        const b = Matter.Bodies.rectangle(x, y, len, 12, {
          mass: toolParams.mass, restitution: 0.1,
          friction: toolParams.friction, frictionAir: simulationParams.airResistance,
          render: { fillStyle: '#78716c', strokeStyle: '#a8a29e', lineWidth: 1 }, label: `Rod`,
        });
        Matter.World.add(engine.world, b);
        bodyLabelsRef.current.set(b.id, `Rod (${toolParams.mass} kg)`);
        ensureNetId(b); onBodyAddedRef.current?.(getBodySnapshot(b));
        pushHistory({ bodies: [b] });
        onClearTool();
        break;
      }
      case 'spring': {
        const ts = toolStateRef.current;
        if (ts.step === 0) {
          const body = getBodyAtPoint(x, y);
          if (body) {
            ts.step = 1;
            ts.firstBodyId = body.id;
            ts.firstPoint = { x: body.position.x, y: body.position.y };
            ts.firstStaticAnchor = null;
            setToolMessage('Now click on a second body or empty space to connect spring');
          } else {
            const anchor = Matter.Bodies.circle(x, y, 8, {
              isStatic: true,
              render: { fillStyle: '#6b7280', strokeStyle: '#9ca3af', lineWidth: 2 },
              label: 'Anchor', collisionFilter: { mask: 0 },
            });
            Matter.World.add(engine.world, anchor);
            ts.step = 1;
            ts.firstBodyId = null;
            ts.firstPoint = { x, y };
            ts.firstStaticAnchor = anchor;
            setToolMessage('Now click on a body to connect spring');
          }
        } else if (ts.step === 1) {
          const allBodies = Matter.Composite.allBodies(engine.world);
          const bodyA = ts.firstBodyId != null ? allBodies.find(b => b.id === ts.firstBodyId) : null;
          const anchorA = ts.firstStaticAnchor;
          const bodyB = getBodyAtPoint(x, y);
          if (!bodyB) {
            if (anchorA) Matter.World.remove(engine.world, anchorA);
            ts.step = 0; ts.firstPoint = null; ts.firstBodyId = null; ts.firstStaticAnchor = null;
            setToolMessage('');
            return;
          }
          const fp = ts.firstPoint;
          const natLen = Math.sqrt((bodyB.position.x - fp.x) ** 2 + (bodyB.position.y - fp.y) ** 2);
          const spring = Matter.Constraint.create({
            ...(bodyA ? { bodyA, pointA: { x: 0, y: 0 } } : { pointA: { x: fp.x, y: fp.y } }),
            bodyB, pointB: { x: 0, y: 0 },
            length: Math.max(natLen, 20),
            // near-zero stiffness: the constraint solver does nothing.
            // All spring physics come from the explicit Hooke's Law force in beforeUpdate.
            // A non-zero constraint stiffness (e.g. 0.04) fights the explicit force,
            // shifting the equilibrium and breaking symmetric SHM.
            stiffness: 0.00001,
            damping: 0,
            render: { visible: false },
          });
          Matter.World.add(engine.world, spring);
          // Set frictionAir proportional to ω_sim so ζ ≈ 0.1–0.5 for slider range 0-30.
          // Old formula (springDamping * 0.005) gave ζ ≫ 1 → overdamped.
          const omegaSim = Math.sqrt(toolParams.springK * 1e-6 / Math.max(bodyB.mass, 0.1));
          bodyB.frictionAir = Math.max(toolParams.springDamping * 2.0 * omegaSim, 0.0002);
          const springInfo = {
            constraint: spring, k: toolParams.springK,
            naturalLength: Math.max(natLen, 20), color: '#22d3ee',
          };
          springInfosRef.current.push(springInfo);
          pushHistory({ bodies: anchorA ? [anchorA] : [], constraints: [spring], springInfos: [springInfo] });
          ts.step = 0; ts.firstPoint = null; ts.firstBodyId = null; ts.firstStaticAnchor = null;
          setToolMessage('');
          onClearTool();
        }
        break;
      }
      case 'hinge': {
        const body = getBodyAtPoint(x, y);
        if (body) {
          const relX = x - body.position.x;
          const relY = y - body.position.y;
          const hinge = Matter.Constraint.create({
            pointA: { x, y }, bodyB: body, pointB: { x: relX, y: relY },
            length: 0, stiffness: 1, render: { visible: false },
          });
          Matter.World.add(engine.world, hinge);
          const pivotDot = Matter.Bodies.circle(x, y, 6, {
            isStatic: true, render: { fillStyle: '#f59e0b' },
            collisionFilter: { mask: 0 }, label: 'Hinge',
          });
          Matter.World.add(engine.world, pivotDot);
          pushHistory({ bodies: [pivotDot], constraints: [hinge] });
          onClearTool();
        }
        break;
      }
      case 'rigid-rod': {
        const ts = toolStateRef.current;
        if (ts.step === 0) {
          const body = getBodyAtPoint(x, y);
          if (body) {
            ts.step = 1;
            ts.firstBodyId = body.id;
            ts.firstPoint = { x: body.position.x, y: body.position.y };
            setToolMessage('Click another body to connect with rigid rod');
          }
        } else if (ts.step === 1) {
          const all = Matter.Composite.allBodies(engine.world);
          const bodyA = all.find(b => b.id === ts.firstBodyId);
          const bodyB = getBodyAtPoint(x, y);
          if (bodyA && bodyB && bodyA !== bodyB) {
            const L = Math.sqrt((bodyB.position.x - bodyA.position.x) ** 2 + (bodyB.position.y - bodyA.position.y) ** 2);
            const rod = Matter.Constraint.create({
              bodyA, bodyB, length: L, stiffness: 1, damping: 0.3,
              render: { strokeStyle: '#d4d4d8', lineWidth: 3, visible: true },
            });
            Matter.World.add(engine.world, rod);
            pushHistory({ constraints: [rod] });
          }
          ts.step = 0; ts.firstPoint = null; ts.firstBodyId = null;
          setToolMessage('');
          onClearTool();
        }
        break;
      }
      case 'conveyor': {
        const width = toolParams.bodySize * 4;
        const height = 16;
        const speed = toolParams.motorSpeed;
        const belt = Matter.Bodies.rectangle(x, y, width, height, {
          isStatic: true, friction: 1, frictionStatic: 1,
          render: { fillStyle: '#78350f', strokeStyle: '#f59e0b', lineWidth: 2 },
          label: 'Conveyor',
        });
        Matter.World.add(engine.world, belt);
        const convEntry = { body: belt, surfaceVel: speed };
        conveyorsRef.current.push(convEntry);
        bodyLabelsRef.current.set(belt.id, `Conveyor ${speed.toFixed(1)} m/s`);
        pushHistory({ bodies: [belt], conveyorInfos: [convEntry] });
        onClearTool();
        break;
      }
      case 'rope': {
        const ts = toolStateRef.current;
        if (ts.step === 0) {
          const body = getBodyAtPoint(x, y);
          if (body) {
            // Check if this body is a motor — if so, enable drive-rope mode
            const isMotor = motorsRef.current.some(m => m.body === body);
            ts.step = 1;
            ts.firstBodyId = body.id;
            ts.firstPoint = { x: body.position.x, y: body.position.y };
            if (isMotor) {
              // Convert click to body-local coordinates for rim attachment
              const cosA = Math.cos(body.angle), sinA = Math.sin(body.angle);
              const dx = x - body.position.x, dy = y - body.position.y;
              ts.rimPoint = { x: dx * cosA + dy * sinA, y: -dx * sinA + dy * cosA };
              ts.isMotorAttachment = true;
              setToolMessage('Motor rim selected — click any body to drive it like a winch 🔄');
            } else {
              ts.rimPoint = null;
              ts.isMotorAttachment = false;
              setToolMessage('Now click on another body to connect rope');
            }
          }
        } else if (ts.step === 1) {
          const allBodies = Matter.Composite.allBodies(engine.world);
          const bodyA = allBodies.find(b => b.id === ts.firstBodyId);
          const bodyB = getBodyAtPoint(x, y);
          if (bodyA && bodyB && bodyA !== bodyB) {
            if (ts.isMotorAttachment && ts.rimPoint) {
              // ── Motor Drive Rope (winch) ───────────────────────────
              const rim = ts.rimPoint;
              const cosA = Math.cos(bodyA.angle), sinA = Math.sin(bodyA.angle);
              const worldRimX = bodyA.position.x + rim.x * cosA - rim.y * sinA;
              const worldRimY = bodyA.position.y + rim.x * sinA + rim.y * cosA;
              const ropeL = Math.hypot(bodyB.position.x - worldRimX, bodyB.position.y - worldRimY);
              const driveRope = Matter.Constraint.create({
                bodyA, pointA: rim,
                bodyB, pointB: { x: 0, y: 0 },
                length: Math.max(ropeL, 10),
                stiffness: 0.9, damping: 0.05,
                render: { visible: false }, // drawn manually with glowing style
              });
              Matter.World.add(engine.world, driveRope);
              const drumR = Math.hypot(rim.x, rim.y);
              const mr = {
                constraint: driveRope,
                motorBody: bodyA,
                rimPoint: rim,
                drumRadius: Math.max(drumR, 8),
                baseAngle: bodyA.angle,
                baseLength: Math.max(ropeL, 10),
              };
              motorRopesRef.current.push(mr);
              pushHistory({ constraints: [driveRope], motorRopeInfos: [mr] });
            } else {
              // ── Standard inextensible rope ─────────────────────────
              const L = Math.hypot(bodyB.position.x - bodyA.position.x, bodyB.position.y - bodyA.position.y);
              const rope = Matter.Constraint.create({
                bodyA, bodyB, length: L, stiffness: 0.98, damping: 0.01,
                render: { strokeStyle: '#a8a29e', lineWidth: 2.5, visible: true },
              });
              Matter.World.add(engine.world, rope);
              pushHistory({ constraints: [rope] });
            }
          }
          ts.step = 0; ts.firstPoint = null; ts.firstBodyId = null;
          ts.isMotorAttachment = false; ts.rimPoint = null;
          setToolMessage('');
          onClearTool();
        }
        break;
      }
      case 'motor': {
        const speed = (toolParams.motorSpeed * Math.PI) / 180;
        const motor = Matter.Bodies.circle(x, y, toolParams.bodySize * 0.65, {
          mass: toolParams.mass * 1.5, frictionAir: 0.01,
          render: { fillStyle: '#1e1b4b', strokeStyle: '#6366f1', lineWidth: 3 },
          label: 'Motor', collisionFilter: { category: 0x0001, mask: 0x0001 },
        });
        const pin = Matter.Constraint.create({
          pointA: { x, y }, bodyB: motor, pointB: { x: 0, y: 0 },
          length: 0, stiffness: 1, render: { visible: false },
        });
        Matter.World.add(engine.world, [motor, pin]);
        const motorEntry = { body: motor, angularSpeed: speed };
        motorsRef.current.push(motorEntry);
        bodyLabelsRef.current.set(motor.id, `Motor ω=${toolParams.motorSpeed}°/f`);
        pushHistory({ bodies: [motor], constraints: [pin], motorInfos: [motorEntry] });
        onClearTool();
        break;
      }
      case 'force': {
        const body = getBodyAtPoint(x, y);
        if (body) {
          const fx = (Math.random() - 0.5) * 0.03;
          const fy = -0.06;
          ensureNetId(body);
          Matter.Body.applyForce(body, body.position, { x: fx, y: fy });
          onBodyApplyForceRef.current?.({ netId: body.plugin.netId, fx, fy, ts: Date.now() });
          onClearTool();
        }
        break;
      }
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = getCanvasXY(e);
    hoverRef.current = { x, y };
    setMouseCoord({ x: Math.round(x), y: Math.round(y) });

    // Pan
    if (panStateRef.current.panning && renderRef.current) {
      const dx = x - panStateRef.current.startX;
      const dy = y - panStateRef.current.startY;
      const r = renderRef.current;
      r.bounds.min.x -= dx; r.bounds.max.x -= dx;
      r.bounds.min.y -= dy; r.bounds.max.y -= dy;
    }
    // Box select
    if (boxSelectRef.current) {
      boxSelectRef.current.x1 = x;
      boxSelectRef.current.y1 = y;
    }
  };

  const handleWheel = (e) => {
    if (!renderRef.current) return;
    e.preventDefault();
    const r = renderRef.current;
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const cx = (r.bounds.min.x + r.bounds.max.x) / 2;
    const cy = (r.bounds.min.y + r.bounds.max.y) / 2;
    const w = (r.bounds.max.x - r.bounds.min.x) * factor;
    const h = (r.bounds.max.y - r.bounds.min.y) * factor;
    r.bounds.min.x = cx - w / 2; r.bounds.max.x = cx + w / 2;
    r.bounds.min.y = cy - h / 2; r.bounds.max.y = cy + h / 2;
    viewRef.current.zoom = (r.options.width ?? 900) / w;
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasXY(e);
    if (panStateRef.current.spaceDown || e.button === 1) {
      panStateRef.current.panning = true;
      panStateRef.current.startX = x;
      panStateRef.current.startY = y;
      e.preventDefault();
      return;
    }
    if (e.shiftKey && !selectedTool) {
      boxSelectRef.current = { x0: x, y0: y, x1: x, y1: y };
    }
  };

  const handleMouseUp = (e) => {
    if (panStateRef.current.panning) { panStateRef.current.panning = false; return; }
    if (boxSelectRef.current && engineRef.current) {
      const { x0, y0, x1, y1 } = boxSelectRef.current;
      const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
      const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
      const hits = Matter.Composite.allBodies(engineRef.current.world).filter(b =>
        !b.isStatic && b.position.x >= minX && b.position.x <= maxX &&
        b.position.y >= minY && b.position.y <= maxY);
      selectedIdsRef.current = new Set(hits.map(b => b.id));
      if (hits.length === 1) {
        selectedIdRef.current = hits[0].id;
        if (onSelectBody) onSelectBody(hits[0].id);
      } else if (hits.length > 1) {
        selectedIdRef.current = null;
        if (onSelectBody) onSelectBody(null);
      }
      boxSelectRef.current = null;
    }
  };

  useEffect(() => {
    const onKD = (e) => { if (e.code === 'Space') panStateRef.current.spaceDown = true; };
    const onKU = (e) => { if (e.code === 'Space') panStateRef.current.spaceDown = false; };
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    return () => { window.removeEventListener('keydown', onKD); window.removeEventListener('keyup', onKU); };
  }, []);

  // Imperative API
  useEffect(() => {
    if (!canvasApi) return;
    canvasApi.current = {
      deleteSelected: () => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (body) {
          const netId = body.plugin?.netId;
          Matter.World.remove(engineRef.current.world, body);
          springInfosRef.current = springInfosRef.current.filter(s => s.constraint.bodyA !== body && s.constraint.bodyB !== body);
          motorsRef.current = motorsRef.current.filter(m => m.body !== body);
          // Remove any drive ropes that referenced this body
          motorRopesRef.current = motorRopesRef.current.filter(mr => mr.motorBody !== body && mr.constraint.bodyB !== body);
          if (netId) onBodyDeletedRef.current?.({ netId });
        }
        selectedIdRef.current = null;
        if (onSelectBody) onSelectBody(null);
      },
      duplicateSelected: () => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        const w = body.bounds.max.x - body.bounds.min.x;
        const h = body.bounds.max.y - body.bounds.min.y;
        const isCircle = body.circleRadius != null;
        const opts = {
          mass: body.mass, friction: body.friction, restitution: body.restitution,
          frictionAir: body.frictionAir, render: { fillStyle: body.render.fillStyle },
          label: body.label,
        };
        const nb = isCircle
          ? Matter.Bodies.circle(body.position.x + 40, body.position.y, body.circleRadius, opts)
          : Matter.Bodies.rectangle(body.position.x + 40, body.position.y, w, h, opts);
        Matter.Body.setAngle(nb, body.angle);
        Matter.World.add(engineRef.current.world, nb);
        bodyLabelsRef.current.set(nb.id, bodyLabelsRef.current.get(body.id) || '');
        selectedIdRef.current = nb.id;
        if (onSelectBody) onSelectBody(nb.id);
      },
      updateSelected: (patch) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        if (patch.mass != null) Matter.Body.setMass(body, patch.mass);
        if (patch.density != null) Matter.Body.setDensity(body, patch.density);
        if (patch.friction != null) body.friction = patch.friction;
        if (patch.restitution != null) body.restitution = patch.restitution;
        if (patch.frictionAir != null) body.frictionAir = patch.frictionAir;
        if (patch.color != null) body.render.fillStyle = patch.color;
        if (patch.name != null) bodyLabelsRef.current.set(body.id, patch.name);
      },
      toggleStaticSelected: () => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        Matter.Body.setStatic(body, !body.isStatic);
      },
      getSelected: () => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return null;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return null;
        const isCircle = body.circleRadius != null;
        const w = body.bounds.max.x - body.bounds.min.x;
        const h = body.bounds.max.y - body.bounds.min.y;
        return {
          id: body.id,
          shape: isCircle ? 'circle' : 'polygon',
          name: bodyLabelsRef.current.get(body.id) || body.label,
          mass: body.mass, density: body.density,
          friction: body.friction, restitution: body.restitution,
          frictionAir: body.frictionAir,
          color: body.render.fillStyle,
          isStatic: body.isStatic,
          isSensor: body.isSensor,
          lockRotation: body.inertia === Infinity,
          bodyType: body.isStatic ? 'static' : (body.plugin?.kinematic ? 'kinematic' : 'dynamic'),
          collisionCategory: body.collisionFilter?.category ?? 1,
          x: body.position.x, y: body.position.y,
          width: isCircle ? null : w,
          height: isCircle ? null : h,
          radius: body.circleRadius,
          vx: body.velocity.x, vy: body.velocity.y,
          angle: (body.angle * 180) / Math.PI,
          angularVelocity: body.angularVelocity,
        };
      },
      setBodyType: (type) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        if (type === 'static') { Matter.Body.setStatic(body, true); body.plugin = { ...body.plugin, kinematic: false }; }
        else if (type === 'kinematic') {
          Matter.Body.setStatic(body, false);
          body.plugin = { ...body.plugin, kinematic: true };
        } else {
          Matter.Body.setStatic(body, false);
          body.plugin = { ...body.plugin, kinematic: false };
        }
      },
      setLockRotation: (lock) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        if (!body.plugin?.origInertia && body.inertia !== Infinity) {
          body.plugin = { ...body.plugin, origInertia: body.inertia };
        }
        Matter.Body.setInertia(body, lock ? Infinity : (body.plugin?.origInertia || 1));
      },
      setSensor: (on) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        body.isSensor = !!on;
      },
      setCollisionCategory: (cat) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        body.collisionFilter.category = cat;
        body.collisionFilter.mask = cat;
      },
      setPosition: (x, y) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        Matter.Body.setPosition(body, { x, y });
      },
      setAngle: (deg) => {
        const id = selectedIdRef.current;
        if (id == null || !engineRef.current) return;
        const body = Matter.Composite.allBodies(engineRef.current.world).find(b => b.id === id);
        if (!body) return;
        Matter.Body.setAngle(body, (deg * Math.PI) / 180);
      },
      clearScene: () => { clearWorld(); selectedIdRef.current = null; if (onSelectBody) onSelectBody(null); },
      setGravity: (on) => {
        if (!engineRef.current) return;
        engineRef.current.gravity.y = on ? 1 : 0;
      },
      stepFrame: () => {
        if (!engineRef.current) return;
        Matter.Runner.stop(runnerRef.current);
        Matter.Engine.update(engineRef.current, 1000 / 60);
        setIsPaused(true);
      },
      saveScene: () => {
        if (!engineRef.current) return null;
        const bodies = Matter.Composite.allBodies(engineRef.current.world)
          .filter(b => !['ground','wall-left','wall-right','ceiling'].includes(b.label));
        const data = {
          version: 1, timestamp: Date.now(),
          bodies: bodies.map(b => ({
            isCircle: b.circleRadius != null,
            radius: b.circleRadius,
            vertices: b.circleRadius != null ? null : b.vertices.map(v => ({ x: v.x - b.position.x, y: v.y - b.position.y })),
            x: b.position.x, y: b.position.y, angle: b.angle,
            mass: b.mass, friction: b.friction, restitution: b.restitution,
            isStatic: b.isStatic, color: b.render.fillStyle, label: b.label,
            name: bodyLabelsRef.current.get(b.id) || '',
          })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `virtual-lab-scene-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      loadScene: (data) => {
        if (!engineRef.current || !data?.bodies) return;
        clearWorld();
        data.bodies.forEach(bd => {
          const opts = {
            mass: bd.mass, friction: bd.friction, restitution: bd.restitution,
            isStatic: bd.isStatic, render: { fillStyle: bd.color }, label: bd.label,
          };
          let b;
          if (bd.isCircle) b = Matter.Bodies.circle(bd.x, bd.y, bd.radius, opts);
          else {
            const xs = bd.vertices.map(v => v.x), ys = bd.vertices.map(v => v.y);
            const w = Math.max(...xs) - Math.min(...xs);
            const h = Math.max(...ys) - Math.min(...ys);
            b = Matter.Bodies.rectangle(bd.x, bd.y, w, h, opts);
          }
          Matter.Body.setAngle(b, bd.angle);
          Matter.World.add(engineRef.current.world, b);
          if (bd.name) bodyLabelsRef.current.set(b.id, bd.name);
        });
      },
      screenshot: () => {
        if (!canvasRef.current) return;
        const url = canvasRef.current.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url; a.download = `virtual-lab-${Date.now()}.png`;
        a.click();
      },
      startTimer: () => {
        const t = timerRef.current;
        t.running = true;
        t.start = performance.now();
      },
      stopTimer: () => {
        const t = timerRef.current;
        if (t.running) {
          t.accum += (performance.now() - t.start);
          t.running = false;
        }
      },
      resetTimer: () => {
        timerRef.current = { running: false, start: 0, accum: 0 };
        setTimerDisplay(0);
      },

      // ── Realtime sync helpers ──────────────────────────────────────────
      getFullState: () => {
        if (!engineRef.current) return null;
        const boundary = new Set(['ground', 'wall-left', 'wall-right', 'ceiling']);
        const bodies = Matter.Composite.allBodies(engineRef.current.world)
          .filter(b => !boundary.has(b.label ?? ''));
        return {
          bodies: bodies.map(b => {
            ensureNetId(b);
            const isCircle = b.circleRadius != null;
            const w = b.bounds.max.x - b.bounds.min.x;
            const h = b.bounds.max.y - b.bounds.min.y;
            return {
              netId: b.plugin.netId,
              shape: isCircle ? 'circle' : 'rect',
              radius: b.circleRadius ?? null,
              w, h,
              x: b.position.x, y: b.position.y, angle: b.angle,
              vx: b.velocity.x, vy: b.velocity.y, av: b.angularVelocity,
              mass: b.mass, friction: b.friction, restitution: b.restitution,
              isStatic: b.isStatic,
              color: b.render?.fillStyle ?? '#3b82f6',
              label: b.label,
              name: bodyLabelsRef.current.get(b.id) ?? '',
            };
          }),
        };
      },
      applyMove: (payload) => {
        if (!engineRef.current || !payload?.netId) return;
        const all = Matter.Composite.allBodies(engineRef.current.world);
        const b = all.find(x => x.plugin?.netId === payload.netId);
        if (!b || b.isStatic) return;
        // Soft-lock: never override position of a body the LOCAL user is currently dragging
        if (mouseConstraintRef.current?.body === b) return;
        Matter.Body.setPosition(b, { x: payload.x, y: payload.y });
        if (payload.angle != null) Matter.Body.setAngle(b, payload.angle);
        Matter.Body.setVelocity(b, { x: payload.vx ?? 0, y: payload.vy ?? 0 });
        if (payload.av != null) Matter.Body.setAngularVelocity(b, payload.av);
      },
      applyAuthoritativeState: (state) => {
        if (!engineRef.current || !state?.bodies) return;
        const world = engineRef.current.world;
        const boundary = new Set(['ground', 'wall-left', 'wall-right', 'ceiling']);
        const all = Matter.Composite.allBodies(world);
        const byNet = new Map();
        all.forEach(b => { if (b.plugin?.netId) byNet.set(b.plugin.netId, b); });

        const incomingIds = new Set(state.bodies.map(s => s.netId));

        // Remove local bodies that don't exist in authoritative state (except boundaries)
        all.forEach(b => {
          if (boundary.has(b.label ?? '')) return;
          if (!b.plugin?.netId) return;
          if (!incomingIds.has(b.plugin.netId)) {
            Matter.World.remove(world, b);
          }
        });

        // Add or update incoming bodies
        state.bodies.forEach(s => {
          let b = byNet.get(s.netId);
          if (!b) {
            const opts = {
              mass: s.mass, friction: s.friction, restitution: s.restitution,
              isStatic: s.isStatic,
              render: { fillStyle: s.color }, label: s.label,
            };
            b = s.shape === 'circle'
              ? Matter.Bodies.circle(s.x, s.y, s.radius ?? 20, opts)
              : Matter.Bodies.rectangle(s.x, s.y, s.w ?? 40, s.h ?? 40, opts);
            b.plugin = { ...(b.plugin || {}), netId: s.netId };
            Matter.World.add(world, b);
            if (s.name) bodyLabelsRef.current.set(b.id, s.name);
          } else {
            // Don't yank a body the local user is currently dragging
            if (mouseConstraintRef.current?.body === b) return;
            Matter.Body.setPosition(b, { x: s.x, y: s.y });
            Matter.Body.setAngle(b, s.angle ?? 0);
            Matter.Body.setVelocity(b, { x: s.vx ?? 0, y: s.vy ?? 0 });
            Matter.Body.setAngularVelocity(b, s.av ?? 0);
          }
        });
      },

      // ── Remote body management ──────────────────────────────────────────
      addRemoteBody: (data) => {
        if (!engineRef.current || !data?.netId) return;
        const world = engineRef.current.world;
        const all = Matter.Composite.allBodies(world);
        // Idempotent: skip if netId already exists locally
        if (all.find(b => b.plugin?.netId === data.netId)) return;
        const opts = {
          mass: data.mass ?? 1, friction: data.friction ?? 0.1,
          restitution: data.restitution ?? 0.5,
          isStatic: data.isStatic ?? false,
          render: { fillStyle: data.color ?? '#3b82f6' }, label: data.label ?? 'Body',
        };
        const b = data.shape === 'circle'
          ? Matter.Bodies.circle(data.x, data.y, data.radius ?? 20, opts)
          : Matter.Bodies.rectangle(data.x, data.y, data.w ?? 40, data.h ?? 40, opts);
        b.plugin = { ...(b.plugin || {}), netId: data.netId };
        Matter.Body.setAngle(b, data.angle ?? 0);
        Matter.World.add(world, b);
        if (data.name) bodyLabelsRef.current.set(b.id, data.name);
      },
      removeRemoteBody: (netId) => {
        if (!engineRef.current || !netId) return;
        const all = Matter.Composite.allBodies(engineRef.current.world);
        const b = all.find(x => x.plugin?.netId === netId);
        if (b) {
          springInfosRef.current = springInfosRef.current.filter(s => s.constraint.bodyA !== b && s.constraint.bodyB !== b);
          motorsRef.current = motorsRef.current.filter(m => m.body !== b);
          Matter.World.remove(engineRef.current.world, b);
        }
      },
      applyForceToBody: (payload) => {
        if (!engineRef.current || !payload?.netId) return;
        const all = Matter.Composite.allBodies(engineRef.current.world);
        const b = all.find(x => x.plugin?.netId === payload.netId);
        if (!b || b.isStatic) return;
        Matter.Body.applyForce(b, b.position, { x: payload.fx ?? 0, y: payload.fy ?? 0 });
      },
      // Expose undo so the keyboard shortcut can call it via canvasApi
      undoLast,
    };
  }, [canvasApi, onSelectBody, clearWorld, undoLast]);

  // Timer tick
  useEffect(() => {
    const id = setInterval(() => {
      const t = timerRef.current;
      const elapsed = t.accum + (t.running ? performance.now() - t.start : 0);
      setTimerDisplay(elapsed);
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
       if (e.target?.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') canvasApi?.current?.deleteSelected();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault(); canvasApi?.current?.duplicateSelected();
      }
      // Ctrl+Z / Cmd+Z → undo last added object or connection
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault(); canvasApi?.current?.undoLast?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canvasApi]);

  const handleReset = () => {
    clearWorld();
    onClearTool();
    setToolMessage('');
    setIsPaused(true);
  };

  const togglePause = () => {
    if (!engineRef.current) return;
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950">
      {/* Toolbar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            {isPaused ? <><Play className="w-3.5 h-3.5" /> Play</> : <><Pause className="w-3.5 h-3.5" /> Pause</>}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            onClick={undoLast}
            title="Undo last added object or connection (Ctrl+Z)"
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            <Trash2 className="w-3.5 h-3.5" /> Undo Last
          </button>
          <button
            onClick={() => canvasApi?.current?.stepFrame()}
            title="Step one frame"
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            <SkipForward className="w-3.5 h-3.5" /> Step
          </button>
          <button
            onClick={() => {
              if (!engineRef.current) return;
              const cur = engineRef.current.timing.timeScale;
              engineRef.current.timing.timeScale = cur < 0.5 ? 1 : 0.25;
            }}
            title="Toggle slow-motion"
            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
          >
            <FastForward className="w-3.5 h-3.5" /> Slow-Mo
          </button>
          <div className="w-px h-6 bg-zinc-700 mx-1"/>
          <button onClick={() => canvasApi?.current?.duplicateSelected()} title="Duplicate selected (Ctrl+D)"
            className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"><Copy className="w-3.5 h-3.5"/></button>
          <button onClick={() => canvasApi?.current?.deleteSelected()} title="Delete selected (Del)"
            className="px-2 py-1.5 bg-red-900/60 hover:bg-red-800 rounded-lg text-sm"><Trash2 className="w-3.5 h-3.5"/></button>
          <div className="w-px h-6 bg-zinc-700 mx-1"/>
          <button onClick={() => {
            const t = timerRef.current;
            if (t.running) canvasApi?.current?.stopTimer();
            else canvasApi?.current?.startTimer();
          }} title="Stopwatch start/stop"
            className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"><Timer className="w-3.5 h-3.5"/></button>
          <button onClick={() => canvasApi?.current?.resetTimer()} title="Reset stopwatch"
            className="px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-[10px] font-mono">0:00</button>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
          {currentExperiment && (
            <span className="px-2 py-1 bg-blue-900/40 border border-blue-800 rounded text-blue-300">
              {currentExperiment}
            </span>
          )}
          {selectedTool && (
            <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded">
              Tool: <span className="text-blue-400">{selectedTool}</span>
            </span>
          )}
          <span>Bodies: <span className="text-zinc-100">{objectCount}</span></span>
          {isPaused && (
            <span className="px-2 py-1 bg-emerald-900/40 border border-emerald-700 rounded text-emerald-300 tracking-wider">
              EDIT MODE
            </span>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          className={selectedTool ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}
        />

        {/* Measurement overlay */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 pointer-events-none">
          <div className="bg-zinc-900/85 border border-zinc-700 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-200 flex items-center gap-2">
            <Timer className="w-3 h-3 text-amber-400"/>
            {(timerDisplay / 1000).toFixed(2)}s
          </div>
          <div className="bg-zinc-900/85 border border-zinc-700 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[11px] font-mono text-zinc-200 flex items-center gap-2">
            <Ruler className="w-3 h-3 text-cyan-400"/>
            ({mouseCoord.x}, {mouseCoord.y}) px
          </div>
        </div>

        {(selectedTool || toolMessage) && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-zinc-900/90 border border-zinc-700 text-xs px-4 py-2 rounded-full text-zinc-300 pointer-events-none backdrop-blur-sm">
            {toolMessage || `Click to place · ${selectedTool}`}
          </div>
        )}

        {objectCount === 0 && !selectedTool && !currentExperiment && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-zinc-600 text-sm font-mono text-center space-y-2">
              <div className="text-4xl mb-4 opacity-30">⚗</div>
              <p>Load an experiment from the library</p>
              <p>or select a tool to place objects</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}