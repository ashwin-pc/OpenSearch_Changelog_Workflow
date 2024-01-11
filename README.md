<a name="back-to-top"></a>

<!-- prettier-ignore-start -->
<!-- omit in toc -->
# OpenSearch Changelog Workflow and Release Notes Script
<!-- prettier-ignore-end -->

![Apache 2.0 License](https://img.shields.io/github/license/saltstack/salt)

<!-- ![Coverage Badge](./badges/coverage.svg) -->

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Introduction
<!-- prettier-ignore-end -->

This repository contains the details and source code for the** OpenSearch Changelog Workflow** and **OpenSearch Release Notes Script** procesess, part of the new broader **Automated Changelog and Release Notes Process** adopted by the [OpenSearch Project](https://opensearch.org/). It presents comprehensive information on how to set up these new procedures aimed at streamlining contributions for any OpenSearch repo, including also guidelines on how to contribute.

For more details about the **Automated Changelog and Release Notes Process** as a whole, please consult the following sections.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Table of Contents
<!-- prettier-ignore-end -->

- [Background of the Automated Process](#background-of-the-automated-process)
- [Benefits of the Automated Process](#benefits-of-the-automated-process)
- [Process Overview](#process-overview)
  - [Changelog Process](#changelog-process)
    - [Changelog Process Entities](#changelog-process-entities)
    - [Changelog Process Jobs](#changelog-process-jobs)
  - [Release Notes Process](#release-notes-process)
- [Getting Started](#getting-started)
  - [Changelog Process](#changelog-process-1)
    - [Creating a New `changelogs` Directory](#creating-a-new-changelogs-directory)
    - [Adding a "Changelog" Section to the PR Description Template](#adding-a-changelog-section-to-the-pr-description-template)
    - [Using a GitHub Actions Workflow to Generate Changeset Files](#using-a-github-actions-workflow-to-generate-changeset-files)
  - [Release Notes Process](#release-notes-process-1)
- [Usage](#usage)
  - [Changelog Process](#changelog-process-2)
    - [Workflow Details](#workflow-details)
    - [Formatting Requirements](#formatting-requirements)
    - [Workflow Flowchart](#workflow-flowchart)
  - [Release Notes Process](#release-notes-process-2)
- [Contributing](#contributing)
- [License](#license)
- [Need Help?](#need-help)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## Background of the Automated Process

On March 20, 2023, Josh Romero issued a [call for proposals](https://github.com/opensearch-project/.github/issues/148) that would "solve the entire collection of issues around generating both ongoing CHANGELOGs, and release notes during General Availability (GA) of the product, for all OpenSearch project repositories."

On May 4, 2023, a working group voted unanimously to move forward with the "Automation" variation of [Ashwin Chandran's proposal](https://github.com/opensearch-project/.github/issues/156). This proposal has now been implemented, and the details of the new changelog and release notes process are set out below.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## Benefits of the Automated Process

The **Automated Changelog and Release Notes Process** improves both contributor experience as well as the efficiency of product development and the release of new versions.

Before this automated process was adopted, whenever a contributor opened a new PR, they were prompted to indicate whether or not they had manually added an entry to the CHANGELOG.md file. However, since a changelog entry required a PR number as a reference, contributors had to first open a PR first, grab the PR number, and then add a second commit to their open PR with the changelog entry for their changes.

In addition to being inefficient, this two-step process also created an opportunity for merge conflicts. If two or more contributors updated the CHANGELOG.md file in their PRs, and those updates were not synchronized with one another, the order of entries in the changelog would be inaccurate, requiring manual intervention to sort things out.

Likewise, when a new product version was scheduled for GA release, release notes and changelog updates had to be prepared manually. This process was both time consuming and labor intensive.

Automating the changelog and release notes process resolves these complications, giving valuable time back to contributors and maintainers and improving the overall experience of working in OpenSearch's repositories.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## Process Overview

The **Automated Changelog and Release Notes Process** is comprised of two independent sets of separate sub-processes: (1) the **Changelog Process** and (2) the **Release Notes Process**.

The first sub-process is conformed by a [Github Action](https://docs.github.com/en/actions) using a [Reusable Workflow](https://docs.github.com/en/actions/using-workflows/reusing-workflows) that checks the validity of a newly added or edited changeset file. Two distinct approaches can be used for these checks: automatic or manual creation/update of fragments (i.e, changeset files). For an automated approach, the workflow communicates with an external service that can automatically create these changeset files on a contributor's behalf and commit them to the open PR.

For the second sub-process, this repository also provides template files for a script that can be used to automatically update the release notes document when a new version is scheduled for release.

The following subsections lay out the mechanisms underlying both of these procedures. (For details about how to implement these processes in an OpenSearch repository, see the "[Getting Started](#getting-started)" section further down in this document.)

### Changelog Process

The following flow diagram depicts the entire **Automated Changelog Process** from start to finish.

![Automated_Changelog_Process](./assets/OpenSearch_Changelog_Workflow.png)

#### Changelog Process Entities

As the diagram illustrates, the **Automated Changelog Process** involves interaction between two **GitHub Repositories** (the OpenSearch repo and the contributor's forked repo), two **external services** (a reusable GitHub Action and an Express.js application), and a **GitHub App**. These components will work together differently depending on whether or not a contributor opts to install the App on their forked repo.

- **Github Repositories**

  - **OpenSearch Upstream Repository** → This is the base repository where a contributor's open pull request resides (e.g. [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards), [OpenSearch UI Framework](https://github.com/opensearch-project/oui), [OpenSearch Neural Search](https://github.com/opensearch-project/neural-search), etc).

  - **Contributor Forked Repository** → The head repository where the contributor's pull request originates from. It contains the changes the contributor is asking to be merged into the base repository.

- **External Services**

  - **OpenSearch Changelog Workflow** → GitHub reusable Action workflow triggered whenever a PR is opened or edited. This workflow acts only in the **OpenSearch Upstream Repository** and carries out the following actions:

    - Check and parse contributor entries in the `## Changelog` section of the PR description.
    - Post comments and add or remove labels on PRs.
    - Communicate with **OpenSearch Changelog PR Bridge** to automatically create, update, or delete changeset files.
    - If a contributor has manually added or updated a changeset file, validate the format of the file.

  - **OpenSearch Changelog PR Bridge** → An Express.js application that serves as the backbone of the **OpenSearch Changelog Bot** (the name of the **GitHub App** referred to above).

    - If a contributor has [installed the bot](https://github.com/apps/opensearch-changeset-bot) in their forked repository, the PR bridge service will receive HTTP requests from the **OpenSearch Changelog Workflow** and commit a changeset file to the branch in the contributor's repository where the PR has originated from. The PR bridge service acts only in the **Contributor Forked Repository**.

    - If a contributor has not installed the bot, the PR bridge service will communicate back to the **OpenSearch Changelog Workflow**, instructing it to look for and parse a manually-created changeset file.

- **GitHub App**
  - **OpenSearch Changelog Bot** → The name of the GitHub App required for obtaining contributors' permissions to act on their behalf and commit changeset files in their forked repository. As mentioned above, the App is installed in the **Contributor Forked Repository** and acts only to creating or updating changeset files. The source code and documentation for the bot is available in the [GitHub App's repository](https://github.com/BigSamu/OpenSearch_Changeset_Bot).

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### Changelog Process Jobs

As the diagram illustrates, the **Changelog Process** consists of three primary jobs:

- **Changelog Parsing** → The reusable GitHub Action checks first to see if the **OpenSearch Changelog Bot** has been installed in the **Contributor Forked Repository**. If it has been, the Action begins parsing the `## Changelog` section of the open PR description. If the **OpenSearch Changelog Bot** has not been installed, then the contributor is prompted to either install the bot or to manually create and commit a changeset file.

  Parsing the `## Changelog` section of the open PR description can result in one of three outcomes:

  1. **Parsing Failed** → If one or more entries in the `## Changelog` section are formatted improperly, the process will fail, and a `failed changeset` label will be added to the PR. For more information about formatting requirements, see the [Usage](#usage) section below.
  2. **Parsing Succeeded** → If the entries in the `## Changelog` section are formatted properly and the Action succeeds in parsing them, the **Automatic Changeset Creation/Update** job is initiated.
  3. **Skip Entry** → If a contributor's changes do not require a changelog entry (e.g., fixing a small typographical error), they may enter `- skip` in the `## Changelog` section. No changeset file will be created or required, a `Skip-Changelog` label will be added to the PR, and the process will end successfully.

- **Automatic Changeset Creation/Update** → This second job is initiated after the `## Changelog` section has been successfully parsed. The Action calls the **OpenSearch Changelog PR Bridge** service, and it obtains permissions granted by the contributor through the **OpenSearch Changelog Bot** to automatically create or update a changeset file.

- **Manual Changeset Creation/Update** → This third job is an alternative to the second one if the **OpenSearch Changelog Bot** app is not installed in the contributor's repository. In this case, the contributor must manually add or edit a changeset file. After each commit, the **OpenSearch Changelog Workflow** checks the formatting of the changeset file. Two outcomes are possible: **Parsing Failed** and **Parsing Succeeded**. The logic is the same as the **Changelog Parsing** job described above.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

---

¿REQUIRED BY JONNATHON DESCRIPTION BELOW?

1. Creating a new `changelogs` directory in the root folder of the repository.

2. Adding a "Changelog" section to the PR template, with instructions for how contributors can add valid changelog entries to this section.

3. Using a GitHub Actions workflow to extract entries from the "Changelog" section of each PR description, create or update a changeset file in `.yml` format, and add this file to the new `changelogs/fragments` directory. The generated changeset file is automatically included as part of the changes to be merged when the PR is approved.

### Release Notes Process

[COMPLETE RILEY AND WILL]

Implementing a script that, when manually triggered from the command line upon general availability of a new product version, will cull the `changelogs/fragments` directory for changeset files and use those files to populate the release notes for the new version and update the final changelog.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## Getting Started

This section discusses in greater detail the four primary changes listed in the "[Process Overview](#process-overview)" section above.

### Changelog Process

#### Creating a New `changelogs` Directory

To centralize information pertinent to the new changelog process, a new `changelogs` directory has been added to the root of the repository. This directory is the new location for `CHANGELOG.md`.

It also houses the `fragments` subdirectory, which includes changeset files in `.yml` format that have been generated from merged PRs. (Only one changeset file is generated per PR.)

Changeset files are named with the PR number they correspond to. (E.g., `5218.yml`.)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### Adding a "Changelog" Section to the PR Description Template

The PR template has been updated with a new "Changelog" section. The comment block in this section provides contributors with instructions for how to add properly-formatted changelog entries to their PR.

Below are the formatting standards for changelog entries:

- Each entry line must begin with a hyphen (-) in the Markdown source file.
- Contributors must categorize their changes by using one of the following prefixes, followed by a colon.
  - `breaking`
  - `chore`
  - `deprecate`
  - `doc`
  - `feat`
  - `fix`
  - `infra`
  - `refactor`
  - `security`
  - `test`
- If the changes in a PR are minor (e.g., fixing a typo), contributors can enter `- skip` in the "Changelog" section to instruct the workflow not to generate a changeset file.
  - If `-skip` is entered in the "Changelog" section, no other categories or descriptions can be present.
- After the colon, contributors should provide a concise description of their changes. Descriptions must be 50 characters or less.

Below is an example of a valid entry in the "Changelog" section of the PR description. (Contributors can add more than one entry if they are contributing more than one type of change in their PR. They do not need to delete the comment block in this section, although they can. If they leave the comment block, they should ensure that the changelog entries they add to their PR lie _outside_ of the comment block.)

```markdown
## Changelog

<!-- Default comment block giving formatting instructions for changeloo entries -->

- feat: Adds a new feature
- refactor: Improves an existing feature
```

Below are examples of invalid entries:

```
// Including "skip" with another category
- skip
- feat: Adds a new feature
```

```
// Missing a hyphen
feat: Adds a new feature
```

```
// Invalid category prefix
- new: Adds something new
```

```
// Missing description
- feat
```

```
// Description longer than 50 characters
- feat: Adds a new feature that is simply too excellent to be described in 50 characters or less
```

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### Using a GitHub Actions Workflow to Generate Changeset Files

Whenever a contributor opens a PR or edits an existing PR, a GitHub Actions workflow is triggered that extracts the metadata from the PR and checks what a contributor has entered in the "Changelog" section of the PR description.

If a contributor has entered valid changelog entries (see formatting requirements in previous section above), the workflow will categorize these entries and either create or update a `.yml` changeset file in the `changelogs/fragments` directory of the repository.

This changeset file will include changelog descriptions under their proper category and also add a link to the PR that generated these changes. Below is an example of what the contents of a changeset file will look like:

```yaml
feat:
  - Adds a new feature ([#532](https://github.com/.../pull/532))

refactor:
  - Improves an existing feature ([#532](https://github.com/.../pull/532))

test:
  - Add unit testing to new feature ([#532](https://github.com/.../pull/532))
  - Update unit testing for existing feature ([#532](https://github.com/.../pull/532))
```

This changeset file will become part of the code that is merged when the PR is approved.

If the workflow encounters a `- skip` line in the PR, and there are no other changelog entries present, it will skip the creation of a changeset file, and the workflow will terminate successfully.

If the workflow encounters an error (e.g., an empty "Changelog" section or an invalid changelog entry), it will fail, and a custom error message will be printed to the workflow logs and added as a comment to the open PR explaining the reason for the failure.

Contributors can then address the error and update their PR, which will trigger the workflow to run again.

### Release Notes Process

[COMPLETE RILEY AND WILL]

## Usage

### Changelog Process

Here's an example of how to use this action in a workflow file:

```yaml
name: Create Change Set

on:
  pull_request:
    types: [synchronize, opened, edited]
    paths-ignore:
      - "changelogs/fragments/**/*"

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
```

#### Workflow Details

Whenever a PR is opened or edited in an OpenSearch repository, this workflow is triggered.

The workflow extracts the metadata from the PR and checks what a contributor has entered in the "Changelog" section of the PR description.

If a contributor has entered valid changelog entries (see formatting requirements below), the workflow will categorize these entries and either create or update a `.yml` changeset file in the `changelogs/fragments` directory of the repository.

This changeset file will include changelog descriptions under their proper category and also add a link to the PR that generated these changes. Below is an example of what the contents of a changeset file will look like:

```yaml
feat:
  - Adds a new feature ([#532](https://github.com/.../pull/532))

refactor:
  - Improves an existing feature ([#532](https://github.com/.../pull/532))

test:
  - Add unit testing to new feature ([#532](https://github.com/.../pull/532))
  - Update unit testing for existing feature ([#532](https://github.com/.../pull/532))
```

This changeset file will become part of the code that is merged when the PR is approved.

If the workflow encounters an error, it will fail, and a custom error message will be printed to the workflow logs explaining the reason for the failure.

Contributors can then address the error and update their PR, which will trigger the workflow to run again.

#### Formatting Requirements

In order for the workflow to successfully create or update a changeset file from a PR description, contributors will need to ensure that their entries in the "Changelog" section of the PR description adhere to the following formatting requirements:

- Each entry line must begin with a hyphen (-) in the Markdown source file.
- Contributors must categorize their changes by using one of the following prefixes, followed by a colon.
  - `breaking`
  - `chore`
  - `deprecate`
  - `doc`
  - `feat`
  - `fix`
  - `infra`
  - `refactor`
  - `test`
  - `security`
- If the changes in a PR are minor (e.g., fixing a typo), contributors can enter `- skip` in the "Changelog" section to instruct the workflow not to generate a changeset file.
  - If `-skip` is entered in the "Changelog" section, no other categories or descriptions can be present.
- After the colon, contributors should provide a concise description of their changes. Descriptions must be 50 characters or less.

Below is an example of a valid entry in the "Changelog" section of the PR description. (Contributors can add more than one entry if they are contributing more than one type of change in their PR.)

```
- feat: Adds a new feature
- refactor: Improves an existing feature
```

Below are examples of invalid entries:

```
// Including "skip" with another category
- skip
- feat: Adds a new feature
```

```
// Missing a hyphen
feat: Adds a new feature
```

```
// Invalid category prefix
- new: Adds something new
```

```
// Missing description
- feat
```

```
// Description longer than 50 characters
- feat: Adds a new feature that is simply too excellent to be described in 50 characters or less
```

#### Workflow Flowchart

The following flow chart, built using [Mermaid](https://mermaid.js.org/) syntax, illustrates the logic this workflow follows.

(NOTE: If you are viewing this README in an IDE or code editor, the flow chart will not render. To view the chart, please visit this README file on GitHub's website, which includes built-in support for Mermaid syntax.)

```mermaid
%%{init: {'themeVariables': { 'fontSize': '24px' }}}%%
  flowchart TD;
    A(Changelog \nWorkflow Starts) --> B{Changelog section\n present in PR?}
    B --> |Yes| C[Extract changelog entries from\n'Changelog' section of PR]
    B --> |No| D[InvalidChangelogHeadingError \nEmptyChangelogSectionError]
    D --> E[Error messsage added as comment to PR]
    E --> F(Workflow fails)
    F --> G[Contributor edits PR]
    G --> A
    C --> H[Prepare changeset entry map]
    H --> I{Entries in PR \nformatted correctly?}
    I --> |Yes| J{'skip' in changeset \n entry map?}
    I --> |No| K[ChangelogEntryMissingHyphenError\nInvalidPrefixError\nEmptyEntryDescriptionError\nEntryTooLongError]
    K --> E
    J --> |Yes| L{Is 'skip' the \nonly entry?}
    J --> |No| M[Changset file created / updated]
    M --> N(Workflow ends successfully)
    L --> |Yes| O['skip-changelog' label added to PR]
    O --> P[No changeset file created / updated]
    P --> N
    L --> |No| Q[CategoryWithSkipOptionError]
    Q --> E

    style A fill:#38bdf8,color:#0f172a
    style B fill:#fbbf24,color:#0f172a
    style D fill:#fb923c,color:#0f172a
    style F fill:#ef4444,color:#f8fafc
    style G fill:#c084fc,color:#0f172a
    style I fill:#fbbf24,color:#0f172a
    style J fill:#fbbf24,color:#0f172a
    style K fill:#fb923c,color:#0f172a
    style L fill:#fbbf24,color:#0f172a
    style Q fill:#fb923c,color:#0f172a
    style N fill:#4ade80,color:#0f172a
```

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### Release Notes Process

[COMPLETE RILEY AND WILL]

When a new product release is ready for general availability, OpenSearch maintainers can run the following script command from the command line:

```bash
yarn release_note:generate
```

This command executes a script that performs the following actions:

- Extract information from the changeset files in the `changelogs/fragments` directory
- Map the changelog entries in these files to their appropriate changelog section headings
- Generate the changelog section for the new release and add it to the top of the changelog
- Create a release notes document to accompany the new release
- Del**ete the ch**angeset files from the `changelogs/fragments` directory

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## Contributing

The **Automated Changelog Release Notes Process** is the result of a concerted effort by OpenSearch maintainers and contributors to improve the development experience for all involved in OpenSearch suite.

Contributions to the **OpenSearch Changelog Workflow** and **OpenSearch **Release** Notes** services are welcome! See our [Developer Guide](./DEVELOPER_GUIDE.md) for instructions on how to set up the project in your local environment and [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**NOTE:** Bear in mind that for suggestions or contributions to the **OpenSearch Changelog PR Bridge** service, a distinct [repository](https://github.com/BigSamu/OpenSearch_Changeset_Bot) is used.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## License

This project is an open-source product released under the Apache 2.0 license (see either [the Apache site](https://www.apache.org/licenses/LICENSE-2.0) or the [LICENSE.txt file](./LICENSE.txt)). The Apache 2.0 license allows you to freely use, modify, distribute, and sell your own products that include Apache 2.0 licensed software.

## Need Help?
