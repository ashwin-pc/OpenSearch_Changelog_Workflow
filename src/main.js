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

  // Define the path to the changeset file
  const changesetFilePath = (prNumber) => `${CHANGESET_PATH}/${prNumber}.yml`;

  // Define variables to store the extracted pull request data
  let baseOwner,
    baseRepo,
    baseBranch,
    headOwner,
    headRepo,
    headBranch,
    prNumber,
    prDescription,
    prLink;

  // Define variable to store the GitHub App installation id
  let prData;

  try {
    // Step 0.1 - Extract information from the payload
    ({
      baseOwner,
      baseRepo,
      baseBranch,
      headOwner,
      headRepo,
      headBranch,
      prNumber,
      prDescription,
      prLink,
    } = extractPullRequestData());

    prData = extractPullRequestData();


    if (!isGitHubAppInstalledOrNotSuspended(octokit, prData)) {
      return;
    }

    // Step 1 - Parse changelog entries and validate
    const changelogEntries = extractChangelogEntries(
      prDescription,
      processChangelogLine
    );
    const changesetEntriesMap = getChangesetEntriesMap(
      changelogEntries,
      prNumber,
      prLink
    );

    // Step 2 - Handle "skip" option

    if (isSkipEntry(changesetEntriesMap)) {
      const commitMessage = `Changeset file for PR #${prNumber} deleted`;
      // Delete of changeset file in forked repo if one was previously created
      await forkedFileServices.deleteFileInForkedRepoByPath(
        headOwner,
        headRepo,
        headBranch,
        changesetFilePath(prNumber),
        commitMessage
      );

      // Add skip label, and remove failed changeset label if exists
      await handleLabels(octokit, prData, "add-skip-label");

      return;
    }

    // Step 3 - Add or update the changeset file in head repo

    const changesetFileContent = getChangesetFileContent(changesetEntriesMap);
    const commitMessage = `Changeset file for PR #${prNumber} created/updated`;
    await forkedFileServices.createOrUpdateFileInForkedRepoByPath(
      headOwner,
      headRepo,
      headBranch,
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
      baseOwner,
      baseRepo,
      prNumber,
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
        headOwner,
        headRepo,
        headBranch,
        changesetFilePath(prNumber),
        commitMessage
      );
    }
    throw new Error("Changeset creation workflow failed.");
  }
}

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

async function isGitHubAppInstalledOrNotSuspended(octokit, prData) {
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

run();
