import { CHANGESET_PATH } from "./config/constants.js";
import { extractChangelogEntries } from "./utils/changelogParser.js";
import {
  prepareChangesetEntryMap,
  prepareChangesetEntriesContent,
} from "./utils/formattingUtils.js";
import {
  extractPullRequestData,
  createOrUpdateFile,
  updatePRLabel,
  handleSkipOption,
  postPRComment,
} from "./utils/githubUtils.js";

/**
 * Main function for the GitHub Actions workflow. Extracts relevant data from a pull request, parses changelog entries, handles "skip" entries, and creates or updates a changeset file in the repository.
*/
async function run() {
  // Initial variables for storing extracted PR data
  let owner, repo, prNumber, prDescription, prLink, branchRef;

  try {
    // Extract pull request data using the GitHub API
    ({ owner, repo, prNumber, prDescription, prLink, branchRef } =
      await extractPullRequestData());
    // Create an array of changelog entry strings from the PR description
    const changesetEntries = extractChangelogEntries(prDescription);
    // Create a map of changeset entries organized by category
    const entryMap = prepareChangesetEntryMap(changesetEntries, prNumber, prLink);
    // Check if the "skip" option is present in the entry map and respond accordingly
    await handleSkipOption(entryMap, owner, repo, prNumber, updatePRLabel);
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
  } catch(error) {
    if (owner && repo && prNumber) {
      await postPRComment(owner, repo, prNumber, error);
    }
    console.error(error);
    throw error;
  }
}

run();
