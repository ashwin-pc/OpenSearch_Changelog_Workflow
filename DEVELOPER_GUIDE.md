<!-- omit in toc -->

# Developer Guide

For contribuiting in this automated **Changelog and Realease Notes Process**, please review sections below

<!-- omit in toc -->

# Table of Contents

- [1. Getting Started Guide](#1-getting-started)
-

## 1. Getting Started

The new **Changelog and Realease Notes Process** consist in different Node.js code snippets or applications that run on different contexts:

## 2. Key Technologies

To effectively contribute in the automated **Changelog and Realease Notes Process** you should be familiar with Nodejs, JavaScript, Expressjs, Github Actions and Github API. Also depending on the OpenSearch repo you are working with, you also need to be familiar with the language that it is being used there to develop and run the Relase Notes script process.

![JavaScript Badge](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000&style=for-the-badge)
![Node.js Badge](https://img.shields.io/badge/Node.js-393?logo=nodedotjs&logoColor=fff&style=for-the-badge)
![Express Badge](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff&style=for-the-badge)
![GitHub Badge](https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=fff&style=for-the-badge)
![GitHub Actions Badge](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=fff&style=for-the-badge)

## 3. Prerequisites

## 4. Overall Process Overview

The new **Changelog and Realease Notes Process** consist in different Node.js code snippets or applications that run on different contexts:

- **Github Runner Instance for Workflow Action** → used to parse and check changelog entries on PR description or manual created changesets files (i.e fragments).
- **Express.js Application for Github App** → For hosting service of Github App in charge of commiting new files on the contributor's repo (Forked OpenSearch Repo). This option is available when a contributor prefers to have an automated tool for creating changesets files.
- **Forked OpenSearch Repository for Realease Notes Script** → in charge of running realise notes process, which consist in:
  - Update of RELEASE_NOTES.md and CHANGELOG.md files
  - Clean up of changesets files ([pull_request_number].yml) in `changelogs/fragments` folder).

### 4.1 Github Runner Instance for Reusable Workflow Action

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

### 4.2 Express.js Application for Github App Bridge Service

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

### 4.3 Forked OpenSearch Repository for Realease Notes Script

[Explanation + UML sequence Diagram]

![UML_DIAGRAM](./assets/sequence_diagram_example.png)

## 5. Getting Started

For contributing, please read each of the sections below. There are several steps to setup the development environments for the different running contexts of the **Changelog and Realease Notes Process** and the OpenSearch forked repo you want to run the automated process

## 5.1 Github dummy Account and OpenSearch Repo

- (We suppose you have a forked version of an OpenSearch repo in your primary Github account)
- Create a dummy Github Account
- Fork and clone your current OpenSearch Repo under your primary Github Account into your dummy Github account
- etc ...

### 5.2 Reusable Workflow Action

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

### 5.3 Github App Bridge Service

[Explanation for setting up development environment for contributing in this context]

- Fork and clone repo
- Install dependencies
- etc ...

### 5.4 Realease Notes Script

[Explanation for setting up development environment for contributing in this context]

- In OpenSearch forked repo create script files
- etc ...

## 6. Code Guidelines

### 6.1 General

#### 6.2 Filenames

All filenames should use `dot.case`.

**Right:** `src/services/posts/post.services.js`

**Wrong:** `src/services/posts/post_services.js`

#### 6.2 Do not comment out code

We use a version management system. If a line of code is no longer needed,
remove it, don't simply comment it out.

#### 6.3 Prettier and linting

All JavaScript code (check `.eslintrc.js`) in [Reusanle Workflow Action](#52-reusable-workflow-action) and [Github App Bridge Service](#53-github-app-bridge-service) is using Prettier to format code. You
can run `node script/eslint --fix` to fix linting issues and apply Prettier formatting.
We recommend you to enable running ESLint via your IDE.

Whenever possible we are trying to use Prettier and linting over written developer guide rules.

Consider every linting rule and every Prettier rule to be also part of our developer guide
and disable them only in exceptional cases and ideally leave a comment why they are
disabled at that specific place.

### JavaScript

The following developer guide rules apply for working with JavaScript files.

#### Prefer modern JavaScript syntax

You should prefer modern language features in a lot of cases, e.g.:

- Prefer `class` over `prototype` inheritance
- Prefer arrow function over function expressions
- Prefer arrow function over storing `this` (no `const self = this;`)
- Prefer template strings over string concatenation
- Prefer the spread operator for copying arrays (`[...arr]`) over `arr.slice()`
- Use optional chaining (`?.`) and nullish Coalescing (`??`) over `lodash.get` (and similar utilities)

#### Avoid mutability and state

Wherever possible, do not rely on mutable state. This means you should not
reassign variables, modify object properties, or push values to arrays.
Instead, create new variables, and shallow copies of objects and arrays:

```js
// good
function addBar(foos, foo) {
  const newFoo = { ...foo, name: "bar" };
  return [...foos, newFoo];
}

// bad
function addBar(foos, foo) {
  foo.name = "bar";
  foos.push(foo);
}
```

#### Avoid `any` whenever possible

Since TypeScript 3.0 and the introduction of the
[`unknown` type](https://mariusschulz.com/blog/the-unknown-type-in-typescript) there are rarely any
reasons to use `any` as a type. Nearly all places of former `any` usage can be replace by either a
generic or `unknown` (in cases the type is really not known).

You should always prefer using those mechanisms over using `any`, since they are stricter typed and
less likely to introduce bugs in the future due to insufficient types.

If you’re not having `any` in your plugin or are starting a new plugin, you should enable the
[`@typescript-eslint/no-explicit-any`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-explicit-any.md)
linting rule for your plugin via the [`.eslintrc.js`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/master/.eslintrc.js) config.

#### Avoid non-null assertions

You should try avoiding non-null assertions (`!.`) wherever possible. By using them you tell
TypeScript, that something is not null even though by it’s type it could be. Usage of non-null
assertions is most often a side-effect of you actually checked that the variable is not `null`
but TypeScript doesn’t correctly carry on that information till the usage of the variable.

In most cases it’s possible to replace the non-null assertion by structuring your code/checks slightly different
or using [user defined type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
to properly tell TypeScript what type a variable has.

Using non-null assertion increases the risk for future bugs. In case the condition under which we assumed that the
variable can’t be null has changed (potentially even due to changes in completely different files), the non-null
assertion would now wrongly disable proper type checking for us.

If you’re not using non-null assertions in your plugin or are starting a new plugin, consider enabling the
[`@typescript-eslint/no-non-null-assertion`](https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/docs/rules/no-non-null-assertion.md)
linting rule for you plugin in the [`.eslintrc.js`](https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/.eslintrc.js) config.

#### Return/throw early from functions

To avoid deep nesting of if-statements, always return a function's value as early
as possible. And where possible, do any assertions first:

```js
// good
function doStuff(val) {
  if (val > 100) {
    throw new Error("Too big");
  }

  if (val < 0) {
    return false;
  }

  // ... stuff
}

// bad
function doStuff(val) {
  if (val >= 0) {
    if (val < 100) {
      // ... stuff
    } else {
      throw new Error("Too big");
    }
  } else {
    return false;
  }
}
```

#### Use object destructuring

This helps avoid temporary references and helps prevent typo-related bugs.

```js
// best
function fullName({ first, last }) {
  return `${first} ${last}`;
}

// good
function fullName(user) {
  const { first, last } = user;
  return `${first} ${last}`;
}

// bad
function fullName(user) {
  const first = user.first;
  const last = user.last;
  return `${first} ${last}`;
}
```

#### Use array destructuring

Directly accessing array values via index should be avoided, but if it is
necessary, use array destructuring:

```js
const arr = [1, 2, 3];

// good
const [first, second] = arr;

// bad
const first = arr[0];
const second = arr[1];
```

#### Avoid magic numbers/strings

These are numbers (or other values) simply used in line in your code. _Do not
use these_, give them a variable name so they can be understood and changed
easily.

```js
// good
const minWidth = 300;

if (width < minWidth) {
  ...
}

// bad
if (width < 300) {
  ...
}
```

#### Use native ES2015 module syntax

Module dependencies should be written using native ES2015 syntax wherever
possible (which is almost everywhere):

```js
// good
import { mapValues } from 'lodash';
export mapValues;

// bad
const _ = require('lodash');
module.exports = _.mapValues;

// worse
define(['lodash'], function (_) {
  ...
});
```

In those extremely rare cases where you're writing server-side JavaScript in a
file that does not pass run through webpack, then use CommonJS modules.

In those even rarer cases where you're writing client-side code that does not
run through webpack, then do not use a module loader at all.

##### Import only top-level modules

The files inside a module are implementation details of that module. They
should never be imported directly. Instead, you must only import the top-level
API that's exported by the module itself.

Without a clear mechanism in place in JS to encapsulate protected code, we make
a broad assumption that anything beyond the root of a module is an
implementation detail of that module.

On the other hand, a module should be able to import parent and sibling
modules.

```js
// good
import foo from "foo";
import child from "./child";
import parent from "../";
import ancestor from "../../../";
import sibling from "../foo";

// bad
import inFoo from "foo/child";
import inSibling from "../foo/child";
```

#### Avoid global definitions

Don't do this. Everything should be wrapped in a module that can be depended on
by other modules. Even things as simple as a single value should be a module.

#### Use ternary operators only for small, simple code

And _never_ use multiple ternaries together, because they make it more
difficult to reason about how different values flow through the conditions
involved. Instead, structure the logic for maximum readability.

```js
// good, a situation where only 1 ternary is needed
const foo = a === b ? 1 : 2;

// bad
const foo = a === b ? 1 : a === c ? 2 : 3;
```

#### Use descriptive conditions

Any non-trivial conditions should be converted to functions or assigned to
descriptively named variables. By breaking up logic into smaller,
self-contained blocks, it becomes easier to reason about the higher-level
logic. Additionally, these blocks become good candidates for extraction into
their own modules, with unit-tests.

```js
// best
function isShape(thing) {
  return thing instanceof Shape;
}
function notSquare(thing) {
  return !(thing instanceof Square);
}
if (isShape(thing) && notSquare(thing)) {
  ...
}

// good
const isShape = thing instanceof Shape;
const notSquare = !(thing instanceof Square);
if (isShape && notSquare) {
  ...
}

// bad
if (thing instanceof Shape && !(thing instanceof Square)) {
  ...
}
```

#### Name regular expressions

```js
// good
const validPassword = /^(?=.*\d).{4,}$/;

if (password.length >= 4 && validPassword.test(password)) {
  console.log("password is valid");
}

// bad
if (password.length >= 4 && /^(?=.*\d).{4,}$/.test(password)) {
  console.log("losing");
}
```

#### Write small functions

Keep your functions short. A good function fits on a slide that the people in
the last row of a big room can comfortably read. So don't count on them having
perfect vision and limit yourself to ~15 lines of code per function.

#### Use "rest" syntax rather than built-in `arguments`

For expressiveness sake, and so you can be mix dynamic and explicit arguments.

```js
// good
function something(foo, ...args) {
  ...
}

// bad
function something(foo) {
  const args = Array.from(arguments).slice(1);
  ...
}
```

#### Use default argument syntax

Always use the default argument syntax for optional arguments.

```js
// good
function foo(options = {}) {
  ...
}

// bad
function foo(options) {
  if (typeof options === 'undefined') {
    options = {};
  }
  ...
}
```

And put your optional arguments at the end.

```js
// good
function foo(bar, options = {}) {
  ...
}

// bad
function foo(options = {}, bar) {
  ...
}
```

#### Use thunks to create closures, where possible

For trivial examples (like the one that follows), thunks will seem like
overkill, but they encourage isolating the implementation details of a closure
from the business logic of the calling code.

```js
// good
function connectHandler(client, callback) {
  return () => client.connect(callback);
}
setTimeout(connectHandler(client, afterConnect), 1000);

// not as good
setTimeout(() => {
  client.connect(afterConnect);
}, 1000);

// bad
setTimeout(() => {
  client.connect(() => {
    ...
  });
}, 1000);
```

#### Use slashes for comments

Use slashes for both single line and multi line comments. Try to write
comments that explain higher level mechanisms or clarify difficult
segments of your code. _Don't use comments to restate trivial things_.

_Exception:_ Comment blocks describing a function and its arguments
(docblock) should start with `/**`, contain a single `*` at the beginning of
each line, and end with `*/`.

```js
// good

// 'ID_SOMETHING=VALUE' -> ['ID_SOMETHING=VALUE', 'SOMETHING', 'VALUE']
const matches = item.match(/ID_([^\n]+)=([^\n]+)/));

/**
 * Fetches a user from...
 * @param  {string} id - id of the user
 * @return {Promise}
 */
function loadUser(id) {
  // This function has a nasty side effect where a failure to increment a
  // redis counter used for statistics will cause an exception. This needs
  // to be fixed in a later iteration.

  ...
}

const isSessionValid = (session.expires < Date.now());
if (isSessionValid) {
  ...
}

// bad

// Execute a regex
const matches = item.match(/ID_([^\n]+)=([^\n]+)/));

// Usage: loadUser(5, function() { ... })
function loadUser(id, cb) {
  // ...
}

// Check if the session is valid
const isSessionValid = (session.expires < Date.now());
// If the session is valid
if (isSessionValid) {
  ...
}
```

#### Use getters but not setters

Feel free to use getters that are free from [side effects][sideeffect], like
providing a length property for a collection class.

Do not use setters, they cause more problems than they can solve.

[sideeffect]: http://en.wikipedia.org/wiki/Side_effect_(computer_science)

#### Attribution

Parts of the JavaScript developer guide were initially forked from the
[node style guide](https://github.com/felixge/node-style-guide) created by [Felix Geisendörfer](http://felixge.de/) which is
licensed under the [CC BY-SA 3.0](http://creativecommons.org/licenses/by-sa/3.0/)
license.
