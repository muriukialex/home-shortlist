// Shared shortlist state, stored in Upstash Redis (Vercel Marketplace, free tier).
// GET  /api/state -> { state, updatedAt }
// POST /api/state  { order, pref } -> { ok, updatedAt }

const KEY = 'home-shortlist:state';

const CATALOG = {
  fridges: ['f1', 'f2', 'f3', 'f4', 'f5', 'f6'],
  guards: ['g1', 'g2'],
  washers: ['w1', 'w2', 'w3'],
  cookers: ['c1', 'c2', 'c3', 'c4', 'c5'],
  burners: ['b1', 'b2', 'b3'],
  bedding: ['d1', 'd2', 'd3', 'd4'],
  dining: ['t1', 't2'],
  microwaves: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'],
};

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis is not connected to this project yet.');
  return { url, token };
}

async function redis(command) {
  const { url, token } = redisConfig();
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`Redis error ${r.status}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

// Only accept state that matches the product catalogue exactly.
function validate(body) {
  if (!body || typeof body !== 'object') return null;
  const order = {};
  const pref = {};
  for (const [cat, ids] of Object.entries(CATALOG)) {
    const o = body.order && body.order[cat];
    if (!Array.isArray(o) || o.length !== ids.length || !ids.every((id) => o.includes(id))) return null;
    order[cat] = o.map(String);
    const p = body.pref && body.pref[cat];
    if (p !== undefined && p !== null) {
      if (typeof p !== 'string' || !ids.includes(p)) return null;
      pref[cat] = p;
    }
  }
  return { order, pref };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const raw = await redis(['GET', KEY]);
      if (!raw) return res.status(200).json({ state: null, updatedAt: 0 });
      const saved = JSON.parse(raw);
      return res.status(200).json(saved);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
      const state = validate(body);
      if (!state) return res.status(400).json({ error: 'Invalid shortlist data.' });
      const updatedAt = Date.now();
      await redis(['SET', KEY, JSON.stringify({ state, updatedAt })]);
      return res.status(200).json({ ok: true, updatedAt });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }
}
