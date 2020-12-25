import * as core from '@actions/core'

import { action } from './action'
import { getExec } from './exec'

export async function entrypoint() {
  const cwd = process.cwd()
  const env = process.env

  await action({ cwd, exec: getExec(process.cwd()), env }, { branchName: 'action', files: [] })
}

entrypoint().catch((e) => {
  console.log('Error happened:', e)
  // in case of error mark action as failed
  core.setFailed(e.message)
})
