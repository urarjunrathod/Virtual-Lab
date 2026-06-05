// experimentDefinitions.js
// VIRTUAL-LAB — University-level experiment definitions (plain JavaScript)
import Matter from 'matter-js';

function makeEmptyResult(name) {
  return { bodies: [], constraints: [], springInfos: [], pulleys: [], motors: [], labels: new Map(), name };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERIMENT DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const EXPERIMENTS = [
  // ── NEWTON'S LAWS ──────────────────────────────────────────────────────────
  {
    id: 'atwood-machine',
    name: "Atwood's Machine",
    category: "Newton's Laws",
    level: 'Undergrad I',
    description: 'Two unequal masses over a frictionless pulley. Derives F = ma for a constrained system.',
    concepts: ["Newton's 2nd Law", 'Constraint Forces', 'Tension', 'Mechanical Advantage'],
    formulas: ['a = (m₁ − m₂)g / (m₁ + m₂)', 'T = 2m₁m₂g / (m₁ + m₂)'],
    parameters: [
      { key: 'm1', label: 'Mass 1 (kg)', min: 0.5, max: 15, step: 0.5, default: 5, target: { type: 'mass', label: 'Mass₁' } },
      { key: 'm2', label: 'Mass 2 (kg)', min: 0.5, max: 15, step: 0.5, default: 3, target: { type: 'mass', label: 'Mass₂' } },
      { key: 'gravity', label: 'Gravity g', min: 0, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(engine, width, height, _params) {
      const res = makeEmptyResult("Atwood's Machine");
      const cx = width / 2;
      const py = 90;
      const m1Val = 5, m2Val = 3;
      const startY = py + 180;

      const pulley = Matter.Bodies.circle(cx, py, 28, {
        isStatic: true,
        label: 'Pulley',
        render: { fillStyle: '#374151', strokeStyle: '#6b7280', lineWidth: 4 },
        collisionFilter: { mask: 0 },
      });

      // Separate categories: masses must not collide with each other, only with floor
      const mass1 = Matter.Bodies.rectangle(cx - 72, startY, 52, 64, {
        mass: m1Val,
        label: 'Mass₁',
        render: { fillStyle: '#3b82f6' },
        friction: 0, frictionAir: 0.002,
        // category 0x0002 only collides with ground (0x0001), not with mass2
        collisionFilter: { category: 0x0002, mask: 0x0001 },
      });

      const mass2 = Matter.Bodies.rectangle(cx + 72, startY, 52, 64, {
        mass: m2Val,
        label: 'Mass₂',
        render: { fillStyle: '#ef4444' },
        friction: 0, frictionAir: 0.002,
        // category 0x0004 only collides with ground (0x0001), not with mass1
        collisionFilter: { category: 0x0004, mask: 0x0001 },
      });

      res.labels.set(mass1.id, `m₁ = ${m1Val} kg`);
      res.labels.set(mass2.id, `m₂ = ${m2Val} kg`);
      res.bodies.push(pulley, mass1, mass2);
      res.pulleys.push({ pulleyBody: pulley, mass1, mass2, cx, py });

      res.customUpdate = (eng) => {
        const gScale = eng.gravity.y * (eng.gravity.scale ?? 0.001);
        const m1 = mass1.mass, m2 = mass2.mass;
        const totalM = Math.max(m1 + m2, 0.001);
        // Atwood tension: T = 2m1*m2*g / (m1+m2)
        const T = (2 * m1 * m2 * gScale) / totalM;
        Matter.Body.applyForce(mass1, mass1.position, { x: 0, y: -T });
        Matter.Body.applyForce(mass2, mass2.position, { x: 0, y: -T });
        // Inextensible rope constraint: enforce v1 = -v2 (equal & opposite)
        // Average the velocities to conserve momentum in the constraint
        const v1 = mass1.velocity.y, v2 = mass2.velocity.y;
        const cv = (v1 - v2) / 2;
        // Keep masses on their vertical tracks (x locked, no rotation via velocity.x=0)
        Matter.Body.setVelocity(mass1, { x: 0, y: cv });
        Matter.Body.setVelocity(mass2, { x: 0, y: -cv });
        // Hard ceiling stops — only set position when truly at limit
        if (mass1.position.y < py + 50) {
          Matter.Body.setPosition(mass1, { x: cx - 72, y: py + 50 });
          Matter.Body.setVelocity(mass1, { x: 0, y: 0 });
          Matter.Body.setVelocity(mass2, { x: 0, y: 0 });
        }
        if (mass2.position.y < py + 50) {
          Matter.Body.setPosition(mass2, { x: cx + 72, y: py + 50 });
          Matter.Body.setVelocity(mass1, { x: 0, y: 0 });
          Matter.Body.setVelocity(mass2, { x: 0, y: 0 });
        }
      };
      return res;
    },
  },

  {
    id: 'inclined-plane',
    name: 'Inclined Plane & Friction',
    category: "Newton's Laws",
    level: 'Undergrad I',
    description: 'Block on inclined surface. Explores normal force, friction, and force decomposition.',
    concepts: ['Normal Force', 'Kinetic & Static Friction', 'Force Components', 'Equilibrium'],
    formulas: ['N = mg cos θ', 'f = μN', 'a = g(sin θ − μ cos θ)'],
    parameters: [
      { key: 'blockMass', label: 'Block Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 2, target: { type: 'mass', label: 'Block' } },
      { key: 'blockFriction', label: 'Block μ', min: 0, max: 1, step: 0.05, default: 0.35, target: { type: 'friction', label: 'Block' } },
      { key: 'gravity', label: 'Gravity g', min: 0, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult('Inclined Plane & Friction');
      const groundY = height - 40;
      const cx = width * 0.45;

      const ramp = Matter.Bodies.rectangle(cx, groundY - 90, 420, 22, {
        isStatic: true, angle: -Math.PI / 6, friction: 0.35,
        render: { fillStyle: '#4b5563' }, label: 'Ramp',
        // 0x0002 = ramp; blocks have mask: 0x0003 so they see both ramp and ground
        collisionFilter: { category: 0x0002, mask: 0x0001 },
      });
      const support = Matter.Bodies.polygon(cx - 80, groundY - 10, 3, 80, {
        isStatic: true, angle: Math.PI,
        render: { fillStyle: '#374151' }, label: 'Support',
        collisionFilter: { mask: 0 },
      });
      // Blocks spaced clearly above the ramp, separated so they fall independently
      const block = Matter.Bodies.rectangle(cx + 55, groundY - 195, 48, 48, {
        mass: 2, friction: 0.35, frictionAir: 0.001, restitution: 0.05,
        render: { fillStyle: '#3b82f6' }, label: 'Block',
        collisionFilter: { category: 0x0001, mask: 0x0003 }, // collide ramp+ground
      });
      const block2 = Matter.Bodies.rectangle(cx - 30, groundY - 195, 38, 38, {
        mass: 1, friction: 0.1, frictionAir: 0.001, restitution: 0.1,
        render: { fillStyle: '#f59e0b' }, label: 'Block 2',
        collisionFilter: { category: 0x0001, mask: 0x0003 }, // collide ramp+ground
      });

      res.labels.set(block.id, 'm = 2 kg, μ = 0.35');
      res.labels.set(block2.id, 'm = 1 kg, μ = 0.10');
      res.bodies.push(ramp, support, block, block2);
      return res;
    },
  },

  {
    id: 'newtons-cradle',
    name: "Newton's Cradle",
    category: "Newton's Laws",
    level: 'Undergrad I',
    description: 'Conservation of momentum and kinetic energy through elastic collisions.',
    concepts: ['Conservation of Momentum', 'Elastic Collision', 'Impulse'],
    formulas: ['p = mv', 'Δp = FΔt', 'e = 1 (elastic)'],
    parameters: [
      // Gravity must be ON for bobs to hang and swing correctly
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 2, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult("Newton's Cradle");
      const NUM = 5;
      const RADIUS = 24;
      // SPACING must equal exactly 2*RADIUS so bobs are touching at rest
      const SPACING = RADIUS * 2;
      const ropeLen = 210;
      const pivotY = height * 0.18;
      const startX = width / 2 - ((NUM - 1) * SPACING) / 2;

      // Bobs use a dedicated collision category so they only hit each other,
      // not the walls, ceiling or any other experiment body.
      const BOB_CAT = 0x0004;
      const BOB_MASK = 0x0004;

      for (let i = 0; i < NUM; i++) {
        const bx = startX + i * SPACING;
        const by = pivotY + ropeLen;

        const pivot = Matter.Bodies.circle(bx, pivotY, 5, {
          isStatic: true,
          render: { fillStyle: '#6b7280' },
          collisionFilter: { mask: 0 },
          label: `P${i}`,
        });
        const bob = Matter.Bodies.circle(bx, by, RADIUS, {
          restitution: 0.999,   // near-perfect elasticity
          friction: 0,
          frictionAir: 0.0003, // very low damping — cradle should swing many times
          mass: 1,
          // slop = 0 gives tightest contact resolution
          slop: 0.01,
          render: { fillStyle: '#94a3b8', strokeStyle: '#cbd5e1', lineWidth: 2 },
          collisionFilter: { category: BOB_CAT, mask: BOB_MASK },
          label: `Bob${i + 1}`,
        });
        const string = Matter.Constraint.create({
          bodyA: pivot,
          bodyB: bob,
          length: ropeLen,
          stiffness: 1,   // fully rigid string
          damping: 0,
          render: { strokeStyle: '#71717a', lineWidth: 1.5, visible: true },
        });
        res.bodies.push(pivot, bob);
        res.constraints.push(string);
      }

      // Pull Bob1 back 30° — enough for a clear demonstration without chaos
      const SWING_ANGLE = Math.PI / 6; // 30°
      const leftBob = res.bodies.find(b => b.label === 'Bob1');
      if (leftBob) {
        const pivot0x = startX;
        Matter.Body.setPosition(leftBob, {
          x: pivot0x - ropeLen * Math.sin(SWING_ANGLE),
          y: pivotY  + ropeLen * Math.cos(SWING_ANGLE),
        });
        // Give it zero initial velocity — gravity will accelerate it naturally
        Matter.Body.setVelocity(leftBob, { x: 0, y: 0 });
      }
      return res;
    },
  },

  {
    id: 'elastic-collision',
    name: 'Elastic & Inelastic Collisions',
    category: "Newton's Laws",
    level: 'Undergrad I',
    description: 'Two-body collision demonstrating momentum conservation and energy changes.',
    concepts: ['Conservation of Momentum', 'Coefficient of Restitution', 'KE Transfer'],
    formulas: ["p_before = p_after", 'v₁′ = (m₁−m₂)v₁/(m₁+m₂)', 'v₂′ = 2m₁v₁/(m₁+m₂)'],
    parameters: [
      { key: 'massA', label: 'Ball A Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 3, target: { type: 'mass', label: 'Ball A' } },
      { key: 'massB', label: 'Ball B Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 1, target: { type: 'mass', label: 'Ball B' } },
      { key: 'vA', label: 'Ball A Velocity', min: 0, max: 12, step: 0.5, default: 6, target: { type: 'velocityX', label: 'Ball A' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult('Elastic & Inelastic Collisions');
      // Place balls sitting ON the ground surface so they collide horizontally,
      // not while falling. Ground surface is at height - 10.
      const groundY = height - 10;
      const r1 = 32, r2 = 24;
      const cy1 = groundY - r1;  // ball centres rest on ground
      const cy2 = groundY - r2;

      // Frictionless track: use a thin invisible rail so balls slide without sinking
      const rail = Matter.Bodies.rectangle(width / 2, groundY + 2, width, 4, {
        isStatic: true, friction: 0, restitution: 0,
        render: { fillStyle: '#27272a' }, label: 'Rail',
        collisionFilter: { category: 0x0001, mask: 0x0001 },
      });

      const ball1 = Matter.Bodies.circle(width * 0.22, cy1, r1, {
        mass: 3, restitution: 0.95, friction: 0, frictionAir: 0.001,
        collisionFilter: { category: 0x0001, mask: 0x0001 },
        render: { fillStyle: '#3b82f6' }, label: 'Ball A',
      });
      Matter.Body.setVelocity(ball1, { x: 6, y: 0 });
      // Lock vertical motion for a clean 1-D demonstration
      Matter.Body.setInertia(ball1, Infinity);

      const ball2 = Matter.Bodies.circle(width * 0.52, cy2, r2, {
        mass: 1, restitution: 0.95, friction: 0, frictionAir: 0.001,
        collisionFilter: { category: 0x0001, mask: 0x0001 },
        render: { fillStyle: '#ef4444' }, label: 'Ball B',
      });
      Matter.Body.setInertia(ball2, Infinity);

      const ball3 = Matter.Bodies.circle(width * 0.66, cy2, r2, {
        mass: 1, restitution: 0.05, friction: 0, frictionAir: 0.001,
        collisionFilter: { category: 0x0001, mask: 0x0001 },
        render: { fillStyle: '#f59e0b' }, label: 'Ball C (inelastic)',
      });
      Matter.Body.setVelocity(ball3, { x: -2.5, y: 0 });
      Matter.Body.setInertia(ball3, Infinity);

      res.labels.set(ball1.id, 'm = 3 kg  →  v = 6');
      res.labels.set(ball2.id, 'm = 1 kg  (e≈1)');
      res.labels.set(ball3.id, 'm = 1 kg ←  (e≈0)');
      res.bodies.push(rail, ball1, ball2, ball3);
      return res;
    },
  },

  // ── PROJECTILE MOTION ─────────────────────────────────────────────────────
  {
    id: 'projectile-motion',
    name: 'Projectile Motion',
    category: "Newton's Laws",
    level: 'Undergrad I',
    description: 'Launch a projectile at an adjustable angle. The complementary angle (90°−θ) lands at the same range, demonstrating R = v₀²sin(2θ)/g.',
    concepts: ['Kinematics', 'Parabolic Trajectory', 'Range Formula', 'Independence of Axes'],
    formulas: ['x(t) = v₀cosθ·t', 'y(t) = v₀sinθ·t − ½gt²', 'R = v₀²sin(2θ)/g', 'H_max = v₀²sin²θ/(2g)'],
    parameters: [
      { key: 'angle', label: 'Launch Angle θ (°)', min: 5, max: 85, step: 5, default: 45 },
      { key: 'speed', label: 'Launch Speed v₀',    min: 3, max: 20, step: 1, default: 12 },
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Projectile Motion');
      const launchX  = 80;
      const groundY  = height - 10;
      const angleDeg = params?.angle ?? 45;
      const speed    = params?.speed  ?? 12;
      const angleRad = (angleDeg * Math.PI) / 180;

      // Static cannon body (purely decorative)
      const cannon = Matter.Bodies.rectangle(launchX - 5, groundY - 7, 38, 14, {
        isStatic: true, render: { fillStyle: '#374151' }, label: 'Cannon',
        collisionFilter: { mask: 0 },
      });

      // Primary projectile at chosen angle
      const proj = Matter.Bodies.circle(launchX, groundY - 26, 11, {
        mass: 0.5, restitution: 0.45, friction: 0.04, frictionAir: 0.001,
        render: { fillStyle: '#ef4444' }, label: 'Projectile',
        collisionFilter: { category: 0x0001, mask: 0x0001 },
      });
      Matter.Body.setVelocity(proj, {
        x:  speed * Math.cos(angleRad),
        y: -speed * Math.sin(angleRad),  // negative y = upward in canvas coords
      });

      // Complementary-angle projectile — same range, different trajectory height
      const comp    = 90 - angleDeg;
      const compRad = (comp * Math.PI) / 180;
      const proj2 = Matter.Bodies.circle(launchX, groundY - 26, 9, {
        mass: 0.3, restitution: 0.45, friction: 0.04, frictionAir: 0.001,
        render: { fillStyle: '#a855f7' }, label: 'Projectile 2',
        collisionFilter: { category: 0x0001, mask: 0x0001 },
      });
      Matter.Body.setVelocity(proj2, {
        x:  speed * Math.cos(compRad),
        y: -speed * Math.sin(compRad),
      });

      res.labels.set(proj.id,  `θ = ${angleDeg}°   v₀ = ${speed}`);
      res.labels.set(proj2.id, `θ = ${comp}° (complementary)`);
      res.bodies.push(cannon, proj, proj2);
      return res;
    },
  },

  // ── FREE FALL & TERMINAL VELOCITY ─────────────────────────────────────────
  {
    id: 'terminal-velocity',
    name: 'Free Fall & Terminal Velocity',
    category: "Newton's Laws",
    level: 'Undergrad I',
    description: 'Three identical masses dropped with different air resistance. Compare free-fall to terminal-velocity limited descent: v_t = mg/b.',
    concepts: ['Drag Force', 'Terminal Velocity', 'Net Force', 'Force Balance'],
    formulas: ['F_drag = bv', 'v_terminal = mg/b', 'ma = mg − bv', 'At terminal: a = 0'],
    parameters: [
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult('Free Fall & Terminal Velocity');
      const topY = 72;
      const MASS = 1.5;
      const configs = [
        { label: 'Ball A (high drag)', color: '#3b82f6', x: width * 0.25, b: 0.05   },
        { label: 'Ball B (med drag)',  color: '#10b981', x: width * 0.50, b: 0.010  },
        { label: 'Ball C (no drag)',   color: '#ef4444', x: width * 0.75, b: 0.0002 },
      ];
      configs.forEach(cfg => {
        const ball = Matter.Bodies.circle(cfg.x, topY, 20, {
          mass: MASS, frictionAir: cfg.b, friction: 0, restitution: 0.3,
          render: { fillStyle: cfg.color }, label: cfg.label,
          collisionFilter: { category: 0x0001, mask: 0x0001 },
        });
        // v_terminal (canvas px/frame) = m × g_scale / b  (g_scale = 0.001)
        const vt = cfg.b > 0.001 ? (MASS * 0.001 / cfg.b).toFixed(2) : '∞';
        res.labels.set(ball.id, `b = ${cfg.b}   v_t ≈ ${vt}`);
        res.bodies.push(ball);
      });
      return res;
    },
  },

  // ── OSCILLATIONS & SHM ─────────────────────────────────────────────────────
  {
    id: 'spring-mass-vertical',
    name: 'Spring–Mass (Vertical)',
    category: 'Oscillations & SHM',
    level: 'Undergrad I',
    description: 'Simple harmonic motion of a mass hanging from a spring. Measure period T and spring constant k.',
    concepts: ["Hooke's Law", 'SHM', 'Restoring Force', 'Resonant Frequency'],
    formulas: ['F = −kx', 'T = 2π√(m/k)', 'ω₀ = √(k/m)', 'E = ½kx²'],
    parameters: [
      { key: 'mass', label: 'Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 2, target: { type: 'mass', label: 'Mass m' } },
      { key: 'k', label: 'Spring k (N/m)', min: 20, max: 400, step: 10, default: 80 },
      { key: 'damping', label: 'Damping', min: 0, max: 30, step: 1, default: 10 },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Spring–Mass (Vertical)');
      const cx = width / 2;
      const anchorY = 80;
      const natLen = 140;
      const k = params.k ?? 80;
      const m = params.mass ?? 2;
      const damp = params.damping ?? 10;

      const anchor = Matter.Bodies.rectangle(cx, anchorY - 18, 90, 22, {
        isStatic: true, label: 'Fixed Support',
        render: { fillStyle: '#374151' }, collisionFilter: { mask: 0 },
      });

      // Equilibrium extension: where spring force = gravity (SPRING_K_SCALE = 1e-6)
      // ext_eq = m × g_sim / k_sim = m × 0.001 / (k × 1e-6) = m × 1000 / k
      // Capped at 160 px so heavy/soft combos stay on screen.
      const ext_eq = Math.min(m * 1000 / k, 160);
      const amplitude = 50; // initial displacement below equilibrium → clear SHM
      const massY = Math.min(anchorY + natLen + ext_eq + amplitude, height - 60);

      // frictionAir calibrated so ζ = damping/(2ω_sim) stays underdamped (< 1).
      // Old formula (damp*0.005) → ζ ≈ 4 at default k=80,m=2 → overdamped (no oscillation).
      // New: frictionAir = damp * 0.0002 → ζ ≈ 0.15 → clearly underdamped SHM.
      const omegaSim = Math.sqrt(k * 1e-6 / Math.max(m, 0.1));
      const mass = Matter.Bodies.circle(cx, massY, 30, {
        mass: m,
        frictionAir: Math.max(damp * 2.0 * omegaSim, 0.0002),
        friction: 0,
        render: { fillStyle: '#a855f7' }, label: 'Mass m',
        collisionFilter: { category: 0x0001, mask: 0 }, // isolated — spring handles all force
      });

      // Constraint stiffness is near-zero: explicit Hooke's Law force (in beforeUpdate)
      // does all the physics. The constraint only defines the attachment geometry.
      const spring = Matter.Constraint.create({
        bodyA: anchor, pointA: { x: 0, y: 11 },
        bodyB: mass,  pointB: { x: 0, y: 0 },
        length: natLen,
        stiffness: 0.00001, // near-zero — explicit force dominates
        damping: 0,
        render: { visible: false },
      });

      res.labels.set(mass.id, `m = ${m} kg   k = ${k} N/m`);
      res.bodies.push(anchor, mass);
      res.constraints.push(spring);
      res.springInfos.push({ constraint: spring, k, naturalLength: natLen, color: '#a855f7' });
      return res;
    },
  },

  {
    id: 'spring-mass-horizontal',
    name: 'Spring–Mass (Horizontal)',
    category: 'Oscillations & SHM',
    level: 'Undergrad I',
    description: 'Horizontal spring-mass system on a frictionless surface. Phase space (x,v) is an ellipse.',
    concepts: ['SHM', 'Phase Space', 'Energy Conservation', 'Equilibrium Position'],
    formulas: ['x(t) = A cos(ω₀t + φ)', 'E = ½mv² + ½kx²', 'ω₀ = √(k/m)'],
    parameters: [
      { key: 'mass', label: 'Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 3, target: { type: 'mass', label: 'Mass m' } },
      { key: 'k', label: 'Spring k (N/m)', min: 20, max: 400, step: 10, default: 80 },
      { key: 'damping', label: 'Damping', min: 0, max: 30, step: 1, default: 10 },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Spring–Mass (Horizontal)');
      const wallX = 60;
      const natLen = 160;
      const k = params.k;
      const mHalf = 28; // half of 56 px body height

      // The track y — fixed horizontal level the mass oscillates along.
      // We use height*0.72 so there is empty space above and below to see clearly.
      const trackY = height * 0.72;

      const wall = Matter.Bodies.rectangle(wallX, trackY, 20, mHalf * 2 + 20, {
        isStatic: true, label: 'Wall', render: { fillStyle: '#374151' },
        collisionFilter: { mask: 0 },
      });

      // Equilibrium position + 60 px initial displacement (triggers SHM immediately)
      const eqX = wallX + 10 + natLen + mHalf;
      const kHoriz = params.k ?? 80;
      const mHoriz = params.mass ?? 3;
      const omegaSimH = Math.sqrt(kHoriz * 1e-6 / Math.max(mHoriz, 0.1));
      const mass = Matter.Bodies.rectangle(eqX + 60, trackY, mHalf * 2, mHalf * 2, {
        mass: mHoriz,
        friction: 0, frictionStatic: 0,
        frictionAir: Math.max((params.damping ?? 10) * 2.0 * omegaSimH, 0.0002),
        render: { fillStyle: '#22d3ee' }, label: 'Mass m',
        // Isolated — y is locked by customUpdate, not by collision
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      // No rotation — pure 1-D SHM
      Matter.Body.setInertia(mass, Infinity);

      const spring = Matter.Constraint.create({
        bodyA: wall, pointA: { x: 10, y: 0 },
        bodyB: mass, pointB: { x: -mHalf, y: 0 },
        length: natLen,
        stiffness: 0.00001, // near-zero: explicit Hooke force (beforeUpdate) handles all physics
        damping: 0,
        render: { visible: false },
      });

      // HORIZONTAL TRACK LOCK: anti-gravity + zero y-velocity every tick.
      // Simulates a perfectly frictionless, massless horizontal rail.
      // Without this, gravity would pull the mass off the horizontal axis.
      res.customUpdate = (eng) => {
        const gSim = (eng?.gravity?.y ?? 1) * (eng?.gravity?.scale ?? 0.001);
        Matter.Body.applyForce(mass, mass.position, { x: 0, y: -mass.mass * gSim });
        Matter.Body.setVelocity(mass, { x: mass.velocity.x, y: 0 });
      };

      res.labels.set(mass.id, `m = ${params.mass ?? 3} kg   k = ${k} N/m`);
      res.bodies.push(wall, mass);
      res.constraints.push(spring);
      res.springInfos.push({ constraint: spring, k, naturalLength: natLen, color: '#22d3ee' });
      return res;
    },
  },

  {
    id: 'simple-pendulum',
    name: 'Simple Pendulum',
    category: 'Oscillations & SHM',
    level: 'Undergrad I',
    description: 'Point-mass pendulum. Verify T = 2π√(L/g) for small angles.',
    concepts: ['SHM (small angle)', 'Restoring Torque', 'Period vs Length', 'Energy Exchange'],
    formulas: ['T = 2π√(L/g)', 'θ(t) ≈ θ₀ cos(ωt)', 'ω = √(g/L)'],
    parameters: [
      { key: 'bobMass', label: 'Bob Mass (kg)', min: 0.2, max: 10, step: 0.1, default: 1.5, target: { type: 'mass', label: 'Bob' } },
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult('Simple Pendulum');
      const cx = width / 2;
      const pivotY = 80;
      const L = 220;

      const pivot = Matter.Bodies.circle(cx, pivotY, 8, {
        isStatic: true, render: { fillStyle: '#6b7280' },
        collisionFilter: { mask: 0 }, label: 'Pivot',
      });
      // Initial angle 25° — visibly displaced without going chaotic
      const initAngle = Math.PI / 7.2; // ~25°
      const bob = Matter.Bodies.circle(
        cx + L * Math.sin(initAngle),
        pivotY + L * Math.cos(initAngle), 22, {
          mass: 1.5, frictionAir: 0.001, friction: 0, restitution: 0,
          render: { fillStyle: '#f59e0b' }, label: 'Bob',
          collisionFilter: { category: 0x0001, mask: 0 }, // isolated — no wall hits
        }
      );
      Matter.Body.setVelocity(bob, { x: 0, y: 0 });
      const string = Matter.Constraint.create({
        bodyA: pivot, bodyB: bob, length: L, stiffness: 1, damping: 0,
        render: { strokeStyle: '#a1a1aa', lineWidth: 2, visible: true },
      });

      res.labels.set(bob.id, `m = 1.5 kg, L = ${L} px`);
      res.bodies.push(pivot, bob);
      res.constraints.push(string);
      return res;
    },
  },

  {
    id: 'coupled-oscillators',
    name: 'Coupled Spring Oscillators',
    category: 'Oscillations & SHM',
    level: 'Undergrad II',
    description: 'Two masses coupled by a middle spring. Observe normal modes: symmetric and anti-symmetric.',
    concepts: ['Normal Modes', 'Coupling', 'Superposition', 'Beating Phenomenon'],
    formulas: ['ω₁ = √(k/m)', 'ω₂ = √((k + 2kc)/m)', 'x = A₁ + A₂'],
    parameters: [
      { key: 'm1', label: 'Mass 1 (kg)', min: 0.5, max: 8, step: 0.5, default: 2, target: { type: 'mass', label: 'Mass 1' } },
      { key: 'm2', label: 'Mass 2 (kg)', min: 0.5, max: 8, step: 0.5, default: 2, target: { type: 'mass', label: 'Mass 2' } },
      { key: 'k', label: 'Spring k', min: 20, max: 300, step: 10, default: 80 },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Coupled Spring Oscillators');
      const wallX = 40;
      const wallX2 = width - 40;
      const k = params.k ?? 80;
      const kc = k * 0.5;
      const DAMP = params.damping ?? 4;

      // All anchors and masses share the SAME y = trackY for purely horizontal SHM
      const trackY = height * 0.52; // vertically centred for good visibility

      const wall1 = Matter.Bodies.rectangle(wallX, trackY, 22, 80, {
        isStatic: true, render: { fillStyle: '#374151' }, collisionFilter: { mask: 0 }, label: 'Wall L',
      });
      const wall2 = Matter.Bodies.rectangle(wallX2, trackY, 22, 80, {
        isStatic: true, render: { fillStyle: '#374151' }, collisionFilter: { mask: 0 }, label: 'Wall R',
      });

      const m1x = width * 0.28;
      const m2x = width * 0.72;
      const mHalf = 26; // half of 52 px body

      const omegaSimC = Math.sqrt(k * 1e-6 / Math.max(params.m1 ?? 2, 0.1));
      const frictionAirC = Math.max(DAMP * 2.0 * omegaSimC, 0.0002);
      const m1 = Matter.Bodies.rectangle(m1x + 60, trackY, mHalf * 2, mHalf * 2, {
        mass: params.m1 ?? 2, frictionAir: frictionAirC, friction: 0,
        render: { fillStyle: '#3b82f6' }, label: 'Mass 1',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const omegaSimC2 = Math.sqrt(k * 1e-6 / Math.max(params.m2 ?? 2, 0.1));
      const m2 = Matter.Bodies.rectangle(m2x, trackY, mHalf * 2, mHalf * 2, {
        mass: params.m2 ?? 2, frictionAir: Math.max(DAMP * 2.0 * omegaSimC2, 0.0002), friction: 0,
        render: { fillStyle: '#ef4444' }, label: 'Mass 2',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      Matter.Body.setInertia(m1, Infinity);
      Matter.Body.setInertia(m2, Infinity);

      // Natural lengths measured from equilibrium positions
      const natLen1 = (m1x - wallX) - mHalf - 10;
      const natLenC = (m2x - m1x) - mHalf * 2;
      const natLen2 = (wallX2 - m2x) - mHalf - 10;

      const spring1 = Matter.Constraint.create({
        bodyA: wall1, pointA: { x: 10, y: 0 },
        bodyB: m1, pointB: { x: -mHalf, y: 0 },
        length: Math.max(natLen1, 20),
        stiffness: 0.00001, damping: 0, render: { visible: false },
      });
      const springC = Matter.Constraint.create({
        bodyA: m1, pointA: { x: mHalf, y: 0 },
        bodyB: m2, pointB: { x: -mHalf, y: 0 },
        length: Math.max(natLenC, 20),
        stiffness: 0.00001, damping: 0, render: { visible: false },
      });
      const spring2 = Matter.Constraint.create({
        bodyA: m2, pointA: { x: mHalf, y: 0 },
        bodyB: wall2, pointB: { x: -10, y: 0 },
        length: Math.max(natLen2, 20),
        stiffness: 0.00001, damping: 0, render: { visible: false },
      });

      // HORIZONTAL TRACK LOCK: anti-gravity + zero y-velocity for each mass.
      res.customUpdate = (eng) => {
        const gSim = (eng?.gravity?.y ?? 1) * (eng?.gravity?.scale ?? 0.001);
        Matter.Body.applyForce(m1, m1.position, { x: 0, y: -m1.mass * gSim });
        Matter.Body.setVelocity(m1, { x: m1.velocity.x, y: 0 });
        Matter.Body.applyForce(m2, m2.position, { x: 0, y: -m2.mass * gSim });
        Matter.Body.setVelocity(m2, { x: m2.velocity.x, y: 0 });
      };

      res.labels.set(m1.id, `m₁ = ${params.m1 ?? 2} kg`);
      res.labels.set(m2.id, `m₂ = ${params.m2 ?? 2} kg`);
      res.bodies.push(wall1, wall2, m1, m2);
      res.constraints.push(spring1, springC, spring2);
      res.springInfos.push(
        { constraint: spring1, k, naturalLength: Math.max(natLen1, 20), color: '#22d3ee' },
        { constraint: springC, k: kc, naturalLength: Math.max(natLenC, 20), color: '#a855f7' },
        { constraint: spring2, k, naturalLength: Math.max(natLen2, 20), color: '#22d3ee' }
      );
      return res;
    },
  },

  // ── ROTATIONAL MOTION ──────────────────────────────────────────────────────
  {
    id: 'compound-pendulum',
    name: 'Compound Pendulum (Physical)',
    category: 'Rotational Motion',
    level: 'Undergrad II',
    description: 'A rigid rod pivoted at one end. I = mL²/3, and T = 2π√(2L/3g).',
    concepts: ['Moment of Inertia', 'Angular SHM', 'Radius of Gyration', 'Physical vs Simple'],
    formulas: ['I = mL²/3 (end pivot)', 'T = 2π√(2L/3g)', 'τ = −mgd·sin θ'],
    parameters: [
      { key: 'rodMass', label: 'Rod Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 3, target: { type: 'mass', label: 'Rod' } },
      { key: 'tipMass', label: 'Tip Mass (kg)', min: 0, max: 5, step: 0.1, default: 1.5, target: { type: 'mass', label: 'Tip Mass' } },
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Compound Pendulum (Physical)');
      const cx = width / 2;
      const pivotY = 90;

      const pivot = Matter.Bodies.circle(cx, pivotY, 8, {
        isStatic: true, render: { fillStyle: '#6b7280' },
        collisionFilter: { mask: 0 }, label: 'Pivot',
      });

      const rodLen = 260, rodW = 14;
      const initAngle = Math.PI / 5; // 36° — good for clear oscillation
      const rod = Matter.Bodies.rectangle(
        cx + (rodLen / 2) * Math.sin(initAngle),
        pivotY + (rodLen / 2) * Math.cos(initAngle),
        rodW, rodLen, {
          mass: (params?.rodMass) ?? 3, frictionAir: 0.001, friction: 0,
          render: { fillStyle: '#78716c', strokeStyle: '#a8a29e', lineWidth: 1 },
          label: 'Rod', collisionFilter: { category: 0x0001, mask: 0 },
        });
      Matter.Body.setAngle(rod, initAngle);

      const hinge = Matter.Constraint.create({
        pointA: { x: cx, y: pivotY }, bodyB: rod, pointB: { x: 0, y: -rodLen / 2 },
        length: 0, stiffness: 1, render: { visible: false },
      });

      const bob = Matter.Bodies.circle(
        cx + rodLen * Math.sin(initAngle),
        pivotY + rodLen * Math.cos(initAngle), 16, {
          mass: (params?.tipMass) ?? 1.5, frictionAir: 0.001,
          render: { fillStyle: '#f59e0b' }, label: 'Tip Mass',
          collisionFilter: { category: 0x0001, mask: 0 },
        }
      );
      const rodTip = Matter.Constraint.create({
        bodyA: rod, pointA: { x: 0, y: rodLen / 2 },
        bodyB: bob, pointB: { x: 0, y: 0 },
        length: 0, stiffness: 1, render: { visible: false },
      });

      res.labels.set(rod.id, 'Rod (3 kg)');
      res.labels.set(bob.id, 'Tip (1.5 kg)');
      res.bodies.push(pivot, rod, bob);
      res.constraints.push(hinge, rodTip);
      return res;
    },
  },

  {
    id: 'rotating-disk-motor',
    name: 'Motorised Rotating Disk',
    category: 'Rotational Motion',
    level: 'Undergrad II',
    description: 'A disk driven by a motor. Observe angular velocity, centripetal effects, and attached masses.',
    concepts: ['Angular Velocity', 'Moment of Inertia (disk)', 'Centripetal Acceleration', 'Torque'],
    formulas: ['I = ½mR²', 'τ = Iα', 'a_c = ω²R', 'L = Iω'],
    parameters: [
      { key: 'diskMass', label: 'Disk Mass (kg)', min: 1, max: 15, step: 0.5, default: 4, target: { type: 'mass', label: 'Disk' } },
      { key: 'gravity', label: 'Gravity g', min: 0, max: 2, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Motorised Rotating Disk');
      const cx = width / 2, cy = height / 2 - 30, R = 85;

      const axle = Matter.Bodies.circle(cx, cy, 10, {
        isStatic: true, render: { fillStyle: '#6b7280' },
        collisionFilter: { mask: 0 }, label: 'Axle',
      });
      const disk = Matter.Bodies.circle(cx, cy, R, {
        mass: params.diskMass ?? 4, frictionAir: 0.002,
        render: { fillStyle: '#1e293b', strokeStyle: '#3b82f6', lineWidth: 3 },
        label: 'Disk', collisionFilter: { category: 0x0001, mask: 0 },
      });
      const pin = Matter.Constraint.create({
        pointA: { x: cx, y: cy }, bodyB: disk, pointB: { x: 0, y: 0 },
        length: 0, stiffness: 1, render: { visible: false },
      });

      const massA = Matter.Bodies.circle(cx + R * 0.7, cy, 14, {
        mass: 0.8, frictionAir: 0.002,
        render: { fillStyle: '#ef4444' }, label: 'Eccentric A',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const linkA = Matter.Constraint.create({
        bodyA: disk, pointA: { x: R * 0.7, y: 0 }, bodyB: massA,
        length: 0, stiffness: 1, render: { visible: false },
      });

      const massB = Matter.Bodies.circle(cx - R * 0.7, cy, 14, {
        mass: 0.8, frictionAir: 0.002,
        render: { fillStyle: '#22d3ee' }, label: 'Eccentric B',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const linkB = Matter.Constraint.create({
        bodyA: disk, pointA: { x: -R * 0.7, y: 0 }, bodyB: massB,
        length: 0, stiffness: 1, render: { visible: false },
      });

      res.labels.set(disk.id, `Disk (${params.diskMass ?? 4} kg)`);
      res.labels.set(massA.id, '0.8 kg');
      res.labels.set(massB.id, '0.8 kg');
      res.bodies.push(axle, disk, massA, massB);
      res.constraints.push(pin, linkA, linkB);
      // ω = 0.025 rad/frame ≈ 90°/s — visible but not frantic
      res.motors.push({ body: disk, angularSpeed: 0.025 });
      return res;
    },
  },

  {
    id: 'double-pendulum',
    name: 'Double Pendulum (Chaotic)',
    category: 'Rotational Motion',
    level: 'Undergrad II',
    description: 'Two-link pendulum exhibiting deterministic chaos. Extreme sensitivity to initial conditions.',
    concepts: ['Chaos Theory', 'Lyapunov Exponent', 'Coupled Oscillators', 'Non-linearity'],
    formulas: ['L = T − V', 'θ̈₁ ≈ complex (Lagrangian)', 'Δx(t) ∝ e^{λt}'],
    parameters: [
      { key: 'bob1Mass', label: 'Bob 1 Mass (kg)', min: 0.5, max: 8, step: 0.5, default: 2, target: { type: 'mass', label: 'Bob 1' } },
      { key: 'bob2Mass', label: 'Bob 2 Mass (kg)', min: 0.5, max: 8, step: 0.5, default: 1.5, target: { type: 'mass', label: 'Bob 2' } },
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Double Pendulum (Chaotic)');
      const cx = width / 2, pivotY = 90, L1 = 140, L2 = 120;

      const pivot = Matter.Bodies.circle(cx, pivotY, 8, {
        isStatic: true, render: { fillStyle: '#6b7280' },
        collisionFilter: { mask: 0 }, label: 'Pivot',
      });
      const bob1 = Matter.Bodies.circle(cx + L1 * 0.5, pivotY + L1 * 0.866, 20, {
        mass: params.bob1Mass ?? 2, frictionAir: 0.0005, friction: 0,
        render: { fillStyle: '#3b82f6' }, label: 'Bob 1',
        // No collisions with anything — pure constraint-driven chaotic motion
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const bob2 = Matter.Bodies.circle(cx + L1 * 0.5, pivotY + L1 * 0.866 + L2, 16, {
        mass: params.bob2Mass ?? 1.5, frictionAir: 0.0005, friction: 0,
        render: { fillStyle: '#ef4444' }, label: 'Bob 2',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const str1 = Matter.Constraint.create({
        bodyA: pivot, bodyB: bob1, length: L1, stiffness: 1, damping: 0,
        render: { strokeStyle: '#a1a1aa', lineWidth: 2, visible: true },
      });
      const str2 = Matter.Constraint.create({
        bodyA: bob1, bodyB: bob2, length: L2, stiffness: 1, damping: 0,
        render: { strokeStyle: '#71717a', lineWidth: 2, visible: true },
      });

      res.labels.set(bob1.id, 'Bob 1 (2 kg)');
      res.labels.set(bob2.id, 'Bob 2 (1.5 kg)');
      res.bodies.push(pivot, bob1, bob2);
      res.constraints.push(str1, str2);
      return res;
    },
  },

  // ── ADVANCED SYSTEMS ──────────────────────────────────────────────────────
  {
    id: 'pulley-spring-system',
    name: 'Pulley & Spring System',
    category: 'Advanced Systems',
    level: 'Undergrad II',
    description: 'Mass on spring balanced against an Atwood mass via a rope over a pulley.',
    concepts: ['Constraint Forces', 'Spring Equilibrium', 'Mechanical Advantage', 'Static Equilibrium'],
    formulas: ['kx = m₂g − m₁g', 'Equilibrium: T = kx₀', 'F_net = m₁a + m₂a'],
    parameters: [
      { key: 'hangMass', label: 'Hanging Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 3, target: { type: 'mass', label: 'Hanging Mass' } },
      { key: 'springMass', label: 'Spring Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 2, target: { type: 'mass', label: 'Spring Mass' } },
      { key: 'k', label: 'Spring k', min: 20, max: 400, step: 10, default: 80 },
    ],
    setup(_engine, width, height, params) {
      const res = makeEmptyResult('Pulley & Spring System');
      const cx = width * 0.55, pulleyY = 85, k = params.k;

      const pulley = Matter.Bodies.circle(cx, pulleyY, 25, {
        isStatic: true, render: { fillStyle: '#374151', strokeStyle: '#6b7280', lineWidth: 3 },
        collisionFilter: { mask: 0 }, label: 'Pulley',
      });
      const wallLeft = Matter.Bodies.rectangle(80, height * 0.4, 20, 100, {
        isStatic: true, render: { fillStyle: '#374151' }, collisionFilter: { mask: 0 }, label: 'Wall',
      });
      const hangingMass = Matter.Bodies.rectangle(cx + 65, pulleyY + 170, 50, 60, {
        mass: 3, friction: 0, frictionAir: 0.002,
        render: { fillStyle: '#ef4444' }, label: 'Hanging Mass',
        inertia: Infinity,
        collisionFilter: { category: 0x0001, mask: 0x0001 },
      });
      const springMass = Matter.Bodies.rectangle(290, height * 0.4, 52, 52, {
        mass: 2, friction: 0.05, frictionAir: 0.002,
        render: { fillStyle: '#3b82f6' }, label: 'Spring Mass',
        inertia: Infinity,
        collisionFilter: { category: 0x0001, mask: 0x0001 },
      });
      Matter.Body.setInertia(hangingMass, Infinity);
      Matter.Body.setInertia(springMass, Infinity);
      const spring = Matter.Constraint.create({
        bodyA: wallLeft, pointA: { x: 10, y: 0 },
        bodyB: springMass, pointB: { x: -26, y: 0 },
        length: 200,
        stiffness: 0.00001, // explicit Hooke force in beforeUpdate handles this spring
        damping: 0,
        render: { visible: false },
      });
      const rope1 = Matter.Constraint.create({
        bodyA: springMass, pointA: { x: 26, y: 0 },
        bodyB: pulley, pointB: { x: 0, y: 0 },
        length: cx - 26 - 290 - 26, stiffness: 0.9,
        render: { strokeStyle: '#d4d4d8', lineWidth: 2, visible: true },
      });
      const rope2 = Matter.Constraint.create({
        bodyA: pulley, pointA: { x: 0, y: 0 },
        bodyB: hangingMass, pointB: { x: 0, y: -30 },
        length: 120, stiffness: 0.9,
        render: { strokeStyle: '#d4d4d8', lineWidth: 2, visible: true },
      });

      res.labels.set(hangingMass.id, `m₂ = 3 kg`);
      res.labels.set(springMass.id, `m₁ = 2 kg`);
      res.bodies.push(pulley, wallLeft, hangingMass, springMass);
      res.constraints.push(spring, rope1, rope2);
      res.springInfos.push({ constraint: spring, k, naturalLength: 200, color: '#22d3ee' });
      return res;
    },
  },

  {
    id: 'bifilar-pendulum',
    name: 'Bifilar Torsional Pendulum',
    category: 'Advanced Systems',
    level: 'Undergrad II',
    description: 'A rod suspended by two parallel strings — exhibits torsional oscillation and measures rotational inertia.',
    concepts: ['Moment of Inertia', 'Torsional Restoring Force', 'SHM in Rotation', 'Parallel Axis Theorem'],
    formulas: ['T = 2π√(IL²/mgd²)', 'I_rod = mL²/12', 'τ = −κθ'],
    parameters: [
      { key: 'barMass', label: 'Bar Mass (kg)', min: 0.5, max: 10, step: 0.5, default: 2.5, target: { type: 'mass', label: 'Bar' } },
      { key: 'gravity', label: 'Gravity g', min: 0.1, max: 3, step: 0.1, default: 1, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult('Bifilar Torsional Pendulum');
      const cx = width / 2, pivotY = 80, L_string = 180, sep = 120;

      const pivotL = Matter.Bodies.circle(cx - sep / 2, pivotY, 7, {
        isStatic: true, render: { fillStyle: '#6b7280' }, collisionFilter: { mask: 0 }, label: 'PL',
      });
      const pivotR = Matter.Bodies.circle(cx + sep / 2, pivotY, 7, {
        isStatic: true, render: { fillStyle: '#6b7280' }, collisionFilter: { mask: 0 }, label: 'PR',
      });
      const bar = Matter.Bodies.rectangle(cx, pivotY + L_string, 200, 18, {
        mass: 2.5, frictionAir: 0.003,
        render: { fillStyle: '#78716c', strokeStyle: '#a8a29e', lineWidth: 1 },
        label: 'Bar', collisionFilter: { category: 0x0001, mask: 0 },
      });
      Matter.Body.setAngle(bar, 0.18);

      const sL = Matter.Constraint.create({
        bodyA: pivotL, bodyB: bar, pointB: { x: -80, y: -6 },
        length: L_string, stiffness: 1, damping: 0,
        render: { strokeStyle: '#a1a1aa', lineWidth: 1.5, visible: true },
      });
      const sR = Matter.Constraint.create({
        bodyA: pivotR, bodyB: bar, pointB: { x: 80, y: -6 },
        length: L_string, stiffness: 1, damping: 0,
        render: { strokeStyle: '#a1a1aa', lineWidth: 1.5, visible: true },
      });

      const mL = Matter.Bodies.circle(cx - 90, pivotY + L_string + 25, 18, {
        mass: 0.8, frictionAir: 0.003,
        render: { fillStyle: '#3b82f6' }, label: 'Mass L',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const cL = Matter.Constraint.create({
        bodyA: bar, pointA: { x: -80, y: 6 },
        bodyB: mL, length: 0, stiffness: 1, render: { visible: false },
      });
      const mR = Matter.Bodies.circle(cx + 90, pivotY + L_string + 25, 18, {
        mass: 0.8, frictionAir: 0.003,
        render: { fillStyle: '#ef4444' }, label: 'Mass R',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      const cR = Matter.Constraint.create({
        bodyA: bar, pointA: { x: 80, y: 6 },
        bodyB: mR, length: 0, stiffness: 1, render: { visible: false },
      });

      res.labels.set(bar.id, 'Bar (2.5 kg)');
      res.bodies.push(pivotL, pivotR, bar, mL, mR);
      res.constraints.push(sL, sR, cL, cR);
      return res;
    },
  },

  // ── KEPLER'S ORBITAL MOTION ───────────────────────────────────────────────
  {
    id: 'kepler-orbit',
    name: "Kepler's Orbital Motion",
    category: 'Advanced Systems',
    level: 'Undergrad II',
    description: "Three bodies orbit a central star under inverse-square gravity. Observe elliptical paths and Kepler's equal-area law — planets sweep equal areas in equal times.",
    concepts: ["Newton's Law of Gravitation", 'Centripetal Force', "Kepler's Three Laws", 'Angular Momentum Conservation'],
    formulas: ['F = GMm/r²', 'v_circ = √(GM/r)', 'T² ∝ a³  (Kepler III)', 'L = mvr = const'],
    parameters: [
      { key: 'gravity', label: 'Background g (keep 0)', min: 0, max: 1, step: 0.1, default: 0, target: { type: 'gravity' } },
    ],
    setup(_engine, width, height) {
      const res = makeEmptyResult("Kepler's Orbital Motion");
      const cx = width / 2, cy = height / 2;
      // G calibrated so T ≈ 4–8 s at typical orbit radii (60 fps, 1 px ≈ arbitrary distance unit).
      // T = 2π√(r³/G): for r = 165, G = 2800 → T ≈ 263 frames ≈ 4.4 s ✓
      const G = 2800;

      // Central star (fixed, large gravitational source)
      const star = Matter.Bodies.circle(cx, cy, 22, {
        isStatic: true,
        render: { fillStyle: '#fbbf24', strokeStyle: '#f59e0b', lineWidth: 4 },
        label: 'Star', collisionFilter: { mask: 0 },
      });

      // ── Planet A: circular orbit at r = 165 ──
      const rA = 165, vA = Math.sqrt(G / rA);
      const planetA = Matter.Bodies.circle(cx + rA, cy, 11, {
        mass: 0.8, frictionAir: 0, friction: 0,
        render: { fillStyle: '#3b82f6' }, label: 'Planet A',
        collisionFilter: { category: 0x0001, mask: 0 }, // no wall/ground collisions
      });
      // At 3-o'clock position, CCW orbit → velocity points upward (−y in canvas)
      Matter.Body.setVelocity(planetA, { x: 0, y: -vA });

      // ── Planet B: moderate ellipse at r = 115 (launched at 80% of circular speed) ──
      // Periapsis ≈ 64 px (safely outside star radius = 22)
      const rB = 115, vB = Math.sqrt(G / rB) * 0.80;
      const planetB = Matter.Bodies.circle(cx - rB, cy, 8, {
        mass: 0.4, frictionAir: 0, friction: 0,
        render: { fillStyle: '#f59e0b' }, label: 'Planet B',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      // At 9-o'clock, CCW orbit → velocity points downward (+y)
      Matter.Body.setVelocity(planetB, { x: 0, y: vB });

      // ── Comet C: wide ellipse at r = 80 (115% of circular speed) ──
      // Periapsis = 80 px, apoapsis ≈ 137 px — dramatically elongated comet-like orbit
      const rC = 80, vC = Math.sqrt(G / rC) * 1.15;
      const cometC = Matter.Bodies.circle(cx, cy - rC, 6, {
        mass: 0.2, frictionAir: 0, friction: 0,
        render: { fillStyle: '#ef4444' }, label: 'Comet C',
        collisionFilter: { category: 0x0001, mask: 0 },
      });
      // At 12-o'clock, CCW orbit → velocity points leftward (−x)
      Matter.Body.setVelocity(cometC, { x: -vC, y: 0 });

      res.labels.set(star.id,    '★ Star');
      res.labels.set(planetA.id, 'Planet A (circular)');
      res.labels.set(planetB.id, 'Planet B (elliptic)');
      res.labels.set(cometC.id,  'Comet C (wide ellipse)');
      res.bodies.push(star, planetA, planetB, cometC);

      res.customUpdate = (eng) => {
        const gCancel = (eng?.gravity?.y ?? 0) * (eng?.gravity?.scale ?? 0.001);
        [planetA, planetB, cometC].forEach(p => {
          // Counteract any engine gravity so orbit is driven purely by custom 1/r² force
          if (Math.abs(gCancel) > 1e-9) {
            Matter.Body.applyForce(p, p.position, { x: 0, y: -p.mass * gCancel });
          }
          // Inverse-square gravitational pull toward star centre
          const dx = cx - p.position.x;
          const dy = cy - p.position.y;
          const r2 = dx * dx + dy * dy;
          const r  = Math.sqrt(r2);
          if (r < 20) return; // avoid singularity at close approach
          const F = G * p.mass / r2;
          Matter.Body.applyForce(p, p.position, { x: F * dx / r, y: F * dy / r });
        });
      };

      return res;
    },
  },
];

export function getExperimentById(id) {
  return EXPERIMENTS.find(e => e.id === id);
}
