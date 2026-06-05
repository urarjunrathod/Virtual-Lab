import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info.jsx';

let _client = null;

export function getSupabase() {
  if (_client) return _client;

  _client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );

  return _client;
}

export const SERVER_BASE =
  `https://${projectId}.supabase.co/functions/v1/make-server-1a68a011`;

export async function apiFetch(
  path,
  opts = {},
  accessToken
) {
  const headers = new Headers(opts.headers || {});

  headers.set('Content-Type', 'application/json');

  headers.set(
    'Authorization',
    `Bearer ${accessToken ?? publicAnonKey}`
  );

  const res = await fetch(
    `${SERVER_BASE}${path}`,
    {
      ...opts,
      headers,
    }
  );

  let data = null;

  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      data?.error ??
      `Request failed: ${res.status} ${path}`;

    console.error(`apiFetch error [${path}]:`, msg);

    throw new Error(msg);
  }

  return data;
}