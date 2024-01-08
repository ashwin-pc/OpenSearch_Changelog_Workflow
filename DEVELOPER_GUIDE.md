<a name="back-to-top"></a>

<!-- omit in toc -->
# Developer Guide

For contribuiting in this automated **Changelog and Realease Notes Process**, please review sections below

<!-- omit in toc -->
## Table of Contents

- [1. Getting Started](#1-getting-started)
- [2. Key Technologies](#2-key-technologies)
- [3. Prerequisites](#3-prerequisites)
- [4. Overall Process Overview](#4-overall-process-overview)
  - [4.1 Github Runner Instance for Reusable Workflow Action](#41-github-runner-instance-for-reusable-workflow-action)
  - [4.2 Express.js Application for Github App Bridge Service](#42-expressjs-application-for-github-app-bridge-service)
  - [4.3 Forked OpenSearch Repository for Realease Notes Script](#43-forked-opensearch-repository-for-realease-notes-script)
- [5. Getting Started](#5-getting-started)
  - [5.1 Github dummy Account and OpenSearch Repo](#51-github-dummy-account-and-opensearch-repo)
  - [5.2 Reusable Workflow Action](#52-reusable-workflow-action)
  - [5.3 Github App Bridge Service](#53-github-app-bridge-service)
  - [5.4 Realease Notes Script](#54-realease-notes-script)
- [6. Code Guidelines](#6-code-guidelines)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 1. Getting Started

The new **Changelog and Realease Notes Process** consist in different Node.js code snippets or applications that run on different contexts:

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 2. Key Technologies

To effectively contribute in the automated **Changelog and Realease Notes Process** you should be familiar with Nodejs, JavaScript, Expressjs, Github Actions and Github API. Also depending on the OpenSearch repo you are working with, you also need to be familiar with the language that it is being used there to develop and run the Relase Notes script process.

![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge)
![Node.js Badge](https://img.shields.io/badge/Node.js-393?logo=nodedotjs&logoColor=fff&style=for-the-badge)
![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)
![GitHub Badge](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=fff&style=for-the-badge)
![GitHub Actions Badge](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=fff&style=for-the-badge)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 3. Prerequisites

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 4. Overall Process Overview

The new **Changelog and Realease Notes Process** consist in different Node.js code snippets or applications that run on different contexts:

- **Github Runner Instance for Workflow Action** → used to parse and check changelog entries on PR description or manual created changesets files (i.e fragments).
- **Express.js Application for Github App** → For hosting service of Github App in charge of commiting new files on the contributor's repo (Forked OpenSearch Repo). This option is available when a contributor prefers to have an automated tool for creating changesets files.
- **Forked OpenSearch Repository for Realease Notes Script** → in charge of running realise notes process, which consist in:
  - Update of RELEASE_NOTES.md and CHANGELOG.md files
  - Clean up of changesets files ([pull_request_number].yml) in `changelogs/fragments` folder).

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 4.1 Github Runner Instance for Reusable Workflow Action

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 4.2 Express.js Application for Github App Bridge Service

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 4.3 Forked OpenSearch Repository for Realease Notes Script

[Explanation + UML sequence Diagram]

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

## 5. Getting Started

For contributing, please read each of the sections below. There are several steps to setup the development environments for the different running contexts of the **Changelog and Realease Notes Process** and the OpenSearch forked repo you want to run the automated process

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 5.1 Github dummy Account and OpenSearch Repo

- (We suppose you have a forked version of an OpenSearch repo in your primary Github account)
- Create a dummy Github Account
- Fork and clone your current OpenSearch Repo under your primary Github Account into your dummy Github account
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 5.2 Reusable Workflow Action

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 5.3 Github App Bridge Service

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

### 5.4 Realease Notes Script

[Explanation for setting up development environment for contributing in this context]

- In OpenSearch forked repo create script files
- etc ...

<p align="right">(<a href="#back-to-top">back to top</a>)</p>

## 6. Code Guidelines

Please refer to [Code Guidelines](./CODE_GUIDELINES.md) document for more details about coding conventions for this project.
