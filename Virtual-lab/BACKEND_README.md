# VIRTUAL-LAB — Backend README

> **Runtime:** Deno (Supabase Edge Functions)  
> **Framework:** Hono  
> **Database / Storage:** Supabase KV Store (PostgreSQL-backed), Supabase Auth, Supabase Realtime  
> **Entry point:** `/supabase/functions/server/index.tsx`  
> **Base URL prefix:** `https://<PROJECT_ID>.supabase.co/functions/v1/make-server-1a68a011`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Environment Variables](#2-environment-variables)
3. [Running the Server](#3-running-the-server)
4. [Middleware & Global Config](#4-middleware--global-config)
5. [Authentication Flow](#5-authentication-flow)
6. [REST API Reference](#6-rest-api-reference)
   - 6.1 [Health](#61-health)
   - 6.2 [Auth](#62-auth)
   - 6.3 [Experiments (Saved Scenes)](#63-experiments-saved-scenes)
   - 6.4 [Rooms](#64-rooms)
   - 6.5 [Authoritative State Snapshot](#65-authoritative-state-snapshot)
   - 6.6 [Analytics](#66-analytics)
   - 6.7 [Room Stats (Teacher View)](#67-room-stats-teacher-view)
7. [KV Store — Key Schema](#7-kv-store--key-schema)
8. [Realtime Layer — Supabase Channels](#8-realtime-layer--supabase-channels)
9. [Event Protocol (useRoomChannel)](#9-event-protocol-useroomchannel)
10. [Conflict Resolution & Soft-Lock](#10-conflict-resolution--soft-lock)
11. [Host-side State Snapshots (Late-Joiner Bootstrap)](#11-host-side-state-snapshots-late-joiner-bootstrap)
12. [Analytics Pipeline](#12-analytics-pipeline)
13. [Security Model](#13-security-model)
14. [Data Models](#14-data-models)
15. [Error Handling Conventions](#15-error-handling-conventions)
16. [Frontend Integration Utilities](#16-frontend-integration-utilities)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React)                      │
│                                                             │
│  AuthContext  ──→  /signup, /me (REST)                      │
│  RoomPanel    ──→  /rooms (REST)                            │
│  PhysicsCanvas ──→  Supabase Realtime (WebSocket)           │
│  AnalyticsDashboard ──→  /analytics (REST)                  │
│  SavedExperiments   ──→  /experiments (REST)                │
└───────────────────┬─────────────────────────────────────────┘
                    │ HTTPS + JWT Bearer
                    ▼
┌─────────────────────────────────────────────────────────────┐
│           Supabase Edge Function  (Deno / Hono)             │
│                                                             │
│  POST /signup          POST /rooms                          │
│  GET  /me              POST /rooms/:code/join               │
│  POST /experiments     POST /rooms/:code/leave              │
│  GET  /experiments     GET  /rooms/:code                    │
│  PUT  /experiments/:id POST /rooms/:code/state              │
│  DEL  /experiments/:id GET  /rooms/:code/stats              │
│  POST /analytics/:room/sample                               │
│  GET  /analytics/:room                                      │
│  GET  /health                                               │
└───────────────────┬─────────────────────────────────────────┘
                    │ Service Role Key (server-side only)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Platform                       │
│                                                             │
│  Auth Service  ─────  JWT issuance & validation             │
│  KV Store      ─────  kv_store_1a68a011 (Postgres)          │
│  Realtime      ─────  WebSocket channels per room           │
└─────────────────────────────────────────────────────────────┘
```

The three-tier pattern is:

```
Frontend  →  Edge Function (REST + auth guard)  →  KV Store / Supabase Auth
Frontend  ←→  Supabase Realtime (WebSocket, no server hop for physics events)
```

Physics events (object moves, force applications, experiment sync) travel **peer-to-peer** over Supabase Realtime broadcast channels — the Edge Function is **not** in the hot path for real-time physics, keeping latency minimal.

---

## 2. Environment Variables

| Variable | Where used | Notes |
|---|---|---|
| `SUPABASE_URL` | Server & frontend | Project REST/Realtime base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Full admin access — never leak to frontend |
| `SUPABASE_ANON_KEY` | Frontend only | Public key for Supabase client & API calls |

The server creates a Supabase admin client at startup:

```ts
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It must **never** be exposed in frontend bundles.

---

## 3. Running the Server

The server is started with:

```ts
Deno.serve(app.fetch);
```

Supabase Edge Functions handle deployment automatically. Locally, use the Supabase CLI:

```bash
supabase start                          # start local Supabase stack
supabase functions serve make-server-1a68a011  # hot-reload edge function
```

---

## 4. Middleware & Global Config

```ts
app.use('*', logger(console.log));      // structured request logging

app.use('/*', cors({
  origin: '*',
  allowHeaders:  ['Content-Type', 'Authorization'],
  allowMethods:  ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
}));
```

All routes are prefixed with `/make-server-1a68a011` to namespace this function.

---

## 5. Authentication Flow

### Sign-up

```
POST /make-server-1a68a011/signup
Body: { email, password, name }
```

1. Server calls `supabaseAdmin.auth.admin.createUser()` with `email_confirm: true` (no SMTP needed).
2. User profile object is written to KV at `user:<userId>`.
3. Frontend immediately calls `supabase.auth.signInWithPassword()` to obtain a JWT session.

### Sign-in

Handled entirely client-side by the Supabase JS SDK:

```ts
const { data } = await supabase.auth.signInWithPassword({ email, password });
// data.session.access_token  →  JWT used as Bearer token for all API calls
```

### Session Persistence

`AuthContext.tsx` bootstraps on mount via:

```ts
supabase.auth.getSession()           // restore existing session
supabase.auth.onAuthStateChange()    // keep token fresh on rotation
```

### Protected Routes

The `requireAuth` middleware wrapper validates every Bearer token:

```ts
async function getAuthUser(c) {
  const token = c.req.header('Authorization')?.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  return error ? null : data.user;
}

function requireAuth(handler) {
  return async (c) => {
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    return handler(c, user);
  };
}
```

All endpoints except `GET /health` and `POST /signup` require a valid JWT.

---

## 6. REST API Reference

All authenticated requests must include:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

### 6.1 Health

| Method | Path | Auth |
|---|---|---|
| GET | `/make-server-1a68a011/health` | None |

**Response**
```json
{ "status": "ok" }
```

---

### 6.2 Auth

#### POST `/signup`

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |
| `name` | string | optional |

**Success 200**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "..." }
}
```

**Error 400** — missing fields or Supabase auth error.

---

#### GET `/me`

Returns the authenticated user's profile stored in KV.

**Success 200**
```json
{
  "user": { "id": "uuid", "email": "...", "name": "...", "createdAt": 1234567890 }
}
```

---

### 6.3 Experiments (Saved Scenes)

Experiments store the full serialised physics scene (bodies, constraints, materials, etc.) so users can restore their sandbox at any time.

#### POST `/experiments`

Save a new experiment.

| Field | Type | Required |
|---|---|---|
| `name` | string | ✅ |
| `scene` | object | ✅ — serialised Matter.js scene |

**Success 200**
```json
{
  "experiment": {
    "id": "abc123",
    "userId": "uuid",
    "name": "My Atwood Machine",
    "scene": { ... },
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

KV key: `experiment:<userId>:<id>`

---

#### GET `/experiments`

List all experiments belonging to the authenticated user.

**Success 200**
```json
{
  "experiments": [ { ...experiment }, ... ]
}
```

---

#### GET `/experiments/:id`

Fetch a single experiment by ID (must belong to the requesting user).

**Success 200** — `{ "experiment": { ... } }`  
**Error 404** — not found or belongs to another user.

---

#### PUT `/experiments/:id`

Update name and/or scene of an existing experiment.

| Field | Type | Notes |
|---|---|---|
| `name` | string | optional |
| `scene` | object | optional |

**Success 200** — `{ "experiment": { ...updated } }`

---

#### DELETE `/experiments/:id`

Permanently remove an experiment.

**Success 200** — `{ "ok": true }`

---

### 6.4 Rooms

Rooms are collaborative sessions identified by a **6-character alphanumeric code** (e.g. `A3KW9Z`).

#### POST `/rooms`

Create a new room. The calling user becomes the **host**.

**Success 200**
```json
{
  "room": {
    "code": "A3KW9Z",
    "hostUserId": "uuid",
    "hostName": "Alice",
    "users": [{ "id": "uuid", "name": "Alice", "joinedAt": 1234567890 }],
    "currentExperimentId": null,
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

Code generation uses a 32-char alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) to avoid look-alike characters. Up to 5 collision retries are attempted.

KV key: `room:<CODE>`

---

#### POST `/rooms/:code/join`

Join an existing room. Idempotent — rejoining the same room does not create a duplicate entry.

**Success 200** — `{ "room": { ...updated room with new user } }`  
**Error 404** — room not found.

---

#### POST `/rooms/:code/leave`

Leave a room.

- If the leaving user is the **host**, the next user in the list becomes the new host automatically.
- If the room becomes **empty**, both `room:<CODE>` and `room:<CODE>:state` are deleted from KV.

**Success 200** — `{ "ok": true }`

---

#### GET `/rooms/:code`

Fetch current room metadata plus the latest authoritative state snapshot.

**Success 200**
```json
{
  "room": { ...room object },
  "state": { ...latest snapshot or null }
}
```

---

### 6.5 Authoritative State Snapshot

#### POST `/rooms/:code/state`

**Host only.** Push a complete serialised physics state to KV so late-joining participants can bootstrap.

| Field | Type | Notes |
|---|---|---|
| `bodies` | array | Serialised Matter.js bodies |
| `constraints` | array | Serialised constraints |
| `...` | any | Any additional scene metadata |

Only the current host (`room.hostUserId === user.id`) is authorised. Returns 403 otherwise.

**Success 200** — `{ "ok": true }`

KV key: `room:<CODE>:state`

---

### 6.6 Analytics

Physics telemetry samples are written per-user per-room and aggregated for the teacher dashboard.

#### POST `/analytics/:roomCode/sample`

Record one telemetry sample. Called by participants on a configurable interval.

| Field | Type | Description |
|---|---|---|
| `totalKE` | number | Total kinetic energy (J) |
| `totalPE` | number | Total potential energy (J) |
| `totalEnergy` | number | KE + PE |
| `totalMomentumX` | number | Net x-momentum (kg·m/s) |
| `totalMomentumY` | number | Net y-momentum (kg·m/s) |

KV key: `analytics:<CODE>:<timestamp>:<userId>`

**Success 200** — `{ "ok": true }`

---

#### GET `/analytics/:roomCode`

Retrieve all samples for a room with pre-computed summary statistics.

**Success 200**
```json
{
  "samples": [
    { "totalKE": 12.4, "totalPE": 5.1, "totalEnergy": 17.5,
      "totalMomentumX": 0.3, "totalMomentumY": -0.1,
      "ts": 1234567890, "userId": "uuid" }
  ],
  "summary": {
    "count": 420,
    "participantCount": 3,
    "avgKE": 10.2,
    "maxKE": 34.7,
    "avgPE": 4.8,
    "avgEnergy": 15.0,
    "maxEnergy": 42.1,
    "avgMomX": 0.05,
    "avgMomY": -0.02,
    "firstTs": 1234567800,
    "lastTs": 1234567890,
    "durationMs": 90000
  }
}
```

---

### 6.7 Room Stats (Teacher View)

#### GET `/rooms/:code/stats`

Quick overview for the teacher analytics dashboard — no full sample list.

**Success 200**
```json
{
  "room": { ...room object },
  "bodyCount": 12,
  "sampleCount": 840,
  "lastStateUpdate": 1234567890
}
```

---

## 7. KV Store — Key Schema

All data is stored in the shared `kv_store_1a68a011` table via the helper functions in `kv_store.tsx`.

| Key Pattern | Contents | Written by |
|---|---|---|
| `user:<userId>` | User profile `{ id, email, name, createdAt }` | `/signup` |
| `experiment:<userId>:<id>` | Full experiment object with serialised `scene` | `/experiments` POST/PUT |
| `room:<CODE>` | Room object `{ code, hostUserId, users[], ... }` | `/rooms` |
| `room:<CODE>:state` | Latest authoritative physics snapshot | `/rooms/:code/state` |
| `analytics:<CODE>:<ts>:<userId>` | Single telemetry sample | `/analytics/:room/sample` |

**KV utility functions used:**

| Function | Behaviour |
|---|---|
| `kv.get(key)` | Returns single value or `null` |
| `kv.set(key, value)` | Upsert |
| `kv.del(key)` | Delete |
| `kv.getByPrefix(prefix)` | Returns `[]` of all values whose key starts with `prefix` |

---

## 8. Realtime Layer — Supabase Channels

Physics collaboration does **not** route through the Edge Function. Instead, every participant subscribes directly to a Supabase Realtime **broadcast channel**:

```
Channel name:  room:<ROOM_CODE>
e.g.           room:A3KW9Z
```

The channel is managed by `useRoomChannel.ts`.

### Channel Features

| Feature | Mechanism | Description |
|---|---|---|
| Physics events | `broadcast` | One-to-many event fan-out, < 100 ms latency |
| Presence | `presence` | Who is currently online in the room |

### Subscription lifecycle

```ts
const ch = supabase.channel(`room:${roomCode}`, {
  config: { presence: { key: selfUserId } },
});

ch.on('broadcast', { event: 'event' }, ({ payload }) => { ... });
ch.on('presence', { event: 'sync' }, () => { ... });

ch.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await ch.track({ name: selfName, joinedAt: Date.now() });
  }
});
```

On unmount, `ch.unsubscribe()` is called to cleanly remove presence.

---

## 9. Event Protocol (useRoomChannel)

Every broadcast message conforms to the `RoomEvent` type:

```ts
type RoomEvent = {
  type: RoomEventType;   // see below
  payload: any;          // event-specific data
  ts: number;            // Date.now() timestamp
  userId: string;        // sender's user ID
  userName?: string;     // sender's display name
};
```

### Event Types

| `type` | Trigger | `payload` shape |
|---|---|---|
| `objectMoved` | User drags a body | `{ bodyId, x, y, vx, vy, angle }` |
| `objectAdded` | User spawns a new body | `{ body: serialisedBody }` |
| `objectDeleted` | User removes a body | `{ bodyId }` |
| `applyForce` | User applies an impulse | `{ bodyId, fx, fy, px, py }` |
| `syncState` | Host broadcasts full state | `{ bodies[], constraints[] }` |
| `experimentLoaded` | Host loads an experiment | `{ experimentId }` |
| `chat` | In-room text message | `{ text, senderName }` |

### Echo Suppression

Events sent by the local user are silently dropped on receipt:

```ts
ch.on('broadcast', { event: 'event' }, ({ payload }) => {
  if (payload.userId === selfUserId) return;  // ignore own echoes
  handlerRef.current?.(payload);
});
```

### Sending

```ts
const { send } = useRoomChannel(roomCode, userId, name, onEvent, onPresence);

send('objectMoved', { bodyId: 42, x: 300, y: 200, vx: 1.2, vy: 0 });
```

---

## 10. Conflict Resolution & Soft-Lock

When multiple users drag bodies simultaneously, a **dragging soft-lock** prevents positional conflicts:

- When a user starts dragging body `B`, they send an `objectMoved` event immediately.
- Remote clients track which `userId` last sent a move event for each `bodyId`.
- If `userId !== selfUserId` is "owning" a body, remote clients **do not apply physics forces** to that body for the duration of the drag — they only apply the received position/velocity.
- The lock is implicitly released when `objectMoved` events stop arriving for that body (drag ended).

This is a **last-writer-wins soft lock** — no explicit lock/unlock messages are needed. The high frequency of `objectMoved` events (every physics frame while dragging) naturally asserts ownership.

---

## 11. Host-side State Snapshots (Late-Joiner Bootstrap)

To avoid requiring a new participant to wait for a sync event, the **host** periodically persists an authoritative snapshot:

```
Every 5 seconds (host only):
  POST /rooms/:code/state  { bodies, constraints, springInfos, ... }
```

When a new user joins:

1. `GET /rooms/:code` returns both `room` and `state`.
2. If `state !== null`, the joining client immediately hydrates the physics engine from the snapshot.
3. If `state === null` (first join or room just created), the client starts with an empty canvas.

This guarantees all participants converge to the same scene within at most one snapshot interval (5 s) of joining.

---

## 12. Analytics Pipeline

```
Participant PhysicsCanvas
        │ (every ~2 s while simulation running)
        ▼
POST /analytics/:roomCode/sample
  { totalKE, totalPE, totalEnergy, totalMomentumX, totalMomentumY }
        │
        ▼
KV key: analytics:<CODE>:<ts>:<userId>
        │
        ▼
GET /analytics/:roomCode
        │
        ▼
AnalyticsDashboard.tsx
  (Recharts — Energy vs Time, Momentum vs Time)
```

### Computed Summary Fields

| Field | Formula |
|---|---|
| `avgKE` | mean of all `totalKE` samples |
| `maxKE` | max of all `totalKE` samples |
| `avgPE` | mean of all `totalPE` samples |
| `avgEnergy` | mean of `totalEnergy` |
| `maxEnergy` | max of `totalEnergy` |
| `avgMomX/Y` | mean of momentum components |
| `participantCount` | count of distinct `userId` values |
| `durationMs` | `lastTs − firstTs` |

---

## 13. Security Model

| Concern | Mitigation |
|---|---|
| Unauthenticated API access | All endpoints except `/health` and `/signup` use `requireAuth` |
| Token validation | Every request validated against Supabase Auth (`getUser(token)`) |
| Service Role Key exposure | Used **server-side only**; never referenced in frontend code |
| Cross-user data access | Experiment keys are namespaced `experiment:<userId>:<id>` — a user can only query their own prefix |
| Host-only state writes | `/rooms/:code/state` checks `room.hostUserId === user.id` |
| CORS | Open `origin: '*'` is intentional for development; restrict in production |

---

## 14. Data Models

### UserProfile
```ts
{
  id: string;          // Supabase Auth UUID
  email: string;
  name: string;
  createdAt: number;   // Unix ms timestamp
}
```

### Experiment
```ts
{
  id: string;
  userId: string;
  name: string;
  scene: {
    bodies: SerializedBody[];
    constraints: SerializedConstraint[];
    springInfos: SpringInfo[];
    // ...any additional canvas state
  };
  createdAt: number;
  updatedAt: number;
}
```

### Room
```ts
{
  code: string;              // 6-char e.g. "A3KW9Z"
  hostUserId: string;
  hostName: string;
  users: Array<{
    id: string;
    name: string;
    joinedAt: number;
  }>;
  currentExperimentId: string | null;
  createdAt: number;
  updatedAt: number;
}
```

### AnalyticsSample
```ts
{
  totalKE: number;
  totalPE: number;
  totalEnergy: number;
  totalMomentumX: number;
  totalMomentumY: number;
  ts: number;
  userId: string;
}
```

---

## 15. Error Handling Conventions

All errors follow the shape:

```json
{ "error": "<descriptive message>" }
```

| HTTP Status | Meaning |
|---|---|
| `200` | Success |
| `400` | Validation error (missing fields, Supabase auth error) |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but not authorised (e.g. non-host writing state) |
| `404` | Resource not found |
| `500` | Unexpected server exception — full error string included for debugging |

All exceptions in route handlers are caught and returned as `500` with the stringified error:

```ts
} catch (err) {
  console.log(`<context>: ${err}`);
  return c.json({ error: `<context>: ${err}` }, 500);
}
```

---

## 16. Frontend Integration Utilities

### `utils/supabase/client.ts`

Provides two helpers consumed throughout the frontend:

```ts
// Singleton Supabase browser client
getSupabase(): SupabaseClient

// Typed fetch wrapper — prepends base URL, injects Authorization header
apiFetch(path: string, init?: RequestInit, token?: string): Promise<any>
```

Usage in components:

```ts
import { apiFetch } from '../../../utils/supabase/client';

const { experiments } = await apiFetch('/experiments', { method: 'GET' }, accessToken);
```

### `AuthContext.tsx`

React context providing:

```ts
{
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signUp(email, password, name): Promise<void>;
  signIn(email, password): Promise<void>;
  signOut(): Promise<void>;
}
```

### `useRoomChannel.ts`

React hook providing:

```ts
const { send } = useRoomChannel(
  roomCode,           // string | null
  selfUserId,         // string | null
  selfName,           // string | null
  onEvent,            // (e: RoomEvent) => void
  onPresenceChange,   // (users: {id,name}[]) => void
);

send(type: RoomEventType, payload: any): void;
```

---

## Experiment Catalogue

13 university-level experiments are defined in `experimentDefinitions.ts`:

| ID | Name | Category | Level |
|---|---|---|---|
| `atwood-machine` | Atwood's Machine | Newton's Laws | Undergrad I |
| `inclined-plane` | Inclined Plane & Friction | Newton's Laws | Undergrad I |
| `newtons-cradle` | Newton's Cradle | Newton's Laws | Undergrad I |
| `elastic-collision` | Elastic & Inelastic Collisions | Newton's Laws | Undergrad I |
| `spring-mass-vertical` | Spring–Mass (Vertical) | Oscillations & SHM | Undergrad I |
| `spring-mass-horizontal` | Spring–Mass (Horizontal) | Oscillations & SHM | Undergrad I |
| `simple-pendulum` | Simple Pendulum | Oscillations & SHM | Undergrad I |
| `coupled-oscillators` | Coupled Spring Oscillators | Oscillations & SHM | Undergrad II |
| `compound-pendulum` | Compound Pendulum (Physical) | Rotational Motion | Undergrad II |
| `rotating-disk-motor` | Motorised Rotating Disk | Rotational Motion | Undergrad II |
| `double-pendulum` | Double Pendulum (Chaotic) | Rotational Motion | Undergrad II |
| `pulley-spring-system` | Pulley & Spring System | Advanced Systems | Undergrad II |
| *(13th)* | *(see experimentDefinitions.ts)* | Advanced Systems | Undergrad II |

Each experiment definition provides:
- `id`, `name`, `category`, `level`
- `description` — plain-text summary
- `concepts[]` — physics concepts demonstrated
- `formulas[]` — key equations
- `parameters[]` — tunable sliders with KV targets (`mass`, `friction`, `gravity`, `velocityX`, etc.)
- `setup(engine, width, height, params)` — factory function that returns `{ bodies, constraints, springInfos, pulleys, motors, labels, customUpdate }`

---

*Last updated: May 2026*
