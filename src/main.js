import { CHANGESET_PATH } from "./config/constants.js";

import {
  forkedFileServices,
  forkedAuthServices,
  commentServices,
  authServices,
  pullRequestServices,
} from "./services/index.js";

import {
  extractPullRequestData,
  processChangelogLine,
  extractChangelogEntries,
  getChangesetEntriesMap,
  getChangesetFileContent,
  isSkipEntry,
  isGitHubAppNotInstalledOrSuspended,
  formatPostComment,
  handleSkipEntry,
  handlePullRequestLabels,
  getChangesetFilePath,
} from "./utils/index.js";

import { ManualChangesetCreationReminderInfo } from "./infos/index.js";
import {
  ChangesetFileNotAddedYetError,
} from "./errors/index.js";

// ****************************************************************************
// I) MAIN
// ****************************************************************************

const run = async () => {
  const octokit = authServices.getOctokitClient();
  let prData = extractPullRequestData();

  // If Github App is not installed or suspended, use manual approach to create changeset file
  if (await isGitHubAppNotInstalledOrSuspended(prData)) {
    console.log(
      "GitHub App is not installed or suspended in the forked repository.\nProceding with checks for manual changeset creation."
    );
    await handleManualChangesetCreation(octokit, prData);
  }
  // Else, use automated approach to create changeset file
  else {
    console.log(
      "GitHub App is installed and not suspended in the forked repository.\nProceding with checks in changelog PR description and automatic creation of changeset file."
    );
    await handleAutomaticChangesetCreation(octokit, prData);
  }
};

run();

// ****************************************************************************
// II) HELPERS
// ****************************************************************************

// ----------------------------------------------------------
// Chnageset Creation Helpers Functions
// ----------------------------------------------------------
const handleAutomaticChangesetCreation = async (octokit, prData) => {
  const changesetCreationMode = "automatic";
  try {
    const changelogEntries = extractChangelogEntries(
      prData.prDescription,
      processChangelogLine,
      changesetCreationMode
    );
    const changesetEntriesMap = getChangesetEntriesMap(
      changelogEntries,
      prData.prNumber,
      prData.prLink,
      changesetCreationMode
    );
    if (isSkipEntry(changesetEntriesMap)) {
      await handleSkipEntry(octokit, prData, changesetCreationMode);
      return;
    }
    const changesetFileContent = getChangesetFileContent(changesetEntriesMap);
    const commitMessage = `Changeset file for PR #${prData.prNumber} created/updated`;
    await forkedFileServices.createOrUpdateFileInForkedRepoByPath(
      prData.headOwner,
      prData.headRepo,
      prData.headBranch,
      getChangesetFilePath(prData.prNumber),
      changesetFileContent,
      commitMessage
    );
    handlePullRequestLabels(octokit, prData, "remove-all-labels");
  } catch (error) {
    const commentInput = error;
    await handlePullRequestComment(
      octokit,
      prData,
      commentInput,
      "changeset-check-error"
    );
    await handlePullRequestLabels(octokit, prData, "add-failed-label");
    await handleDeletionChangesetFileOnChangelogEntryError(prData, error);
    throw new Error("Automatic creation of changeset file failed.", error);
  }
};

const handleManualChangesetCreation = async (octokit, prData) => {
  // Post info message about adding changeset file manually if PR opened or reopened
  const changesetCreationMode = "manual";
  if (prData.prAction == "opened" || prData.prAction == "reopened") {
    const commentInput = new ManualChangesetCreationReminderInfo(
      prData.prNumber
    );
    await handlePullRequestComment(
      octokit,
      prData,
      commentInput,
      "github-app-info"
    );
    await handlePullRequestLabels(octokit, prData, "add-failed-label");
    throw new Error("Waiting for changeset file to be added manually.");
  }
  // Else, post error message indicating changeset file is missing
  else if (prData.prAction == "edited" || prData.prAction == "synchronize") {
    try {
      const changelogEntries = extractChangelogEntries(
        prData.prDescription,
        processChangelogLine,
        changesetCreationMode
      );
      const changesetEntriesMap = getChangesetEntriesMap(
        changelogEntries,
        prData.prNumber,
        prData.prLink,
        changesetCreationMode
      );
      if (isSkipEntry(changesetEntriesMap)) {
        await handleSkipEntry(octokit, prData, changesetCreationMode);
        return;
      }
      const changesetFileExist =
        await pullRequestServices.isFileInCommitedChanges(
          octokit,
          prData.baseOwner,
          prData.baseRepo,
          prData.prNumber,
          getChangesetFilePath(prData.prNumber)
        );
      if (!changesetFileExist) {
        throw new ChangesetFileNotAddedYetError(prData.prNumber);
      }
      handlePullRequestLabels(octokit, prData, "remove-all-labels");
    } catch (error) {
      const commentInput = error;
      await handlePullRequestComment(
        octokit,
        prData,
        commentInput,
        "changeset-check-error"
      );
      await handlePullRequestLabels(octokit, prData, "add-failed-label");
      throw new Error("Changeset file required to be added manually.", error);
    }
  }
};

// ----------------------------------------------------------
// Error Helpers Functions
// ----------------------------------------------------------

const handleDeletionChangesetFileOnChangelogEntryError = async (
  prData,
  error
) => {
  // Delete changeset file if one was previously created
  if (
    error.name !== "MissingChangelogPullRequestBridgeUrlDomainError" &&
    error.name !== "MissingChangelogPullRequestBridgeApiKeyError" &&
    error.name !== "UnauthorizedRequestToPullRequestBridgeServiceError"
  ) {
    const commitMessage = `Changeset file for PR #${prData.prNumber} deleted`;
    await forkedFileServices.deleteFileInForkedRepoByPath(
      prData.headOwner,
      prData.headRepo,
      prData.headBranch,
      getChangesetFilePath(prData.prNumber),
      commitMessage
    );
  }
};

const handlePullRequestComment = async (
  octokit,
  prData,
  commentInput,
  operation
) => {
  let commentType;
  switch (operation) {
    case "changeset-check-error":
      commentType = "ERROR";
      console.error(
        `Error:  ${commentInput.message}}.`
      );
      break;
    case "github-app-info":
      commentType = "INFO";
      console.log(
        "GitHub App is not installed or suspended in the forked repository. Manual changeset creation is required."
      );
      break;
    default:
      console.error(`Unknown operation: ${operation}`);
      return;
  }

  const pullRequestComment = formatPostComment({
    input: commentInput,
    type: commentType,
  });

  await commentServices.postComment(
    octokit,
    prData.baseOwner,
    prData.baseRepo,
    prData.prNumber,
    pullRequestComment
  );
};
