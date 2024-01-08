<a name="back-to-top"></a>

<!-- prettier-ignore-start -->
<!-- omit in toc -->
# Developer Guide
<!-- prettier-ignore-end -->

This guide is for any developer who wants a running local development environment for contribuiting in this automated **Changelog and Realease Notes Process**. If you're planning to collaborate (e.i. adding features, fixing bugs, etc) to this repository or related ones make sure to also read the [contributing guide](CONTRIBUTING.md).

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Table of Contents
<!-- prettier-ignore-end -->

- [1. Process Overview](#1-process-overview)
  - [1.1 Github Runner Instance for Reusable Workflow Action](#11-github-runner-instance-for-reusable-workflow-action)
  - [1.2 Express.js Application for Github App Bridge Service](#12-expressjs-application-for-github-app-bridge-service)
  - [1.3 Forked OpenSearch Repository for Realease Notes Script](#13-forked-opensearch-repository-for-realease-notes-script)
  - [1.4 Key Technologies](#14-key-technologies)
- [2. Prerequisites](#2-prerequisites)
- [3. Setting Up Development Environments](#3-setting-up-development-environments)
  - [3.1 Github dummy Account and OpenSearch Repo](#31-github-dummy-account-and-opensearch-repo)
  - [3.2 Reusable Workflow Action](#32-reusable-workflow-action)
  - [3.3 Github App Bridge Service](#33-github-app-bridge-service)
  - [3.4 Realease Notes Script](#34-realease-notes-script)
- [4. Code Guidelines](#4-code-guidelines)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 1. Process Overview

The new **Changelog and Realease Notes Process** consist in different Node.js code snippets or applications that run on different contexts:

- **Github Runner Instance for Workflow Action** → used to parse and check changelog entries on PR description or manual created changesets files (i.e fragments).
- **Express.js Application for Github App** → For hosting service of Github App in charge of commiting new files on the contributor's repo (Forked OpenSearch Repo). This option is available when a contributor prefers to have an automated tool for creating changesets files.
- **Forked OpenSearch Repository for Realease Notes Script** → in charge of running realise notes process, which consist in:
  - Update of RELEASE_NOTES.md and CHANGELOG.md files
  - Clean up of changesets files ([pull_request_number].yml) in `changelogs/fragments` folder).

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 1.1 Github Runner Instance for Reusable Workflow Action

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 1.2 Express.js Application for Github App Bridge Service

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 1.3 Forked OpenSearch Repository for Realease Notes Script

[Explanation + UML sequence Diagram]

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

### 1.4 Key Technologies

To effectively contribute in the automated **Changelog and Realease Notes Process** you should be familiar with Nodejs, JavaScript, Expressjs, Github Actions and Github API. Also depending on the OpenSearch repo you are working with, you also need to be familiar with the language that it is being used there to develop and run the Relase Notes script process.

![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge)
![Node.js Badge](https://img.shields.io/badge/Node.js-393?logo=nodedotjs&logoColor=fff&style=for-the-badge)
![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)
![GitHub Badge](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=fff&style=for-the-badge)
![GitHub Actions Badge](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=fff&style=for-the-badge)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 2. Prerequisites

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 3. Setting Up Development Environments

For contributing, please read each of the sections below. There are several steps to setup the development environments for the different running contexts of the **Changelog and Realease Notes Process** and the OpenSearch forked repo you want to run the automated process.

### 3.1 Github dummy Account and OpenSearch Repo

- (We suppose you have a forked version of an OpenSearch repo in your primary Github account)
- Create a dummy Github Account
- Fork and clone your current OpenSearch Repo under your primary Github Account into your dummy Github account
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 3.2 Reusable Workflow Action

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 3.3 Github App Bridge Service

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 3.4 Realease Notes Script

[Explanation for setting up development environment for contributing in this context]

- In OpenSearch forked repo create script files
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 4. Code Guidelines

Please refer to the [Code Guidelines](./COheDE_GUIDELINES.md) document for more reference about the code conventions followed in this project.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>
