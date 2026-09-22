import { access, rm, symlink } from 'node:fs/promises'
import { delimiter, dirname, join } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'

const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const firebaseCli = join(repo, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js')
const junction = join(tmpdir(), `market2u-emulator-${process.pid}`)

// The Firestore emulator cannot open a rules path containing Thai characters
// on Windows. A temporary ASCII-only junction preserves the real working tree
// while giving Java a path it can read. Other platforms use the repo directly.
let cwd = repo
if (process.platform === 'win32' && Array.from(repo).some((character) => (character.codePointAt(0) ?? 0) > 127)) {
  await symlink(repo, junction, 'junction')
  cwd = junction
}

const env = { ...process.env }
if (process.platform === 'win32') {
  const androidJava = 'C:\\Program Files\\Android\\Android Studio\\jbr\\bin\\java.exe'
  try {
    await access(androidJava)
    env.PATH = `${dirname(androidJava)}${delimiter}${env.PATH ?? ''}`
  } catch {
    // firebase-tools prints the actionable missing-Java error when no JDK is available.
  }
}

const child = spawn(
  process.execPath,
  [
    firebaseCli,
    'emulators:exec',
    '--config',
    'firebase.emulator.json',
    '--only',
    'firestore,storage',
    '--project',
    'market2u-sellpage-test',
    'vitest run --config vitest.emulator.config.ts',
  ],
  { cwd, env, stdio: 'inherit' },
)

const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject)
  child.once('exit', (code) => resolve(code ?? 1))
})

if (cwd === junction) await rm(junction, { recursive: true, force: true })
process.exitCode = exitCode
