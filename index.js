import { CHANGESET_PATH } from "./config/constants.js";

import { extractChangelogEntries } from "./utils/changelogParser.js";
import {
  prepareChangesetEntryMap,
  prepareChangesetEntriesContent,
} from "./utils/formattingUtils.js";
import {
  extractPullRequestData,
  createOrUpdateFile,
} from "./utils/githubUtils.js";

async function run() {
  // Get Pull Rerquest data
  const { owner, repo, prNumber, prDescription, prLink, branchRef } =
    await extractPullRequestData();

  // Extract the changelog entries from the PR description
  const changesetEntries = extractChangelogEntries(prDescription);

  // Create a map of changeset entries
  const entryMap = prepareChangesetEntryMap(changesetEntries, prNumber, prLink);

  // Prepare the content for the changeset file
  const changesetEntriesContent = Buffer.from(
    prepareChangesetEntriesContent(entryMap)
  ).toString("base64");
  const changesetFileName = `${prNumber}.yml`;
  const changesetFilPath = `${CHANGESET_PATH}/${changesetFileName}`;

  const message = `Add changeset for PR #${prNumber}`;

  // Create or update the changeset file using Github API
  await createOrUpdateFile(
    owner,
    repo,
    changesetFilPath,
    changesetEntriesContent,
    message,
    branchRef
  );

  console.log("Changeset file added successfully.");
}

run();
