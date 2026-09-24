/* dsh-512-token — browser half.
 *
 * Bundled in the shell module-table format: window.__ModuleLoader__.load()
 * with a factory receiving the module `require`. The kernel adopts the
 * exported `apply`/`inject` as a Cordis client plugin.
 */
window.__ModuleLoader__.load({
  id: 'dsh-512-token',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')
    var h = React.createElement

    var css = [
      '.tkn-theme-dark{--tkn-bg:#17181c;--tkn-bg1:#1d1f25;--tkn-bg2:#141519;--tkn-line1:rgba(255,255,255,.08);--tkn-line2:rgba(255,255,255,.16);--tkn-text:#e9eaee;--tkn-text2:#9ba1ac;--tkn-brand:#4f8dff;--tkn-warn:#e0a83e;--tkn-err:#f2555a;--tkn-ok:#4cb782;--tkn-shadow:0 10px 32px rgba(0,0,0,.6)}',
      '.tkn-theme-light{--tkn-bg:#ffffff;--tkn-bg1:#f6f7f9;--tkn-bg2:#eef0f3;--tkn-line1:rgba(20,24,32,.1);--tkn-line2:rgba(20,24,32,.2);--tkn-text:#1c2028;--tkn-text2:#6b7280;--tkn-brand:#2f6bff;--tkn-warn:#b57d12;--tkn-err:#d92d32;--tkn-ok:#1f9d61;--tkn-shadow:0 10px 32px rgba(15,20,30,.16)}',
      '.tkn-theme-dark .tkn-head,.tkn-theme-dark .tkn-card,.tkn-theme-dark .tkn-cur,.tkn-theme-dark .tkn-detail{background:rgba(255,255,255,.035)}',
      '.tkn-theme-dark .tkn-row:hover{background:rgba(255,255,255,.05)}',
      '.tkn-panel{position:fixed;width:600px;max-width:calc(100vw - 24px);max-height:min(720px,88vh);display:flex;flex-direction:column;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-overlay,var(--tkn-bg)));border:1px solid var(--dsw-alias-border-l2,var(--tkn-line2));border-radius:12px;box-shadow:var(--tkn-shadow);z-index:1000;pointer-events:auto;color:var(--dsw-alias-label-primary,var(--tkn-text));font-size:13px;overflow:hidden}',
      '.tkn-panel *{box-sizing:border-box}',
      '.tkn-head{display:flex;align-items:center;gap:6px;padding:9px 12px;cursor:move;user-select:none;background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));flex:none}',
      '.tkn-title{font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}',
      '.tkn-btn{border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:2px 8px;cursor:pointer;font-size:12px;line-height:1.6;flex:none}',
      '.tkn-btn:hover{color:var(--dsw-alias-label-primary,var(--tkn-text));border-color:var(--dsw-alias-border-l2,var(--tkn-line2))}',
      '.tkn-body{overflow-y:auto;padding:12px;min-height:0}',
      '.tkn-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
      '.tkn-card{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;padding:7px 9px;min-width:0}',
      '.tkn-card .k{color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-card .v{font-size:15px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-sec{margin:12px 0 6px;font-weight:600;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;text-transform:uppercase;letter-spacing:.04em}',
      '.tkn-cur{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;margin-top:10px}',
      '.tkn-cur .name{font-weight:600}',
      '.tkn-cur .nums{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap}',
      '.tkn-prov{display:flex;align-items:center;gap:8px;padding:5px 2px;border-bottom:1px dashed var(--dsw-alias-border-l1,var(--tkn-line1));cursor:pointer}',
      '.tkn-prov:hover{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1))}',
      '.tkn-arrow{flex:none;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;width:12px;text-align:center}',
      '.tkn-prov-detail{padding:6px 2px 10px 20px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:13px;line-height:1.6;font-variant-numeric:tabular-nums;border-bottom:1px dashed var(--dsw-alias-border-l1,var(--tkn-line1))}',
      '.tkn-prov-models-label{margin-top:10px;font-weight:600;color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-prov-model{padding:5px 0 6px}',
      '.tkn-prov-model-name{color:var(--dsw-alias-label-primary,var(--tkn-text));font-weight:600;margin-bottom:2px}',
      '.tkn-prov-model-nums{color:var(--dsw-alias-label-secondary,var(--tkn-text2));line-height:1.6}',
      '.tkn-prov.cur .tkn-pname{color:var(--dsw-alias-brand-primary,var(--tkn-brand));font-weight:600}',
      '.tkn-pname{min-width:92px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.tkn-pnums{flex:1;min-width:0;text-align:right;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12.5px;line-height:1.55}',
      '.tkn-heat{display:grid;grid-template-columns:repeat(10,1fr);gap:7px}',
      '.tkn-cell{aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:12px;font-variant-numeric:tabular-nums;background:var(--dsw-alias-bg-layer-2,var(--tkn-bg2));min-width:0;cursor:pointer}',
      '.tkn-cell.today{outline:1px solid var(--dsw-alias-brand-primary,var(--tkn-brand));outline-offset:1px}',
      '.tkn-cell.selected{outline:2px solid var(--dsw-alias-brand-primary,var(--tkn-brand));outline-offset:1px}',
      '.tkn-heat-cap{font-size:11px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));margin-top:6px;display:flex;justify-content:space-between}',
      '.tkn-heat-head{display:flex;align-items:center;justify-content:space-between}',
      '.tkn-heat-all{border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:1px 10px;cursor:pointer;font-size:12px;line-height:1.6;font-weight:500;text-transform:none;letter-spacing:0}',
      '.tkn-heat-all:hover{color:var(--dsw-alias-label-primary,var(--tkn-text));border-color:var(--dsw-alias-border-l2,var(--tkn-line2))}',
      '.tkn-day-detail{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;font-size:12.5px;font-variant-numeric:tabular-nums}',
      '.tkn-day-date{font-weight:600;color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-table{width:100%;border-collapse:collapse;font-size:12.5px}',
      '.tkn-table th{text-align:left;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-weight:500;padding:4px 6px;border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));white-space:nowrap}',
      '.tkn-table td{padding:5px 6px;border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));font-variant-numeric:tabular-nums;white-space:nowrap;vertical-align:top}',
      '.tkn-table td.t-title{max-width:150px;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-row{cursor:pointer}',
      '.tkn-row:hover{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1))}',
      '.tkn-detail{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));font-size:12px;color:var(--dsw-alias-label-secondary,var(--tkn-text2))}',
      '.tkn-req{display:flex;gap:7px;align-items:baseline;padding:2px 0;font-variant-numeric:tabular-nums}',
      '.tkn-req .t{color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-badge{font-size:11px;padding:1px 6px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap}',
      '.tkn-badge.live{color:var(--dsw-alias-state-success-primary,var(--tkn-ok));border-color:var(--dsw-alias-state-success-primary,var(--tkn-ok))}',
      '.tkn-more{width:100%;margin-top:6px;border:1px dashed var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:4px;cursor:pointer;font-size:12px}',
      '.tkn-foot{display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-top:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:11px;flex:none}',
      '.tkn-err{color:var(--dsw-alias-state-error-primary,var(--tkn-err));padding:6px 12px;font-size:11px;border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1))}',
      '.tkn-load{padding:18px;text-align:center;color:var(--dsw-alias-label-secondary,var(--tkn-text2))}',
      '.tkn-collapsed{position:fixed;pointer-events:auto;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-overlay,var(--tkn-bg)));border:1px solid var(--dsw-alias-border-l2,var(--tkn-line2));border-radius:9px;padding:8px 12px;cursor:pointer;font-size:12.5px;z-index:1000;box-shadow:var(--tkn-shadow);user-select:none;color:var(--dsw-alias-label-primary,var(--tkn-text));display:flex;align-items:center;gap:10px;max-width:min(600px,calc(100vw - 24px))}',
      '.tkn-coll-title{font-weight:600;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:none}',
      '.tkn-coll-item{color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.tkn-coll-item.strong{color:var(--dsw-alias-label-primary,var(--tkn-text));font-weight:600}',
      '.tkn-pill{position:fixed;right:16px;bottom:16px;pointer-events:auto;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-overlay,var(--tkn-bg)));border:1px solid var(--dsw-alias-border-l2,var(--tkn-line2));border-radius:999px;padding:8px 14px;cursor:pointer;font-size:12px;z-index:1000;box-shadow:var(--tkn-shadow);display:flex;align-items:center;gap:7px;color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-brand-primary,var(--tkn-brand))}',
      '.tkn-empty{padding:10px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:12px;text-align:center}',
    ].join('\n')

    // Inject CSS at materialization time: the module system claims <style>
    // tags created while the factory runs (data-plugin bookkeeping for HMR).
    if (typeof document !== 'undefined' && typeof document.head !== 'undefined') {
      var tagId = 'dsh-512-token/panel.css'
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
        title: 'Token 用量统计', openTitle: '打开 Token 用量统计', tokenStats: 'Token 统计',
        allSessions: '全部会话', input: '入', output: '出', cache: '缓存', total: '总计', steps: '步',
        cacheRead: '缓存读', cacheWrite: '缓存写', collapsedTitle: 'Token 用量（点击展开，拖动移动）',
        refresh: '刷新', collapse: '收起', close: '关闭',
        loadError: '统计加载失败：', willRetry: '（将自动重试）', calculating: '统计中…', loading: '加载中…',
        inputTokens: '输入 Tokens', outputTokens: '输出 Tokens', totalTokens: '总计 Tokens',
        cacheTokens: '缓存 Tokens', cacheHitRate: '缓存命中率', sessions: '会话', stepsLabel: '步数',
        hitRateFormula: '命中 = 缓存读 / (未缓存输入 + 缓存读 + 缓存写)',
        dayMainProv: '当日主要提供商：', currentProv: '当前提供商：', currentSession: '当前会话：', noProvUsage: '尚无提供商用量记录',
        configuredProvs: '已配置提供商（', noProvData: '尚无提供商数据', clickCollapse: '点击收起详情', clickExpand: '点击展开详情',
        grand: '总', hitRate: '命中率', modelDetails: '模型明细（', noModelData: '暂无模型用量记录', unknownModel: '未知模型',
        viewing: '正在查看：', monthlyUsage: '本月用量', allUsage: '全部用量', viewAllMonth: '查看本月全部用量',
        clickAgainReturn: '再点一次返回本月全部用量\n', clickViewDay: '点击查看该日用量\n',
        inputFull: '输入 ', outputFull: '输出 ', totalFull: '总计 ', leftArrow: '← ', today: '今天 ', rightArrow: ' →',
        sessionDetailDay: '会话明细（当日 ', sessionDetail: '会话明细（', noSessionDataDay: '当日无会话数据', noSessionData: '尚无会话数据',
        thSession: '会话', thInput: '输入', thOutput: '输出', thCache: '缓存', thHit: '命中', thTotal: '总计', thSteps: '步数', thStatus: '状态',
        live: 'live', archived: '存档', uncachedInput: '未缓存输入', turns: '轮次', modelDuration: '模型耗时', provider: '提供商', created: '创建',
        contextUsage: '上下文占用', projectedNext: '（预估下次 ', recentRequests: '最近请求记录（', noRequestData: '暂无请求记录（尚无上报用量）',
        collapseRequests: '收起请求记录', showAllRequests: '显示全部 ', requests: ' 条请求', readError: '读取统计出错：',
        collapseList: '收起列表', showAllSessions: '显示全部 ', sessionsUnit: ' 个会话',
        updatedAt: '更新于 ', refreshing: ' · 刷新中', autoRefresh: ' · 每10s自动', estimated: '估算/上报值',
      },
      en: {
        title: 'Token Usage Stats', openTitle: 'Open Token Usage Stats', tokenStats: 'Token Stats',
        allSessions: 'All Sessions', input: 'In', output: 'Out', cache: 'Cache', total: 'Total', steps: 'steps',
        cacheRead: 'Cache R', cacheWrite: 'Cache W', collapsedTitle: 'Token Usage (click to expand, drag to move)',
        refresh: 'Refresh', collapse: 'Collapse', close: 'Close',
        loadError: 'Failed to load stats: ', willRetry: ' (will auto-retry)', calculating: 'Calculating…', loading: 'Loading…',
        inputTokens: 'Input Tokens', outputTokens: 'Output Tokens', totalTokens: 'Total Tokens',
        cacheTokens: 'Cache Tokens', cacheHitRate: 'Cache Hit Rate', sessions: 'Sessions', stepsLabel: 'Steps',
        hitRateFormula: 'Hit = Cache Read / (Uncached Input + Cache Read + Cache Write)',
        dayMainProv: 'Top provider today: ', currentProv: 'Current provider: ', currentSession: 'Current session: ', noProvUsage: 'No provider usage recorded yet',
        configuredProvs: 'Configured Providers (', noProvData: 'No provider data yet', clickCollapse: 'Click to collapse details', clickExpand: 'Click to expand details',
        grand: 'Total', hitRate: 'Hit Rate', modelDetails: 'Model Details (', noModelData: 'No model usage recorded', unknownModel: 'Unknown model',
        viewing: 'Viewing: ', monthlyUsage: 'This Month', allUsage: 'All Usage', viewAllMonth: 'View all usage this month',
        clickAgainReturn: 'Click again to return to all usage\n', clickViewDay: 'Click to view daily usage\n',
        inputFull: 'Input ', outputFull: 'Output ', totalFull: 'Total ', leftArrow: '← ', today: 'Today ', rightArrow: ' →',
        sessionDetailDay: 'Session Details (day: ', sessionDetail: 'Session Details (', noSessionDataDay: 'No session data for this day', noSessionData: 'No session data yet',
        thSession: 'Session', thInput: 'Input', thOutput: 'Output', thCache: 'Cache', thHit: 'Hit', thTotal: 'Total', thSteps: 'Steps', thStatus: 'Status',
        live: 'live', archived: 'archived', uncachedInput: 'Uncached Input', turns: 'Turns', modelDuration: 'Model Duration', provider: 'Provider', created: 'Created',
        contextUsage: 'Context Usage', projectedNext: ' (projected next: ', recentRequests: 'Recent Requests (', noRequestData: 'No request records yet (no usage reported)',
        collapseRequests: 'Collapse requests', showAllRequests: 'Show all ', requests: ' requests', readError: 'Error reading stats: ',
        collapseList: 'Collapse list', showAllSessions: 'Show all ', sessionsUnit: ' sessions',
        updatedAt: 'Updated ', refreshing: ' · refreshing', autoRefresh: ' · auto 10s', estimated: 'estimated/reported',
      },
    }

    // Compact units: >=1m -> '15.2m', >=1k -> '161.3k', else raw.
    function fmt(n) {
      if (typeof n !== 'number' || !isFinite(n)) return '—'
      var a = Math.abs(n)
      if (a >= 1000000) return (n / 1000000).toFixed(1) + 'm'
      if (a >= 1000) return (n / 1000).toFixed(1) + 'k'
      return String(Math.round(n))
    }
    // Full raw numbers (kept for the per-request records).
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
    function short(s, n) { return (s && s.length > n ? s.slice(0, n - 1) + '…' : s || '（无标题）') }

    function fetchStats() {
      return fetch('/dsh-512-token', { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status)
        return res.json()
      })
    }

    function TokenStatsPanel(props) {
      var useState = React.useState
      var useEffect = React.useEffect
      var useRef = React.useRef
      var useCallback = React.useCallback

      var dataState = useState(null)
      var data = dataState[0]
      var setData = dataState[1]
      var errorState = useState(null)
      var error = errorState[0]
      var setError = errorState[1]
      var loadingState = useState(false)
      var loading = loadingState[0]
      var setLoading = loadingState[1]
      var modeState = useState('expanded')
      var mode = modeState[0]
      var setMode = modeState[1]
      var posState = useState({ x: Math.max(16, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 616), y: 88 })
      var pos = posState[0]
      var setPos = posState[1]
      var openRowState = useState(null)
      var openRow = openRowState[0]
      var setOpenRow = openRowState[1]
      var openProvState = useState(null)
      var openProv = openProvState[0]
      var setOpenProv = openProvState[1]
      var selectedDayState = useState(null)
      var selectedDay = selectedDayState[0]
      var setSelectedDay = selectedDayState[1]
      var showAllState = useState(false)
      var showAll = showAllState[0]
      var setShowAll = showAllState[1]
      var showReqsState = useState(false)
      var showReqs = showReqsState[0]
      var setShowReqs = showReqsState[1]
      var langState = useState(function () {
        try { return (typeof localStorage !== 'undefined' && localStorage.getItem('dsh-ts-lang')) || 'zh' }
        catch (e) { return 'zh' }
      })
      var lang = langState[0]
      var setLang = langState[1]
      var t = I18N[lang] || I18N.zh
      function toggleLang() {
        var next = lang === 'zh' ? 'en' : 'zh'
        setLang(next)
        try { if (typeof localStorage !== 'undefined') localStorage.setItem('dsh-ts-lang', next) } catch (e) { /* ignore */ }
      }
      var panelRef = useRef(null)
      var dragRef = useRef(null)

      var theme = ctxRef === null ? null : ctxRef.get('theme')
      var themeState = useState(function () {
        try {
          var s = theme && theme.getTheme ? theme.getTheme() : null
          return (s && s.active && s.active.id) || (s && s.preference) || ''
        } catch (e) { return '' }
      })
      var themeId = themeState[0]
      var setThemeId = themeState[1]
      useEffect(function () {
        if (ctxRef === null || typeof ctxRef.on !== 'function') return undefined
        return ctxRef.on('theme/change', function (snap) {
          try {
            var id = (snap && snap.active && snap.active.id) || (snap && snap.preference) || ''
            if (id) setThemeId(id)
          } catch (e) { /* ignore */ }
        })
      }, [])
      var dark = themeId !== 'light'
      var themeClass = dark ? 'tkn-theme-dark' : 'tkn-theme-light'

      var currentId = undefined
      try {
        if (props.useSessions) {
          var current = props.useSessions(function (state) {
            if (!state || !state.byId) return undefined
            var rows = Object.values(state.byId)
            for (var i = 0; i < rows.length; i++) if (rows[i].retainedBy && rows[i].retainedBy.mainView > 0) return rows[i].id
            return undefined
          })
          if (current !== undefined) currentId = current
        }
      } catch (e) { currentId = undefined }
      var currentIdRef = useRef(currentId)

      var refresh = useCallback(function () {
        setLoading(true)
        return fetchStats().then(function (result) {
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

      useEffect(function () {
        refresh()
        var timerId = window.setInterval(function () { refresh() }, 10000)
        return function () { window.clearInterval(timerId) }
      }, [refresh])

      useEffect(function () {
        if (currentId !== undefined && currentIdRef.current !== currentId) {
          currentIdRef.current = currentId
          refresh()
        }
      }, [currentId, refresh])

      function stop(e) { e.stopPropagation() }
      function onDragStart(e) {
        e.preventDefault()
        var startX = e.clientX
        var startY = e.clientY
        var baseX = pos.x
        var baseY = pos.y
        dragRef.current = { moved: false }
        function onMove(ev) {
          var dx = ev.clientX - startX
          var dy = ev.clientY - startY
          if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true
          var el = panelRef.current
          var w = el ? el.offsetWidth : 600
          var hh = el ? el.offsetHeight : 560
          var vw = typeof window !== 'undefined' ? window.innerWidth : 1280
          var vh = typeof window !== 'undefined' ? window.innerHeight : 800
          var x = Math.min(Math.max(8, baseX + dx), Math.max(8, vw - w - 8))
          var y = Math.min(Math.max(8, baseY + dy), Math.max(8, vh - hh - 8))
          setPos({ x: x, y: y })
        }
        function onUp() {
          if (typeof window !== 'undefined') {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
          }
        }
        if (typeof window !== 'undefined') {
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp)
        }
      }

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
        totals = {
          input: dayView.input,
          output: dayView.output,
          cacheRead: dayView.cacheRead,
          cacheWrite: dayView.cacheWrite,
          grand: dayView.total,
          steps: dayView.steps,
          turns: 0,
        }
        providers = dayView.providers || []
        sessions = dayView.sessions || []
      }
      var currentRow = null
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id === currentId) { currentRow = sessions[i]; break }
      }
      var currentProviderId = null
      if (isDayMode) {
        var topDayProv = null
        for (var tp = 0; tp < providers.length; tp++) if (topDayProv === null || providers[tp].total > topDayProv.total) topDayProv = providers[tp]
        currentProviderId = topDayProv ? topDayProv.id : null
      } else {
        currentProviderId = currentRow ? currentRow.lastProvider : null
      }
      var currentProv = null
      for (var j = 0; j < providers.length; j++) {
        if (providers[j].id === currentProviderId) { currentProv = providers[j]; break }
      }
      var curInput = (!isDayMode && currentRow) ? (currentRow.usage.uncachedInput + currentRow.usage.cacheRead + currentRow.usage.cacheWrite) : (totals ? totals.input : null)
      var curCache = (!isDayMode && currentRow) ? (currentRow.usage.cacheRead + currentRow.usage.cacheWrite) : (totals ? (totals.cacheRead + totals.cacheWrite) : null)
      var curCacheRead = (!isDayMode && currentRow) ? currentRow.usage.cacheRead : (totals ? totals.cacheRead : null)
      var curCacheWrite = (!isDayMode && currentRow) ? currentRow.usage.cacheWrite : (totals ? totals.cacheWrite : null)
      var curOutput = (!isDayMode && currentRow) ? currentRow.usage.output : (totals ? totals.output : null)
      var curGrand = (!isDayMode && currentRow) ? currentRow.grand : (totals ? totals.grand : null)
      var curSteps = (!isDayMode && currentRow) ? currentRow.steps : (totals ? totals.steps : null)

      if (mode === 'hidden') {
        return h('div', { className: 'tkn-pill ' + themeClass, onClick: function () { setMode('expanded') }, title: t.openTitle },
          h('span', { className: 'tkn-pill-dot' }),
          t.tokenStats,
        )
      }

      if (mode === 'collapsed') {
        return h('div', { ref: panelRef, className: 'tkn-collapsed ' + themeClass, style: { left: pos.x, top: pos.y }, onPointerDown: onDragStart, onClick: function () { if (!dragRef.current || !dragRef.current.moved) setMode('expanded') }, title: t.collapsedTitle },
          h('span', { className: 'tkn-coll-title', title: isDayMode ? (dayView ? dayView.date : t.allSessions) : (currentRow ? currentRow.title : t.allSessions) }, 'Token · ' + short(isDayMode ? (dayView ? dayView.date : t.allSessions) : (currentRow ? currentRow.title : t.allSessions), 14)),
          h('span', { className: 'tkn-coll-item' }, t.input + ' ' + fmt(curInput)),
          h('span', { className: 'tkn-coll-item' }, t.output + ' ' + fmt(curOutput)),
          h('span', { className: 'tkn-coll-item', title: t.cacheRead + ' ' + fmtFull(curCacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(curCacheWrite) }, t.cache + ' ' + fmt(curCache)),
          h('span', { className: 'tkn-coll-item strong' }, t.total + ' ' + fmt(curGrand)),
          h('span', { className: 'tkn-coll-item' }, fmt(curSteps) + ' ' + t.steps),
        )
      }

      var maxDay = 0
      for (var di = 0; di < days.length; di++) if (days[di].total > maxDay) maxDay = days[di].total
      var visible = showAll ? sessions : sessions.slice(0, 50)
      var todayKey = dayKey(Date.now())
      var totalHit = hitRate(totals ? totals.input - totals.cacheRead - totals.cacheWrite : null, totals ? totals.cacheRead : null, totals ? totals.cacheWrite : null)

      function card(k, v, title) {
        return h('div', { className: 'tkn-card', title: title || '' }, h('div', { className: 'k' }, k), h('div', { className: 'v' }, typeof v === 'string' ? v : fmt(v)))
      }

      var head = h('div', { className: 'tkn-head', onPointerDown: onDragStart },
        h('span', { className: 'tkn-title' }, t.title),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: function () { refresh() }, title: t.refresh }, '⟳'),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: toggleLang, title: lang === 'zh' ? 'English' : '中文' }, lang === 'zh' ? 'EN' : '中'),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: function () { setMode('collapsed') }, title: t.collapse }, '▾'),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: function () { setMode('hidden') }, title: t.close }, '×'),
      )

      var errBar = error ? h('div', { className: 'tkn-err' }, t.loadError + error + t.willRetry) : null

      var content
      if (!data) {
        content = h('div', { className: 'tkn-load' }, loading ? t.calculating : t.loading)
      } else {
        var cards = h('div', { className: 'tkn-cards' },
          card(t.inputTokens, totals.input),
          card(t.outputTokens, totals.output),
          card(t.totalTokens, totals.grand),
          card(t.cacheTokens, totals.cacheRead + totals.cacheWrite, t.cacheRead + ' ' + fmtFull(totals.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(totals.cacheWrite)),
          card(t.cacheHitRate, pct(totalHit), t.hitRateFormula),
          card(t.sessions, isDayMode ? (dayView.sessionCount || 0) : (data.covered + (data.totalCount > data.covered ? '/' + data.totalCount : ''))),
          card(t.stepsLabel, totals.steps),
        )
        var cur = currentProv ? h('div', { className: 'tkn-cur' },
          h('span', { className: 'name' }, (isDayMode ? t.dayMainProv : t.currentProv) + currentProv.name),
          h('span', { className: 'nums' }, t.input + ' ' + fmt(currentProv.input) + ' · ' + t.output + ' ' + fmt(currentProv.output) + ' · ' + t.cacheRead + ' ' + fmt(currentProv.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmt(currentProv.cacheWrite) + ' · ' + t.grand + ' ' + fmt(currentProv.total)),
        ) : (currentRow ? h('div', { className: 'tkn-cur' }, h('span', { className: 'name' }, t.currentSession + short(currentRow.title, 20)), h('span', { className: 'nums' }, t.noProvUsage)) : null)
        var provSec = h('div', null,
          h('div', { className: 'tkn-sec' }, t.configuredProvs + providers.length + '）'),
          providers.length === 0 ? h('div', { className: 'tkn-empty' }, t.noProvData) : providers.map(function (p) {
            var expanded = openProv === p.id
            var hit = hitRate(p.input - p.cacheRead - p.cacheWrite, p.cacheRead, p.cacheWrite)
            var row = h('div', { className: 'tkn-prov' + (p.id === currentProviderId ? ' cur' : ''), key: p.id, onClick: function () { setOpenProv(expanded ? null : p.id) }, title: expanded ? t.clickCollapse : t.clickExpand },
              h('span', { className: 'tkn-pname', title: p.id + ' · ' + t.cacheRead + ' ' + fmtFull(p.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(p.cacheWrite) }, p.name),
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
                    h('div', { className: 'tkn-prov-model-nums' }, t.input + ' ' + fmt(m.input) + ' · ' + t.output + ' ' + fmt(m.output) + ' · ' + t.total + ' ' + fmt(m.total) + ' · ' + t.cache + ' ' + fmt(m.cacheRead + m.cacheWrite) + ' · ' + t.hitRate + ' ' + pct(mHit)),
                  )
                }),
              ),
            ]
          }),
        )
        var dayDetail = null
        if (isDayMode && dayView) {
          var dHit = hitRate(dayView.input - dayView.cacheRead - dayView.cacheWrite, dayView.cacheRead, dayView.cacheWrite)
          dayDetail = h('div', { className: 'tkn-day-detail' },
            h('span', { className: 'tkn-day-date' }, t.viewing + dayView.date),
            h('span', null, t.input + ' ' + fmt(dayView.input) + ' · ' + t.output + ' ' + fmt(dayView.output) + ' · ' + t.cache + ' ' + fmt(dayView.cacheRead + dayView.cacheWrite) + ' · ' + t.hitRate + ' ' + pct(dHit) + ' · ' + t.total + ' ' + fmt(dayView.total) + ' · ' + t.stepsLabel + ' ' + fmt(dayView.steps)),
          )
        }
        var heat = h('div', null,
          h('div', { className: 'tkn-sec tkn-heat-head' },
            h('span', null, t.monthlyUsage),
            h('button', { className: 'tkn-heat-all', onClick: function () { setSelectedDay(null) }, title: t.viewAllMonth }, t.allUsage),
          ),
          dayDetail,
          h('div', { className: 'tkn-heat' }, days.map(function (d) {
            var i = maxDay > 0 ? d.total / maxDay : 0
            var dayNum = Number(d.date.slice(8))
            var isToday = d.date === todayKey
            var isSelected = d.date === selectedDay
            var bg
            var fg
            if (dark) {
              bg = i <= 0 ? 'transparent' : 'rgba(255,255,255,' + (0.06 + 0.82 * i).toFixed(3) + ')'
              fg = i > 0.4 ? '#1e2025' : 'var(--dsw-alias-label-secondary,var(--tkn-text2))'
            } else {
              bg = i <= 0 ? 'transparent' : 'rgba(47,107,255,' + (0.08 + 0.8 * i).toFixed(3) + ')'
              fg = i > 0.45 ? '#ffffff' : 'var(--dsw-alias-label-secondary,var(--tkn-text2))'
            }
            return h('div', { className: 'tkn-cell' + (isToday ? ' today' : '') + (isSelected ? ' selected' : ''), key: d.date, style: { background: bg, color: fg }, onClick: function () { setSelectedDay(isSelected ? null : d.date) }, title: (isSelected ? t.clickAgainReturn : t.clickViewDay) + d.date + '  ' + t.inputFull + fmtFull(d.input) + ' · ' + t.outputFull + fmtFull(d.output) + ' · ' + t.totalFull + fmtFull(d.total) },
              String(dayNum),
            )
          })),
          h('div', { className: 'tkn-heat-cap' },
            h('span', null, t.leftArrow + (days[0] ? days[0].date : '—')),
            h('span', null, t.today + todayKey + t.rightArrow),
          ),
        )
        var sessSec = h('div', null,
          h('div', { className: 'tkn-sec' }, isDayMode ? t.sessionDetailDay + (dayView.sessionCount || 0) + '）' : t.sessionDetail + data.covered + '/' + data.totalCount + '）'),
          sessions.length === 0 ? h('div', { className: 'tkn-empty' }, isDayMode ? t.noSessionDataDay : t.noSessionData) : h('table', { className: 'tkn-table' },
            h('thead', null, h('tr', null,
              h('th', null, t.thSession), h('th', null, t.thInput), h('th', null, t.thOutput), h('th', null, t.thCache), h('th', null, t.thHit), h('th', null, t.thTotal), h('th', null, t.thSteps), h('th', null, t.thStatus),
            )),
            h('tbody', null, visible.map(function (s) {
              var detail = openRow === s.id
              var sHit = hitRate(s.usage.uncachedInput, s.usage.cacheRead, s.usage.cacheWrite)
              var cells = h('tr', { key: s.id, className: 'tkn-row', onClick: function () { setOpenRow(detail ? null : s.id) } },
                h('td', { className: 't-title', title: s.title }, short(s.title, 20)),
                h('td', null, fmt(s.usage.uncachedInput + s.usage.cacheRead + s.usage.cacheWrite)),
                h('td', null, fmt(s.usage.output)),
                h('td', { title: t.cacheRead + ' ' + fmtFull(s.usage.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmtFull(s.usage.cacheWrite) }, fmt(s.usage.cacheRead + s.usage.cacheWrite)),
                h('td', { title: t.cacheRead + ' / (' + t.uncachedInput + ' + ' + t.cacheRead + ' + ' + t.cacheWrite + ')' }, pct(sHit)),
                h('td', null, fmt(s.grand)),
                h('td', null, fmt(s.steps)),
                h('td', null, h('span', { className: 'tkn-badge' + (s.live ? ' live' : '') }, s.live ? t.live : t.archived)),
              )
              if (!detail) return cells
              var reqs = s.requests || []
              var shownReqs = showReqs ? reqs : reqs.slice(0, 8)
              return [
                cells,
                h('tr', { key: s.id + '-d', className: 'tkn-detail' }, h('td', { colSpan: 8 },
                  t.uncachedInput + ' ' + fmt(s.usage.uncachedInput) + ' · ' + t.cacheRead + ' ' + fmt(s.usage.cacheRead) + ' · ' + t.cacheWrite + ' ' + fmt(s.usage.cacheWrite) + ' · ' + t.output + ' ' + fmt(s.usage.output) + ' · ' + t.hitRate + ' ' + pct(sHit),
                  h('br'),
                  t.turns + ' ' + fmt(s.turns) + ' · ' + t.modelDuration + ' ' + fmtDur(s.llmMs) + (s.lastProvider ? ' · ' + t.provider + ' ' + s.lastProvider + (s.lastModel ? ' / ' + s.lastModel : '') : '') + ' · ' + t.created + ' ' + fmtDate(s.createdAt),
                  s.pressure && s.pressure.contextWindow ? h('div', null, t.contextUsage + ' ' + fmt(s.pressure.pressureTokens) + ' / ' + fmt(s.pressure.contextWindow) + t.projectedNext + fmt(s.pressure.projectedTokens) + ')') : null,
                  h('div', { style: { marginTop: 6, fontWeight: 600, color: 'var(--dsw-alias-label-primary,var(--tkn-text))' } }, t.recentRequests + reqs.length + '）'),
                  reqs.length === 0 ? h('div', null, t.noRequestData) : shownReqs.map(function (r, ri) {
                    return h('div', { className: 'tkn-req', key: ri },
                      h('span', { className: 't' }, fmtTime(r.time)),
                      h('span', null, (r.provider || '?') + (r.model ? '/' + r.model : '')),
                      h('span', null, t.input + ' ' + fmtFull(r.input)),
                      h('span', null, t.output + ' ' + fmtFull(r.output)),
                      h('span', null, t.cacheRead + ' ' + fmtFull(r.cacheRead)),
                      h('span', null, t.cacheWrite + ' ' + fmtFull(r.cacheWrite)),
                    )
                  }),
                  reqs.length > 8 ? h('button', { className: 'tkn-more', onClick: function (e) { e.stopPropagation(); setShowReqs(!showReqs) } }, showReqs ? t.collapseRequests : t.showAllRequests + reqs.length + t.requests) : null,
                  s.error && s.errorMsg ? h('div', { style: { color: 'var(--dsw-alias-state-error-primary,var(--tkn-err))', marginTop: 4 } }, t.readError + s.errorMsg) : null,
                )),
              ]
            })),
          ),
          sessions.length > 50 ? h('button', { className: 'tkn-more', onClick: function () { setShowAll(!showAll) } }, showAll ? t.collapseList : t.showAllSessions + sessions.length + t.sessionsUnit) : null,
        )
        content = h('div', null,
          cards,
          cur,
          provSec,
          heat,
          sessSec,
        )
      }

      return h('div', { ref: panelRef, className: 'tkn-panel ' + themeClass, style: { left: pos.x, top: pos.y } },
        head,
        errBar,
        h('div', { className: 'tkn-body' }, content),
        h('div', { className: 'tkn-foot' },
          h('span', null, t.updatedAt + fmtDate(data ? data.generatedAt : null) + (loading ? t.refreshing : t.autoRefresh)),
          h('span', null, t.estimated),
        ),
      )
    }

    function apply(ctx) {
      ctxRef = ctx
      ctx.slots.inject('shell.overlay', function () {
        return ctx.slots.register(
          { name: 'shell.overlay', id: 'token-stats-panel', order: 0 },
          function (props) { return React.createElement(TokenStatsPanel, props) },
        )
      })
    }

    exports.apply = apply
    exports.inject = ['slots']
    return module.exports
  },
})
