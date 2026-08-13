# dsh-token-stats

浮动的 Token 用量统计面板插件，为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面提供完整的用量统计：

- **总用量**：输入 / 输出 / 总计 / 缓存 / 缓存命中率 / 会话数 / 步数
- **当前提供商**：当前会话所用提供商及其累计用量（自动高亮）
- **已配置提供商**：只显示你真正配置的提供商（来自 `llm-pi-ai` / `llm-deepseek` 设置节）+ 实际产生用量的路由，每个提供商显示 入/出/缓存/总计 与占比条
- **近 30 天用量**：30 个热力方格（深色模式用量越多越白，浅色模式越多越蓝），悬停查看每日明细
- **会话明细**：每个会话的 输入/输出/缓存/命中率/总计/步数，可展开查看分桶、上下文占用与 **最近逐请求记录**（时间、提供商/模型、入、出、缓存读、缓存写）
- 面板可**拖动、折叠为摘要长条（当前会话标题 + 入/出/缓存/总计/步数）、关闭后从悬浮球重开**；数据每 5 秒自动刷新；配色跟随 harness 深浅主题

数据来源：harness 的 `tokenUsage` / `sessionStats` 投影（provider 上报值）叠加插件对会话日志的增量折叠（`request/header` + `assistant/message` usage），历史会话读取一次后缓存。

## 安装

在运行 dsh 的目录（装有 dsh 的 node_modules 处）安装：

```bash
npm install dsh-token-stats
```

然后把插件行加入你的 profile 补丁（或 `$DSH_HOME/cordis.patch.yml` 全局层）：

```yaml
- insert:
    - id: token-stats
      name: dsh-token-stats
```

重启 dsh（或等待用户补丁热重载），然后**刷新浏览器页面**（新 client 模块需要页面重载才会进入 `window.__DSH_BOOT__`）。面板会出现在页面右上区域。

> 依赖：需要 Web profile（`webServer` 服务）与 `session-query` / `session-projection` / `session-persistence` 等标准宿主行（默认 Web 组合均具备）。

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
