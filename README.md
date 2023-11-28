# OpenSearch Create Changeset Action

![MIT License](https://img.shields.io/badge/license-MIT-blue)
![GitHub contributors](https://img.shields.io/github/contributors/BigSamu/OpenSearch_Change_Set_Create_Action)

This GitHub Actions workflow automates the management of changelog entries for pull requests in OpenSearch repositories.

## Usage

Here's an example of how to use this action in a workflow file:

```yaml
name: Create Change Set

on:
  pull_request:
    types: [synchronize, opened, edited]
    paths-ignore:
      - 'changelogs/fragments/**/*'

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Update Changelog
        uses: BigSamu/OpenSearch_Change_Set_Create_Action@main
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          changeset_path: changelogs/fragments