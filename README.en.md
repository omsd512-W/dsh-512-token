[简体中文](README.md) | English

# dsh-512-token

A token usage statistics page for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) v0.2.0-rc.1 web UI. After installing, open **Settings → Token Usage** to see input / output / cache / hit rate across all sessions, usage per provider and model, a daily heatmap for the current month, and per-session request records.

<table>
  <tr>
    <td><img src="docs/panel-1.png" alt="Stats" width="400" /></td>
    <td><img src="docs/panel-2.png" alt="Stats" width="400" /></td>
  </tr>
</table>

> The screenshots show the 0.3 floating panel; since 0.4 the same content lives in Settings.

## Features

- **Overview**: input, output, total, cache read / write, cache hit rate, sessions, steps, turns
- **Every session counted**: history, forks and subagent sessions, with no cap
- **Providers**: the providers you configured (from the `llm-pi-ai` / `llm-deepseek` settings sections) plus any route that carried usage; expand one for per-model usage
- **Monthly heatmap**: one cell per day of the current month; click a day to switch the whole page to that day, click "All Usage" to go back
- **Sessions**: input / output / cache / hit rate / total / steps per session; expand a row for buckets, context usage, fork inheritance and recent request records
- **Forks counted once**: a forked session counts only its own work after the fork; the part inherited from its parent is counted in the parent, or once in the fork if the parent was deleted
- **Fits the UI**: language follows dsh's Chinese/English setting, colors follow the light/dark theme; refreshes every 10 seconds while the page is open

## Install

```bash
dsh plugin --profile web add github:omsd512-W/dsh-512-token
```

The package ships a `cordis.patch.yml` composition layer that `dsh plugin` adds to the `web` profile. Restart dsh and reload the page afterwards.

Requires dsh 0.2.0-rc.1 or a later 0.2 release (it uses the session projection API); on an incompatible version dsh disables the plugin instead of letting it fail.

### Install from source

```bash
git clone https://github.com/omsd512-W/dsh-512-token.git
cd dsh-512-token
dsh plugin --profile web add .
```

## Uninstall

Run `dsh plugin --profile web remove dsh-512-token` and restart dsh. You can also delete `~/.dsh/storages/dsh-512-token/`.

## How it works

```
lib/index.js       host half: registers the session projection, reads the projection cache, serves /dsh-512-token
lib/client.js      browser half: the Settings page (shell module-table format, no build step)
cordis.patch.yml   composition row loaded by the dsh plugin manager
```

**Incremental**: each session's usage is a dsh session projection (`sessionProjections`, host-only, never sent to the browser with session data).

- Live sessions: dsh updates the projection on every appended event; the plugin reads the current value.
- History: dsh checkpoints projections into its persisted cache (`sessionProjectionCache`) at every turn end and when a session closes; the plugin reads that cache instead of the logs.
- A session without a cached value (first install, or after the fold logic changes) is read once in the background and the result is written back to the cache, so it is never read again.
- A cached value can lag its log (dsh killed mid-turn, or the session continued under another profile). `~/.dsh/storages/dsh-512-token/verified.json` records the log size each cached value was checked against; when the size changes, the cached value is shown while that one session is re-read in the background.

**What is counted**: provider-reported usage from the log (`request/header` for provider and model, usage on `assistant/message` / `assistant/attempt`); retries within one step follow dsh token-meter's replacement rule, so only the final attempt counts. A fork's inherited prefix length comes straight from dsh (inheritedEventCount); older logs fall back to the `session/end-seed { inherited: true }` marker.

**Loading contract**:

- `package.json` declares `dsh.client.platform = "web"` and its `inject` dependencies; the host scanner mounts `/plugins/<id>/client.js`
- The browser half is bundled in module-table format; the factory returns `{ apply, inject }`
- The UI registers a Settings page through `ctx.slots.inject('settings.section', …)` (id `dsh-512-token`, after the built-in pages)
- When changing the fold logic, bump `STATE_VERSION` in `lib/index.js`; old cached values are then ignored and rebuilt in the background

## Development

```bash
# Syntax check and tests
npm run check

# Install from the current directory into the web profile
dsh plugin --profile web add .
```

## Credits

Based on `dsh-token-stats` by **H1a3x**; released under the same [MIT](LICENSE) license with the original attribution kept.

- Source: https://github.com/H1a3x/dsh-token-stats
- npm: https://www.npmjs.com/package/dsh-token-stats

Third-party code brought in must keep its original LICENSE and attribution; active upstream dependencies are referenced through npm rather than copied.

## Links

- [Linux.do](https://linux.do/)
