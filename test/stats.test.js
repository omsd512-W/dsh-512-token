import assert from 'node:assert/strict'
import { test } from 'node:test'
import { apply } from '../lib/index.js'

test('rc.1 session observations count settled attempts once', async () => {
  const now = Date.now()
  const events = [
    { seq: 0, time: now, type: 'request/header', data: { header: { config: { provider: 'deepseek', model: 'chat' } } } },
    { seq: 1, time: now, type: 'assistant/attempt', data: { turn: 0, step: 0, stream: [{ type: 'chunk', chunk: { type: 'usage', usage: { inputTokens: 2, outputTokens: 3 } } }] } },
    { seq: 2, time: now, type: 'llm/retry-started', data: { turn: 0, step: 0 } },
    { seq: 3, time: now, type: 'assistant/message', data: { turn: 0, step: 0, usage: { inputTokens: 5, outputTokens: 7 }, stream: [] } },
    { seq: 4, time: now, type: 'step/end', data: { turn: 0, step: 0 } },
    { seq: 5, time: now, type: 'assistant/attempt', data: { turn: 0, step: 1, usage: { inputTokens: 100, outputTokens: 100 }, stream: [] } },
    { seq: 6, time: now, type: 'assistant/message', data: { turn: 0, step: 1, usage: { inputTokens: 1, outputTokens: 1 }, stream: [] } },
    { seq: 7, time: now, type: 'step/end', data: { turn: 0, step: 1 } },
  ]
  let route
  let disposals = 0
  let live = true
  const ctx = {
    effect() {},
    get: (name) => ({
      sessionQuery: {
        listSessions: async () => [{ header: { id: 'session-1', createdAt: now }, live, persisted: true }],
        observeSession: async () => ({
          events,
          projections: { values: { tokenUsage: { uncachedInputTokens: 8, outputTokens: 11, cacheReadTokens: 0, cacheWriteTokens: 0 } } },
          [Symbol.dispose]: () => { disposals++ },
        }),
        readTitle: async () => ({ title: 'Test' }),
      },
      llm: { listProviders: () => [{ id: 'deepseek', name: 'DeepSeek' }], listConfigurableProviders: () => [] },
    })[name],
    inject: (_names, callback) => callback({ effect: (register) => register(), webServer: { register: (value) => { route = value } } }),
  }
  apply(ctx)
  assert.equal(route.path, '/dsh-512-token')
  async function read() {
    let payload
    await route.handler({}, { setHeader() {}, end: (body) => { payload = JSON.parse(body) } })
    return payload
  }
  const first = await read()
  assert.equal(first.totals.grand, 19)
  assert.equal(first.providers[0].total, 19)
  assert.equal(first.sessions[0].requests.length, 3)
  const second = await read()
  assert.equal(second.providers[0].total, 19)
  assert.equal(disposals, 2)
  live = false
  await read()
  await read()
  assert.equal(disposals, 3)
})

test('cold history warms without blocking the first response', async () => {
  const now = Date.now()
  let route
  let release
  const observation = new Promise((resolve) => { release = resolve })
  const ctx = {
    effect() {},
    logger: { warn() {} },
    get: (name) => ({
      sessionQuery: {
        listSessions: async () => [{ header: { id: 'cold', createdAt: now }, live: false, persisted: true }],
        observeSession: async () => observation,
        readTitle: async () => ({ title: 'Cold' }),
      },
      llm: { listProviders: () => [], listConfigurableProviders: () => [] },
    })[name],
    inject: (_names, callback) => callback({ effect: (register) => register(), webServer: { register: (value) => { route = value } } }),
  }
  apply(ctx)
  async function read() {
    let payload
    await route.handler({}, { setHeader() {}, end: (body) => { payload = JSON.parse(body) } })
    return payload
  }
  const first = await read()
  assert.equal(first.covered, 0)
  assert.equal(first.warming, 1)
  release({ events: [
    { seq: 0, time: now, type: 'request/header', data: { header: { config: { provider: 'deepseek', model: 'chat' } } } },
    { seq: 1, time: now, type: 'assistant/message', data: { turn: 0, step: 0, usage: { inputTokens: 2, outputTokens: 3 } } },
    { seq: 2, time: now, type: 'step/end', data: { turn: 0, step: 0 } },
  ], projections: { values: {} }, [Symbol.dispose]() {} })
  await new Promise((resolve) => setImmediate(resolve))
  const second = await read()
  assert.equal(second.covered, 1)
  assert.equal(second.warming, 0)
  assert.equal(second.totals.grand, 5)
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
/** dsh's tokenUsage projection folds the WHOLE log, inherited prefix included. */
function wholeLogUsage(events) {
  let input = 0; let output = 0
  for (const e of events) if (e.type === 'assistant/message' && e.data.usage) { input += e.data.usage.inputTokens; output += e.data.usage.outputTokens }
  return { uncachedInputTokens: input, outputTokens: output, cacheReadTokens: 0, cacheWriteTokens: 0 }
}
async function runStats(sessions) {
  let route
  const byId = new Map(sessions.map((s) => [s.id, s]))
  const ctx = {
    effect() {},
    logger: { warn() {} },
    get: (name) => ({
      sessionQuery: {
        listSessions: async () => sessions.map((s) => ({ header: { id: s.id, createdAt: s.createdAt, parentSession: s.parent, isSeeded: !!s.parent }, live: true, persisted: true })),
        observeSession: async (id) => {
          const s = byId.get(id)
          return { events: s.events, projections: { values: { tokenUsage: wholeLogUsage(s.events), sessionStats: { turns: 99, steps: 99, llmMs: 99 } } }, [Symbol.dispose]() {} }
        },
        readTitle: async (id) => ({ title: id }),
      },
      llm: { listProviders: () => [{ id: 'deepseek', name: 'DeepSeek' }], listConfigurableProviders: () => [] },
    })[name],
    inject: (_names, callback) => callback({ effect: (register) => register(), webServer: { register: (value) => { route = value } } }),
  }
  apply(ctx)
  let payload
  await route.handler({}, { setHeader() {}, end: (body) => { payload = JSON.parse(body) } })
  return payload
}
const rowOf = (payload, id) => payload.sessions.find((r) => r.id === id)
const dayTotal = (payload) => payload.days.reduce((n, d) => n + d.total, 0)

test('a fork child does not re-count the usage it inherited from its parent', async () => {
  const t = Date.now() - 60000
  // Parent: two closed steps (10+1, 20+2), then the user forks after the first.
  const parent = [header(0, t), ...stepEvents(1, t, 0, 0, 10, 1), ...stepEvents(4, t, 1, 0, 20, 2)]
  // Fork at seq 3 (end of turn 0), plus an open step the parent left mid-flight
  // is closed by a synthetic step/end, then the child's own turn (300+30).
  const child = forkLog(parent, 3, [
    { time: t + 5000, type: 'step/end', data: { turn: 0, step: 0 } },
    ...stepEvents(0, t + 6000, 2, 0, 300, 30).map(({ seq: _s, ...e }) => e),
  ])
  const payload = await runStats([
    { id: 'parent', createdAt: t, events: parent },
    { id: 'child', createdAt: t + 1, parent: 'parent', events: child },
  ])
  // Real usage: parent 11 + 22, child's own 330. The inherited 11 is not repeated.
  assert.equal(payload.totals.grand, 33 + 330)
  assert.equal(payload.providers.find((p) => p.id === 'deepseek').total, 33 + 330)
  assert.equal(dayTotal(payload), 33 + 330)
  const row = rowOf(payload, 'child')
  assert.equal(row.grand, 330)
  assert.equal(row.seeded, true)
  assert.equal(row.inheritedGrand, 11)
  assert.equal(row.inheritedCounted, false)
  assert.equal(row.steps, 1)       // the synthetic closer is not new work
  assert.equal(row.turns, 1)
  assert.equal(row.llmMs, 1000)    // own step/start -> message only
  assert.equal(rowOf(payload, 'parent').grand, 33)
  assert.equal(payload.totals.steps, 99 + 1)  // parent keeps dsh's sessionStats
})

test('a fork child counts its inherited prefix once when the parent is absent', async () => {
  const t = Date.now() - 60000
  const parent = [header(0, t), ...stepEvents(1, t, 0, 0, 10, 1)]
  const child = forkLog(parent, 3, stepEvents(0, t + 6000, 1, 0, 300, 30).map(({ seq: _s, ...e }) => e))
  const payload = await runStats([{ id: 'child', createdAt: t + 1, parent: 'deleted-parent', events: child }])
  assert.equal(payload.totals.grand, 11 + 330)
  const row = rowOf(payload, 'child')
  assert.equal(row.grand, 11 + 330)
  assert.equal(row.inheritedCounted, true)
})

test('a fork of a fork counts every generation once', async () => {
  const t = Date.now() - 60000
  const a = [header(0, t), ...stepEvents(1, t, 0, 0, 10, 1)]
  const b = forkLog(a, 3, stepEvents(0, t + 6000, 1, 0, 200, 20).map(({ seq: _s, ...e }) => e))
  const c = forkLog(b, b[b.length - 1].seq, stepEvents(0, t + 9000, 2, 0, 3000, 300).map(({ seq: _s, ...e }) => e))
  const all = await runStats([
    { id: 'a', createdAt: t, events: a },
    { id: 'b', createdAt: t + 1, parent: 'a', events: b },
    { id: 'c', createdAt: t + 2, parent: 'b', events: c },
  ])
  assert.equal(all.totals.grand, 11 + 220 + 3300)
  assert.equal(rowOf(all, 'c').grand, 3300)
  assert.equal(rowOf(all, 'c').inheritedGrand, 11 + 220)
  assert.equal(rowOf(all, 'b').grand, 220)
})
