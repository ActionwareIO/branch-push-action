import { expect } from 'earljs'
import { readFileSync } from 'fs-extra'
import { join } from 'path'

import { action } from '../src/action'
import { setupGitClient } from '../src/git/utils'
import { getFilteringExec, makeWorkspace, writeFiles } from './helpers'

describe('integration', () => {
  it('creates new deploy branch', async () => {
    const workspaceFiles = {
      'action.yml': `name: 'action for tests'`,
      'dist/index.js': `console.log('test!')`,
      '.gitignore': 'dist/index.js',
    }
    const { exec, git, workspacePath } = await makeWorkspace(workspaceFiles)
    const filteringExec = getFilteringExec(exec)
    await setupGitClient(filteringExec)

    await exec('git add .gitignore action.yml')
    await exec('git commit -m init')

    await action(
      { cwd: workspacePath, env: {}, exec: filteringExec },
      { branchName: 'action', files: ['action.yml', 'dist/index.js'] },
    )

    const distIndexContents = readFileSync(join(workspacePath, 'dist/index.js'), 'utf-8')
    expect(distIndexContents).toEqual(workspaceFiles['dist/index.js'])

    const status = await git.status()
    // .gitignore should be not tracked on this branch
    // @todo due to earl back this requires ...
    expect({ ...status }).toBeAnObjectWith({ created: [], deleted: [], modified: [], not_added: ['.gitignore'] })

    const branchesInfo = await git.branch()
    // @todo due to earl back this requires ...
    expect({ ...branchesInfo }).toBeAnObjectWith({ all: ['action', 'master'], current: 'action' })

    const exactOutput = await exec('git diff-tree --no-commit-id --name-status -r HEAD')
    expect(exactOutput).toMatchSnapshot()
  })

  it('pushes to already existing branch', async () => {
    const workspaceFiles = {
      'action.yml': `name: 'action for tests'`,
      '.gitignore': 'dist/index.js',
    }
    const { exec, git, workspacePath } = await makeWorkspace(workspaceFiles)
    const filteringExec = getFilteringExec(exec)
    await setupGitClient(filteringExec)

    await exec('git add .gitignore action.yml')
    await exec('git commit -m init')
    // create action branch, commit old code and switch back to master
    await exec('git checkout -b action')
    writeFiles({ 'dist/index.js': `console.log('old!')` }, workspacePath)
    await exec('git add -f dist/index.js')
    await exec('git commit -m "some old build"')
    await exec('git checkout master')
    writeFiles({ 'dist/index.js': `console.log('new!')` }, workspacePath)

    await action(
      { cwd: workspacePath, env: {}, exec: filteringExec },
      { branchName: 'action', files: ['action.yml', 'dist/index.js'] },
    )

    const distIndexContents = readFileSync(join(workspacePath, 'dist/index.js'), 'utf-8')
    expect(distIndexContents).toEqual(`console.log('new!')`)

    const status = await git.status()
    // .gitignore should be not tracked on this branch
    // @todo due to earl back this requires ...
    expect({ ...status }).toBeAnObjectWith({ created: [], deleted: [], modified: [], not_added: [] })

    const branchesInfo = await git.branch()
    // @todo due to earl back this requires ...
    expect({ ...branchesInfo }).toBeAnObjectWith({ all: ['action', 'master'], current: 'action' })

    const exactOutput = await exec('git diff-tree --no-commit-id --name-status -r HEAD')
    expect(exactOutput).toMatchSnapshot()
  })

  it('works when nothing to commit', async () => {
    const workspaceFiles = {
      'action.yml': `name: 'action for tests'`,
      '.gitignore': 'dist/index.js',
    }
    const { exec, git, workspacePath } = await makeWorkspace(workspaceFiles)
    const filteringExec = getFilteringExec(exec)
    await setupGitClient(filteringExec)

    await exec('git add .gitignore action.yml')
    await exec('git commit -m init')
    // create action branch, commit old code and switch back to master
    await exec('git checkout -b action')
    writeFiles({ 'dist/index.js': `console.log('new!')` }, workspacePath)
    await exec('git add -f dist/index.js')
    await exec('git commit -m "some old build"')
    await exec('git checkout master')
    writeFiles({ 'dist/index.js': `console.log('new!')` }, workspacePath)

    await action(
      { cwd: workspacePath, env: {}, exec: filteringExec },
      { branchName: 'action', files: ['action.yml', 'dist/index.js'] },
    )

    const distIndexContents = readFileSync(join(workspacePath, 'dist/index.js'), 'utf-8')
    expect(distIndexContents).toEqual(`console.log('new!')`)

    const status = await git.status()
    // .gitignore should be not tracked on this branch
    // @todo due to earl back this requires ...
    expect({ ...status }).toBeAnObjectWith({ created: [], deleted: [], modified: [], not_added: [] })

    const branchesInfo = await git.branch()
    // @todo due to earl back this requires ...
    expect({ ...branchesInfo }).toBeAnObjectWith({ all: ['action', 'master'], current: 'action' })

    const exactOutput = await exec('git diff-tree --no-commit-id --name-status -r HEAD')
    expect(exactOutput).toMatchSnapshot()
  })
})
