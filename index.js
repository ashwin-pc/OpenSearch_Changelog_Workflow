import { CHANGESET_PATH } from "./config/constants.js";

import { extractChangelogEntries } from "./utils/changelogParser.js";
import {
  prepareChangesetEntryMap,
  prepareChangesetEntriesContent,
} from "./utils/formattingUtils.js";
import { CategoryWithSkipOptionError } from "./utils/customErrors.js";
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

  if (entryMap["skip"]) {
    if (Object.keys(entryMap).length > 1) {
      throw new CategoryWithSkipOptionError();
    } else {
      console.log("No changeset file created or updated.");
      return;
    }
  }

  // Prepare some parameters for creating or updating the changeset file
  const changesetEntriesContent = Buffer.from(
    prepareChangesetEntriesContent(entryMap)
  ).toString("base64");
  const changesetFileName = `${prNumber}.yml`;
  const changesetFilePath = `${CHANGESET_PATH}/${changesetFileName}`;
  const message = `Add changeset for PR #${prNumber}`;

  // Create or update the changeset file using Github API
  await createOrUpdateFile(
    owner,
    repo,
    changesetFilePath,
    changesetEntriesContent,
    message,
    branchRef
  );
}

run();
