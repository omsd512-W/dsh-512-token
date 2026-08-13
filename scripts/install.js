#!/usr/bin/env node
/**
 * dsh-token-stats installer: one command = package + composition row.
 *
 *   npx dsh-token-stats install [--profile web] [--force]
 *   node scripts/install.js --from <local package dir>
 *
 * 1. Copies the package into $DSH_HOME/profiles/node_modules/dsh-token-stats
 *    (the profile resolution root the dsh loader resolves bare plugin names
 *    from; a real directory, no symlink).
 * 2. Idempotently adds the composition row to
 *    $DSH_HOME/profiles/<profile>/cordis.patch.yml.
 * 3. Prints the one manual step left: restart dsh, then refresh the page.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, lstatSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url)) // <pkg>/scripts
const pkgDir = dirname(here) // <pkg>

function parseArgs(argv) {
  const opts = { command: 'install', profile: 'web', from: null, force: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--profile' && argv[i + 1]) opts.profile = argv[++i]
    else if (a === '--from' && argv[i + 1]) opts.from = argv[++i]
    else if (a === '--force') opts.force = true
    else if (a === '--help' || a === '-h') opts.command = 'help'
    else if (a === 'install') opts.command = 'install'
  }
  return opts
}

const FILES = ['lib', 'package.json', 'README.md', 'LICENSE']

function copyRecursive(src, dst) {
  mkdirSync(dst, { recursive: true })
  for (const entry of readdirSync(src)) {
    const s = join(src, entry)
    const d = join(dst, entry)
    if (statSync(s).isDirectory()) copyRecursive(s, d)
    else copyFileSync(s, d)
  }
}

/** Remove a path whether it is a real directory or a symlink (link only). */
function rmAny(p) {
  try {
    if (lstatSync(p).isSymbolicLink()) { unlinkSync(p); return }
  } catch { /* missing: nothing to remove */ }
  rmSync(p, { recursive: true, force: true })
}

function copyPackage(fromDir, target) {
  for (const f of FILES) {
    const s = join(fromDir, f)
    if (!existsSync(s)) {
      console.error(`error: ${fromDir} 缺少 ${f} —— 不是 dsh-token-stats 包目录`)
      process.exit(1)
    }
  }
  rmAny(target)
  mkdirSync(target, { recursive: true })
  for (const f of FILES) {
    const s = join(fromDir, f)
    if (statSync(s).isDirectory()) copyRecursive(s, join(target, f))
    else copyFileSync(s, join(target, f))
  }
}

const ROW = ['- insert:', '    - id: token-stats', '      name: dsh-token-stats'].join('\n')

function patchComposition(patchPath) {
  if (existsSync(patchPath)) {
    const text = readFileSync(patchPath, 'utf8')
    if (text.includes('name: dsh-token-stats')) return { changed: false, path: patchPath }
    const trimmed = text.trim()
    if (trimmed === '' || trimmed === '[]') {
      writeFileSync(patchPath, ROW + '\n', 'utf8')
    } else {
      writeFileSync(patchPath, text.replace(/\s+$/, '') + '\n\n' + ROW + '\n', 'utf8')
    }
    return { changed: true, path: patchPath }
  }
  mkdirSync(dirname(patchPath), { recursive: true })
  const header = [
    '# Your patch layer for this dsh profile, applied after every bundle layer:',
    '# a top-level YAML array of loader patch entries (id-targeted config',
    '# overrides, disables, and insert lists; `!!js` expressions allowed).',
    '',
  ].join('\n')
  writeFileSync(patchPath, header + ROW + '\n', 'utf8')
  return { changed: true, path: patchPath }
}

function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.command === 'help') {
    console.log([
      'dsh-token-stats 安装器',
      '',
      '用法:',
      '  npx dsh-token-stats install [--profile web] [--force]',
      '  node scripts/install.js --from <本地包目录>',
      '',
      '完成两件事（幂等，可重复运行）:',
      '  1. 把包安装到 $DSH_HOME/profiles/node_modules/dsh-token-stats',
      '  2. 把组合行写入 $DSH_HOME/profiles/<profile>/cordis.patch.yml',
      '',
      '最后一步需要手动完成: 重启 dsh，然后刷新浏览器页面。',
    ].join('\n'))
    return
  }
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  const target = join(dshHome, 'profiles', 'node_modules', 'dsh-token-stats')
  const from = opts.from || pkgDir

  if (existsSync(target) && !opts.force) {
    console.log('已安装（跳过）: ' + target + '  —— 用 --force 重新覆盖')
  } else {
    copyPackage(from, target)
    console.log('安装完成: ' + target)
  }
  const patch = patchComposition(join(dshHome, 'profiles', opts.profile, 'cordis.patch.yml'))
  console.log(patch.changed ? '已写入组合行: ' + patch.path : '组合行已存在: ' + patch.path)
  console.log('')
  console.log('下一步: 重启 dsh，然后刷新浏览器页面。')
}

main()
