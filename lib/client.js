/* dsh-token-stats — browser half.
 *
 * Bundled in the shell module-table format: window.__ModuleLoader__.load()
 * with a factory receiving the module `require`. The kernel adopts the
 * exported `apply`/`inject` as a Cordis client plugin.
 */
window.__ModuleLoader__.load({
  id: 'dsh-token-stats',
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
      '.tkn-panel{position:fixed;width:600px;max-width:calc(100vw - 24px);max-height:min(720px,88vh);display:flex;flex-direction:column;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-overlay,var(--tkn-bg)));border:1px solid var(--dsw-alias-border-l2,var(--tkn-line2));border-radius:12px;box-shadow:var(--tkn-shadow);z-index:1000;pointer-events:auto;color:var(--dsw-alias-label-primary,var(--tkn-text));font-size:12px;overflow:hidden}',
      '.tkn-panel *{box-sizing:border-box}',
      '.tkn-head{display:flex;align-items:center;gap:6px;padding:9px 12px;cursor:move;user-select:none;background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));flex:none}',
      '.tkn-title{font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}',
      '.tkn-btn{border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:2px 8px;cursor:pointer;font-size:11px;line-height:1.6;flex:none}',
      '.tkn-btn:hover{color:var(--dsw-alias-label-primary,var(--tkn-text));border-color:var(--dsw-alias-border-l2,var(--tkn-line2))}',
      '.tkn-body{overflow-y:auto;padding:12px;min-height:0}',
      '.tkn-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
      '.tkn-card{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;padding:7px 9px;min-width:0}',
      '.tkn-card .k{color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-card .v{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-sec{margin:12px 0 6px;font-weight:600;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:11px;text-transform:uppercase;letter-spacing:.04em}',
      '.tkn-cur{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));border-radius:8px;margin-top:10px}',
      '.tkn-cur .name{font-weight:600}',
      '.tkn-cur .nums{margin-left:auto;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap}',
      '.tkn-cols{display:grid;grid-template-columns:1.05fr 1fr;gap:12px;margin-top:4px;align-items:start}',
      '.tkn-cols .tkn-sec{margin-top:12px}',
      '.tkn-prov{display:flex;align-items:center;gap:8px;padding:5px 2px;border-bottom:1px dashed var(--dsw-alias-border-l1,var(--tkn-line1))}',
      '.tkn-prov.cur .pname{color:var(--dsw-alias-brand-primary,var(--tkn-brand));font-weight:600}',
      '.tkn-pname{min-width:92px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.tkn-pnums{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap;font-size:11px}',
      '.tkn-track{flex:1;height:7px;background:var(--dsw-alias-bg-layer-2,var(--tkn-bg2));border-radius:4px;overflow:hidden;min-width:36px}',
      '.tkn-fill{height:100%;background:var(--dsw-alias-brand-primary,var(--tkn-brand));border-radius:4px}',
      '.tkn-heat{display:grid;grid-template-columns:repeat(15,1fr);gap:4px}',
      '.tkn-cell{aspect-ratio:1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-variant-numeric:tabular-nums;background:var(--dsw-alias-bg-layer-2,var(--tkn-bg2));min-width:0;cursor:default}',
      '.tkn-cell.today{outline:1px solid var(--dsw-alias-brand-primary,var(--tkn-brand));outline-offset:1px}',
      '.tkn-heat-cap{font-size:10px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));margin-top:5px;display:flex;justify-content:space-between}',
      '.tkn-table{width:100%;border-collapse:collapse;font-size:11.5px}',
      '.tkn-table th{text-align:left;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-weight:500;padding:4px 6px;border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));white-space:nowrap}',
      '.tkn-table td{padding:5px 6px;border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));font-variant-numeric:tabular-nums;white-space:nowrap;vertical-align:top}',
      '.tkn-table td.t-title{max-width:150px;overflow:hidden;text-overflow:ellipsis}',
      '.tkn-row{cursor:pointer}',
      '.tkn-row:hover{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1))}',
      '.tkn-detail{background:var(--dsw-alias-bg-layer-1,var(--tkn-bg1));font-size:11px;color:var(--dsw-alias-label-secondary,var(--tkn-text2))}',
      '.tkn-req{display:flex;gap:7px;align-items:baseline;padding:2px 0;font-variant-numeric:tabular-nums}',
      '.tkn-req .t{color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-badge{font-size:10px;padding:1px 6px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));color:var(--dsw-alias-label-secondary,var(--tkn-text2));white-space:nowrap}',
      '.tkn-badge.live{color:var(--dsw-alias-state-success-primary,var(--tkn-ok));border-color:var(--dsw-alias-state-success-primary,var(--tkn-ok))}',
      '.tkn-more{width:100%;margin-top:6px;border:1px dashed var(--dsw-alias-border-l1,var(--tkn-line1));background:transparent;color:var(--dsw-alias-label-secondary,var(--tkn-text2));border-radius:6px;padding:4px;cursor:pointer;font-size:11px}',
      '.tkn-foot{display:flex;justify-content:space-between;align-items:center;padding:7px 12px;border-top:1px solid var(--dsw-alias-border-l1,var(--tkn-line1));color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:10px;flex:none}',
      '.tkn-err{color:var(--dsw-alias-state-error-primary,var(--tkn-err));padding:6px 12px;font-size:11px;border-bottom:1px solid var(--dsw-alias-border-l1,var(--tkn-line1))}',
      '.tkn-load{padding:18px;text-align:center;color:var(--dsw-alias-label-secondary,var(--tkn-text2))}',
      '.tkn-collapsed{position:fixed;pointer-events:auto;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-overlay,var(--tkn-bg)));border:1px solid var(--dsw-alias-border-l2,var(--tkn-line2));border-radius:9px;padding:8px 12px;cursor:pointer;font-size:11.5px;z-index:1000;box-shadow:var(--tkn-shadow);user-select:none;color:var(--dsw-alias-label-primary,var(--tkn-text));display:flex;align-items:center;gap:10px;max-width:min(600px,calc(100vw - 24px))}',
      '.tkn-coll-title{font-weight:600;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:none}',
      '.tkn-coll-item{color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.tkn-coll-item.strong{color:var(--dsw-alias-label-primary,var(--tkn-text));font-weight:600}',
      '.tkn-pill{position:fixed;right:16px;bottom:16px;pointer-events:auto;background:var(--dsw-specific-sidebar-fill,var(--dsw-alias-bg-overlay,var(--tkn-bg)));border:1px solid var(--dsw-alias-border-l2,var(--tkn-line2));border-radius:999px;padding:8px 14px;cursor:pointer;font-size:12px;z-index:1000;box-shadow:var(--tkn-shadow);display:flex;align-items:center;gap:7px;color:var(--dsw-alias-label-primary,var(--tkn-text))}',
      '.tkn-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-brand-primary,var(--tkn-brand))}',
      '.tkn-empty{padding:10px;color:var(--dsw-alias-label-secondary,var(--tkn-text2));font-size:11px;text-align:center}',
    ].join('\n')

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
      return fetch('/token-stats', { cache: 'no-store' }).then(function (res) {
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
      var showAllState = useState(false)
      var showAll = showAllState[0]
      var setShowAll = showAllState[1]
      var showReqsState = useState(false)
      var showReqs = showReqsState[0]
      var setShowReqs = showReqsState[1]
      var panelRef = useRef(null)
      var dragRef = useRef(null)

      var theme = ctx.get('theme')
      var themeState = useState(function () {
        try {
          var s = theme && theme.getTheme ? theme.getTheme() : null
          return (s && s.active && s.active.id) || (s && s.preference) || ''
        } catch (e) { return '' }
      })
      var themeId = themeState[0]
      var setThemeId = themeState[1]
      useEffect(function () {
        if (!ctx || typeof ctx.on !== 'function') return undefined
        return ctx.on('theme/change', function (snap) {
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
          var current = props.useSessions(function (state) { return (state ? state.current : undefined) })
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
        var timerId = window.setInterval(function () { refresh() }, 5000)
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
      var currentRow = null
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].id === currentId) { currentRow = sessions[i]; break }
      }
      var currentProviderId = currentRow ? currentRow.lastProvider : null
      var currentProv = null
      for (var j = 0; j < providers.length; j++) {
        if (providers[j].id === currentProviderId) { currentProv = providers[j]; break }
      }
      var curInput = currentRow ? (currentRow.usage.uncachedInput + currentRow.usage.cacheRead + currentRow.usage.cacheWrite) : (totals ? totals.input : null)
      var curCache = currentRow ? (currentRow.usage.cacheRead + currentRow.usage.cacheWrite) : (totals ? (totals.cacheRead + totals.cacheWrite) : null)
      var curCacheRead = currentRow ? currentRow.usage.cacheRead : (totals ? totals.cacheRead : null)
      var curCacheWrite = currentRow ? currentRow.usage.cacheWrite : (totals ? totals.cacheWrite : null)
      var curOutput = currentRow ? currentRow.usage.output : (totals ? totals.output : null)
      var curGrand = currentRow ? currentRow.grand : (totals ? totals.grand : null)
      var curSteps = currentRow ? currentRow.steps : (totals ? totals.steps : null)

      if (mode === 'hidden') {
        return h('div', { className: 'tkn-pill ' + themeClass, onClick: function () { setMode('expanded') }, title: '打开 Token 用量统计' },
          h('span', { className: 'tkn-pill-dot' }),
          'Token 统计',
        )
      }

      if (mode === 'collapsed') {
        return h('div', { ref: panelRef, className: 'tkn-collapsed ' + themeClass, style: { left: pos.x, top: pos.y }, onPointerDown: onDragStart, onClick: function () { if (!dragRef.current || !dragRef.current.moved) setMode('expanded') }, title: 'Token 用量（点击展开，拖动移动）' },
          h('span', { className: 'tkn-coll-title', title: currentRow ? currentRow.title : '全部会话' }, 'Token · ' + short(currentRow ? currentRow.title : '全部会话', 14)),
          h('span', { className: 'tkn-coll-item' }, '入 ' + fmt(curInput)),
          h('span', { className: 'tkn-coll-item' }, '出 ' + fmt(curOutput)),
          h('span', { className: 'tkn-coll-item', title: '缓存读 ' + fmtFull(curCacheRead) + ' · 缓存写 ' + fmtFull(curCacheWrite) }, '缓存 ' + fmt(curCache)),
          h('span', { className: 'tkn-coll-item strong' }, '总计 ' + fmt(curGrand)),
          h('span', { className: 'tkn-coll-item' }, fmt(curSteps) + ' 步'),
        )
      }

      var maxDay = 0
      for (var di = 0; di < days.length; di++) if (days[di].total > maxDay) maxDay = days[di].total
      var maxProv = 0
      for (var pi = 0; pi < providers.length; pi++) if (providers[pi].total > maxProv) maxProv = providers[pi].total
      var visible = showAll ? sessions : sessions.slice(0, 50)
      var todayKey = dayKey(Date.now())
      var totalHit = hitRate(totals ? totals.input - totals.cacheRead - totals.cacheWrite : null, totals ? totals.cacheRead : null, totals ? totals.cacheWrite : null)

      function card(k, v, title) {
        return h('div', { className: 'tkn-card', title: title || '' }, h('div', { className: 'k' }, k), h('div', { className: 'v' }, typeof v === 'string' ? v : fmt(v)))
      }

      var head = h('div', { className: 'tkn-head', onPointerDown: onDragStart },
        h('span', { className: 'tkn-title' }, 'Token 用量统计'),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: function () { refresh() }, title: '刷新' }, '⟳'),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: function () { setMode('collapsed') }, title: '收起' }, '▾'),
        h('button', { className: 'tkn-btn', onPointerDown: stop, onClick: function () { setMode('hidden') }, title: '关闭' }, '×'),
      )

      var errBar = error ? h('div', { className: 'tkn-err' }, '统计加载失败：' + error + '（将自动重试）') : null

      var content
      if (!data) {
        content = h('div', { className: 'tkn-load' }, loading ? '统计中…' : '加载中…')
      } else {
        var cards = h('div', { className: 'tkn-cards' },
          card('输入 Tokens', totals.input),
          card('输出 Tokens', totals.output),
          card('总计 Tokens', totals.grand),
          card('缓存 Tokens', totals.cacheRead + totals.cacheWrite, '缓存读 ' + fmtFull(totals.cacheRead) + ' · 缓存写 ' + fmtFull(totals.cacheWrite)),
          card('缓存命中率', pct(totalHit), '命中 = 缓存读 / (未缓存输入 + 缓存读 + 缓存写)'),
          card('会话', data.covered + (data.totalCount > data.covered ? '/' + data.totalCount : '')),
          card('步数', totals.steps),
        )
        var cur = currentProv ? h('div', { className: 'tkn-cur' },
          h('span', { className: 'name' }, '当前提供商：' + currentProv.name),
          h('span', { className: 'nums' }, '入 ' + fmt(currentProv.input) + ' · 出 ' + fmt(currentProv.output) + ' · 缓存读 ' + fmt(currentProv.cacheRead) + ' · 缓存写 ' + fmt(currentProv.cacheWrite) + ' · 共 ' + fmt(currentProv.total)),
        ) : (currentRow ? h('div', { className: 'tkn-cur' }, h('span', { className: 'name' }, '当前会话：' + short(currentRow.title, 20)), h('span', { className: 'nums' }, '尚无提供商用量记录')) : null)
        var provSec = h('div', null,
          h('div', { className: 'tkn-sec' }, '已配置提供商（' + providers.length + '）'),
          providers.length === 0 ? h('div', { className: 'tkn-empty' }, '尚无提供商数据') : providers.map(function (p) {
            return h('div', { className: 'tkn-prov' + (p.id === currentProviderId ? ' cur' : ''), key: p.id },
              h('span', { className: 'tkn-pname', title: p.id + ' · 缓存读 ' + fmtFull(p.cacheRead) + ' · 缓存写 ' + fmtFull(p.cacheWrite) }, p.name),
              h('span', { className: 'tkn-pnums' }, '入 ' + fmt(p.input) + ' · 出 ' + fmt(p.output) + ' · ' + fmt(p.total)),
              h('span', { className: 'tkn-track' }, h('span', { className: 'tkn-fill', style: { width: maxProv > 0 ? Math.max(2, Math.round((p.total / maxProv) * 100)) + '%' : '0%' } })),
            )
          }),
        )
        var heat = h('div', null,
          h('div', { className: 'tkn-sec' }, '近 30 天用量'),
          h('div', { className: 'tkn-heat' }, days.map(function (d) {
            var i = maxDay > 0 ? d.total / maxDay : 0
            var dayNum = Number(d.date.slice(8))
            var isToday = d.date === todayKey
            var bg
            var fg
            if (dark) {
              bg = i <= 0 ? 'transparent' : 'rgba(255,255,255,' + (0.06 + 0.82 * i).toFixed(3) + ')'
              fg = i > 0.4 ? '#1e2025' : 'var(--dsw-alias-label-secondary,var(--tkn-text2))'
            } else {
              bg = i <= 0 ? 'transparent' : 'rgba(47,107,255,' + (0.08 + 0.8 * i).toFixed(3) + ')'
              fg = i > 0.45 ? '#ffffff' : 'var(--dsw-alias-label-secondary,var(--tkn-text2))'
            }
            return h('div', { className: 'tkn-cell' + (isToday ? ' today' : ''), key: d.date, style: { background: bg, color: fg }, title: d.date + '  输入 ' + fmtFull(d.input) + ' · 输出 ' + fmtFull(d.output) + ' · 总计 ' + fmtFull(d.total) },
              String(dayNum),
            )
          })),
          h('div', { className: 'tkn-heat-cap' },
            h('span', null, '← ' + (days[0] ? days[0].date : '—')),
            h('span', null, '今天 ' + todayKey + ' →'),
          ),
        )
        var sessSec = h('div', null,
          h('div', { className: 'tkn-sec' }, '会话明细（' + data.covered + '/' + data.totalCount + '）'),
          sessions.length === 0 ? h('div', { className: 'tkn-empty' }, '尚无会话数据') : h('table', { className: 'tkn-table' },
            h('thead', null, h('tr', null,
              h('th', null, '会话'), h('th', null, '输入'), h('th', null, '输出'), h('th', null, '缓存'), h('th', null, '命中'), h('th', null, '总计'), h('th', null, '步数'), h('th', null, '状态'),
            )),
            h('tbody', null, visible.map(function (s) {
              var detail = openRow === s.id
              var sHit = hitRate(s.usage.uncachedInput, s.usage.cacheRead, s.usage.cacheWrite)
              var cells = h('tr', { key: s.id, className: 'tkn-row', onClick: function () { setOpenRow(detail ? null : s.id) } },
                h('td', { className: 't-title', title: s.title }, short(s.title, 20)),
                h('td', null, fmt(s.usage.uncachedInput + s.usage.cacheRead + s.usage.cacheWrite)),
                h('td', null, fmt(s.usage.output)),
                h('td', { title: '缓存读 ' + fmtFull(s.usage.cacheRead) + ' · 缓存写 ' + fmtFull(s.usage.cacheWrite) }, fmt(s.usage.cacheRead + s.usage.cacheWrite)),
                h('td', { title: '缓存读 / (未缓存输入 + 缓存读 + 缓存写)' }, pct(sHit)),
                h('td', null, fmt(s.grand)),
                h('td', null, fmt(s.steps)),
                h('td', null, h('span', { className: 'tkn-badge' + (s.live ? ' live' : '') }, s.live ? 'live' : '存档')),
              )
              if (!detail) return cells
              var reqs = s.requests || []
              var shownReqs = showReqs ? reqs : reqs.slice(0, 8)
              return [
                cells,
                h('tr', { key: s.id + '-d', className: 'tkn-detail' }, h('td', { colSpan: 8 },
                  '未缓存输入 ' + fmt(s.usage.uncachedInput) + ' · 缓存读 ' + fmt(s.usage.cacheRead) + ' · 缓存写 ' + fmt(s.usage.cacheWrite) + ' · 输出 ' + fmt(s.usage.output) + ' · 命中率 ' + pct(sHit),
                  h('br'),
                  '轮次 ' + fmt(s.turns) + ' · 模型耗时 ' + fmtDur(s.llmMs) + (s.lastProvider ? ' · 提供商 ' + s.lastProvider + (s.lastModel ? ' / ' + s.lastModel : '') : '') + ' · 创建 ' + fmtDate(s.createdAt),
                  s.pressure && s.pressure.contextWindow ? h('div', null, '上下文占用 ' + fmt(s.pressure.pressureTokens) + ' / ' + fmt(s.pressure.contextWindow) + '（预估下次 ' + fmt(s.pressure.projectedTokens) + '）') : null,
                  h('div', { style: { marginTop: 6, fontWeight: 600, color: 'var(--dsw-alias-label-primary,var(--tkn-text))' } }, '最近请求记录（' + reqs.length + '）'),
                  reqs.length === 0 ? h('div', null, '暂无请求记录（尚无上报用量）') : shownReqs.map(function (r, ri) {
                    return h('div', { className: 'tkn-req', key: ri },
                      h('span', { className: 't' }, fmtTime(r.time)),
                      h('span', null, (r.provider || '?') + (r.model ? '/' + r.model : '')),
                      h('span', null, '入 ' + fmtFull(r.input)),
                      h('span', null, '出 ' + fmtFull(r.output)),
                      h('span', null, '缓存读 ' + fmtFull(r.cacheRead)),
                      h('span', null, '缓存写 ' + fmtFull(r.cacheWrite)),
                    )
                  }),
                  reqs.length > 8 ? h('button', { className: 'tkn-more', onClick: function (e) { e.stopPropagation(); setShowReqs(!showReqs) } }, showReqs ? '收起请求记录' : '显示全部 ' + reqs.length + ' 条请求') : null,
                  s.error && s.errorMsg ? h('div', { style: { color: 'var(--dsw-alias-state-error-primary,var(--tkn-err))', marginTop: 4 } }, '读取统计出错：' + s.errorMsg) : null,
                )),
              ]
            })),
          ),
          sessions.length > 50 ? h('button', { className: 'tkn-more', onClick: function () { setShowAll(!showAll) } }, showAll ? '收起列表' : '显示全部 ' + sessions.length + ' 个会话') : null,
        )
        content = h('div', null,
          cards,
          cur,
          h('div', { className: 'tkn-cols' }, provSec, heat),
          sessSec,
        )
      }

      return h('div', { ref: panelRef, className: 'tkn-panel ' + themeClass, style: { left: pos.x, top: pos.y } },
        head,
        errBar,
        h('div', { className: 'tkn-body' }, content),
        h('div', { className: 'tkn-foot' },
          h('span', null, '更新于 ' + fmtDate(data ? data.generatedAt : null) + (loading ? ' · 刷新中' : ' · 每5s自动')),
          h('span', null, '估算/上报值'),
        ),
      )
    }

    function apply(ctx) {
      var tagId = 'dsh-token-stats/panel.css'
      if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
        var tag = document.createElement('style')
        tag.dataset.pluginCss = tagId
        tag.textContent = css
        document.head.appendChild(tag)
      }
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
