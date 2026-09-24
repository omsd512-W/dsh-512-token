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
