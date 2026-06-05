import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.jsx";

const app = new Hono();

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

// ─── Helpers ─────────────────────────────────────────────

async function getAuthUser(c) {
  const auth = c.req.header("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) return null;

  return data.user;
}

function requireAuth(handler) {
  return async (c) => {
    const user = await getAuthUser(c);

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return handler(c, user);
  };
}

function genId() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36)
  );
}

function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let s = "";

  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }

  return s;
}

// ─── Health ─────────────────────────────────────────────

app.get("/make-server-1a68a011/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Auth ─────────────────────────────────────────────

app.post("/make-server-1a68a011/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json(
        { error: "Email and password are required" },
        400
      );
    }

    const { data, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: {
          name: name ?? email.split("@")[0],
        },
        email_confirm: true,
      });

    if (error) {
      console.log(`Signup error for ${email}: ${error.message}`);

      return c.json(
        { error: `Signup failed: ${error.message}` },
        400
      );
    }

    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name: name ?? email.split("@")[0],
      createdAt: Date.now(),
    });

    return c.json({
      user: {
        id: data.user.id,
        email,
        name: name ?? email.split("@")[0],
      },
    });
  } catch (err) {
    console.log(`Signup exception: ${err}`);

    return c.json(
      { error: `Signup exception: ${err}` },
      500
    );
  }
});

// ─── Current User ──────────────────────────────────────

app.get(
  "/make-server-1a68a011/me",
  requireAuth(async (c, user) => {
    const profile =
      (await kv.get(`user:${user.id}`)) ?? {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? user.email,
      };

    return c.json({ user: profile });
  })
);

// ─── Experiments ───────────────────────────────────────

app.post(
  "/make-server-1a68a011/experiments",
  requireAuth(async (c, user) => {
    try {
      const body = await c.req.json();

      const { name, scene } = body;

      if (!name || !scene) {
        return c.json(
          { error: "name and scene are required" },
          400
        );
      }

      const id = genId();

      const exp = {
        id,
        userId: user.id,
        name,
        scene,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await kv.set(`experiment:${user.id}:${id}`, exp);

      return c.json({ experiment: exp });
    } catch (err) {
      console.log(`Save experiment error: ${err}`);

      return c.json(
        { error: `Failed to save experiment: ${err}` },
        500
      );
    }
  })
);

app.get(
  "/make-server-1a68a011/experiments",
  requireAuth(async (c, user) => {
    const list = await kv.getByPrefix(
      `experiment:${user.id}:`
    );

    return c.json({
      experiments: list ?? [],
    });
  })
);

app.delete(
  "/make-server-1a68a011/experiments/:id",
  requireAuth(async (c, user) => {
    const id = c.req.param("id");

    await kv.del(`experiment:${user.id}:${id}`);

    return c.json({ ok: true });
  })
);

// ─── Rooms ─────────────────────────────────────────────

app.post(
  "/make-server-1a68a011/rooms",
  requireAuth(async (c, user) => {
    try {
      let code = genRoomCode();

      for (let i = 0; i < 5; i++) {
        const exists = await kv.get(`room:${code}`);

        if (!exists) break;

        code = genRoomCode();
      }

      const profile =
        (await kv.get(`user:${user.id}`)) ?? {
          id: user.id,
          name: user.email,
        };

      const room = {
        code,
        hostUserId: user.id,
        hostName: profile.name,
        users: [
          {
            id: user.id,
            name: profile.name,
            joinedAt: Date.now(),
          },
        ],
        currentExperimentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await kv.set(`room:${code}`, room);

      return c.json({ room });
    } catch (err) {
      console.log(`Create room error: ${err}`);

      return c.json(
        { error: `Failed to create room: ${err}` },
        500
      );
    }
  })
);

Deno.serve(app.fetch);