import { copySync } from 'fs-extra'
import { join } from 'path'
import { dirSync as tmp } from 'tmp'

import { Exec } from './exec'
import {
  checkIfRemoteBranchExists,
  isStageAreEmpty,
  newPristineBranch,
  setupGitClient,
  setupGitRemote,
  switchBranch,
} from './git/utils'

interface ActionCtx {
  exec: Exec
  env: NodeJS.ProcessEnv
  cwd: string
}

interface Options {
  branchName: string
  files: string[]
}

export async function action(ctx: ActionCtx, options: Options) {
  const tmpDir = tmp().name
  console.log('Tmp dir created: ', tmpDir)

  console.info(`Coping ${options.files.length} files away to tmp dir`)
  for (const file of options.files) {
    const fullOutputPath = join(tmpDir, file)

    copySync(join(ctx.cwd, file), fullOutputPath)
  }

  await setupGitClient(ctx.exec)
  await setupGitRemote(ctx.exec, ctx.env)
  if (await checkIfRemoteBranchExists(ctx.exec, options.branchName)) {
    console.log(`Remote branch ${options.branchName} exists. Switching...`)
    await ctx.exec(`git fetch`)
    await switchBranch(ctx.exec, options.branchName)
  } else {
    console.log(`Remote branch ${options.branchName} does not exist. Creating pristine branch ${options.branchName}.`)
    await newPristineBranch(ctx.exec, options.branchName)
  }

  console.info(`Coping ${options.files.length} files back to the workspace and git adding them`)
  for (const file of options.files) {
    const fullOutputPath = join(tmpDir, file)

    copySync(fullOutputPath, join(ctx.cwd, file), { overwrite: true })

    await ctx.exec(`git add --force ${file}`)
  }

  if (!(await isStageAreEmpty(ctx.exec))) {
    await ctx.exec(`git commit -m "Automated release" -a`)
    await ctx.exec(`git push origin`)
  }
}
