/**
 * dsh-512-token — host half.
 *
 * Token usage per session is a dsh session projection: a pure fold over
 * committed session events that the framework drives eagerly for live
 * sessions and checkpoints into the persisted projection cache
 * (`sessionProjectionCache`) at turn ends, on disposal and on its throttle.
 * History is therefore read from the cache instead of re-reading logs:
 *
 * - live sessions: `sessionProjections.stateOf(session, KEY)` (already folded);
 * - cold sessions: the cached checkpoint row for KEY (zero log I/O);
 * - cold sessions without a usable row (first run, a bumped STATE_VERSION, or
 *   a log that changed since the row was verified): one background log read
 *   that folds the unit and writes the row back through
 *   `sessionProjectionCache.coldSnapshot`, so it is never read again.
 *
 * A cache row may lag its log (dsh killed mid-turn, or the session continued
 * under another profile whose cache is separate). `storages/dsh-512-token/
 * verified.json` remembers the log size each row was verified against; a
 * size change re-verifies that one session in the background.
 *
 * The browser half (lib/client.js) renders the stats as a Settings page and
 * polls the /dsh-512-token route while that page is open.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

/** Host-only projection key (no client view: nothing extra rides session frames). */
const KEY = 'dsh512TokenUsage'
/** Bump whenever the state shape or fold semantics change; old rows are then ignored. */
const STATE_VERSION = 1
const INDEX_FORMAT = 1
/** Per-request records kept per session (own and inherited part each). */
const REQ_KEEP = 40
const COLD_CONCURRENCY = 2
const BOOT_SYNC_DELAY_MS = 15000
const DISPOSE_SYNC_DELAY_MS = 5000
const SAVE_DELAY_MS = 2000
const SEP = '\u0000'

// ---- pure helpers ----
const pad = (n) => (n < 10 ? '0' : '') + n
const localDay = (t) => {
  const d = new Date(t)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
const num = (x) => (typeof x === 'number' && Number.isFinite(x) ? x : 0)
const isNum = (x) => typeof x === 'number' && Number.isFinite(x)
/** [uncachedInput, output, cacheRead, cacheWrite, reasoning] */
const bucketsOf = (u) => [num(u.inputTokens), num(u.outputTokens), num(u.cacheReadTokens), num(u.cacheWriteTokens), num(u.reasoningTokens)]
const addBuckets = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3], a[4] + b[4]]
const grandOf = (b) => b[0] + b[1] + b[2] + b[3]
const errorText = (e) => (e && e.message) || String(e)

// ---- projection state ----
//
// Plain JSON by the projection contract. One session:
//   cut      exact fork-inherited prefix length (events with seq < cut are the parent's)
//   cutDone  whether events are now the session's own work
//   skipKey  step key at the last inherited cut: fork closers at or below it are not new steps
//   lastKey  step key (turn * 1e6 + step) of the last step-scoped event
//   hdr      provider/model of the last request/header
//   open     the open step's key and start time (model duration)
//   pend     usage samples not yet final (rc.1 replacement: a later sample in the same
//            step slot replaces it; final once retry starts, the step ends or the slot moves)
//   own/inh  aggregates of the session's own work and of its inherited prefix (forks only)
// Aggregate: u buckets, steps, turns, llmMs, md 'provider\0model\0day' -> buckets,
//   sd day -> steps, req last REQ_KEEP [time, provider, model, turn, step, ...buckets].

function emptyAgg() {
  return { u: [0, 0, 0, 0, 0], steps: 0, turns: 0, llmMs: 0, md: {}, sd: {}, req: [] }
}

function initState(inheritedEventCount) {
  const cut = Math.max(0, num(Number(inheritedEventCount)))
  return {
    cut,
    cutDone: cut === 0,
    skipKey: -1,
    lastKey: -1,
    hdr: null,
    open: null,
    pend: [],
    lastTurn: null,
    title: null,
    own: emptyAgg(),
    inh: cut > 0 ? emptyAgg() : null,
  }
}

function aggAddSample(a, s) {
  const mk = s.p + SEP + (s.m || '') + SEP + localDay(s.t)
  const md = { ...a.md }
  md[mk] = md[mk] ? addBuckets(md[mk], s.b) : s.b.slice()
  let req = a.req.concat([[s.t, s.p, s.m || null, Math.floor(s.k / 1000000), s.k % 1000000, s.b[0], s.b[1], s.b[2], s.b[3], s.b[4]]])
  if (req.length > REQ_KEEP) req = req.slice(req.length - REQ_KEEP)
  return { ...a, u: addBuckets(a.u, s.b), md, req }
}

/** A fresh aggregate holding a + b; neither input is modified. */
function combineAgg(a, b) {
  const md = { ...a.md }
  for (const k of Object.keys(b.md)) md[k] = md[k] ? addBuckets(md[k], b.md[k]) : b.md[k].slice()
  const sd = { ...a.sd }
  for (const k of Object.keys(b.sd)) sd[k] = (sd[k] || 0) + b.sd[k]
  let req = a.req.concat(b.req)
  if (req.length > REQ_KEEP) req = req.slice(req.length - REQ_KEEP)
  return { u: addBuckets(a.u, b.u), steps: a.steps + b.steps, turns: a.turns + b.turns, llmMs: a.llmMs + b.llmMs, md, sd, req }
}

/** Finalize the pending samples matching `pred` into the current part. `s` is a draft. */
function flushWhere(s, pred) {
  if (!s.pend.some(pred)) return
  const keep = []
  for (const p of s.pend) {
    if (!pred(p)) { keep.push(p); continue }
    if (s.cutDone) s.own = aggAddSample(s.own, p)
    else s.inh = aggAddSample(s.inh, p)
  }
  s.pend = keep
}
const ALL = () => true

function usageOf(data) {
  if (data.usage) return data.usage
  if (Array.isArray(data.stream)) {
    for (let i = data.stream.length - 1; i >= 0; i--) {
      const r = data.stream[i]
      if (r && r.type === 'chunk' && r.chunk && r.chunk.type === 'usage') return r.chunk.usage
    }
  }
  return undefined
}

/**
 * Pure transition. Returns the same reference for events that change nothing.
 * Usage follows rc.1 token-meter replacement: an attempt is final only after
 * retry starts or the step closes; a later sample in the same slot replaces it.
 */
function foldEvent(state, event) {
  const data = event.data
  if (data === null || typeof data !== 'object') return state
  let d = null
  const draft = () => {
    if (d === null) d = { ...state }
    return d
  }
  const cur = () => (d === null ? state : d)

  // Fork child: everything before the exact inherited cut is the parent's work,
  // already counted in the parent session.
  if (!state.cutDone && isNum(event.seq) && event.seq >= state.cut) {
    const s = draft()
    flushWhere(s, ALL)
    s.open = null
    s.skipKey = s.lastKey
    s.cutDone = true
  }

  const type = event.type
  if (type === 'session/end-seed') {
    // Tagged cut markers. With the exact cut above this is a no-op at the final
    // marker; it keeps a log without a recorded cut (older formats) correct.
    if (data.inherited === true) {
      const s = draft()
      flushWhere(s, ALL)
      if (s.own.steps > 0 || s.own.req.length > 0 || grandOf(s.own.u) > 0 || s.own.llmMs > 0) {
        s.inh = s.inh ? combineAgg(s.inh, s.own) : s.own
        s.own = emptyAgg()
      } else if (s.inh === null) {
        s.inh = emptyAgg()
      }
      s.open = null
      s.skipKey = s.lastKey
    }
    return cur()
  }
  if (type === 'session/title') {
    const title = typeof data.title === 'string' ? data.title : null
    if (title !== cur().title) draft().title = title
    return cur()
  }
  if (type === 'request/header') {
    const cfg = data.header && data.header.config
    if (cfg) {
      const p = typeof cfg.provider === 'string' ? cfg.provider : null
      const m = typeof cfg.model === 'string' ? cfg.model : null
      const h = cur().hdr
      if (h === null || h.p !== p || h.m !== m) draft().hdr = { p, m }
    }
    return cur()
  }

  const turn = data.turn
  const step = data.step
  if (typeof turn !== 'number' || typeof step !== 'number') return cur()
  const k = turn * 1000000 + step
  if (k !== cur().lastKey) {
    const s = draft()
    flushWhere(s, (p) => p.k < k)
    s.lastKey = k
  }

  switch (type) {
    case 'step/start': {
      draft().open = { k, t: num(event.time) }
      return cur()
    }
    case 'assistant/message':
    case 'assistant/attempt': {
      const c = cur()
      if (type === 'assistant/message' && c.open !== null && c.open.k === k) {
        // Model time, as dsh-session-stats measures it: step/start -> assembled message.
        const s = draft()
        const ms = Math.max(0, num(event.time) - c.open.t)
        if (s.cutDone) s.own = { ...s.own, llmMs: s.own.llmMs + ms }
        else s.inh = { ...s.inh, llmMs: s.inh.llmMs + ms }
        s.open = null
      }
      const usage = usageOf(data)
      if (usage) {
        const h = cur().hdr
        const sample = { k, t: num(event.time), p: (h && h.p) || 'unknown', m: h ? h.m : null, b: bucketsOf(usage) }
        const s = draft()
        const i = s.pend.findIndex((p) => p.k === k)
        s.pend = i < 0 ? s.pend.concat([sample]) : s.pend.map((p, j) => (j === i ? sample : p))
      }
      return cur()
    }
    case 'llm/retry-started': {
      if (cur().pend.some((p) => p.k === k)) flushWhere(draft(), (p) => p.k === k)
      return cur()
    }
    case 'step/end': {
      // Closers a fork appends for a step its parent left open belong to the
      // inherited prefix, not to new work in this session.
      if (k <= cur().skipKey) return cur()
      const s = draft()
      flushWhere(s, (p) => p.k === k)
      const day = localDay(num(event.time))
      const newTurn = s.lastTurn !== turn
      const bump = (a) => ({ ...a, steps: a.steps + 1, turns: a.turns + (newTurn ? 1 : 0), sd: { ...a.sd, [day]: (a.sd[day] || 0) + 1 } })
      if (s.cutDone) s.own = bump(s.own)
      else s.inh = bump(s.inh)
      if (newTurn) s.lastTurn = turn
      return s
    }
    default:
      return cur()
  }
}

// ---- state validation (the projection's stateSchema) ----
const isBuckets = (b) => Array.isArray(b) && b.length === 5 && b.every(isNum)
const isPlainObject = (o) => o !== null && typeof o === 'object' && !Array.isArray(o)
function isAgg(a) {
  return isPlainObject(a) && isBuckets(a.u) && isNum(a.steps) && isNum(a.turns) && isNum(a.llmMs)
    && isPlainObject(a.md) && Object.values(a.md).every(isBuckets)
    && isPlainObject(a.sd) && Object.values(a.sd).every(isNum)
    && Array.isArray(a.req) && a.req.every((r) => Array.isArray(r) && r.length === 10)
}
function isState(v) {
  return isPlainObject(v) && isNum(v.cut) && typeof v.cutDone === 'boolean' && isNum(v.skipKey) && isNum(v.lastKey)
    && (v.hdr === null || isPlainObject(v.hdr))
    && (v.open === null || (isPlainObject(v.open) && isNum(v.open.k) && isNum(v.open.t)))
    && Array.isArray(v.pend) && v.pend.every((p) => isPlainObject(p) && isNum(p.k) && isNum(p.t) && typeof p.p === 'string' && isBuckets(p.b))
    && (v.lastTurn === null || isNum(v.lastTurn))
    && (v.title === null || typeof v.title === 'string')
    && isAgg(v.own) && (v.inh === null || isAgg(v.inh))
}
/** Minimal schema: the registry only calls `parse` on persisted rows. */
const stateSchema = {
  parse(value) {
    if (!isState(value)) throw new TypeError('dsh-512-token: malformed projection state')
    return structuredClone(value)
  },
}

/** The projection unit (host-only: no `wire`, so it never reaches clients). */
const projection = {
  key: KEY,
  stateVersion: STATE_VERSION,
  stateSchema,
  init: (_header, inheritedEventCount) => initState(inheritedEventCount),
  apply: foldEvent,
}

/** Fold a whole log from init (tests and the cold-read fallback). */
function foldLog(inheritedEventCount, events) {
  let state = initState(inheritedEventCount)
  for (const event of events) state = foldEvent(state, event)
  return state
}

// ---- reading persisted rows ----

/**
 * The cached checkpoint row for KEY, identity-checked like the cache's own
 * listing read (lifecycle: createdAt, cwd, seeded). The cache has no public
 * read for host-only rows, so this goes through its table; when that shape is
 * unavailable every cold session simply takes the log-read path.
 */
function readRow(cache, header, validated) {
  if (!cache) return undefined
  let table
  try {
    table = typeof cache.requireTable === 'function' ? cache.requireTable() : cache.table
  } catch (e) { return undefined }
  if (!table || typeof table.get !== 'function') return undefined
  let record
  try { record = table.get(header.id) } catch (e) { return undefined }
  if (!isPlainObject(record) || !isPlainObject(record.identity) || !isPlainObject(record.rows)) return undefined
  const idn = record.identity
  if (idn.createdAt !== header.createdAt || idn.cwd !== header.cwd || (idn.isSeeded ?? false) !== (header.isSeeded ?? false)) return undefined
  const row = record.rows[KEY]
  if (!isPlainObject(row) || row.ver !== STATE_VERSION || !isNum(row.seq)) return undefined
  if (!validated.has(row.val)) {
    if (!isState(row.val)) return undefined
    validated.add(row.val)
  }
  return row
}

/** Change token of a stored log: its size when the backend reports it (append-only logs grow). */
function tokenOf(snapshot) {
  if (typeof snapshot.sizeBytes === 'number') return 's' + snapshot.sizeBytes
  if (snapshot.revision !== undefined && snapshot.revision !== null) return 'r' + String(snapshot.revision)
  return null
}

function dshHome() {
  const env = process.env.DSH_HOME
  if (typeof env === 'string' && env.trim() !== '') {
    const v = env.trim()
    if (v === '~') return homedir()
    if (v.startsWith('~/') || v.startsWith('~\\')) return join(homedir(), v.slice(2))
    return resolve(v)
  }
  return join(homedir(), '.dsh')
}

// ---- the host service ----

function createTracker(ctx, options = {}) {
  const indexFile = options.indexFile || join(dshHome(), 'storages', 'dsh-512-token', 'verified.json')
  const st = {
    verified: null, // id -> token the cached row was verified against
    liveSeq: new Map(), // id -> last seq seen while live (a clean disposal writes a row at least this far)
    memo: new Map(), // id -> { token, state } folded here from a log read
    failed: new Map(), // id -> { token, message }
    queued: new Map(), // id -> token
    active: new Set(),
    validated: new WeakSet(),
    entries: new Map(), // last sync's classification
    syncing: null,
    saveTimer: null,
    syncTimer: null,
    warnedCache: false,
    abort: new AbortController(),
    listed: null,
  }

  async function loadVerified() {
    if (st.verified !== null) return
    try {
      const json = JSON.parse(await readFile(indexFile, 'utf8'))
      st.verified = json && json.format === INDEX_FORMAT && json.stateVersion === STATE_VERSION && isPlainObject(json.sessions) ? json.sessions : {}
    } catch (e) {
      st.verified = {}
    }
  }

  async function save() {
    st.saveTimer = null
    if (st.verified === null) return
    const sessions = {}
    for (const [id, token] of Object.entries(st.verified)) {
      if (st.listed === null || st.listed.has(id)) sessions[id] = token
    }
    const body = JSON.stringify({ format: INDEX_FORMAT, stateVersion: STATE_VERSION, sessions })
    try {
      await mkdir(dirname(indexFile), { recursive: true })
      const tmp = indexFile + '.' + process.pid + '.tmp'
      await writeFile(tmp, body)
      await rename(tmp, indexFile)
    } catch (e) {
      ctx.logger.warn('dsh-512-token: saving ' + indexFile + ' failed: ' + errorText(e))
    }
  }
  function scheduleSave() {
    if (st.saveTimer !== null || st.abort.signal.aborted) return
    st.saveTimer = setTimeout(() => { void save() }, SAVE_DELAY_MS)
  }
  function markVerified(id, token) {
    if (token === null || st.verified[id] === token) return
    st.verified[id] = token
    scheduleSave()
  }

  /** Read one cold log once, fold it, and write the checkpoint back through the cache. */
  async function coldRead(id, token) {
    const sessionQuery = ctx.get('sessionQuery')
    if (!sessionQuery) return
    let observation
    try {
      observation = await sessionQuery.observeSession(id, { signal: st.abort.signal, projectionMode: 'none' })
    } catch (e) {
      if (!st.abort.signal.aborted) st.failed.set(id, { token, message: errorText(e) })
      return
    }
    try {
      if (observation.source === 'live') return // attached meanwhile: the live path covers it
      const events = observation.events
      const state = foldLog(observation.inheritedEventCount, events)
      const seq = events.length > 0 ? events[events.length - 1].seq : -1
      // Verified later, once the cache row has caught up to `seq` (the
      // write-back lands asynchronously and is fail-soft).
      st.memo.set(id, { token, state, seq })
      st.failed.delete(id)
      const cache = ctx.get('sessionProjectionCache')
      if (cache && typeof cache.coldSnapshot === 'function') {
        try {
          cache.coldSnapshot(observation.header, observation.inheritedEventCount, events)
        } catch (e) {
          if (!st.warnedCache) {
            st.warnedCache = true
            ctx.logger.warn('dsh-512-token: projection cache write-back failed (stats are recomputed on the next start): ' + errorText(e))
          }
        }
      }
    } finally {
      observation[Symbol.dispose]()
    }
  }

  function pump() {
    while (st.active.size < COLD_CONCURRENCY && st.queued.size > 0 && !st.abort.signal.aborted) {
      const [id, token] = st.queued.entries().next().value
      st.queued.delete(id)
      st.active.add(id)
      void coldRead(id, token)
        .catch((e) => { ctx.logger.warn('dsh-512-token: reading ' + id + ' failed: ' + errorText(e)) })
        .finally(() => {
          st.active.delete(id)
          // Yield between logs so a long warmup never monopolizes the event loop.
          setImmediate(pump)
          // Drained: one more pass records the rows that caught up as verified.
          if (st.queued.size === 0 && st.active.size === 0) scheduleSync(SAVE_DELAY_MS)
        })
    }
  }
  function enqueue(id, token) {
    if (st.active.has(id) || st.queued.has(id)) return
    const failed = st.failed.get(id)
    if (failed && failed.token === token) return
    st.queued.set(id, token)
    pump()
  }

  /**
   * List every session and resolve each one's projection state: live from the
   * registry, cold from the cached row (or this process's own fold), queueing
   * a background log read for anything missing or unverified.
   */
  async function syncOnce() {
    await loadVerified()
    const registry = ctx.get('sessionProjections')
    const sessions = ctx.get('sessions')
    const persistence = ctx.get('sessionPersistence')
    const cache = ctx.get('sessionProjectionCache')
    const snapshots = persistence ? await persistence.list() : []
    const entries = new Map()
    for (const snap of snapshots) {
      entries.set(snap.header.id, { id: snap.header.id, header: snap.header, token: tokenOf(snap), persisted: true, session: null })
    }
    if (sessions && typeof sessions.list === 'function') {
      for (const session of sessions.list()) {
        const prev = entries.get(session.id)
        entries.set(session.id, { id: session.id, header: session.header, token: prev ? prev.token : null, persisted: !!prev, session })
      }
    }
    st.listed = new Set(entries.keys())
    const ordered = [...entries.values()].sort((a, b) => (b.header.createdAt - a.header.createdAt) || (a.id < b.id ? -1 : 1))
    for (const e of ordered) {
      e.state = null
      e.live = e.session !== null
      e.fresh = false
      e.error = null
      if (e.live) {
        try {
          e.state = registry ? registry.stateOf(e.session, KEY) || null : null
          e.fresh = e.state !== null
        } catch (err) {
          e.error = errorText(err)
        }
        if (typeof e.session.seq === 'number') st.liveSeq.set(e.id, e.session.seq - 1)
        continue
      }
      const row = readRow(cache, e.header, st.validated)
      const memo = st.memo.get(e.id)
      const memoFresh = memo !== undefined && memo.token === e.token
      if (row) {
        const since = st.liveSeq.get(e.id)
        if (st.verified[e.id] === e.token || (since !== undefined && row.seq >= since) || (memoFresh && row.seq >= memo.seq)) {
          markVerified(e.id, e.token)
          st.liveSeq.delete(e.id)
          st.memo.delete(e.id)
          e.state = row.val
          e.fresh = true
        } else if (memoFresh) {
          e.state = memo.state
          e.fresh = true
        } else {
          e.state = row.val // possibly stale, never wrong: shown while it is re-verified
          enqueue(e.id, e.token)
        }
      } else if (memoFresh) {
        e.state = memo.state
        e.fresh = true
      } else {
        if (memo !== undefined) e.state = memo.state
        enqueue(e.id, e.token)
      }
      const failed = st.failed.get(e.id)
      if (failed && failed.token === e.token && e.state === null) e.error = failed.message
    }
    for (const id of st.memo.keys()) if (!entries.has(id)) st.memo.delete(id)
    st.entries = new Map(ordered.map((e) => [e.id, e]))
    return st.entries
  }

  function sync() {
    if (st.syncing === null) {
      st.syncing = syncOnce().finally(() => { st.syncing = null })
    }
    return st.syncing
  }
  function scheduleSync(delay) {
    if (st.syncTimer !== null || st.abort.signal.aborted) return
    st.syncTimer = setTimeout(() => {
      st.syncTimer = null
      sync().catch((e) => { ctx.logger.warn('dsh-512-token: background sync failed: ' + errorText(e)) })
    }, delay)
  }

  function dispose() {
    st.abort.abort()
    if (st.syncTimer !== null) clearTimeout(st.syncTimer)
    if (st.saveTimer !== null) {
      clearTimeout(st.saveTimer)
      void save()
    }
    st.queued.clear()
  }

  function onDisposed(session) {
    if (session && typeof session.seq === 'number') st.liveSeq.set(session.id, session.seq - 1)
    scheduleSync(DISPOSE_SYNC_DELAY_MS)
  }

  return { st, sync, scheduleSync, dispose, onDisposed, save }
}

// ---- payload ----

/** One session's usage as shown: own part, plus the inherited part when its parent is gone. */
function sessionAgg(state, includePending, withInherited) {
  let own = state.own
  let inh = state.inh
  if (includePending && state.pend.length > 0) {
    for (const p of state.pend) {
      if (state.cutDone || inh === null) own = aggAddSample(own, p)
      else inh = aggAddSample(inh, p)
    }
  }
  return { agg: withInherited && inh !== null ? combineAgg(inh, own) : own, inh }
}

const requestObject = (r) => ({ time: r[0], provider: r[1], model: r[2], turn: r[3], step: r[4], input: r[5], output: r[6], cacheRead: r[7], cacheWrite: r[8], reasoning: r[9] })
const bucketsRow = (b) => {
  const input = b[0] + b[2] + b[3]
  return { input, output: b[1], cacheRead: b[2], cacheWrite: b[3], total: input + b[1] }
}

async function providerRoster(ctx, caches) {
  const llm = ctx.get('llm')
  const settings = ctx.get('settings')
  const nowTs = Date.now()
  if (caches.providers && (nowTs - caches.providers.ts) < 60000) return caches.providers
  const names = new Map()
  if (llm) {
    try {
      for (const info of await llm.listProviders()) names.set(info.id, info.name || info.id)
    } catch (e) { /* ignore */ }
    try {
      for (const c of await llm.listConfigurableProviders()) {
        if (!names.has(c.provider)) names.set(c.provider, c.displayName || c.provider)
      }
    } catch (e) { /* ignore */ }
  }
  const configured = new Set()
  if (settings) {
    try {
      const pi = settings.get('llm-pi-ai')
      if (pi && pi.providers && typeof pi.providers === 'object') for (const k of Object.keys(pi.providers)) configured.add(k)
    } catch (e) { /* ignore */ }
    try {
      const dl = settings.get('llm-deepseek')
      if (dl && typeof dl === 'object') configured.add('deepseek-official')
    } catch (e) { /* ignore */ }
  }
  caches.providers = { ts: nowTs, names, configured }
  return caches.providers
}

/** Compute the full statistics payload from one sync's classification. */
async function buildPayload(ctx, tracker, caches) {
  const entries = await tracker.sync()
  const { st } = tracker
  const monthPrefix = (() => {
    const t = new Date()
    return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-'
  })()

  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, grand: 0, steps: 0, turns: 0 }
  const providerAgg = new Map()
  const modelAgg = new Map()
  const dayAgg = new Map()
  const daySteps = new Map()
  const providerDayAgg = new Map()
  const modelDayAgg = new Map()
  const sessionsByDay = new Map()
  const rows = []
  const add = (map, key, b) => map.set(key, map.has(key) ? addBuckets(map.get(key), b) : b.slice())
  let covered = 0
  let warming = 0
  let verifying = 0
  let failed = 0

  for (const e of entries.values()) {
    if (e.state === null) {
      if (e.error) failed++
      else warming++
      if (e.error) {
        rows.push({ id: e.id, title: '', live: e.live, persisted: e.persisted, createdAt: e.header.createdAt, usage: { uncachedInput: 0, cacheRead: 0, cacheWrite: 0, output: 0 }, grand: 0, steps: 0, turns: 0, llmMs: 0, seeded: !!e.header.isSeeded, parentSession: e.header.parentSession || null, inheritedGrand: 0, inheritedCounted: false, lastProvider: null, lastModel: null, requestCount: 0, pending: false, error: true, errorMsg: e.error })
      }
      continue
    }
    covered++
    if (!e.fresh) verifying++
    const state = e.state
    const parentId = e.header.parentSession
    // A fork child's inherited prefix is already counted in its parent. Count
    // it here only when the parent session no longer exists, so that usage is
    // still counted once. Known limit: with the parent gone, the whole prefix
    // is counted here, so a surviving grandparent's part, or the same prefix
    // in sibling forks of that deleted parent, can be counted more than once.
    const inheritedCounted = state.inh !== null && !(parentId && entries.has(parentId))
    const { agg, inh } = sessionAgg(state, !e.live, inheritedCounted)
    for (const mk of Object.keys(agg.md)) {
      const b = agg.md[mk]
      const i1 = mk.indexOf(SEP)
      const i2 = mk.indexOf(SEP, i1 + 1)
      const p = mk.slice(0, i1)
      const pm = mk.slice(0, i2)
      const day = mk.slice(i2 + 1)
      add(providerAgg, p, b)
      add(modelAgg, pm, b)
      if (!day.startsWith(monthPrefix)) continue
      add(dayAgg, day, b)
      add(providerDayAgg, p + SEP + day, b)
      add(modelDayAgg, pm + SEP + day, b)
      let perDay = sessionsByDay.get(day)
      if (!perDay) { perDay = new Map(); sessionsByDay.set(day, perDay) }
      add(perDay, e.id, b)
    }
    for (const day of Object.keys(agg.sd)) {
      if (day.startsWith(monthPrefix)) daySteps.set(day, (daySteps.get(day) || 0) + agg.sd[day])
    }
    const u = agg.u
    const grand = grandOf(u)
    totals.input += u[0] + u[2] + u[3]
    totals.output += u[1]
    totals.cacheRead += u[2]
    totals.cacheWrite += u[3]
    totals.grand += grand
    totals.steps += agg.steps
    totals.turns += agg.turns
    e.view = { agg, title: state.title || '' }
    rows.push({
      id: e.id,
      title: state.title || '',
      live: e.live,
      persisted: e.persisted,
      createdAt: e.header.createdAt,
      usage: { uncachedInput: u[0], cacheRead: u[2], cacheWrite: u[3], output: u[1] },
      grand,
      steps: agg.steps,
      turns: agg.turns,
      llmMs: agg.llmMs,
      // Fork children: the parent-inherited usage this row leaves out (or,
      // when inheritedCounted, includes because the parent no longer exists).
      seeded: inh !== null,
      parentSession: parentId || null,
      inheritedGrand: inh !== null ? grandOf(inh.u) : 0,
      inheritedCounted,
      lastProvider: state.hdr ? state.hdr.p : null,
      lastModel: state.hdr ? state.hdr.m : null,
      requestCount: agg.req.length,
      pending: !e.fresh,
      error: false,
      errorMsg: null,
    })
  }

  const { names: providerNames, configured } = await providerRoster(ctx, caches)
  const unknownName = '未知/未记录'
  const modelsOf = (id) => {
    const list = []
    for (const [pm, b] of modelAgg) {
      const sep = pm.indexOf(SEP)
      if (pm.slice(0, sep) !== id) continue
      list.push({ model: pm.slice(sep + 1) || null, ...bucketsRow(b) })
    }
    return list.sort((a, b2) => b2.total - a.total)
  }
  const providerRows = []
  for (const id of new Set([...configured, ...providerAgg.keys()])) {
    if (id === 'unknown') continue
    const b = providerAgg.get(id) || [0, 0, 0, 0, 0]
    providerRows.push({ id, name: providerNames.get(id) || id, ...bucketsRow(b), reasoning: b[4], models: modelsOf(id) })
  }
  if (providerAgg.has('unknown')) {
    const b = providerAgg.get('unknown')
    providerRows.push({ id: 'unknown', name: unknownName, ...bucketsRow(b), reasoning: b[4], models: modelsOf('unknown') })
  }
  providerRows.sort((a, b2) => b2.total - a.total)

  // Current month, from the 1st to the end of the month (future days empty).
  // Every day carries a complete day-scoped view (providers, models, sessions)
  // so the page can sync its whole surface to one selected date.
  const days = []
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const modelsOfDay = (pid, key) => {
    const list = []
    for (const [mdk, b] of modelDayAgg) {
      const parts = mdk.split(SEP)
      if (parts[0] !== pid || parts[2] !== key) continue
      list.push({ model: parts[1] || null, ...bucketsRow(b) })
    }
    return list.sort((a, b2) => b2.total - a.total)
  }
  const dayProviderIds = new Set([...configured, ...providerAgg.keys()])
  for (let dn = 1; dn <= daysInMonth; dn++) {
    const key = localDay(new Date(now.getFullYear(), now.getMonth(), dn).getTime())
    const b = dayAgg.get(key) || [0, 0, 0, 0, 0]
    const dayProviders = []
    for (const pid of dayProviderIds) {
      if (pid === 'unknown' && !providerDayAgg.has('unknown' + SEP + key)) continue
      const pb = providerDayAgg.get(pid + SEP + key) || [0, 0, 0, 0, 0]
      dayProviders.push({ id: pid, name: pid === 'unknown' ? unknownName : (providerNames.get(pid) || pid), ...bucketsRow(pb), models: modelsOfDay(pid, key) })
    }
    dayProviders.sort((a, b2) => b2.total - a.total)
    const daySessions = []
    for (const [id, sb] of sessionsByDay.get(key) || []) {
      const e = entries.get(id)
      daySessions.push({
        id,
        title: e.view.title,
        live: e.live,
        usage: { uncachedInput: sb[0], cacheRead: sb[2], cacheWrite: sb[3], output: sb[1] },
        grand: grandOf(sb),
        steps: e.view.agg.sd[key] || 0,
        requestCount: e.view.agg.req.filter((r) => localDay(r[0]) === key).length,
      })
    }
    daySessions.sort((a, b2) => b2.grand - a.grand)
    const row = bucketsRow(b)
    days.push({
      date: key,
      day: dn,
      input: row.input,
      output: row.output,
      cacheRead: row.cacheRead,
      cacheWrite: row.cacheWrite,
      total: row.total,
      steps: daySteps.get(key) || 0,
      sessionCount: daySessions.length,
      providers: dayProviders,
      sessions: daySessions,
    })
  }

  rows.sort((a, b2) => b2.grand - a.grand)
  return {
    generatedAt: Date.now(),
    totals,
    providers: providerRows,
    days,
    sessions: rows,
    covered,
    warming,
    verifying,
    failed,
    loading: st.queued.size + st.active.size,
    totalCount: entries.size,
  }
}

/** One session's recent request records (optionally one day) and context pressure. */
async function sessionDetail(ctx, tracker, id, day) {
  let e = tracker.st.entries.get(id)
  if (!e) e = (await tracker.sync()).get(id)
  if (!e || e.state === null) return { id, requests: [], pressure: null }
  const parentId = e.header.parentSession
  const inheritedCounted = e.state.inh !== null && !(parentId && tracker.st.entries.has(parentId))
  const { agg } = sessionAgg(e.state, !e.live, inheritedCounted)
  let req = agg.req
  if (day) req = req.filter((r) => localDay(r[0]) === day).slice(-10)
  else req = req.slice(-20)
  let pressure = null
  try {
    const values = e.live
      ? ctx.get('sessionProjections').snapshot(e.session, ['contextPressure']).values
      : (ctx.get('sessionProjectionCache')?.cachedSnapshot(e.header, ['contextPressure'])?.values || {})
    const p = values.contextPressure
    if (p) pressure = { pressureTokens: p.pressureTokens ?? null, projectedTokens: p.projectedTokens ?? null, contextWindow: p.contextWindow ?? null }
  } catch (err) { /* optional */ }
  return { id, requests: req.slice().reverse().map(requestObject), pressure }
}

/**
 * Cordis plugin entry: registers the projection unit, keeps the cache index in
 * step with session lifecycles, and serves /dsh-512-token.
 */
function apply(ctx, config = {}) {
  const tracker = createTracker(ctx, config)
  const caches = { providers: null }
  ctx.effect(() => () => tracker.dispose(), 'dsh-512-token: stop background reads')

  ctx.inject(['sessionProjections'], (pctx) => {
    pctx.effect(() => pctx.sessionProjections.register(projection), 'dsh-512-token: token usage projection')
  })
  ctx.on('session/disposed', (session) => tracker.onDisposed(session))
  // Verify what changed since the last run shortly after boot, so the page
  // opens complete; after the first full pass this reads only changed logs.
  tracker.scheduleSync(BOOT_SYNC_DELAY_MS)

  // Share one in-flight computation across concurrent polls.
  let inflight = null
  const send = (res, payload) => {
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify(payload))
  }

  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'exact',
      path: '/dsh-512-token',
      handler: async (req, res) => {
        try {
          if (!ctx.get('sessionProjections')) {
            send(res, { error: 'service-unavailable' })
            return
          }
          const url = new URL(req.url || '/dsh-512-token', 'http://localhost')
          const sessionId = url.searchParams.get('session')
          if (sessionId) {
            send(res, await sessionDetail(ctx, tracker, sessionId, url.searchParams.get('day')))
            return
          }
          let task = inflight
          if (task === null) {
            task = buildPayload(ctx, tracker, caches).finally(() => { inflight = null })
            inflight = task
          }
          send(res, await task)
        } catch (e) {
          res.statusCode = 500
          send(res, { error: errorText(e) })
        }
      },
    }), 'dsh-512-token: /dsh-512-token route')
  })
}

const name = '512-token'

export { apply, name, projection, foldLog, KEY, STATE_VERSION }
