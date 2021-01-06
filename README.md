<p align="center">
  <h3 align="center">Branch push action</h3>
  <p align="center">Move files to a different branch and make a commit. Useful for GitHub Action deployment.</p>
  <p align="center">
    <img alt="Build status" src="https://github.com/ActionwareIO/branch-push-action/workflows/CI/badge.svg">
    <a href="/package.json"><img alt="Software License" src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square"></a>
  </p>
</p>

## Usage

[Full article about this action](https://dev.to/krzkaczor/fixing-github-actions-development-using-github-actions-33mk)

**.github/workflows/deploy.yml**:

```yml
name: deploy

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1

      -  # build

      - uses: ActionwareIO/branch-push-action@action
        with:
          branch: action
          files: |
            README.md
            action.yml
            ./dist/index.js
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
