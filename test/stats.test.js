import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { apply, foldLog, KEY, projection, STATE_VERSION } from '../lib/index.js'

const tmp = mkdtempSync(join(tmpdir(), 'dsh-512-token-'))
after(() => rmSync(tmp, { recursive: true, force: true }))
let fileSeq = 0
const indexFile = () => join(tmp, 'verified-' + (++fileSeq) + '.json')
const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

/**
 * A small dsh host: sessions (live), persistence (stored logs with sizes),
 * session query (cold observations), the projection registry and a projection
 * cache whose rows behave like the real one's (whole-record writes that land
 * asynchronously).
 */
function createHost({ stored = [], live = [], cacheTable = new Map() } = {}) {
  const calls = { observe: 0 }
  const byId = new Map(stored.map((s) => [s.id, s]))
  let definition = null
  const headerOf = (s) => ({ id: s.id, createdAt: s.createdAt, isSeeded: (s.iec || 0) > 0, ...(s.parent ? { parentSession: s.parent } : {}) })
  const liveSession = (s) => ({ id: s.id, header: headerOf(s), seq: s.events.length, inheritedEventCount: s.iec || 0, events: s.events })
  const cache = {
    requireTable: () => cacheTable,
    coldSnapshot(header, iec, events) {
      const seq = events.length ? events[events.length - 1].seq : -1
      const val = JSON.parse(JSON.stringify(foldLog(iec, events)))
      const record = { identity: { createdAt: header.createdAt, isSeeded: header.isSeeded, inheritedEventCount: iec }, rows: { other: { ver: 1, seq, val: 1 }, [KEY]: { ver: STATE_VERSION, seq, val } } }
      setTimeout(() => cacheTable.set(header.id, record), 1)
      return { asOfSeq: seq, values: {} }
    },
    cachedSnapshot: () => undefined,
  }
  const registry = {
    register(def) { definition = def; return () => { definition = null } },
    stateOf(session, key) {
      if (!definition || key !== definition.key) return undefined
      let state = definition.init(session.header, session.inheritedEventCount)
      for (const e of session.events) state = definition.apply(state, e)
      return state
    },
    snapshot: () => ({ asOfSeq: -1, values: {} }),
  }
  const services = {
    sessions: { list: () => live.map(liveSession) },
    sessionPersistence: { list: async () => stored.map((s) => ({ header: headerOf(s), revision: 'r' + (s.size ?? s.events.length), sizeBytes: s.size ?? s.events.length * 100 })) },
    sessionQuery: {
      observeSession: async (id) => {
        calls.observe++
        const s = byId.get(id)
        if (s.gate) await s.gate
        return { source: 'prepared', header: headerOf(s), inheritedEventCount: s.iec || 0, events: s.events, [Symbol.dispose]() {} }
      },
    },
    sessionProjectionCache: cache,
    sessionProjections: registry,
    llm: { listProviders: () => [{ id: 'deepseek', name: 'DeepSeek' }], listConfigurableProviders: () => [] },
  }
  let route
  const disposers = []
  const ctx = {
    effect: (fn) => { disposers.push(fn()) },
    on() {},
    logger: { warn() {} },
    get: (name) => services[name],
    inject: (names, callback) => {
      const child = { effect: (fn) => fn() }
      for (const n of names) child[n] = services[n]
      child.webServer = { register: (value) => { route = value } }
      callback(child)
    },
  }
  return {
    calls,
    cacheTable,
    services,
    start(file) {
      apply(ctx, { indexFile: file })
      assert.equal(definition.key, KEY)
      return this
    },
    stop() { for (const d of disposers) if (typeof d === 'function') d() },
    async read(query = '') {
      let payload
      await route.handler({ url: '/dsh-512-token' + query }, { setHeader() {}, end: (body) => { payload = JSON.parse(body) } })
      return payload
    },
  }
}

const usageEvents = (now) => [
  { seq: 0, time: now, type: 'request/header', data: { header: { config: { provider: 'deepseek', model: 'chat' } } } },
  { seq: 1, time: now, type: 'assistant/attempt', data: { turn: 0, step: 0, stream: [{ type: 'chunk', chunk: { type: 'usage', usage: { inputTokens: 2, outputTokens: 3 } } }] } },
  { seq: 2, time: now, type: 'llm/retry-started', data: { turn: 0, step: 0 } },
  { seq: 3, time: now, type: 'assistant/message', data: { turn: 0, step: 0, usage: { inputTokens: 5, outputTokens: 7 }, stream: [] } },
  { seq: 4, time: now, type: 'step/end', data: { turn: 0, step: 0 } },
  { seq: 5, time: now, type: 'assistant/attempt', data: { turn: 0, step: 1, usage: { inputTokens: 100, outputTokens: 100 }, stream: [] } },
  { seq: 6, time: now, type: 'assistant/message', data: { turn: 0, step: 1, usage: { inputTokens: 1, outputTokens: 1 }, stream: [] } },
  { seq: 7, time: now, type: 'step/end', data: { turn: 0, step: 1 } },
  { seq: 8, time: now, type: 'session/title', data: { title: 'Test' } },
]

test('the projection counts settled attempts once and returns the same state for foreign events', () => {
  const now = Date.now()
  const state = foldLog(0, usageEvents(now))
  assert.deepEqual(state.own.u, [8, 11, 0, 0, 0])
  assert.equal(state.own.steps, 2)
  assert.equal(state.own.req.length, 3)
  assert.equal(state.title, 'Test')
  assert.equal(projection.apply(state, { seq: 9, time: now, type: 'todo/write', data: { todos: [] } }), state)
  assert.equal(projection.apply(state, { seq: 9, time: now, type: 'tool/call', data: { turn: 0, step: 1, callId: 'x', name: 'n', arguments: '' } }), state)
  // Plain JSON, and the schema round-trips it.
  assert.deepEqual(projection.stateSchema.parse(JSON.parse(JSON.stringify(state))), state)
  assert.throws(() => projection.stateSchema.parse({ nope: true }))
})

test('a live session is read from the registry without log reads', async () => {
  const now = Date.now()
  const host = createHost({ live: [{ id: 'live-1', createdAt: now, events: usageEvents(now) }] }).start(indexFile())
  const payload = await host.read()
  assert.equal(payload.totals.grand, 19)
  assert.equal(payload.providers[0].total, 19)
  assert.equal(payload.sessions[0].title, 'Test')
  assert.equal(payload.sessions[0].live, true)
  assert.equal(host.calls.observe, 0)
  const detail = await host.read('?session=live-1')
  assert.equal(detail.requests.length, 3)
  assert.equal(detail.requests[0].input, 1) // newest first
  host.stop()
})

test('cold history is read once, cached, and served from the cache after a restart', async () => {
  const now = Date.now()
  let release
  const gate = new Promise((resolve) => { release = resolve })
  const events = usageEvents(now)
  const cacheTable = new Map()
  const file = indexFile()
  const first = createHost({ stored: [{ id: 'cold', createdAt: now, events, gate }], cacheTable }).start(file)
  const p1 = await first.read()
  assert.equal(p1.covered, 0)
  assert.equal(p1.warming, 1)
  release()
  await tick()
  await tick()
  const p2 = await first.read()
  assert.equal(p2.covered, 1)
  assert.equal(p2.warming, 0)
  assert.equal(p2.totals.grand, 19)
  assert.equal(first.calls.observe, 1)
  assert.equal(cacheTable.get('cold').rows[KEY].ver, STATE_VERSION)
  first.stop()
  await tick()
  assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).sessions, { cold: 's' + events.length * 100 })

  // Restart: the verified row answers without reading the log again.
  const second = createHost({ stored: [{ id: 'cold', createdAt: now, events }], cacheTable }).start(file)
  const p3 = await second.read()
  assert.equal(p3.covered, 1)
  assert.equal(p3.verifying, 0)
  assert.equal(p3.totals.grand, 19)
  assert.equal(p3.sessions[0].pending, false)
  assert.equal(second.calls.observe, 0)
  second.stop()
})

test('a row whose log grew since it was verified is shown, then re-read', async () => {
  const now = Date.now()
  const events = usageEvents(now)
  const cacheTable = new Map()
  const file = indexFile()
  const first = createHost({ stored: [{ id: 's', createdAt: now, events }], cacheTable }).start(file)
  await first.read()
  await tick(); await tick()
  assert.equal((await first.read()).totals.grand, 19)
  first.stop()
  await tick()

  // The log gained a step that the cached row never saw (dsh killed mid-turn).
  const grown = [...events,
    { seq: 9, time: now, type: 'assistant/message', data: { turn: 1, step: 0, usage: { inputTokens: 100, outputTokens: 0 } } },
    { seq: 10, time: now, type: 'step/end', data: { turn: 1, step: 0 } }]
  const second = createHost({ stored: [{ id: 's', createdAt: now, events: grown }], cacheTable }).start(file)
  const stale = await second.read()
  assert.equal(stale.totals.grand, 19)
  assert.equal(stale.sessions[0].pending, true)
  await tick(); await tick()
  const fresh = await second.read()
  assert.equal(fresh.totals.grand, 119)
  assert.equal(second.calls.observe, 1)
  second.stop()
})

// ---- fork children: the inherited prefix must be counted once ----

const header = (seq, time) => ({ seq, time, type: 'request/header', data: { header: { config: { provider: 'deepseek', model: 'chat' } } } })
/** One closed step: step/start, assistant/message with usage, step/end. */
function stepEvents(seq, time, turn, step, input, output) {
  return [
    { seq, time, type: 'step/start', data: { turn, step } },
    { seq: seq + 1, time: time + 1000, type: 'assistant/message', data: { turn, step, usage: { inputTokens: input, outputTokens: output } } },
    { seq: seq + 2, time: time + 1000, type: 'step/end', data: { turn, step } },
  ]
}
/** A fork child's log: the parent's prefix through `boundary`, the tagged cut, then its own events. */
function forkLog(parentEvents, boundary, ownEvents) {
  const prefix = parentEvents.filter((e) => e.seq <= boundary)
  let seq = boundary + 1
  const cut = { seq: seq++, time: prefix[prefix.length - 1].time, type: 'session/end-seed', data: { inherited: true } }
  return [...prefix, cut, ...ownEvents.map((e) => ({ ...e, seq: seq++ }))]
}
/** The exact inherited prefix length dsh records for a fork: the final tagged marker's seq. */
const iecOf = (events) => {
  let cut = 0
  for (const e of events) if (e.type === 'session/end-seed' && e.data.inherited === true) cut = e.seq
  return cut
}
async function runStats(sessions, { exactCut = true } = {}) {
  const host = createHost({ live: sessions.map((s) => ({ ...s, iec: exactCut ? iecOf(s.events) : 0 })) }).start(indexFile())
  const payload = await host.read()
  host.stop()
  return payload
}
const rowOf = (payload, id) => payload.sessions.find((r) => r.id === id)
const dayTotal = (payload) => payload.days.reduce((n, d) => n + d.total, 0)

for (const exactCut of [true, false]) {
  const label = exactCut ? '' : ' (log without a recorded cut)'

  test('a fork child does not re-count the usage it inherited from its parent' + label, async () => {
    const t = Date.now() - 60000
    // Parent: two closed steps (10+1, 20+2), then the user forks after the first.
    const parent = [header(0, t), ...stepEvents(1, t, 0, 0, 10, 1), ...stepEvents(4, t, 1, 0, 20, 2)]
    // Fork at seq 3 (end of turn 0), plus a synthetic closer for a step the
    // parent had open, then the child's own turn (300+30).
    const child = forkLog(parent, 3, [
      { time: t + 5000, type: 'step/end', data: { turn: 0, step: 0 } },
      ...stepEvents(0, t + 6000, 2, 0, 300, 30).map(({ seq: _s, ...e }) => e),
    ])
    const payload = await runStats([
      { id: 'parent', createdAt: t, events: parent },
      { id: 'child', createdAt: t + 1, parent: 'parent', events: child },
    ], { exactCut })
    // Real usage: parent 11 + 22, child's own 330. The inherited 11 is not repeated.
    assert.equal(payload.totals.grand, 33 + 330)
    assert.equal(payload.providers.find((p) => p.id === 'deepseek').total, 33 + 330)
    assert.equal(dayTotal(payload), 33 + 330)
    const row = rowOf(payload, 'child')
    assert.equal(row.grand, 330)
    assert.equal(row.seeded, true)
    assert.equal(row.inheritedGrand, 11)
    assert.equal(row.inheritedCounted, false)
    assert.equal(row.steps, 1) // the synthetic closer is not new work
    assert.equal(row.turns, 1)
    assert.equal(row.llmMs, 1000) // own step/start -> message only
    assert.equal(rowOf(payload, 'parent').grand, 33)
    assert.equal(payload.totals.steps, 2 + 1)
  })

  test('a fork child counts its inherited prefix once when the parent is gone' + label, async () => {
    const t = Date.now() - 60000
    const parent = [header(0, t), ...stepEvents(1, t, 0, 0, 10, 1)]
    const child = forkLog(parent, 3, stepEvents(0, t + 6000, 1, 0, 300, 30).map(({ seq: _s, ...e }) => e))
    const payload = await runStats([{ id: 'child', createdAt: t + 1, parent: 'deleted-parent', events: child }], { exactCut })
    assert.equal(payload.totals.grand, 11 + 330)
    const row = rowOf(payload, 'child')
    assert.equal(row.grand, 11 + 330)
    assert.equal(row.inheritedCounted, true)
  })

  test('a fork of a fork counts every generation once' + label, async () => {
    const t = Date.now() - 60000
    const a = [header(0, t), ...stepEvents(1, t, 0, 0, 10, 1)]
    const b = forkLog(a, 3, stepEvents(0, t + 6000, 1, 0, 200, 20).map(({ seq: _s, ...e }) => e))
    const c = forkLog(b, b[b.length - 1].seq, stepEvents(0, t + 9000, 2, 0, 3000, 300).map(({ seq: _s, ...e }) => e))
    const all = await runStats([
      { id: 'a', createdAt: t, events: a },
      { id: 'b', createdAt: t + 1, parent: 'a', events: b },
      { id: 'c', createdAt: t + 2, parent: 'b', events: c },
    ], { exactCut })
    assert.equal(all.totals.grand, 11 + 220 + 3300)
    assert.equal(rowOf(all, 'c').grand, 3300)
    assert.equal(rowOf(all, 'c').inheritedGrand, 11 + 220)
    assert.equal(rowOf(all, 'b').grand, 220)
  })
}
