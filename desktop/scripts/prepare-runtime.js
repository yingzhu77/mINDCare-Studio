const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const desktopRoot = path.resolve(__dirname, '..')
const repoRoot = path.resolve(desktopRoot, '..')
const serverRoot = path.join(repoRoot, 'server')
const runtimeRoot = path.join(desktopRoot, '.runtime')
const runtimeServer = path.join(runtimeRoot, 'server')

function assertInside(child, parent) {
  const rel = path.relative(parent, child)
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Refusing to write outside ${parent}: ${child}`)
  }
}

function copyRequiredFile(name) {
  const src = path.join(serverRoot, name)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(runtimeServer, name))
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`)
  }
}

function removeByPredicate(root, predicate) {
  if (!fs.existsSync(root)) return
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      removeByPredicate(fullPath, predicate)
      if (predicate(fullPath, true)) fs.rmSync(fullPath, { recursive: true, force: true })
    } else if (predicate(fullPath, false)) {
      fs.rmSync(fullPath, { force: true })
    }
  }
}

assertInside(runtimeRoot, desktopRoot)
fs.rmSync(runtimeRoot, { recursive: true, force: true })
fs.mkdirSync(runtimeServer, { recursive: true })

fs.cpSync(path.join(serverRoot, 'dist'), path.join(runtimeServer, 'dist'), {
  recursive: true,
  force: true,
})
fs.cpSync(path.join(serverRoot, 'node_modules'), path.join(runtimeServer, 'node_modules'), {
  recursive: true,
  force: true,
})
copyRequiredFile('package.json')
copyRequiredFile('package-lock.json')

run('npm.cmd', ['prune', '--omit=dev', '--ignore-scripts'], runtimeServer)

for (const relativePath of [
  'node_modules/prisma',
  'node_modules/@prisma/engines',
  'node_modules/@prisma/fetch-engine',
  'node_modules/@prisma/get-platform',
]) {
  fs.rmSync(path.join(runtimeServer, relativePath), { recursive: true, force: true })
}

removeByPredicate(path.join(runtimeServer, 'node_modules'), (filePath, isDirectory) => {
  const name = path.basename(filePath).toLowerCase()
  if (isDirectory) return name === 'test' || name === 'tests' || name === '__tests__' || name === 'docs' || name === 'doc' || name === 'example' || name === 'examples'
  return (
    name.endsWith('.map') ||
    name.endsWith('.ts') ||
    name.endsWith('.md') ||
    name.endsWith('.markdown') ||
    name.endsWith('.tmp') ||
    name.includes('.tmp') ||
    name === 'license' ||
    name.startsWith('license.') ||
    name === 'changelog' ||
    name.startsWith('changelog.')
  )
})

console.log('[desktop] prepared pruned server runtime at', runtimeServer)
