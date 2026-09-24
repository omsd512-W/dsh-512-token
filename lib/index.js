/**
 * dsh-512-token — host half.
 *
 * Incrementally folds every session log (request/header + assistant usage
 * samples) into per-provider / per-day / per-session / per-request aggregates,
 * then serves them over a webserver route that the browser half polls.
 *
 * Mount this package as a row in any dsh profile's cordis.patch.yml:
 *
 *   - insert:
 *       - id: 512-token
 *         name: dsh-512-token
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
    byModel: new Map(),
    byDay: new Map(),
    byProviderDay: new Map(),
    byModelDay: new Map(),
    stepsByDay: new Map(),
    requests: [],
    usage: EMPTY(),
    steps: 0,
    turns: 0,
    lastTurn: null,
    coldValues: null,
    errorMsg: null,
  }
}

function addSample(fold, sample, key) {
  let pb = fold.byProvider.get(sample.provider)
  if (!pb) { pb = EMPTY(); fold.byProvider.set(sample.provider, pb) }
  mergeInto(pb, sample.b)
  const modelKey = (sample.provider || 'unknown') + '\u0000' + (sample.model || '')
  let mb = fold.byModel.get(modelKey)
  if (!mb) { mb = EMPTY(); fold.byModel.set(modelKey, mb) }
  mergeInto(mb, sample.b)
  const day = localDay(sample.time)
  const pdKey = (sample.provider || 'unknown') + '\u0000' + day
  let pdb = fold.byProviderDay.get(pdKey)
  if (!pdb) { pdb = EMPTY(); fold.byProviderDay.set(pdKey, pdb) }
  mergeInto(pdb, sample.b)
  const mdKey = (sample.provider || 'unknown') + '\u0000' + (sample.model || '') + '\u0000' + day
  let mdb = fold.byModelDay.get(mdKey)
  if (!mdb) { mdb = EMPTY(); fold.byModelDay.set(mdKey, mdb) }
  mergeInto(mdb, sample.b)
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
  for (const [k, sample] of fold.pending) {
    if (belowKey !== undefined && k >= belowKey) continue
    fold.pending.delete(k)
    addSample(fold, sample, k)
  }
}

/**
 * Match rc.1 token-meter replacement: an attempt is final only after retry
 * starts or the step closes; a later sample in the same slot replaces it.
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
  if (event.type === 'assistant/message' || event.type === 'assistant/attempt') {
    let usage = data.usage
    if (!usage && Array.isArray(data.stream)) {
      for (let i = data.stream.length - 1; i >= 0; i--) {
        const record = data.stream[i]
        if (record.type === 'chunk' && record.chunk && record.chunk.type === 'usage') {
          usage = record.chunk.usage
          break
        }
      }
    }
    if (usage) fold.pending.set(k, { b: bucketOf(usage), time: event.time, provider: (fold.header && fold.header.provider) || 'unknown', model: fold.header ? fold.header.model : null })
  } else if (event.type === 'llm/retry-started') {
    const sample = fold.pending.get(k)
    if (sample) {
      fold.pending.delete(k)
      addSample(fold, sample, k)
    }
  } else if (event.type === 'step/end') {
    const sample = fold.pending.get(k)
    if (sample) {
      fold.pending.delete(k)
      addSample(fold, sample, k)
    }
    fold.steps += 1
    const stepDay = localDay(event.time)
    fold.stepsByDay.set(stepDay, (fold.stepsByDay.get(stepDay) || 0) + 1)
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
async function computeStats(ctx, folds, titles, caches) {
  const sessionQuery = ctx.get('sessionQuery')
  const llm = ctx.get('llm')
  const settings = ctx.get('settings')
  if (!sessionQuery || !llm) {
    return { error: 'service-unavailable' }
  }

  const records = await sessionQuery.listSessions()
  const totalCount = records.length
  const coveredList = records.slice(0, 200)
  // Only the current month is consumed by the day view; gate all day-keyed
  // aggregation on this prefix so historical days cost nothing per poll.
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

  await pool(coveredList, 6, async (rec) => {
    const id = rec.header.id
    let fold = folds.get(id)
    if (!fold) { fold = makeFold(); folds.set(id, fold) }
    const isLive = rec.live
    let usage = null
    let stats = null
    let pressure = null
    try {
      if (isLive) fold.coldValues = null
      if (fold.coldValues) {
        ({ usage, stats, pressure } = fold.coldValues)
      } else {
        const observation = await sessionQuery.observeSession(id)
        try {
          // ponytail: live observations materialize full logs; switch to handle.read tails if large live sessions make polling slow.
          for (const ev of observation.events) {
            if (ev.seq > fold.lastSeq) {
              foldEvent(fold, ev)
              fold.lastSeq = ev.seq
            }
          }
          if (!isLive) finalizePending(fold)
          const values = observation.projections?.values || {}
          usage = values.tokenUsage || null
          stats = values.sessionStats || null
          pressure = values.contextPressure || null
          if (!isLive) fold.coldValues = { usage, stats, pressure }
        } finally {
          observation[Symbol.dispose]()
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
    for (const [mk, b] of fold.byModel) {
      let ab = modelAgg.get(mk)
      if (!ab) { ab = EMPTY(); modelAgg.set(mk, ab) }
      mergeInto(ab, b)
    }
    for (const [d, b] of fold.byDay) {
      if (!d.startsWith(monthPrefix)) continue
      let db = dayAgg.get(d)
      if (!db) { db = EMPTY(); dayAgg.set(d, db) }
      mergeInto(db, b)
    }
    for (const [d, b] of fold.stepsByDay) {
      if (!d.startsWith(monthPrefix)) continue
      daySteps.set(d, (daySteps.get(d) || 0) + b)
    }
    for (const [pdk, b] of fold.byProviderDay) {
      if (!pdk.slice(pdk.lastIndexOf('\u0000') + 1).startsWith(monthPrefix)) continue
      let ab = providerDayAgg.get(pdk)
      if (!ab) { ab = EMPTY(); providerDayAgg.set(pdk, ab) }
      mergeInto(ab, b)
    }
    for (const [mdk, b] of fold.byModelDay) {
      const mparts = mdk.split('\u0000')
      if (mparts.length !== 3 || !mparts[2].startsWith(monthPrefix)) continue
      let ab = modelDayAgg.get(mdk)
      if (!ab) { ab = EMPTY(); modelDayAgg.set(mdk, ab) }
      mergeInto(ab, b)
    }
    let title = titles.get(id)
    if (title === undefined) {
      try {
        const t = await sessionQuery.readTitle(id)
        title = (t && t.title) || ''
      } catch (e) { title = '' }
      titles.set(id, title)
    }
    // Per-day session rows: the day view's session table (day-scoped buckets
    // from fold.byDay plus that day's steps and recent request records).
    for (const [d, b] of fold.byDay) {
      if (!d.startsWith(monthPrefix)) continue
      let list = sessionsByDay.get(d)
      if (!list) { list = []; sessionsByDay.set(d, list) }
      const dInput = b.input + b.cacheRead + b.cacheWrite
      const dReqs = fold.requests.filter((r) => localDay(r.time) === d).slice(-10).reverse()
      list.push({
        id,
        title,
        live: isLive,
        usage: { uncachedInput: b.input, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, output: b.output },
        grand: dInput + b.output,
        steps: fold.stepsByDay.get(d) || 0,
        requests: dReqs,
      })
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
  // or that actually carried usage. Names/config are cached for a minute —
  // they rarely change, and re-listing them every poll was needless host work.
  const nowTs = Date.now()
  let providerNames
  let configured
  if (caches && caches.providers && (nowTs - caches.providers.ts) < 60000) {
    providerNames = caches.providers.names
    configured = caches.providers.configured
  } else {
    providerNames = new Map()
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
    configured = new Set()
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
    if (caches) caches.providers = { ts: nowTs, names: providerNames, configured }
  }
  const providerIds = new Set([...configured, ...providerAgg.keys()])
  const providerRows = []
  const modelsOf = (id) => {
    const list = []
    for (const [mk, b] of modelAgg) {
      const sep = mk.indexOf('\u0000')
      if (sep === -1 || mk.slice(0, sep) !== id) continue
      const model = mk.slice(sep + 1)
      const mInput = b.input + b.cacheRead + b.cacheWrite
      list.push({ model: model || null, input: mInput, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, total: mInput + b.output })
    }
    list.sort((a, b2) => b2.total - a.total)
    return list
  }
  for (const id of providerIds) {
    if (id === 'unknown') continue
    const b = providerAgg.get(id) || EMPTY()
    const inputTotal = b.input + b.cacheRead + b.cacheWrite
    providerRows.push({ id, name: providerNames.get(id) || id, input: inputTotal, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, reasoning: b.reasoning, total: inputTotal + b.output, models: modelsOf(id) })
  }
  if (providerAgg.has('unknown')) {
    const b = providerAgg.get('unknown')
    const inputTotal = b.input + b.cacheRead + b.cacheWrite
    providerRows.push({ id: 'unknown', name: '未知/未记录', input: inputTotal, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, reasoning: b.reasoning, total: inputTotal + b.output, models: modelsOf('unknown') })
  }
  providerRows.sort((a, b2) => b2.total - a.total)

  // Current month, from the 1st to the end of the month (future days empty).
  // Every day carries a complete day-scoped view (providers, models, sessions)
  // so the browser panel can sync its whole surface to one selected date.
  const days = []
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const modelsOfDay = (pid, key) => {
    const list = []
    for (const [mdk, b] of modelDayAgg) {
      const parts = mdk.split('\u0000')
      if (parts.length !== 3 || parts[0] !== pid || parts[2] !== key) continue
      const mInput = b.input + b.cacheRead + b.cacheWrite
      list.push({ model: parts[1] || null, input: mInput, output: b.output, cacheRead: b.cacheRead, cacheWrite: b.cacheWrite, total: mInput + b.output })
    }
    list.sort((a, b2) => b2.total - a.total)
    return list
  }
  const dayProviderIds = new Set([...configured, ...providerAgg.keys()])
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(now.getFullYear(), now.getMonth(), d)
    const key = localDay(date.getTime())
    const b = dayAgg.get(key) || EMPTY()
    const dayProviders = []
    for (const pid of dayProviderIds) {
      if (pid === 'unknown' && !providerDayAgg.has('unknown\u0000' + key)) continue
      const pb = providerDayAgg.get(pid + '\u0000' + key) || EMPTY()
      const pInput = pb.input + pb.cacheRead + pb.cacheWrite
      dayProviders.push({ id: pid, name: pid === 'unknown' ? '未知/未记录' : (providerNames.get(pid) || pid), input: pInput, output: pb.output, cacheRead: pb.cacheRead, cacheWrite: pb.cacheWrite, total: pInput + pb.output, models: modelsOfDay(pid, key) })
    }
    dayProviders.sort((a, b2) => b2.total - a.total)
    const daySessions = (sessionsByDay.get(key) || []).slice().sort((a, b2) => b2.grand - a.grand)
    days.push({
      date: key,
      day: d,
      input: b.input + b.cacheRead + b.cacheWrite,
      output: b.output,
      cacheRead: b.cacheRead,
      cacheWrite: b.cacheWrite,
      total: b.input + b.output + b.cacheRead + b.cacheWrite,
      steps: daySteps.get(key) || 0,
      sessionCount: daySessions.length,
      providers: dayProviders,
      sessions: daySessions,
    })
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
 * Cordis plugin entry. Registers the /dsh-512-token webserver route once the
 * webServer service is available (activation order is service-driven, so the
 * route registration waits on the service instead of racing it).
 */
function apply(ctx) {
  const folds = new Map()
  const titles = new Map()
  const caches = { providers: { ts: 0, names: new Map(), configured: new Set() } }

  // Share one in-flight computation across concurrent polls (the browser fires
  // an immediate refresh on session change in addition to its 10s interval, so
  // they can overlap on a slow first load).
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
          let task = inflight
          if (task === null) {
            task = computeStats(ctx, folds, titles, caches).finally(() => { inflight = null })
            inflight = task
          }
          send(res, await task)
        } catch (e) {
          res.statusCode = 500
          send(res, { error: ((e && e.message) || String(e)) })
        }
      },
    }), 'dsh-512-token: /dsh-512-token route')
  })
}

const name = '512-token'

export { apply, name }
