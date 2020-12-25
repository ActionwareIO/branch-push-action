import { ensureDirSync, writeFileSync } from 'fs-extra'
import { dirname, join } from 'path'
import simpleGit, { SimpleGit } from 'simple-git/promise'
import { dirSync as tmp } from 'tmp'

import { Exec, getExec } from '../../src/exec'

export async function makeWorkspace(
  files: Record<string, string>,
): Promise<{ exec: Exec; workspacePath: string; git: SimpleGit }> {
  const workspacePath = tmp().name
  const git = simpleGit(workspacePath)

  writeFiles(files, workspacePath)
  await git.init()
  const exec = getExec(workspacePath)

  return { exec, git, workspacePath }
}

/**
 * Skips side effects that would require real git remote or change global git settings as tests do not run usually in a sandboxed environment
 */
export function getFilteringExec(realExec: Exec): Exec {
  return (...args: any[]) => {
    if (args[0].startsWith('git push')) {
      return
    }
    if (args[0].startsWith('git remote')) {
      return
    }
    if (args[0].startsWith('git config')) {
      return
    }
    if (args[0].startsWith('git ls-remote --heads origin')) {
      // eslint-disable-next-line
      return realExec('git branch --list' + args[0].slice('git ls-remote --heads origin'.length))
    }
    return (realExec as any)(...args)
  }
}

export function writeFiles(workspaceFiles: Record<string, string>, path: string) {
  for (const [filePath, contents] of Object.entries(workspaceFiles)) {
    const fullPath = join(path, filePath)
    ensureDirSync(dirname(fullPath))
    writeFileSync(fullPath, contents)
  }
}
