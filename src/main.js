import {
  CHANGESET_PATH,
  FAILED_CHANGESET_LABEL,
  SKIP_LABEL,
} from "./config/constants.js";

import {
  forkedFileServices,
  forkedAuthServices,
  labelServices,
  commentServices,
  authServices,
} from "./services/index.js";

import {
  extractPullRequestData,
  processChangelogLine,
  extractChangelogEntries,
  getChangesetEntriesMap,
  getChangesetFileContent,
  isSkipEntry,
  formatPostComment,
} from "./utils/index.js";

import { GitHubAppSuspendedOrNotInstalledWarning } from "./warnings/index.js";

async function run() {
  // Initialize Octokit client with the GitHub token
  const octokit = authServices.getOctokitClient();

  // Define variable to store the GitHub App installation id
  let prData;

  try {
    // Step 0 - Extract information from the payload and validate GitHub App installation
    prData = extractPullRequestData();
    if (!isGitHubAppInstalledOrNotSuspended(octokit, prData)) {
      return;
    }

    // Step 1 - Parse changelog entries and validate
    const changelogEntries = extractChangelogEntries(
      prData.prDescription,
      processChangelogLine
    );
    const changesetEntriesMap = getChangesetEntriesMap(
      changelogEntries,
      prData.prNumber,
      prData.prLink
    );

    // Step 2 - Handle "skip" option

    if (isSkipEntry(changesetEntriesMap)) {
      await handleSkipEntry(octokit, prData);
      return;
    }

    // Step 3 - Add or update the changeset file in head repo

    const changesetFileContent = getChangesetFileContent(changesetEntriesMap);
    const commitMessage = `Changeset file for PR #${prNumber} created/updated`;
    await forkedFileServices.createOrUpdateFileInForkedRepoByPath(
      prData.headOwner,
      prData.headRepo,
      prData.headBranch,
      changesetFilePath(prNumber),
      changesetFileContent,
      commitMessage
    );

    // Step 4 - Remove failed changeset label and skip labels if they exist
    handleLabels(octokit, prData, "remove-all-labels");
  } catch (error) {
    const errorPostComment = formatPostComment({ input: error, type: "ERROR" });

    // Add error comment to PR
    await commentServices.postComment(
      octokit,
      prData.baseOwner,
      prData.baseRepo,
      prData.prNumber,
      errorPostComment
    );

    // Add failed changeset label, and remove skip label if exists
    await handleLabels(octokit, prData, "add-failed-label");

    // Delete changeset file if one was previously created
    if (
      error.name !== "MissingChangelogPullRequestBridgeUrlDomainError" &&
      error.name !== "MissingChangelogPullRequestBridgeApiKeyError" &&
      error.name !== "UnauthorizedRequestToPullRequestBridgeServiceError"
    ) {
      const commitMessage = `Changeset file for PR #${prNumber} deleted`;
      await forkedFileServices.deleteFileInForkedRepoByPath(
        prData.headOwner,
        prData.headRepo,
        prData.headBranch,
        changesetFilePath(prNumber),
        commitMessage
      );
    }
    throw new Error("Changeset creation workflow failed.");
  }
}



const isGitHubAppInstalledOrNotSuspended = async (octokit, prData) => {
  const githubAppInstallationInfo =
    await forkedAuthServices.getGitHubAppInstallationInfoFromForkedRepo(
      prData.headOwner,
      prData.headRepo
    );

  if (
    !githubAppInstallationInfo.installed ||
    githubAppInstallationInfo.suspended
  ) {
    console.log(
      "GitHub App is not installed or suspended in the forked repository. Manual changeset creation is required."
    );
    const warning = new GitHubAppSuspendedOrNotInstalledWarning(prNumber);
    const warningPostComment = formatPostComment({
      input: warning,
      type: "WARNING",
    });
    await commentServices.postComment(
      octokit,
      prData.baseOwner,
      prData.baseRepo,
      prData.prNumber,
      warningPostComment
    );

    await handleLabels(octokit, prData, "remove-all-labels");
    return false;
  }
  return true;
}

// ----------------------------------------------------------
// Entries Util Functions
// ----------------------------------------------------------
const handleSkipEntry = async (octokit, prData) => {
  const commitMessage = `Changeset file for PR #${prData.prNumber} deleted`;
  await forkedFileServices.deleteFileInForkedRepoByPath(
    prData.headOwner,
    prData.headRepo,
    prData.headBranch,
    getChangesetFilePath(prData.prNumber),
    commitMessage
  );
  await handleLabels(octokit, prData, "add-skip-label");
};

function getChangesetFilePath(prNumber) {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
}

// ----------------------------------------------------------
// Labels Util Functions
// ----------------------------------------------------------
const handleLabels = async (octokit, prData, operation) => {
  switch (operation) {
    case "add-skip-label":
      await labelServices.addLabel(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        SKIP_LABEL
      );
      await labelServices.removeLabel(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        FAILED_CHANGESET_LABEL
      );
      break;
    case "add-failed-label":
      await labelServices.addLabel(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        FAILED_CHANGESET_LABEL
      );
      await labelServices.removeLabel(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        SKIP_LABEL
      );
      break;
    case "remove-all-labels":
      await labelServices.removeLabel(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        SKIP_LABEL
      );
      await labelServices.removeLabel(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        FAILED_CHANGESET_LABEL
      );
      break;
    default:
      console.log(`Unknown operation: ${operation}`);
  }
};

run();
