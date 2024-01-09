<a name="back-to-top"></a>

<!-- prettier-ignore-start -->
<!-- omit in toc -->
# Developer Guide
<!-- prettier-ignore-end -->

This guide is for any developer who wants to set up a running local development environment for contributing to this **Automated Changelog and Release Notes Process**. We welcome contributions of all types (e.g., documentation improvements, bug fixes, new features); however, before you open a pull request, we ask that you please consult the [contributing guide](CONTRIBUTING.md).

<!-- prettier-ignore-start -->
<!-- omit in toc -->
## Table of Contents
<!-- prettier-ignore-end -->

- [1. Process Overview](#1-process-overview)
  - [1.1 Reusable GitHub Action](#11-reusable-github-action)
  - [1.2 Github App](#12-github-app)
  - [1.3 Release Notes Script](#13-release-notes-script)
  - [2. Key Technologies](#2-key-technologies)
- [3. Prerequisites](#3-prerequisites)
- [4. Setting Up Your Development Environment](#4-setting-up-your-development-environment)
  - [4.1 Github Dummy Account and OpenSearch Repo](#41-github-dummy-account-and-opensearch-repo)
  - [4.2 Reusable Workflow Action](#42-reusable-workflow-action)
  - [4.3 Github App Bridge Service](#43-github-app-bridge-service)
  - [4.4 Release Notes Script](#44-release-notes-script)
- [5. Code Guidelines](#5-code-guidelines)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 1. Process Overview

This **Automated Changelog and Release Notes Process** involves several components operating in different contexts, each with specific aims:

- **Reusable GitHub Action** → Triggered by pull requests originating from forked repositories. The action parses and checks either:
  - Changelog entries entered in the "Changelog" section of the PR description
  OR
  - Manually-created changeset files (i.e., fragments).

- **Github App** → If an OpenSearch contributor wants to automate the process of generating their changeset files, they can install the `OpenSearch-Changeset-Bot` on their forked OpenSearch repository. The bot is a GitHub App built using `Express.js`. It listens for HTTP requests coming from the reusable GitHub Action, performs CRUD operations on changeset files, and commits those files to contributors' open PRs.

- **Automated Release Notes Script** → This script can be adapted by OpenSearch repositories to suit their needs and language of choice. It reads the files held in the `changelogs/fragments` directory and performs two primary actions:
  - Updating the CHANGELOG.md document with the changes introduced in the latest version release
  - Generating a release notes document

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 1.1 Reusable GitHub Action

[Explanation + UML sequence Diagram]

<img src="./assets/sequence_diagram_example.png" alt="uml_diagram" width="500" height="auto"/>

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 1.2 Github App

[Explanation + UML sequence Diagram]

<img src="./assets/sequence_diagram_example.png" alt="uml_diagram" width="500" height="auto"/>

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 1.3 Release Notes Script

[Explanation + UML sequence Diagram]

<img src="./assets/sequence_diagram_example.png" alt="uml_diagram" width="500" height="auto"/>

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 2. Key Technologies

To effectively contribute to the **Automated Changelog and Release Notes Process** you should be familiar with JavaScript, Node.js, Express.js, Github Actions, and the Github API. Depending on the OpenSearch repository you are working with, you should also be familiar with the whatever language has been chosen to implement the release notes script with.

![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge)
![Node.js Badge](https://img.shields.io/badge/Node.js-393?logo=nodedotjs&logoColor=fff&style=for-the-badge)
![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)
![GitHub Badge](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=fff&style=for-the-badge)
![GitHub Actions Badge](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=fff&style=for-the-badge)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 3. Prerequisites

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 4. Setting Up Your Development Environment

For contributing, please read each of the sections below. There are several steps to setup the development environments for the different running contexts of the **Changelog and Release Notes Process** and the OpenSearch forked repo you want to run the automated process.

### 4.1 Github Dummy Account and OpenSearch Repo

- (We suppose you have a forked version of an OpenSearch repo in your primary Github account)
- Create a dummy Github Account
- Fork and clone your current OpenSearch Repo under your primary Github Account into your dummy Github account
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 4.2 Reusable Workflow Action

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 4.3 Github App Bridge Service

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 4.4 Release Notes Script

[Explanation for setting up development environment for contributing in this context]

- In OpenSearch forked repo create script files
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 5. Code Guidelines

Please refer to the [Code Guidelines](./CODE_GUIDELINES.md) document for more reference about the code conventions followed in this project.

<p align="right">(<a href="#back-to-top">back to top</a>)</p>
