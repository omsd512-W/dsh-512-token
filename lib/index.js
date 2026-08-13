/**
 * dsh-token-stats — host half.
 *
 * Incrementally folds every session log (request/header + assistant usage
 * samples) into per-provider / per-day / per-session / per-request aggregates,
 * then serves them over a webserver route that the browser half polls.
 *
 * Mount this package as a row in any dsh profile's cordis.patch.yml:
 *
 *   - insert:
 *       - id: token-stats
 *         name: dsh-token-stats
 *
 * The client half (lib/client.js) is picked up automatically because the
 * package declares `dsh.client` in package.json.
 */

// ---- pure helpers ----
const EMPTY = () => ({ input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 })
const stepKey = (turn, step) => turn * 1000000 + step
const pad = (n) => (n < 10 ? '0' : '') + n
const localDay = (t) => {
  const d = new Date(t)
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
const bucketOf = (u) => ({
  input: u.inputTokens || 0,
  output: u.outputTokens || 0,
  cacheRead: u.cacheReadTokens || 0,
  cacheWrite: u.cacheWriteTokens || 0,
  reasoning: u.reasoningTokens || 0,
})
const mergeInto = (target, b) => {
  target.input += b.input
  target.output += b.output
  target.cacheRead += b.cacheRead
  target.cacheWrite += b.cacheWrite
  target.reasoning += b.reasoning
}

function makeFold() {
  return {
    lastSeq: -1,
    lastStepKey: -1,
    header: null,
    pending: new Map(),
    byProvider: new Map(),
    byDay: new Map(),
    requests: [],
    usage: EMPTY(),
    steps: 0,
    turns: 0,
    lastTurn: null,
    cold: false,
    errorMsg: null,
  }
}

function addSample(fold, sample, key) {
  let pb = fold.byProvider.get(sample.provider)
  if (!pb) { pb = EMPTY(); fold.byProvider.set(sample.provider, pb) }
  mergeInto(pb, sample.b)
  const day = localDay(sample.time)
  let db = fold.byDay.get(day)
  if (!db) { db = EMPTY(); fold.byDay.set(day, db) }
  mergeInto(db, sample.b)
  mergeInto(fold.usage, sample.b)
  if (key !== undefined) {
    fold.requests.push({
      time: sample.time,
      provider: sample.provider,
      model: sample.model || null,
      turn: Math.floor(key / 1000000),
      step: key % 1000000,
      input: sample.b.input,
      output: sample.b.output,
      cacheRead: sample.b.cacheRead,
      cacheWrite: sample.b.cacheWrite,
      reasoning: sample.b.reasoning,
    })
    if (fold.requests.length > 40) fold.requests.shift()
  }
}

function finalizePending(fold, belowKey) {
  for (const [k, sample] of Array.from(fold.pending)) {
    if (belowKey !== undefined && k >= belowKey) continue
    fold.pending.delete(k)
    addSample(fold, sample, k)
  }
}

/**
 * Mirrors the token-meter projection: chunk 'usage' samples are an early
 * per-step value, assistant/message replaces it, step/end finalizes it.
 */
function foldEvent(fold, event) {
  const data = event.data
  if (!data) return
  if (event.type === 'request/header' && data.header && data.header.config) {
    fold.header = { provider: data.header.config.provider, model: data.header.config.model }
    return
  }
  const turn = data.turn
  const step = data.step
  if (typeof turn !== 'number' || typeof step !== 'number') return
  const k = stepKey(turn, step)
  if (k !== fold.lastStepKey) {
    finalizePending(fold, k)
    fold.lastStepKey = k
  }
  if (event.type === 'assistant/chunk' && data.chunk && data.chunk.type === 'usage' && data.chunk.usage) {
    fold.pending.set(k, { b: bucketOf(data.chunk.usage), time: event.time, provider: (fold.header && fold.header.provider) || 'unknown', model: fold.header ? fold.header.model : null })
  } else if (event.type === 'assistant/message' && data.usage) {
    fold.pending.set(k, { b: bucketOf(data.usage), time: event.time, provider: (fold.header && fold.header.provider) || 'unknown', model: fold.header ? fold.header.model : null })
  } else if (event.type === 'step/end') {
    const sample = fold.pending.get(k)
    if (sample) {
      fold.pending.delete(k)
      addSample(fold, sample, k)
    }
    fold.steps += 1
    if (fold.lastTurn !== turn) {
      fold.lastTurn = turn
      fold.turns += 1
    }
  }
}

async function pool(items, limit, fn) {
  const queue = items.slice()
  const workers = []
  const n = Math.min(limit, queue.length)
  for (let i = 0; i < n; i++) {
    workers.push((async () => {
      while (queue.length) {
        const item = queue.shift()
        await fn(item)
      }
    })())
  }
  await Promise.all(workers)
}

/**
 * Compute the full statistics payload. Pure function over the host services;
 * shared by the HTTP route handler.
 */
async function computeStats(ctx, folds, titles) {
  const sessionQuery = ctx.get('sessionQuery')
  const projections = ctx.get('sessionProjections')
  const cache = ctx.get('sessionProjectionCache')
  const sessionsSvc = ctx.get('sessions')
  const persistence = ctx.get('sessionPersistence')
  const llm = ctx.get('llm')
  const settings = ctx.get('settings')
  if (!sessionQuery || !projections || !cache || !sessionsSvc || !persistence || !llm) {
    return { error: 'service-unavailable' }
  }
  const records = await sessionQuery.listSessions()
  const liveSet = new Set(sessionsSvc.list().map((s) => s.id))
  const totalCount = records.length
  const coveredList = records.slice(0, 200)

  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, grand: 0, steps: 0, turns: 0 }
  const providerAgg = new Map()
  const dayAgg = new Map()
  const rows = []

  await pool(coveredList, 6, async (rec) => {
    const id = rec.header.id
    let fold = folds.get(id)
    if (!fold) { fold = makeFold(); folds.set(id, fold) }
    const isLive = liveSet.has(id)
    let usage = null
    let stats = null
    let pressure = null
    try {
      if (isLive) {
        // Delta-fold the full log each poll (headers always precede samples,
        // so provider attribution is exact). readSession is live-preferred.
        const log = await sessionQuery.readSession(id)
        for (const ev of log.events) {
          if (ev.seq > fold.lastSeq) {
            foldEvent(fold, ev)
            fold.lastSeq = ev.seq
          }
        }
        try {
          const session = sessionsSvc.get(id)
          if (session) {
            const snap = projections.snapshot(session)
            usage = snap.values.tokenUsage || null
            stats = snap.values.sessionStats || null
            pressure = snap.values.contextPressure || null
          }
        } catch (e) {
          usage = null
          stats = null
          pressure = null
          if (!fold.errorMsg) fold.errorMsg = 'projection: ' + ((e && e.message) || String(e))
        }
      } else {
        if (!fold.cold) {
          const read = await persistence.readFrom(id, 0)
          for (const ev of read.events) {
            if (ev.seq > fold.lastSeq) {
              foldEvent(fold, ev)
              fold.lastSeq = ev.seq
            }
          }
          for (const [k, sample] of fold.pending) addSample(fold, sample, k)
          fold.pending.clear()
          fold.cold = true
        }
        try {
          const snap = await cache.coldSnapshot(id)
          usage = snap.values.tokenUsage || null
          stats = snap.values.sessionStats || null
          pressure = snap.values.contextPressure || null
        } catch (e) {
          usage = null
          stats = null
          pressure = null
          if (!fold.errorMsg) fold.errorMsg = 'coldSnapshot: ' + ((e && e.message) || String(e))
        }
      }
    } catch (e) {
      if (!fold.errorMsg) fold.errorMsg = ((e && e.message) || String(e))
    }
    for (const [p, b] of fold.byProvider) {
      let ab = providerAgg.get(p)
      if (!ab) { ab = EMPTY(); providerAgg.set(p, ab) }
      mergeInto(ab, b)
    }
    for (const [d, b] of fold.byDay) {
      let db = dayAgg.get(d)
      if (!db) { db = EMPTY(); dayAgg.set(d, db) }
      mergeInto(db, b)
    }
    let title = titles.get(id)
    if (title === undefined) {
      try {
        const t = await sessionQuery.readTitle(id)
        title = (t && t.title) || ''
      } catch (e) { title = '' }
      titles.set(id, title)
    }
    const u = usage || { uncachedInputTokens: fold.usage.input, outputTokens: fold.usage.output, cacheReadTokens: fold.usage.cacheRead, cacheWriteTokens: fold.usage.cacheWrite }
    const s = stats || { turns: fold.turns, steps: fold.steps, llmMs: 0 }
    const inputTotal = (u.uncachedInputTokens || 0) + (u.cacheReadTokens || 0) + (u.cacheWriteTokens || 0)
    const grand = inputTotal + (u.outputTokens || 0)
    totals.input += inputTotal
    totals.output += u.outputTokens || 0
    totals.cacheRead += u.cacheReadTokens || 0
    totals.cacheWrite += u.cacheWriteTokens || 0
    totals.grand += grand
    totals.steps += s.steps || 0
    totals.turns += s.turns || 0
    const requests = fold.requests.slice(-20).reverse()
    rows.push({
      id,
      title,
      live: isLive,
      persisted: !!rec.persisted,
      createdAt: rec.header.createdAt,
      usage: {
        uncachedInput: u.uncachedInputTokens || 0,
        cacheRead: u.cacheReadTokens || 0,
        cacheWrite: u.cacheWriteTokens || 0,
        output: u.outputTokens || 0,
      },
      grand,
      steps: s.steps || 0,
      turns: s.turns || 0,
      llmMs: s.llmMs || 0,
      lastProvider: fold.header ? fold.header.provider : null,
      lastModel: fold.header ? fold.header.model : null,
      pressure: pressure ? {
        pressureTokens: pressure.pressureTokens === undefined ? null : pressure.pressureTokens,
        projectedTokens: pressure.projectedTokens === undefined ? null : pressure.projectedTokens,
        contextWindow: pressure.contextWindow === undefined ? null : pressure.contextWindow,
      } : null,
      requests,
      error: !!fold.errorMsg,
      errorMsg: fold.errorMsg,
    })
  })

  // Provider roster: only providers that are CONFIGURED (settings sections)
  // or that actually carried usage.
  const providerNames = new Map()
  try {
    const infos = await llm.listProviders()
    for (const info of infos) providerNames.set(info.id, info.name || info.id)
  } catch (e) { /* ignore */ }
  try {
    const cfg = await llm.listConfigurableProviders()
    for (const c of cfg) {
      if (!providerNames.has(c.provider)) providerNames.set(c.provider, c.displayName || c.provider)
    }
  } catch (e) { /* ignore */ }
  const configured = new Set()
  if (settings) {
    try {
      const pi = settings.get('llm-pi-ai')
      if (pi && pi.providers && typeof pi.providers === 'object') {
        for (const k of Object.keys(pi.providers)) configured.add(k)
      }
    } catch (e) { /* ignore */ }
    try {
      const dl = settings.get('llm-deepseek')
      if (dl && typeof dl === 'object') configured.add('deepseek-official')
    } catch (e) { /* ignore */ }
  }
  const providerIds = new Set([...configured, ...providerAgg.keys()])
  const providerRows = []
  for (const id of providerIds) {
    if (id === 'unknown') continue
    const b = providerAgg.get(id) || EMPTY()
    const inputTotal = b.input + b.cacheRead + b.cacheWrite
    providerRows.push({ id, name: providerNames.get(id) || id, input: inputTotal, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, reasoning: b.reasoning, total: inputTotal + b.output })
  }
  if (providerAgg.has('unknown')) {
    const b = providerAgg.get('unknown')
    const inputTotal = b.input + b.cacheRead + b.cacheWrite
    providerRows.push({ id: 'unknown', name: '未知/未记录', input: inputTotal, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, reasoning: b.reasoning, total: inputTotal + b.output })
  }
  providerRows.sort((a, b2) => b2.total - a.total)

  // Last 30 days.
  const days = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = localDay(d.getTime())
    const b = dayAgg.get(key) || EMPTY()
    days.push({ date: key, input: b.input + b.cacheRead + b.cacheWrite, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, total: b.input + b.output + b.cacheRead + b.cacheWrite })
  }

  rows.sort((a, b2) => b2.grand - a.grand)
  return {
    generatedAt: Date.now(),
    totals: { ...totals },
    providers: providerRows,
    days,
    sessions: rows,
    covered: coveredList.length,
    totalCount,
  }
}

/**
 * Cordis plugin entry. Registers the /token-stats webserver route once the
 * webServer service is available (activation order is service-driven, so the
 * route registration waits on the service instead of racing it).
 */
function apply(ctx) {
  const folds = new Map()
  const titles = new Map()

  ctx.inject(['webServer'], (httpCtx) => {
    httpCtx.effect(() => httpCtx.webServer.register({
      kind: 'exact',
      path: '/token-stats',
      handler: async (req, res) => {
        try {
          const payload = await computeStats(ctx, folds, titles)
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.setHeader('cache-control', 'no-store')
          res.end(JSON.stringify(payload))
        } catch (e) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: ((e && e.message) || String(e)) }))
        }
      },
    }), 'dsh-token-stats: /token-stats route')
  })
}

const name = 'token-stats'

export { apply, name }
