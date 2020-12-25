import { Exec } from '../exec'

export async function setupGit(exec: Exec, env: NodeJS.ProcessEnv) {
  await exec('git config --global user.email github-actions[bot]@users.noreply.github.com')
  await exec('git config --global user.name github-actions[bot]')

  // replace read only origin with full access origin
  await exec(`git remote remove origin`)
  await exec(
    `git remote add origin https://${env.GITHUB_ACTOR}:${env.INPUT_GITHUB_TOKEN}@github.com/${env.GITHUB_REPOSITORY}.git`,
  )
}

export async function newPristineBranch(exec: Exec, branchName: string) {
  await exec(`git checkout --orphan ${branchName}`)
  await exec('git reset') // remove all files from staging area
  await exec('git commit --allow-empty -m "Root commit"')
  await exec(`git push origin ${branchName}`)
}

export async function switchBranch(exec: Exec, branchName: string): Promise<void> {
  await exec(`git checkout "${branchName}"`)
}

export async function checkIfRemoteBranchExists(exec: Exec, branchName: string): Promise<boolean> {
  const branchInfo = await exec(`git ls-remote --heads origin "${branchName}"`)

  return branchInfo.indexOf(branchName) !== -1
}

export async function isStageAreEmpty(exec: Exec): Promise<boolean> {
  const output = await exec('git diff --cached')
  return output === ''
}
