<a name="back-to-top"></a>

<!-- prettier-ignore-start -->
<!-- omit in toc -->
<h1> OpenSearch Automated Changelog Workflow and Release Notes Process</h1>
<!-- prettier-ignore-end -->

![Apache 2.0 License](https://img.shields.io/github/license/saltstack/salt)

<!-- ![Coverage Badge](./badges/coverage.svg) -->

<!-- prettier-ignore-start -->
<!-- omit in toc -->
<h2> Introduction </h2>
<!-- prettier-ignore-end -->

This repository contains the details and source code for a new broader **Automated Changelog and Release Notes Process** adopted by the [OpenSearch Project](https://opensearch.org/) community. It presents comprehensive information on how to set up this new procedure aimed at streamlining contributions for any OpenSearch repo, including also guidelines on how to contribute. For more details about it, please consult the sections below.

<!-- prettier-ignore-start -->
<!-- omit in toc -->
<h2> Table of Contents </h2>
<!-- prettier-ignore-end -->

- [1. Background of Proposal](#1-background-of-proposal)
- [2. Current Context](#2-current-context)
- [3. Changesets](#3-changesets)
- [4. Process Overview](#4-process-overview)
  - [4.1. Changelog Workflow Process](#41-changelog-workflow-process)
    - [4.1.1. Changelog Process Entities](#411-changelog-process-entities)
    - [4.1.2. Changelog Process Jobs](#412-changelog-process-jobs)
  - [4.2. Release Notes Process](#42-release-notes-process)
    - [4.2.1 Update the Changelog Document](#421-update-the-changelog-document)
    - [4.2.2 Generate the Release Notes](#422-generate-the-release-notes)
- [5. Getting Started for OpenSearch Repository Maintainers](#5-getting-started-for-opensearch-repository-maintainers)
  - [5.1. Changelog Workflow Process](#51-changelog-workflow-process)
    - [5.1.1. Create a New `changelogs` Directory](#511-create-a-new-changelogs-directory)
    - [5.1.2. Add a "Changelog" Section to the PR Description Template](#512-add-a-changelog-section-to-the-pr-description-template)
    - [5.1.3. Add a Github Worflow File to Invoke OpenSearch Changelog Workflow](#513-add-a-github-worflow-file-to-invoke-opensearch-changelog-workflow)
  - [5.2. Release Notes Process](#52-release-notes-process)
    - [5.2.1 Verify Core Modules and Install `js-yaml`](#521-verify-core-modules-and-install-js-yaml)
    - [5.2.2 Ensure Proper Location of Files and Directories](#522-ensure-proper-location-of-files-and-directories)
    - [5.2.3 Configure Files and Script Command](#523-configure-files-and-script-command)
      - [5.2.3.1 `package.json`](#5231-packagejson)
      - [5.2.3.2 `scripts/generate_release_note.js`](#5232-scriptsgenerate_release_notejs)
      - [5.2.3.3 `generate_release_note.ts` and `generate_release_note_helper.ts`](#5233-generate_release_notets-and-generate_release_note_helperts)
- [6. Usage for OpenSearch Maintainers and Contributors](#6-usage-for-opensearch-maintainers-and-contributors)
  - [6.1. Changelog Workflow Process](#61-changelog-workflow-process)
    - [6.1.1. Automatic Apporach Followed](#611-automatic-apporach-followed)
    - [6.1.2. Manual Apporach Folled](#612-manual-apporach-folled)
  - [6.2. Release Notes Script Process](#62-release-notes-script-process)
- [7. Mantainers](#7-mantainers)
- [8. Contributing](#8-contributing)
- [9. License](#9-license)
- [10. Need Help?](#10-need-help)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 1. Background of Proposal

On March 20, 2023, Josh Romero issued a [call for proposals](https://github.com/opensearch-project/.github/issues/148) that would "solve the entire collection of issues around generating both ongoing changelogs and release notes during General Availability (GA) of the product, for all OpenSearch project repositories."

On May 4, 2023, a working group voted unanimously to move forward with the "Automation" variation of [Ashwin Chandran's proposal](https://github.com/opensearch-project/.github/issues/156). This proposal has now been implemented, and the details of the new changelog and release notes process are set out below.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 2. Current Context

The **Automated Changelog and Release Notes Process** presented here improves both contributor experience as well as the efficiency of product development and the release of new versions for any OpenSeearch library.

Whenever a contributor opens a new PR, they are prompted to indicate whether or not they have manually added an entry to the CHANGELOG.md file. However, since any changelog entry entered requires a PR number as a reference, contributors had to open a PR first, grab its number, and then add a second commit to include these new changes.

In addition to the inefficiency above, this two-step process also creates an opportunity for merge conflicts. Suppose two or more contributors update the CHANGELOG.md file in their respective PRs, and updates are not synchronized. In that case, changelog entries may introduce error conflicts for the same prefix (i.e., `feat`) due to the order they are being added, requiring manual intervention to sort things out, which is tedious.

Furthermore, hurdles to speed up this procedure are also present in the case of new version distributions for any OpenSearch library. Whenever a new product version is scheduled for GA, release notes and changelog updates have to be prepared manually. This task is also time-consuming and labor-intensive.

Automating the changelog and release notes process resolves these complications, giving valuable time back to contributors and maintainers and improving the overall experience of working in OpenSearch's repositories without wasting time on laborious operative tasks.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 3. Changesets

The **Automated Changelog and Release Notes Process** bases its logic in the use of **changeset** or **fragment** files. In the context of this automated solution, **changesets** are atomic pieces of information that store a collection of changelog entries detailing modifications done by a contributor in the source code. This information is stored in a `.yml` file for each PR and contains the following three bits of information:

- **Entry Prefix**: type of change proposed by the contributor. The available options are `breaking`,`chore`, `deprecate`, `doc`,`feat`,`fix`,`infra`,`refactor`,`security`,`test`, `skip`.
- **Entry Description**: detail regarding changes proposed by the contributor.
- **PR Number and Link**: pull request number identifier and GitHub link related to the set of changes in the contribution.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 4. Process Overview

The **Automated Changelog and Release Notes Process** is comprised of two independent sets of separate sub-processes: (1) the **Changelog Workflow Process** and (2) the **Release Notes Script Process**.

### 4.1. Changelog Workflow Process

The first sub-process is conformed by a [Github Action](https://docs.github.com/en/actions) using a [Reusable Workflow](https://docs.github.com/en/actions/using-workflows/reusing-workflows) that checks the validity of a newly added or edited changeset file. Two distinct approaches can be used for these checks: an automatic approach or a manual one.

For an automated approach, the workflow communicates with an external service ([OpenSearch Changelog PR Bridge](https://github.com/BigSamu/OpenSearch_Changeset_Bot)) that can automatically create these changeset files on a contributor's behalf and commit them to the open PR.

The following flow diagram depicts the entire **Changelog Workflow Process** from start to finish.

![OpenSearch_Changelog_Workflow_Process](./assets/OpenSearch_Changelog_Process_Diagram.png)

> **NOTE**: Currently the chnagelog process is enforcing an automatic approach. No manual approach is available yet.

#### 4.1.1. Changelog Process Entities

As the diagram illustrates, the **Changelog Process** involves interaction between two **GitHub Repositories** (the OpenSearch repo and the contributor's forked repo), two **External Services** (a reusable GitHub Action and an Express.js application), and one **GitHub App**. These components work together differently depending on whether or not a contributor opts to install the App on its forked OpenSearch repo.

- **GitHub Repositories**

  - **OpenSearch Upstream Repository** → This is the base repository where a contributor's PR resides (e.g. [OpenSearch Dashboards](https://github.com/opensearch-project/OpenSearch-Dashboards), [OpenSearch UI Framework](https://github.com/opensearch-project/oui), [OpenSearch Neural Search](https://github.com/opensearch-project/neural-search), etc).
  - **Contributor Forked Repository** → The head repository from which the contributor's PR originates. It contains the changes the contributor suggests for a merge into the base repository.

- **External Services**

  - **OpenSearch Changelog Workflow** → GitHub Action implementing a reusable workflow that triggers whenever a PR is opened or edited. This workflow acts only in the **OpenSearch Upstream Repository** and carries out the following actions:

    - Check and parse contributor entries in the `## Changelog` section of the PR description.
    - Post comments and add or remove labels on PRs.
    - For an automatic changeset approach, it communicates with **OpenSearch** Changelog PR Bridge\*\* to create, update, or delete changeset files automatically.
    - For a manual changeset approach, it validates the content of a fragment file created or updated by a contributor.

  - **OpenSearch Changelog PR Bridge** → An Express.js application that serves as the authorized entity for committing changeset files on behalf of the contributor. Only available for an automatic approach for creating or updating fragment files.

    <!-- - If a contributor has [installed the bot](https://github.com/apps/opensearch-changeset-bot) in their forked repository, the PR bridge service will receive HTTP requests from the **OpenSearch Changelog Workflow** and commit a changeset file to the branch in the contributor's repository where the PR has originated from. The PR bridge service acts only in the **Contributor Forked Repository**.

    - If a contributor has not installed the bot, the PR bridge service will communicate back to the **OpenSearch Changelog Workflow**, instructing it to look for and parse a manually-created changeset file. -->

- **GitHub App**
  - **OpenSearch Changelog Bot** → a GitHub App required for a contributor to grant permissions to the **OpenSearch Changelog PR Bridge** service so the latter can act on his behalf.

   <!-- As mentioned above, the App is installed in the **Contributor Forked Repository** and acts only to creating or updating changeset files. The source code and documentation for the bot is available in the [GitHub App's repository](https://github.com/BigSamu/OpenSearch_Changeset_Bot). -->

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### 4.1.2. Changelog Process Jobs

As the diagram illustrates, the **Changelog Process** consists of three primary jobs:

- **Changelog Parsing** → Here, the reusable workflow checks first if the **OpenSearch Changelog Bot** App has been installed in the **Contributor Forked Repository**. If so, the service parses the `## Changelog` section of the open PR description. On the other hand, I=if the **OpenSearch Changelog Bot** App has not been set up, the contributor is prompted to either install the bot or manually commit a changeset file.

  If the automatic approach is followed, the parsing of the `## Changelog` section from the PR will result in one of the following three outputs:

  1. **Parsing Failed** → If one or more entries in the `## Changelog` section are formatted improperly, the process will post an error comment, and a `failed changeset` label will be added to the PR. Addtionaly any previous existent changeset file from that PR will be removed.
  2. **Parsing Succeeded** → If the entries in the `## Changelog` section are adequately formatted and the action succeeds in parsing them, then the **Automatic Changeset Creation/Update** job is initiated adn the chnagelog process continue.
  3. **Skip Entry** → If a contributor adds a `skip` entry (i.e. changes in base code do not require a changelog entry, for instance fixing a minor typographical error),  then no changeset file will be created or existing ones will be deleted. A `Skip-Changelog` label will be added to the PR, and the changelog process will end successfully.

- **Automatic Changeset Creation/Update** → This second job is initiated after the `## Changelog` section from the PR description is successfully parsed. In this job, the **OpenSearch Changelog PR Bridge** service receives a request from the **OpenSearch Changelog Workflow** for committing a changeset file in the **Contributor Forked Repository**. The former obtains the required permissions from the **OpenSearch Changelog Bot** when this is installed in the later repo, thus acting on behalf of the contributor.

- **Manual Changeset Creation/Update** → This third job is an alternative to the second one if the **OpenSearch Changelog Bot** App is not installed in the **Contributor Forked Repository**. The contributor must manually add or edit a fragment file in this case. After the contributor commits a fragment file, the **OpenSearch Changelog Workflow** will - on this occasion - check the formatting of the changeset file. In this case. wwo outcomes are possible here:

  1. **Check Failed**: If one or more entries in the fragment file are wrongly formatted, the process will post an error comment and a `failed changeset` label will be added to the PR.
  2. **Check Succeeded**: If the entries in the fragment file are correctly formatted, the changelog process will finish sucessfully.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>


### 4.2. Release Notes Process

The **Release Notes Process** is a script that can be adapted to the needs of a particular OpenSearch repository. This script is included in the [releaseNotesTemplates](./releaseNotesTemplates/) directory. Please note that this script is *not executable* in its current form. It must either be configured according to the instructions below or customized to suit a different use case.

The **Release Notes Process** performs two primary actions:

1. Update the repository's `CHANGELOG.md` document with a new section detailing the changes that accompany a new version release.

2. Generate a release notes document tied to the new release and write that file to the repository's release notes directory.

#### 4.2.1 Update the Changelog Document

This script begins by reading the changeset files in the `changelogs/fragments/` directory. It uses a pre-established section map to group changelog entries together by shared category headings. The **Automated Changelog Process** facilitates this mapping by ensuring that changeset files have been correctly formatted and categorized.

As a precaution, the release notes script relocates the changeset files to a temporary directory. It then uses the mapped changelog entries to create a new section in the `CHANGELOG.md` document.

#### 4.2.2 Generate the Release Notes

Having done the work of mapping changelog entries and updating the `CHANGELOG.md` document, the script uses this prepared material to generate a release notes document. After adding this file to the repository's release notes directory, the script deletes the changeset files from their temporary location and exits the process successfully.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 5. Getting Started for OpenSearch Repository Maintainers

This section discusses in greater detail the steps required by each **OpenSearch** repo to get its library ready to implement the processes described in the "[Process Overview](#process-overview)" section above.

### 5.1. Changelog Workflow Process

#### 5.1.1. Create a New `changelogs` Directory

To centralize information pertinent to the new changelog process, a new `changelogs` directory has to be added by maintainers at the root of any OpenSearch repository. This directory is the new location for `CHANGELOG.md`.

Also a subdirectory called `fragments` needs to be added in the parent folder `changelogs`. The later one is the one where all changeset files in `.yml` are being added automatically or manually when a PR is open. Remember that only one changeset file is required per PR. These changeset files are named with the PR number they correspond to. (E.g., `5218.yml`.)

Below is an example of how this directory looks like

```
├── ...
└── changelogs
  ├── CHANGELOG.md
  └── fragments
      ├── 5218.yml
      ├── 5219.yml
      └── 5220.yml
```
> **NOTE**: At this point neither a CHANGELOG.md file or changeset .yml files need to be added. On later steps this will be shown.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### 5.1.2. Add a "Changelog" Section to the PR Description Template

The PR template has to be updated by adding a new "Changelog" section as follows:

```
...

## Changelog
<!--
Add each of the changelog entries as a line item in this section. e.g.
- fix: Updates the graph
- feat: Adds a new feature

If this change does not need to added to the changelog, just add a single `skip` line e.g.
- skip

Valid prefixes: breaking, chore, deprecate, doc, feat, fix, infra, refactor, test

Descriptions following the prefixes must be 50 characters or less
-->

...
```

The comment block in this section provides contributors with instructions for how to add properly-formatted changelog entries to their PR.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### 5.1.3. Add a Github Worflow File to Invoke OpenSearch Changelog Workflow

Under each `./github/workflow` directory of your OpenSearch repo, create a file called `opensearch_changelog_workflow.yml` and add the following code below:

```yaml
name: OpenSearch Changelog Workflow

on:
  pull_request_target:
    types: [opened, edited]

permissions:
  contents: read
  issues: write
  pull-requests: write

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4
      - name: Parse changelog entries and submit request for changset creation
        uses: BigSamu/OpenSearch_Parse_Changelog_Action@main
        with:
          token: ${{secrets.GITHUB_TOKEN}}
```

Whenever a PR is opened or edited in an OpenSearch repository, this workflow will be triggered in the **OpenSearch Upstream Repository**. Metadata from the PR will be extracted and parsed or checked depending the approach a contributor want to follow (automatic or manual commit of changeset files).

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 5.2. Release Notes Process

As mentioned above, the release notes process was designed for the specific context of the `OpenSearch-Dashboards` repository. Therefore, the following instructions demonstrate how to configure the script in that context. Implementation details may vary from repository to repository.

#### 5.2.1 Verify Core Modules and Install `js-yaml`

The script uses the following Node.js core modules:
- `path`
- `fs` (including `fs/promises`)

`fs/promises` has been a stable built-in module since Node version 14. So, depending on which version of Node you are using, it may already be installed in your `node-modules` directory. Still, it is worth verifying that these modules are accessible to your project.

In addition to these core modules, the release notes script utilizes `js-yaml` for parsing and writing YAML files. If it is not already among your project dependencies, you can install it from within your root directory via `npm` or `yarn`:

```bash
npm install js-yaml
```
```bash
yarn add js-yaml
```

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### 5.2.2 Ensure Proper Location of Files and Directories

Because the release notes script reads from and writes to specific directories and files, it is important to ensure that the script is able to target the correct paths.

Below is a simplified directory tree showing where the script expects to find the various resources it needs to complete its tasks:

```
./
|  ├── changelogs/
|  |  ├── fragments/
|  |  |  ├── 5218.yml
|  |  |  ├── 5219.yml
|  |  |  └── 5220.yml
|  ├── release-notes/
|  ├── scripts/
|  |  ├── generate_release_note.js
|  |  └── use_node
|  ├── src/
|  |  ├── dev/
|  |  |  ├── generate_release_note.ts
|  |  |  └── generate_release_note_helper.ts
|  └── package.json
```

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

#### 5.2.3 Configure Files and Script Command

##### 5.2.3.1 `package.json`
The release notes script is executed manually from the command line. To configure the command, the following line should be added to the `"scripts"` object in the `package.json` file:

```json
{
  "scripts": {
    "release_note:generate": "scripts/use_node scripts/generate_release_note"
  }
}
```

When invoked, `"release_note:generate"` script identifier runs a script command that executes the `generate_release_note` script within the appropriate Node.js runtime. It passes the `generate_release_note` script as an argument to the `use_node` script, which is available in the [OpenSearch-Dashboards repository](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/scripts/use_node) for reference.

Additionally, to generate accurate headings in the release notes document and changelog section, the script will need to be able to access the current product version. Please ensure that the `"version"` property in your `package.json` file is updated with the current release version.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

##### 5.2.3.2 `scripts/generate_release_note.js`

This file, located in the `scripts/` directory, imports the files necessary for the execution of the release notes script. It should be configured as follows:

```js
require('../src/setup_node_env');
require('../src/dev/generate_release_note');
require('../src/dev/generate_release_note_helper');
```

##### 5.2.3.3 `generate_release_note.ts` and `generate_release_note_helper.ts`

These files, available in the [releaseNotesTemplates](./releaseNotesTemplates/) directory in this repository, should be added to the `src/dev/` directory as indicated in the simplified directory tree above.

## 6. Usage for OpenSearch Maintainers and Contributors

This section discusses how maintainers and contributors can use this new process in their daily days to take advantge of benefits the automatization implemented the creation of changelogs and release notes

### 6.1. Changelog Workflow Process

To make use of the changelog workflow when opening a PR, a contributor or maintainer can follow either an automatic or manual approach for commiting changeset files.

#### 6.1.1. Automatic Apporach Followed

In order to use the **OpenSearch Changelog PR Bridge** service for automatic commit of changeset files in any of your OpenSearch forked repos:

- Navigate to the [OpenSearch-bot](https://github.com/apps/opensearch-changeset-bot) installation page and click "Install".
- Follow the instructions there and only install this App in all forked OpenSearch repositories where you want to have this feature activated.

Once installed, go to the PR description and under the `## Changelog` section add the changelog entries detailing the changes suggested in your PR.

Below are the formatting standards for changelog entries in the `## Changelog`:

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
- After the colon, contributors should provide a concise description of their changes. Descriptions must be 100 characters or less.

Below is an example of valid entries in the `## Changelog` section of the PR description:

```markdown
## Changelog

<!--
Add each of the changelog entries as a line item in this section. e.g.
- fix: Updates the graph
- feat: Adds a new feature

If this change does not need to added to the changelog, just add a single `skip` line e.g.
- skip

Valid prefixes: breaking, chore, deprecate, doc, feat, fix, infra, refactor, test

Descriptions following the prefixes must be 50 characters or less
-->

- feat: Adds a new feature
- refactor: Improves an existing feature
- test: Add unit testing to new feature
- test: Update unit testing for existing feature
```

Mantainers and contributors can add more than one entry if they are contributing to more than one type of PR prefix. Also, they do not need to delete the comment block in this section, although they can. If they leave the comment block, they should ensure that the changelog entries they add lie _outside_ of the comment block.

Once done adding the changelog entries and submitting the PR, the `OpenSearch Changelog Workflow` will run an create a changeset file in the `chagelog/fragments` directory as below:

```yaml
# Changeset file 13.yml
feat:
  - Adds a new feature ([#13](https://github.com/.../pull/13))

refactor:
  - Improves an existing feature ([#13](https://github.com/.../pull/13))

test:
  - Add unit testing to new feature ([#13](https://github.com/.../pull/13))
  - Update unit testing for existing feature ([#13](https://github.com/.../pull/13))
```

And the following update will appear in the PR conversation history:

![Changeset_Created_Updated_Commit_Message](./assets/Changeset_Created_Updated_Commit_Message.png)

This changeset file will become part of the code that is merged when the PR is approved.

If the workflow encounters a `- skip` line in the PR, and there are no other changelog entries present, it will skip instead the creation of a changeset file, and the workflow will terminate successfully with a label `skip-changelog` appearing as follows:

![Skip_Changelog_Label_Commit_Message](./assets/Skip_Changelog_Label_Commit_Message.png)

Lastly, if the workflow encounters an error (e.g., empty description for specific prefix), then the parsing process will fail, and a custom error message will be posted along side a `failed changeset` label:

![Error_Comment_and_Failed_Changeset_Label_Commit_Message.png](./assets/Error_Comment_and_Failed_Changeset_Label_Commit_Message.png)

A set of examples with entries resulting in errors are listed beneath:

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

The following flow chart, built using [Mermaid](https://mermaid.js.org/) syntax, illustrates the logic this workflow follows.

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

#### 6.1.2. Manual Apporach Folled

<img src="./assets/under-construction-warning-sign-vector.jpg" width="200">

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 6.2. Release Notes Script Process

<img src="./assets/under-construction-warning-sign-vector.jpg" width="200">

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

[TO COMPLETE AND REVIEW]

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 7. Mantainers

- [Samuel Valdes Gutierrez](https://github.com/BigSamu) - OpenSearch Slack [link](https://opensearch.slack.com/archives/D05T6HWHLG3)
- [Johnathon Bowers](https://github.com/JohnathonBowers) - OpenSearch Slack [link](https://opensearch.slack.com/archives/D06075U158Q)

## 8. Contributing

The **Automated Changelog Release Notes Process** is the result of a concerted effort by OpenSearch maintainers and contributors to improve the development experience for all involved in OpenSearch suite.

Contributions to the **OpenSearch Changelog Workflow** and **OpenSearch **Release** Notes** services are welcome! See our [Developer Guide](./DEVELOPER_GUIDE.md) for instructions on how to set up the project in your local environment and [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

>**NOTE:** Bear in mind that for suggestions or contributions to the **OpenSearch Changelog PR Bridge** service, a distinct [repository](https://github.com/BigSamu/OpenSearch_Changeset_Bot) is used.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 9. License

This project is an open-source product released under the Apache 2.0 license (see either [the Apache site](https://www.apache.org/licenses/LICENSE-2.0) or the [LICENSE.txt file](./LICENSE.txt)). The Apache 2.0 license allows you to freely use, modify, distribute, and sell your own products that include Apache 2.0 licensed software.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 10. Need Help?

Feel free to contact us in the slack channel or by oppening an issue in this repo.
