# dsh-token-stats

浮动的 Token 用量统计面板插件，为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面提供完整的用量统计：

- **总用量**：输入 / 输出 / 总计 / 缓存 / 缓存命中率 / 会话数 / 步数
- **当前提供商**：当前会话所用提供商及其累计用量（自动高亮）；点击提供商行可展开**模型明细**（每个模型各自的 入/出/总/缓存/命中率）
- **已配置提供商**：只显示你真正配置的提供商（来自 `llm-pi-ai` / `llm-deepseek` 设置节）+ 实际产生用量的路由，每个提供商显示 入/出/缓存/总计
- **本月用量**：当月 1 号到月末的热力方格（深色模式用量越多越白，浅色模式越多越蓝）；**点击任意日期，整个面板（卡片/提供商/会话明细）同步为该日数据**，点"全部用量"返回全量视图
- **会话明细**：每个会话的 输入/输出/缓存/命中率/总计/步数，可展开查看分桶、上下文占用与 **最近逐请求记录**（时间、提供商/模型、入、出、缓存读、缓存写）
- 面板可**拖动、折叠为摘要长条、关闭后从悬浮球重开**；数据每 10 秒自动刷新；配色跟随 harness 深浅主题

数据来源：harness 的 `tokenUsage` / `sessionStats` 投影（provider 上报值）叠加插件对会话日志的增量折叠（`request/header` + `assistant/message` usage），历史会话读取一次后缓存。

## 安装

**一条命令**（npm 发布后）：

```bash
npx dsh-token-stats install
```

安装器自动完成（幂等，可重复运行）：

1. 把包安装到 `$DSH_HOME/profiles/node_modules/dsh-token-stats`（dsh 插件解析根，真实目录、非符号链接）；
2. 把组合行写入 `$DSH_HOME/profiles/web/cordis.patch.yml`（已被清空的补丁也会修复；`--profile <name>` 指定其他 profile）；
3. 打印提示。

然后**重启 dsh，刷新浏览器页面**——重启是唯一无法自动化的步骤（宿主模块与组合在进程内缓存，插件无法安全地重启自己的宿主进程）。

可选参数：`--profile <name>`（默认 `web`）、`--force`（重新覆盖已安装的包）。

> 未发布时的本地安装：`node scripts/install.js --from <仓库目录>`；卸载：删除 `profiles/node_modules/dsh-token-stats` 目录并从 `cordis.patch.yml` 移除该行，重启。

## 插件契约（本插件如何装载）

- `package.json` 声明 `dsh.client = { "platform": "web", "inject": [...] }` 与 `exports["./client"]`。宿主侧扫描器（`@deepseek-ai/dsh-client-modules` 的 Node 半边）据此生成 `window.__DSH_BOOT__` 图行，并挂上 `/plugins/<id>/client.js` 路由。
- 浏览器半以模块表格式打包：`window.__ModuleLoader__.load({ id, factory })`，工厂内可 `require('react')` 等平台种子词；工厂物化时注入 CSS（模块系统记录 `data-plugin` 归属）。
- 工厂返回 `module.exports = { apply, inject }`。**服务依赖以导出的 `inject` 为准**（cordis 等待该服务后再执行 apply）；包声明里的 `inject` 只是图信息。
- 宿主半通过 `ctx.inject(['webServer'], …)` 注册 HTTP 路由；没有 `webServer`（非 Web profile）时静默跳过，不影响无头模式。
- UI 入口：`ctx.slots.inject('shell.overlay', …)` —— root 作用域的 list slot，浮层可拖动、不遮挡页面交互。
- 热更新边界：`lib/client.js` 内容变化**刷新页面即生效**；`dsh.client` 声明变化需要**重启 dsh**（扫描结果按包名缓存、不失效）。

## 卸载

从 `cordis.patch.yml` 删除该行并重启；或保留行、在设置页的插件清单里禁用。

## 开发

```
lib/index.js   宿主半：日志增量折叠 + /token-stats JSON 路由
lib/client.js  浏览器半：面板 UI（shell module-table 格式，无需构建步骤）
```

本地验证：

```bash
node --check lib/index.js
```

## 发布（GitHub + npm）

```bash
# 1) 推到 GitHub（把 package.json 的 repository 改成你的仓库地址）
git init && git add . && git commit -m "dsh-token-stats v0.1.0"
git remote add origin https://github.com/<your-name>/dsh-token-stats.git
git push -u origin main
git tag v0.1.0 && git push origin v0.1.0

# 2) 发布到 npm（如名字被占用，改用 @<你的scope>/dsh-token-stats 并同步改包名）
npm publish
```

他人安装：`npm install dsh-token-stats` + 上面的组合行即可。

## License

MIT
