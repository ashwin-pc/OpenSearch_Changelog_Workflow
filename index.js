import github from "@actions/github";
import { CHANGESET_PATH, GITHUB_TOKEN, FAILED_CHANGESET_LABEL } from "./config/constants.js";
import {
  processLine,
  extractChangelogEntries,
} from "./utils/changelogParser.js";
import {
  prepareChangelogEntry,
  prepareChangelogEntriesMap,
  prepareChangesetEntriesContent,
} from "./utils/formattingUtils.js";
import {
  extractPullRequestData,
  createOrUpdateFile,
  updatePRLabel,
  handleSkipOption,
  postPRComment,
  getErrorComment,
} from "./utils/githubUtils.js";
/**
 * Main function for the GitHub Actions workflow. Extracts relevant data from a pull request, parses changelog entries, handles "skip" entries, and creates or updates a changeset file in the repository.
 */
async function run() {
  // Initialize Octokit client with the GitHub token
  const octokit = github.getOctokit(GITHUB_TOKEN);
  // Initial variables for storing extracted PR data
  let owner, repo, prNumber, prDescription, prLink, branchRef, prUser;

  try {
    // Extract pull request data using the GitHub API
    ({ owner, repo, prNumber, prDescription, prLink, branchRef, prUser } =
      await extractPullRequestData(octokit));

    console.log("-----------------------------------")
    console.log(owner)
    console.log(repo)
    console.log(prNumber)
    console.log(prDescription)
    console.log(prLink)
    console.log(branchRef)
    console.log(prUser)
    console.log("-----------------------------------")

    // Create an array of changelog entry strings from the PR description
    const changelogEntries = extractChangelogEntries(
      prDescription,
      processLine
    );

    // Create a map of changeset entries organized by category
    const changelogEntriesMap = prepareChangelogEntriesMap(
      changelogEntries,
      prNumber,
      prLink,
      prepareChangelogEntry
    );

    // Check if the "skip" option is present in the entry map and respond accordingly
    const isSkipOptionPresent = await handleSkipOption(
      octokit,
      changelogEntriesMap,
      owner,
      repo,
      prNumber,
      updatePRLabel
    );

    // Skip changeset file creation if the "skip" label was added to the PR
    if (isSkipOptionPresent) {
      console.log("Skipping changeset creation because of 'skip' option.");
      return;
    }

    // Prepare some parameters for creating or updating the changeset file
    const changesetEntriesContent = Buffer.from(
      prepareChangesetEntriesContent(changelogEntriesMap)
    ).toString("base64");
    const changesetFileName = `${prNumber}.yml`;
    const changesetFilePath = `${CHANGESET_PATH}/${changesetFileName}`;
    const message = `Add changeset for PR #${prNumber}`;

    // Create or update the changeset file using Github API
    await createOrUpdateFile(
      octokit,
      owner,
      repo,
      changesetFilePath,
      changesetEntriesContent,
      message,
      branchRef,
      prUser
    );
    await updatePRLabel(
      octokit,
      owner,
      repo,
      prNumber,
      FAILED_CHANGESET_LABEL,
      false
    );
  } catch (error) {
    if (owner && repo && prNumber) {
      await postPRComment(
        octokit,
        owner,
        repo,
        prNumber,
        error,
        getErrorComment
      );
      await updatePRLabel(
        octokit,
        owner,
        repo,
        prNumber,
        FAILED_CHANGESET_LABEL,
        true
      );
    }
    console.error(error);
    throw error;
  }
}

run();
