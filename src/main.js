import {
  CHANGESET_PATH,
} from "./config/constants.js";

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
  handlePullRequestLabels,
} from "./utils/index.js";

import { ManualChangesetCreationReminderInfo } from "./infos/index.js";
import {
  ChangesetFileNotAddedYetError,
  ChangesetFileMustNotExistWithSkipEntryOption,
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
    await handleErrorChangelogEntries(error, octokit, prData);
    throw new Error("Automatic creation of changeset file failed.", error);
  }
};

const handleManualChangesetCreation = async (octokit, prData) => {
  // Post info message about adding changeset file manually if PR opened or reopened
  const changesetCreationMode = "manual";
  if (prData.prAction == "opened" || prData.prAction == "reopened") {
    await postInfoMessageAboutGitHubAppAndAutomationProcess(octokit, prData);
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
      await postErrorMessageAboutMissingChangesetFile(error, octokit, prData);
      throw new Error("Changeset file required to be added manually.", error);
    }
  }
};

// ----------------------------------------------------------
// Entries Helpers Functions
// ----------------------------------------------------------
const handleSkipEntry = async (octokit, prData, changesetCreationMode) => {
  const commitMessage = `Changeset file for PR #${prData.prNumber} deleted`;
  if (changesetCreationMode === "automatic") {
    await forkedFileServices.deleteFileInForkedRepoByPath(
      prData.headOwner,
      prData.headRepo,
      prData.headBranch,
      getChangesetFilePath(prData.prNumber),
      commitMessage
    );
    await handlePullRequestLabels(octokit, prData, "add-skip-label");
  } else {
    const changesetFileExist =
      await pullRequestServices.isFileInCommitedChanges(
        octokit,
        prData.baseOwner,
        prData.baseRepo,
        prData.prNumber,
        getChangesetFilePath(prData.prNumber)
      );
      console.log("changesetFileExist", changesetFileExist);
    if (changesetFileExist) {
      await handlePullRequestLabels(octokit, prData, "add-failed-label");
      throw new ChangesetFileMustNotExistWithSkipEntryOption(prData.prNumber);
    } else {
      await handlePullRequestLabels(octokit, prData, "add-skip-label");
    }
  }
};

// ----------------------------------------------------------
// Error Helpers Functions
// ----------------------------------------------------------

const handleErrorChangelogEntries = async (error, octokit, prData) => {
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
  await handlePullRequestLabels(octokit, prData, "add-failed-label");

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

// ----------------------------------------------------------
// Pull Request Post Helpers Functions
// ----------------------------------------------------------
const postInfoMessageAboutGitHubAppAndAutomationProcess = async (
  octokit,
  prData
) => {
  console.log(
    "GitHub App is not installed or suspended in the forked repository. Manual changeset creation is required."
  );
  const info = new ManualChangesetCreationReminderInfo(prData.prNumber);
  const infoPostComment = formatPostComment({
    input: info,
    type: "INFO",
  });
  await commentServices.postComment(
    octokit,
    prData.baseOwner,
    prData.baseRepo,
    prData.prNumber,
    infoPostComment
  );

  await handlePullRequestLabels(octokit, prData, "remove-all-labels");
};

const postErrorMessageAboutMissingChangesetFile = async (
  error,
  octokit,
  prData
) => {
  console.log(
    `Changeset file ${prData.prNumber}.yml is missing in the forked repository.`
  );

  const errorPostComment = formatPostComment({
    input: error,
    type: "ERROR",
  });
  await commentServices.postComment(
    octokit,
    prData.baseOwner,
    prData.baseRepo,
    prData.prNumber,
    errorPostComment
  );
  await handlePullRequestLabels(octokit, prData, "add-failed-label");
};

// ----------------------------------------------------------
// Path Helpers Functions
// ----------------------------------------------------------
function getChangesetFilePath(prNumber) {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
}
