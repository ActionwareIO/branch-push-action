import { exec } from '@actions/exec'

export type Exec = (cmd: string) => Promise<string>

export function getExec(cwd: string): Exec {
  return async (cmd: string) => {
    let output = ''

    await exec(cmd, [], {
      cwd,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString()
        },
      },
    })

    return output
  }
}
