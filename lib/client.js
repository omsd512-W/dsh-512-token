/* dsh-512-token — browser half.
 *
 * Bundled in the shell module-table format: window.__ModuleLoader__.load()
 * with a factory receiving the module `require`. The kernel adopts the
 * exported `apply`/`inject` as a Cordis client plugin.
 *
 * Renders the statistics as a page of the Settings panel (`settings.section`)
 * and polls the host route only while that page is open.
 */
window.__ModuleLoader__.load({
  id: 'dsh-512-token',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')
    var h = React.createElement

    var css = [
      '.tkn-theme-dark{--tkn-line1:rgba(255,255,255,.08);--tkn-line2:rgba(255,255,255,.16);--tkn-text:#e9eaee;--tkn-text2:#9ba1ac;--tkn-brand:#4f8dff;--tkn-err:#f2555a;--tkn-ok:#4cb782;--tkn-fill:rgba(255,255,255,.035);--tkn-fill2:rgba(255,255,255,.06)}',
      '.tkn-theme-light{--tkn-line1:rgba(20,24,32,.1);--tkn-line2:rgba(20,24,32,.2);--tkn-text:#1c2028;--tkn-text2:#6b7280;--tkn-brand:#2f6bff;--tkn-err:#d92d32;--tkn-ok:#1f9d61;--tkn-fill:rgba(20,24,32,.03);--tkn-fill2:rgba(20,24,32,.06)}',
      '.tkn-page{color:var(--dsw-alias-label-primary,var(--tkn-text));font-size:13px;padding-bottom:8px}',
      '.tkn-page *{box-sizing:border-box}',
      '.tkn-head{display:flex;align-items:center;gap:8px;margin:0 0 4px}',
      '.tkn-title{font-size:16px;font-weight:500;line-height:24px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-btn{border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:2px 10px;cursor:pointer;font-size:12px;line-height:1.6;flex:none;font-family:inherit}',
      '.tkn-btn:hover{color:var(--dsw-alias-label-primary,var(--tkn-text));border-color:var(--dsw-alias-border-l2,var(--tkn-line2))}',
      '.tkn-status{color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;line-height:18px;margin:0 0 12px}',
      '.tkn-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
      '.tkn-card{background:var(--tkn-fill);border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;padding:7px 9px;min-width:0}',
      '.tkn-card .k{color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-card .v{font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-sec{margin:16px 0 6px;font-weight:600;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;letter-spacing:.04em}',
      '.tkn-cur{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--tkn-fill);border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;margin-top:10px}',
      '.tkn-cur .name{font-weight:600}',
      '.tkn-cur .nums{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-prov{display:flex;align-items:center;gap:8px;padding:6px 2px;border-bottom:.5px solid var(--dsw-alias-border-l2,var(--tkn-line1));cursor:pointer}',
      '.tkn-prov:hover{background:var(--tkn-fill)}',
      '.tkn-arrow{flex:none;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;width:12px;text-align:center}',
      '.tkn-prov-detail{padding:6px 2px 10px 20px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:13px;line-height:1.6;font-variant-numeric:tabular-nums;border-bottom:.5px solid var(--dsw-alias-border-l2,var(--tkn-line1))}',
      '.tkn-prov-models-label{margin-top:10px;font-weight:600;color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-prov-model{padding:5px 0 6px}',
      '.tkn-prov-model-name{color:var(--dsw-alias-label-primary,var(--tkn-text));font-weight:600;margin-bottom:2px}',
      '.tkn-prov.cur .tkn-pname{color:var(--dsw-alias-brand-primary,var(--tkn-brand));font-weight:600}',
      '.tkn-pname{min-width:92px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.tkn-pnums{flex:1;min-width:0;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12.5px;line-height:1.55}',
      '.tkn-heat{display:grid;grid-template-columns:repeat(10,1fr);gap:7px}',
      '.tkn-cell{aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-variant-numeric:tabular-nums;background:var(--tkn-fill2);min-width:0;cursor:pointer}',
      '.tkn-cell.today{outline:1px solid var(--dsw-alias-brand-primary,var(--tkn-brand));outline-offset:1px}',
      '.tkn-cell.selected{outline:2px solid var(--dsw-alias-brand-primary,var(--tkn-brand));outline-offset:1px}',
      '.tkn-heat-cap{font-size:11px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));margin-top:6px;display:flex;justify-content:space-between}',
      '.tkn-heat-head{display:flex;align-items:center;justify-content:space-between}',
      '.tkn-day-detail{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 8px;padding:8px 10px;background:var(--tkn-fill);border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;font-size:12.5px;font-variant-numeric:tabular-nums}',
      '.tkn-day-date{font-weight:600}',
      '.tkn-table{width:100%;border-collapse:collapse;font-size:12.5px}',
      '.tkn-table th{text-align:left;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-weight:500;padding:4px 6px;border-bottom:.5px solid var(--dsw-alias-border-l2,var(--tkn-line1));white-space:nowrap}',
      '.tkn-table td{padding:5px 6px;border-bottom:.5px solid var(--dsw-alias-border-l2,var(--tkn-line1));font-variant-numeric:tabular-nums;white-space:nowrap;vertical-align:top}',
      '.tkn-table td.t-title{max-width:150px;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-row{cursor:pointer}',
      '.tkn-row:hover{background:var(--tkn-fill)}',
      '.tkn-detail{background:var(--tkn-fill);font-size:12px;color:var(--dsw-alias-label-secondary,var(--tkn-text2))}',
      '.tkn-detail td{white-space:normal}',
      '.tkn-req{display:flex;gap:7px;align-items:baseline;padding:2px 0;font-variant-numeric:tabular-nums;flex-wrap:wrap}',
      '.tkn-req .t{color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-badge{font-size:11px;padding:1px 6px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap}',
      '.tkn-badge.live{color:var(--dsw-alias-state-success-primary,var(--tkn-ok));border-color:var(--dsw-alias-state-success-primary,var(--tkn-ok))}',
      '.tkn-more{width:100%;margin-top:6px;border:1px dashed var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:4px;cursor:pointer;font-size:12px;font-family:inherit}',
      '.tkn-err{color:var(--dsw-alias-state-error-primary,var(--tkn-err));font-size:12px;margin:0 0 8px}',
      '.tkn-load{padding:18px;text-align:center;color:var(--dsw-alias-label-secondary,var(--tkn-text2))}',
      '.tkn-empty{padding:10px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;text-align:center}',
      '.tkn-note{margin-top:14px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:11px;line-height:1.6}',
    ].join('\n')

    // Inject CSS at materialization time: the module system claims <style>
    // tags created while the factory runs (data-plugin bookkeeping for HMR).
    if (typeof document !== 'undefined' && typeof document.head !== 'undefined') {
      var tagId = 'dsh-512-token/page.css'
      if (document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
        var tag = document.createElement('style')
        tag.dataset.pluginCss = tagId
        tag.textContent = css
        document.head.appendChild(tag)
      }
    }

    // The component lives at factory scope, so it reaches the live ctx
    // through this holder (assigned once by apply()).
    var ctxRef = null

    var I18N = {
      zh: {
        nav: 'Token 用量', title: 'Token 用量统计',
        input: '入', output: '出', cache: '缓存', total: '总计',
        cacheRead: '缓存读', cacheWrite: '缓存写', refresh: '刷新',
        loadError: '统计加载失败：', willRetry: '（将自动重试）', calculating: '统计中…', loading: '加载中…',
        inputTokens: '输入 Tokens', outputTokens: '输出 Tokens', totalTokens: '总计 Tokens',
        cacheTokens: '缓存 Tokens', cacheHitRate: '缓存命中率', sessions: '会话', stepsLabel: '步数', turnsLabel: '轮次',
        hitRateFormula: '命中 = 缓存读 / (未缓存输入 + 缓存读 + 缓存写)',
        dayMainProv: '当日主要提供商：',
        configuredProvs: '提供商（', noProvData: '尚无提供商数据', clickCollapse: '点击收起详情', clickExpand: '点击展开详情',
        grand: '总', hitRate: '命中率', modelDetails: '模型明细（', noModelData: '暂无模型用量记录', unknownModel: '未知模型',
        viewing: '正在查看：', monthlyUsage: '本月用量', allUsage: '全部用量', viewAllMonth: '查看全部用量',
        clickAgainReturn: '再点一次返回全部用量\n', clickViewDay: '点击查看该日用量\n',
        inputFull: '输入 ', outputFull: '输出 ', totalFull: '总计 ', leftArrow: '← ', today: '今天 ', rightArrow: ' →',
        sessionDetailDay: '会话明细（当日 ', sessionDetail: '会话明细（', noSessionDataDay: '当日无会话数据', noSessionData: '尚无会话数据',
        thSession: '会话', thInput: '输入', thOutput: '输出', thCache: '缓存', thHit: '命中', thTotal: '总计', thSteps: '步数', thStatus: '状态',
        live: '运行中', history: '历史', uncachedInput: '未缓存输入', modelDuration: '模型耗时', provider: '提供商', created: '创建',
        contextUsage: '上下文占用', projectedNext: '（预估下次 ', recentRequests: '最近请求记录', noRequestData: '暂无请求记录', requestsLoading: '请求记录加载中…',
        collapseRequests: '收起请求记录', showAllRequests: '显示全部 ', requests: ' 条请求', readError: '读取出错：',
        collapseList: '收起列表', showAllSessions: '显示全部 ', sessionsUnit: ' 个会话',
        updatedAt: '更新于 ', refreshing: ' · 刷新中', autoRefresh: ' · 每 10 秒自动刷新',
        firstPass: ' · 首次统计历史会话中，还剩 ', firstPassUnit: ' 个', verifying: ' · 复核 ', verifyingUnit: ' 个有变动的会话',
        failed: ' · 读取失败 ', failedUnit: ' 个',
        forkOf: 'Fork 自 ', inheritedSkipped: '，继承部分 ', inheritedSkipped2: ' 已计入父会话，此处不重复统计',
        inheritedCounted: '，父会话已删除，继承部分 ', inheritedCounted2: ' 计入本会话',
        untitled: '（无标题）',
        note: '数字来自各会话日志中模型上报的用量，按会话投影缓存增量统计；fork 会话继承自父会话的部分只计一次。',
      },
      en: {
        nav: 'Token Usage', title: 'Token Usage Stats',
        input: 'In', output: 'Out', cache: 'Cache', total: 'Total',
        cacheRead: 'Cache R', cacheWrite: 'Cache W', refresh: 'Refresh',
        loadError: 'Failed to load stats: ', willRetry: ' (will auto-retry)', calculating: 'Calculating…', loading: 'Loading…',
        inputTokens: 'Input Tokens', outputTokens: 'Output Tokens', totalTokens: 'Total Tokens',
        cacheTokens: 'Cache Tokens', cacheHitRate: 'Cache Hit Rate', sessions: 'Sessions', stepsLabel: 'Steps', turnsLabel: 'Turns',
        hitRateFormula: 'Hit = Cache Read / (Uncached Input + Cache Read + Cache Write)',
        dayMainProv: 'Top provider that day: ',
        configuredProvs: 'Providers (', noProvData: 'No provider data yet', clickCollapse: 'Click to collapse details', clickExpand: 'Click to expand details',
        grand: 'Total', hitRate: 'Hit Rate', modelDetails: 'Models (', noModelData: 'No model usage recorded', unknownModel: 'Unknown model',
        viewing: 'Viewing: ', monthlyUsage: 'This Month', allUsage: 'All Usage', viewAllMonth: 'View all usage',
        clickAgainReturn: 'Click again to return to all usage\n', clickViewDay: 'Click to view that day\n',
        inputFull: 'Input ', outputFull: 'Output ', totalFull: 'Total ', leftArrow: '← ', today: 'Today ', rightArrow: ' →',
        sessionDetailDay: 'Sessions (day: ', sessionDetail: 'Sessions (', noSessionDataDay: 'No session data for this day', noSessionData: 'No session data yet',
        thSession: 'Session', thInput: 'Input', thOutput: 'Output', thCache: 'Cache', thHit: 'Hit', thTotal: 'Total', thSteps: 'Steps', thStatus: 'Status',
        live: 'live', history: 'history', uncachedInput: 'Uncached Input', modelDuration: 'Model Duration', provider: 'Provider', created: 'Created',
        contextUsage: 'Context Usage', projectedNext: ' (projected next: ', recentRequests: 'Recent Requests', noRequestData: 'No request records', requestsLoading: 'Loading requests…',
        collapseRequests: 'Collapse requests', showAllRequests: 'Show all ', requests: ' requests', readError: 'Read error: ',
        collapseList: 'Collapse list', showAllSessions: 'Show all ', sessionsUnit: ' sessions',
        updatedAt: 'Updated ', refreshing: ' · refreshing', autoRefresh: ' · auto-refresh every 10s',
        firstPass: ' · first pass over history, ', firstPassUnit: ' left', verifying: ' · re-checking ', verifyingUnit: ' changed sessions',
        failed: ' · unreadable ', failedUnit: '',
        forkOf: 'Forked from ', inheritedSkipped: '; the inherited ', inheritedSkipped2: ' is counted in the parent, not again here',
        inheritedCounted: '; the parent was deleted, so the inherited ', inheritedCounted2: ' is counted here',
        untitled: '(untitled)',
        note: 'Numbers are the usage models reported in each session log, kept incrementally in the session projection cache; the part a fork inherits from its parent is counted once.',
      },
    }

    function activeLang() {
      try {
        var locale = ctxRef === null ? null : ctxRef.get('locale')
        var id = locale && locale.getSnapshot ? locale.getSnapshot().active : ''
        return typeof id === 'string' && id.indexOf('zh') === 0 ? 'zh' : (id ? 'en' : 'zh')
      } catch (e) { return 'zh' }
    }

    // Compact units: >=1m -> '15.2m', >=1k -> '161.3k', else raw.
    function fmt(n) {
      if (typeof n !== 'number' || !isFinite(n)) return '—'
      var a = Math.abs(n)
      if (a >= 1000000) return (n / 1000000).toFixed(1) + 'm'
      if (a >= 1000) return (n / 1000).toFixed(1) + 'k'
      return String(Math.round(n))
    }
    function fmtFull(n) { return (typeof n === 'number' && isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—') }
    function pct(r) { return (typeof r === 'number' && isFinite(r) ? (r * 100).toFixed(1) + '%' : '—') }
    function hitRate(uncached, cacheRead, cacheWrite) {
      var total = (uncached || 0) + (cacheRead || 0) + (cacheWrite || 0)
      return total > 0 ? (cacheRead || 0) / total : null
    }
    function fmtDur(ms) { return (typeof ms === 'number' && isFinite(ms) ? (ms / 1000).toFixed(1) + 's' : '—') }
    function pad2(n) { return (n < 10 ? '0' : '') + n }
    function dayKey(t) {
      var d = new Date(t)
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
    }
    function fmtTime(t) {
      if (!t) return '—'
      var d = new Date(t)
      return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
    }
    function fmtDate(t) {
      if (!t) return '—'
      var d = new Date(t)
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes())
    }
    function short(s, n, fallback) { return (s && s.length > n ? s.slice(0, n - 1) + '…' : s || fallback) }

    function fetchJson(url) {
      return fetch(url, { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
    }

    function useLang() {
      var locale = ctxRef === null ? null : ctxRef.get('locale')
      var subscribe = React.useCallback(function (fn) {
        return locale && locale.subscribe ? locale.subscribe(fn) : function () {}
      }, [locale])
      return React.useSyncExternalStore(subscribe, activeLang, activeLang)
    }

    function useDark() {
      var themeState = React.useState(function () {
        try {
          var theme = ctxRef === null ? null : ctxRef.get('theme')
          var s = theme && theme.getTheme ? theme.getTheme() : null
          return (s && s.active && s.active.id) || (s && s.preference) || ''
        } catch (e) { return '' }
      })
      var setThemeId = themeState[1]
      React.useEffect(function () {
        if (ctxRef === null || typeof ctxRef.on !== 'function') return undefined
        return ctxRef.on('theme/change', function (snap) {
          try {
            var id = (snap && snap.active && snap.active.id) || (snap && snap.preference) || ''
            if (id) setThemeId(id)
          } catch (e) { /* ignore */ }
        })
      }, [])
      return themeState[0] !== 'light'
    }

    /** Request records and context pressure of one expanded session row. */
    function SessionDetail(props) {
      var t = props.t
      var s = props.row
      var stateHook = React.useState({ loading: true, data: null, error: null })
      var detail = stateHook[0]
      var setDetail = stateHook[1]
      var showAllHook = React.useState(false)
      var showAll = showAllHook[0]
      var setShowAll = showAllHook[1]
      React.useEffect(function () {
        var alive = true
        fetchJson('/dsh-512-token?session=' + encodeURIComponent(s.id) + (props.day ? '&day=' + encodeURIComponent(props.day) : '')).then(function (data) {
          if (alive) setDetail({ loading: false, data: data, error: data && data.error ? String(data.error) : null })
        }, function (e) {
          if (alive) setDetail({ loading: false, data: null, error: (e && e.message) || String(e) })
        })
        return function () { alive = false }
      }, [s.id, props.day, props.version])
      var sHit = hitRate(s.usage.uncachedInput, s.usage.cacheRead, s.usage.cacheWrite)
      var reqs = detail.data && detail.data.requests ? detail.data.requests : []
      var shown = showAll ? reqs : reqs.slice(0, 8)
      var pressure = detail.data ? detail.data.pressure : null
      var fork = null
      if (s.seeded && s.inheritedGrand > 0) {
        fork = h('div', null, t.forkOf + (s.parentSession || '?') + (s.inheritedCounted ? t.inheritedCounted + fmt(s.inheritedGrand) + t.inheritedCounted2 : t.inheritedSkipped + fmt(s.inheritedGrand) + t.inheritedSkipped2))
      }
      return h('td', { colSpan: 8 },
        t.uncachedInput + ' ' + fmt(s.usage.uncachedInput) + ' · ' + t.cacheRead + ' ' + fmt(s.usage.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmt(s.usage.cacheWrite) + ' · ' + t.output + ' ' + fmt(s.usage.output) + ' · ' + t.hitRate + ' ' + pct(sHit),
        s.turns !== undefined ? h('div', null, t.turnsLabel + ' ' + fmt(s.turns) + ' · ' + t.modelDuration + ' ' + fmtDur(s.llmMs) + (s.lastProvider ? ' · ' + t.provider + ' ' + s.lastProvider + (s.lastModel ? ' / ' + s.lastModel : '') : '') + ' · ' + t.created + ' ' + fmtDate(s.createdAt)) : null,
        fork,
        pressure && pressure.contextWindow ? h('div', null, t.contextUsage + ' ' + fmt(pressure.pressureTokens) + ' / ' + fmt(pressure.contextWindow) + t.projectedNext + fmt(pressure.projectedTokens) + ')') : null,
        h('div', { style: { marginTop: 6, fontWeight: 600, color: 'var(--dsw-alias-label-primary,var(--tkn-text))' } }, t.recentRequests + (detail.loading ? '' : '（' + reqs.length + '）')),
        detail.loading ? h('div', null, t.requestsLoading)
          : detail.error ? h('div', { style: { color: 'var(--dsw-alias-state-error-primary,var(--tkn-err))' } }, t.readError + detail.error)
          : reqs.length === 0 ? h('div', null, t.noRequestData)
          : shown.map(function (r, ri) {
            return h('div', { className: 'tkn-req', key: ri },
              h('span', { className: 't' }, fmtTime(r.time)),
              h('span', null, (r.provider || '?') + (r.model ? '/' + r.model : '')),
              h('span', null, t.input + ' ' + fmtFull(r.input)),
              h('span', null, t.output + ' ' + fmtFull(r.output)),
              h('span', null, t.cacheRead + ' ' + fmtFull(r.cacheRead)),
              h('span', null, t.cacheWrite + ' ' + fmtFull(r.cacheWrite)),
            )
          }),
        reqs.length > 8 ? h('button', { className: 'tkn-more', onClick: function (e) { e.stopPropagation(); setShowAll(!showAll) } }, showAll ? t.collapseRequests : t.showAllRequests + reqs.length + t.requests) : null,
        s.error && s.errorMsg ? h('div', { style: { color: 'var(--dsw-alias-state-error-primary,var(--tkn-err))', marginTop: 4 } }, t.readError + s.errorMsg) : null,
      )
    }

    function TokenStatsPage() {
      var useState = React.useState
      var useEffect = React.useEffect
      var useCallback = React.useCallback

      var dataHook = useState(null)
      var data = dataHook[0]
      var setData = dataHook[1]
      var errorHook = useState(null)
      var error = errorHook[0]
      var setError = errorHook[1]
      var loadingHook = useState(false)
      var loading = loadingHook[0]
      var setLoading = loadingHook[1]
      var openRowHook = useState(null)
      var openRow = openRowHook[0]
      var setOpenRow = openRowHook[1]
      var openProvHook = useState(null)
      var openProv = openProvHook[0]
      var setOpenProv = openProvHook[1]
      var selectedDayHook = useState(null)
      var selectedDay = selectedDayHook[0]
      var setSelectedDay = selectedDayHook[1]
      var showAllHook = useState(false)
      var showAll = showAllHook[0]
      var setShowAll = showAllHook[1]

      var lang = useLang()
      var t = I18N[lang] || I18N.zh
      var dark = useDark()
      var themeClass = dark ? 'tkn-theme-dark' : 'tkn-theme-light'

      var refresh = useCallback(function () {
        setLoading(true)
        return fetchJson('/dsh-512-token').then(function (result) {
          if (result && result.error) {
            setError(String(result.error))
            return
          }
          setData(result)
          setError(null)
        }, function (e) {
          setError((e && e.message) || String(e))
        }).finally(function () {
          setLoading(false)
        })
      }, [])

      var busy = data && (data.loading > 0 || data.warming > 0)
      var refreshInterval = busy ? 3000 : 10000
      useEffect(function () {
        refresh()
        var timerId = window.setInterval(function () { refresh() }, refreshInterval)
        return function () { window.clearInterval(timerId) }
      }, [refresh, refreshInterval])

      var totals = data ? data.totals : null
      var sessions = data ? data.sessions : []
      var providers = data ? data.providers : []
      var days = data ? data.days : []
      var dayView = null
      if (data && selectedDay) {
        for (var dv = 0; dv < days.length; dv++) if (days[dv].date === selectedDay) { dayView = days[dv]; break }
      }
      var isDayMode = dayView !== null
      if (dayView) {
        totals = { input: dayView.input, output: dayView.output, cacheRead: dayView.cacheRead, cacheWrite: dayView.cacheWrite, grand: dayView.total, steps: dayView.steps }
        providers = dayView.providers || []
        sessions = dayView.sessions || []
      }
      var topProviderId = null
      if (isDayMode) {
        var topDayProv = null
        for (var tp = 0; tp < providers.length; tp++) if (topDayProv === null || providers[tp].total > topDayProv.total) topDayProv = providers[tp]
        topProviderId = topDayProv && topDayProv.total > 0 ? topDayProv.id : null
      }

      var head = h('div', { className: 'tkn-head' },
        h('span', { className: 'tkn-title' }, t.title),
        h('button', { className: 'tkn-btn', onClick: function () { refresh() }, title: t.refresh }, '⟳ ' + t.refresh),
      )
      var status = null
      if (data) {
        status = h('div', { className: 'tkn-status' },
          t.updatedAt + fmtDate(data.generatedAt) + (loading ? t.refreshing : t.autoRefresh)
          + (data.warming > 0 ? t.firstPass + data.warming + t.firstPassUnit : '')
          + (data.verifying > 0 ? t.verifying + data.verifying + t.verifyingUnit : '')
          + (data.failed > 0 ? t.failed + data.failed + t.failedUnit : ''))
      }
      var errBar = error ? h('div', { className: 'tkn-err' }, t.loadError + error + t.willRetry) : null

      if (!data) {
        return h('div', { className: 'tkn-page ' + themeClass }, head, errBar, h('div', { className: 'tkn-load' }, loading ? t.calculating : t.loading))
      }

      function card(k, v, title) {
        return h('div', { className: 'tkn-card', title: title || '' }, h('div', { className: 'k' }, k), h('div', { className: 'v' }, typeof v === 'string' ? v : fmt(v)))
      }
      var totalHit = hitRate(totals.input - totals.cacheRead - totals.cacheWrite, totals.cacheRead, totals.cacheWrite)
      var cards = h('div', { className: 'tkn-cards' },
        card(t.inputTokens, totals.input),
        card(t.outputTokens, totals.output),
        card(t.totalTokens, totals.grand, fmtFull(totals.grand)),
        card(t.cacheTokens, totals.cacheRead + totals.cacheWrite, t.cacheRead + ' ' + fmtFull(totals.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(totals.cacheWrite)),
        card(t.cacheHitRate, pct(totalHit), t.hitRateFormula),
        card(t.sessions, isDayMode ? String(dayView.sessionCount || 0) : String(data.covered) + (data.totalCount > data.covered ? '/' + data.totalCount : '')),
        card(t.stepsLabel, totals.steps),
        card(t.turnsLabel, isDayMode ? '—' : totals.turns),
      )

      var topProv = null
      for (var j = 0; j < providers.length; j++) if (providers[j].id === topProviderId) { topProv = providers[j]; break }
      var cur = topProv ? h('div', { className: 'tkn-cur' },
        h('span', { className: 'name' }, t.dayMainProv + topProv.name),
        h('span', { className: 'nums' }, t.input + ' ' + fmt(topProv.input) + ' · ' + t.output + ' ' + fmt(topProv.output) + ' · ' + t.cacheRead + ' ' + fmt(topProv.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmt(topProv.cacheWrite) + ' · ' + t.grand + ' ' + fmt(topProv.total)),
      ) : null

      var provSec = h('div', null,
        h('div', { className: 'tkn-sec' }, t.configuredProvs + providers.length + '）'),
        providers.length === 0 ? h('div', { className: 'tkn-empty' }, t.noProvData) : providers.map(function (p) {
          var expanded = openProv === p.id
          var hit = hitRate(p.input - p.cacheRead - p.cacheWrite, p.cacheRead, p.cacheWrite)
          var row = h('div', { className: 'tkn-prov' + (p.id === topProviderId ? ' cur' : ''), key: p.id, onClick: function () { setOpenProv(expanded ? null : p.id) }, title: expanded ? t.clickCollapse : t.clickExpand },
            h('span', { className: 'tkn-pname', title: p.id }, p.name),
            h('span', { className: 'tkn-pnums' }, t.grand + ' ' + fmt(p.total)),
            h('span', { className: 'tkn-arrow' }, expanded ? '▾' : '▸'),
          )
          if (!expanded) return row
          var models = p.models || []
          return [
            row,
            h('div', { className: 'tkn-prov-detail', key: p.id + '-d' },
              h('div', null, t.input + ' ' + fmt(p.input) + ' · ' + t.output + ' ' + fmt(p.output) + ' · ' + t.total + ' ' + fmt(p.total) + ' · ' + t.cache + ' ' + fmt(p.cacheRead + p.cacheWrite) + ' · ' + t.hitRate + ' ' + pct(hit) + ' · ' + t.cacheRead + ' ' + fmtFull(p.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(p.cacheWrite)),
              h('div', { className: 'tkn-prov-models-label' }, t.modelDetails + models.length + '）'),
              models.length === 0 ? h('div', null, t.noModelData) : models.map(function (m, mi) {
                var mHit = hitRate(m.input - m.cacheRead - m.cacheWrite, m.cacheRead, m.cacheWrite)
                return h('div', { className: 'tkn-prov-model', key: mi },
                  h('div', { className: 'tkn-prov-model-name' }, m.model || t.unknownModel),
                  h('div', null, t.input + ' ' + fmt(m.input) + ' · ' + t.output + ' ' + fmt(m.output) + ' · ' + t.total + ' ' + fmt(m.total) + ' · ' + t.cache + ' ' + fmt(m.cacheRead + m.cacheWrite) + ' · ' + t.hitRate + ' ' + pct(mHit)),
                )
              }),
            ),
          ]
        }),
      )

      var maxDay = 0
      for (var di = 0; di < days.length; di++) if (days[di].total > maxDay) maxDay = days[di].total
      var todayKey = dayKey(Date.now())
      var dayDetail = null
      if (isDayMode) {
        var dHit = hitRate(dayView.input - dayView.cacheRead - dayView.cacheWrite, dayView.cacheRead, dayView.cacheWrite)
        dayDetail = h('div', { className: 'tkn-day-detail' },
          h('span', { className: 'tkn-day-date' }, t.viewing + dayView.date),
          h('span', null, t.input + ' ' + fmt(dayView.input) + ' · ' + t.output + ' ' + fmt(dayView.output) + ' · ' + t.cache + ' ' + fmt(dayView.cacheRead + dayView.cacheWrite) + ' · ' + t.hitRate + ' ' + pct(dHit) + ' · ' + t.total + ' ' + fmt(dayView.total) + ' · ' + t.stepsLabel + ' ' + fmt(dayView.steps)),
        )
      }
      var heat = h('div', null,
        h('div', { className: 'tkn-sec tkn-heat-head' },
          h('span', null, t.monthlyUsage),
          h('button', { className: 'tkn-btn', onClick: function () { setSelectedDay(null); setOpenRow(null) }, title: t.viewAllMonth }, t.allUsage),
        ),
        dayDetail,
        h('div', { className: 'tkn-heat' }, days.map(function (d) {
          var i = maxDay > 0 ? d.total / maxDay : 0
          var isSelected = d.date === selectedDay
          var bg
          var fg
          if (dark) {
            bg = i <= 0 ? undefined : 'rgba(255,255,255,' + (0.06 + 0.82 * i).toFixed(3) + ')'
            fg = i > 0.4 ? '#1e2025' : 'var(--dsw-alias-label-secondary,var(--tkn-text2))'
          } else {
            bg = i <= 0 ? undefined : 'rgba(47,107,255,' + (0.08 + 0.8 * i).toFixed(3) + ')'
            fg = i > 0.45 ? '#ffffff' : 'var(--dsw-alias-label-secondary,var(--tkn-text2))'
          }
          return h('div', {
            className: 'tkn-cell' + (d.date === todayKey ? ' today' : '') + (isSelected ? ' selected' : ''),
            key: d.date,
            style: { background: bg, color: fg },
            onClick: function () { setSelectedDay(isSelected ? null : d.date); setOpenRow(null) },
            title: (isSelected ? t.clickAgainReturn : t.clickViewDay) + d.date + '  ' + t.inputFull + fmtFull(d.input) + ' · ' + t.outputFull + fmtFull(d.output) + ' · ' + t.totalFull + fmtFull(d.total),
          }, String(Number(d.date.slice(8))))
        })),
        h('div', { className: 'tkn-heat-cap' },
          h('span', null, t.leftArrow + (days[0] ? days[0].date : '—')),
          h('span', null, t.today + todayKey + t.rightArrow),
        ),
      )

      var visible = showAll ? sessions : sessions.slice(0, 50)
      var sessSec = h('div', null,
        h('div', { className: 'tkn-sec' }, isDayMode ? t.sessionDetailDay + (dayView.sessionCount || 0) + '）' : t.sessionDetail + sessions.length + '）'),
        sessions.length === 0 ? h('div', { className: 'tkn-empty' }, isDayMode ? t.noSessionDataDay : t.noSessionData) : h('table', { className: 'tkn-table' },
          h('thead', null, h('tr', null,
            h('th', null, t.thSession), h('th', null, t.thInput), h('th', null, t.thOutput), h('th', null, t.thCache), h('th', null, t.thHit), h('th', null, t.thTotal), h('th', null, t.thSteps), h('th', null, t.thStatus),
          )),
          h('tbody', null, visible.map(function (s) {
            var open = openRow === s.id
            var sHit = hitRate(s.usage.uncachedInput, s.usage.cacheRead, s.usage.cacheWrite)
            var cells = h('tr', { key: s.id, className: 'tkn-row', onClick: function () { setOpenRow(open ? null : s.id) } },
              h('td', { className: 't-title', title: s.title || s.id }, short(s.title, 20, t.untitled)),
              h('td', null, fmt(s.usage.uncachedInput + s.usage.cacheRead + s.usage.cacheWrite)),
              h('td', null, fmt(s.usage.output)),
              h('td', { title: t.cacheRead + ' ' + fmtFull(s.usage.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(s.usage.cacheWrite) }, fmt(s.usage.cacheRead + s.usage.cacheWrite)),
              h('td', { title: t.hitRateFormula }, pct(sHit)),
              h('td', { title: fmtFull(s.grand) }, fmt(s.grand)),
              h('td', null, fmt(s.steps)),
              h('td', null, h('span', { className: 'tkn-badge' + (s.live ? ' live' : '') }, s.live ? t.live : t.history)),
            )
            if (!open) return cells
            return [
              cells,
              h('tr', { key: s.id + '-d', className: 'tkn-detail' },
                h(SessionDetail, { t: t, row: s, day: isDayMode ? dayView.date : null, version: data.generatedAt }),
              ),
            ]
          })),
        ),
        sessions.length > 50 ? h('button', { className: 'tkn-more', onClick: function () { setShowAll(!showAll) } }, showAll ? t.collapseList : t.showAllSessions + sessions.length + t.sessionsUnit) : null,
      )

      return h('div', { className: 'tkn-page ' + themeClass },
        head,
        status,
        errBar,
        cards,
        cur,
        provSec,
        heat,
        sessSec,
        h('div', { className: 'tkn-note' }, t.note),
      )
    }

    function apply(ctx) {
      ctxRef = ctx
      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register(
          {
            name: 'settings.section',
            id: 'dsh-512-token',
            order: 30,
            label: function () { return (I18N[activeLang()] || I18N.zh).nav },
          },
          function () { return h(TokenStatsPage, null) },
        )
      })
    }

    exports.apply = apply
    exports.inject = ['slots']
    return module.exports
  },
})
