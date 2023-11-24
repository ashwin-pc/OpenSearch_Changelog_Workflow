const core = require("@actions/core");
const github = require("@actions/github");

// Define the prefixes that can be used in the changelog entries
const PREFIXES = [
  "breaking",
  "deprecate",
  "feat",
  "fix",
  "infra",
  "doc",
  "chore",
  "refactor",
  "test",
];

// Function to extract changelog entries from the PR description
function extractChangelogEntries(prDescription) {
  const regexPatternChangelogSection = /## Changelog\s*([\s\S]*?)(?:\n##|$)/;
  // Regex explanation:
  // /## Changelog\s*   // Matches the '## Changelog' heading in markdown. '\s*' matches any whitespace (spaces, tabs) following 'Changelog'.
  // ([\s\S]*?)         // Non-greedy match for any character set. Captures the content after '## Changelog' heading.
  // (?:\n##|$)/;       // Non-capturing group. Matches a newline followed by '##' (next markdown heading) or the end of the text ('$').

  const changelogSection = prDescription.match(regexPatternChangelogSection);
  // Output -> Array of length 2:
  // changelogSection[0]: Full regex match including '## Changelog' and following content.
  // changelogSection[1]: Captured content after '## Changelog', excluding the heading itself.

  if (changelogSection) {
    let state = { inComment: false };
    const entries = changelogSection[0]
      .replace(/## Changelog\s*/, "")
      .split("\n")
      .filter((line) => isEntryLine(line, state))
      .map((entry) => entry.trim());
    return entries;
  }
  return [];
}

function isEntryLine(line, state) {
  // Check to exclude lines part of a comment block (i.e. lines between <!-- and -->)
  if (line.includes("<!--")) state.inComment = true;
  if (line.includes("-->")) {
      state.inComment = false;
      return false;
  }
  return !state.inComment && line.trim().startsWith("-");
}

function convertString(str, id, link) {
  const prefixeRegex = PREFIXES.join("|");
  const regex = new RegExp(`-\\s(${prefixeRegex}):(.*)`);
  const match = str.match(regex);
  if (match) {
    const [, prefix, text] = match;
    return [`- ${text} ([#${id}](${link}))`, prefix];
  }
  return [str, "unknown"];
}

async function run() {
  try {
    // Read input parameters
    const token = process.env.INPUT_TOKEN;
    const changesetPath = process.env.INPUT_CHANGESET_PATH;

    // Set up Octokit with the provided token
    const octokit = github.getOctokit(token);

    // Get context data
    const context = github.context;
    const { owner, repo } = context.repo;
    const pullRequestNumber = context.payload.pull_request.number;
    console.log(
      `Adding chnageset for PR #${pullRequestNumber}... by ${owner} in ${repo}`
    );

    // Get the pull request details
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    // Extract the changelog entries from the PR description
    const prDescription = pullRequest.body || "";
    const entries = extractChangelogEntries(prDescription);

    console.log(`Found ${entries.length} changelog entries.`);

    // If there are no entries, add a new entry with the PR title
    if (entries.length === 0) {
      entries.push(`- unknown: ${context.payload.pull_request.title}`);
    }

    // Create a new changeset file and populate it with the new entries in the following format:
    // <prefix>:
    // - <entry> ([#<PR number>](<PR link>))
    // - <entry> ([#<PR number>](<PR link>))
    // - <entry> ([#<PR number>](<PR link>))
    // <prefix>:
    // - <entry> ([#<PR number>](<PR link>))
    // - <entry> ([#<PR number>](<PR link>))
    // - <entry> ([#<PR number>](<PR link>))
    // ...
    const entryMap = entries
      .map((entry) =>
        convertString(entry, pullRequestNumber, pullRequest.html_url)
      )
      .reduce((acc, [entry, prefix]) => {
        if (!acc[prefix]) {
          acc[prefix] = [];
        }
        acc[prefix].push(entry);
        return acc;
      }, {});

    const changesetContent = Object.entries(entryMap)
      .map(([prefix, entries]) => {
        return `${prefix}:\n${entries.join("\n")}`;
      })
      .join("\n\n");

    // Add the changeset file to the repo

    async function createOrUpdateFile(
      octokit,
      owner,
      repo,
      path,
      content,
      message,
      branch
      // pullRequestNumber
    ) {
      let sha;
      try {
        const response = await octokit.rest.repos.getContent({
          owner,
          repo,
          path,
          ref: branch,
        });
        sha = response.data.sha;
      } catch (error) {
        if (error.status === 404) {
          // File does not exist
          console.log(
            "changeset for this PR not found, will create a new one."
          );
        } else {
          // Other errors
          console.log("other error:", error);
          throw error;
        }
      }
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: message,
        content: content,
        sha, // This will be undefined if the file doesn't exist
        branch,
      });
      console.log(`File: ${path} ${sha ? "updated" : "created"} successfully.`);
    }

    const changesetFileName = `${pullRequestNumber}.yml`;

    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      `${changesetPath}/${changesetFileName}`,
      Buffer.from(changesetContent).toString("base64"),
      `Add changeset for PR #${pullRequestNumber}`,
      context.payload.pull_request.head.ref
    );

    // console.log("Changeset file added successfully.");
  } catch (error) {
    console.trace(`Error adding changeset: ${error}`);
    process.exit(1);
  }
}

run();
