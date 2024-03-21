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
  isGitHubAppNotInstalledOrSuspended,
  formatPostComment,
} from "./utils/index.js";

import { ManualChangesetCreationReminderInfo } from "./infos/index.js";

// ****************************************************************************
// I) MAIN
// ****************************************************************************

const run = async () => {
  const octokit = authServices.getOctokitClient();
  let prData = extractPullRequestData();

  // If Github App is not installed or suspended
  if (await isGitHubAppNotInstalledOrSuspended(prData)) {
    await handleManualChangesetCreation(octokit, prData);
  }
  // Else, use automated approach to create changeset file
  else {
    await handleAutomaticChangesetCreation(octokit, prData);
  }
};

run();

// ****************************************************************************
// II) HELPERS
// ****************************************************************************

// ----------------------------------------------------------
// GitHub App Helpers Functions
// ----------------------------------------------------------
const postInfoMessageAboutGitHubAppAndAutomationProcess = async (
  octokit,
  prData
) => {
  console.log(
    "GitHub App is not installed or suspended in the forked repository. Manual changeset creation is required."
  );
  const warning = new ManualChangesetCreationReminderInfo(prData.prNumber);
  const warningPostComment = formatPostComment({
    input: warning,
    type: "INFO",
  });
  await commentServices.postComment(
    octokit,
    prData.baseOwner,
    prData.baseRepo,
    prData.prNumber,
    warningPostComment
  );

  await handleLabels(octokit, prData, "remove-all-labels");
};

// ----------------------------------------------------------
// Entries Helpers Functions
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

const handleAutomaticChangesetCreation = async (octokit, prData) => {
  try {
    const changelogEntries = extractChangelogEntries(
      prData.prDescription,
      processChangelogLine
    );
    const changesetEntriesMap = getChangesetEntriesMap(
      changelogEntries,
      prData.prNumber,
      prData.prLink
    );
    if (isSkipEntry(changesetEntriesMap)) {
      await handleSkipEntry(octokit, prData);
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
    handleLabels(octokit, prData, "remove-all-labels");
  } catch (error) {
    await handleErrorChangelogEntries(error, octokit, prData);
    throw new Error("Changeset creation workflow failed.");
  }
};

const handleManualChangesetCreation = async (octokit, prData) => {
  // Post info message about adding changeset file manually if PR opened or reopened
  if (prData.action == "opened" || prData.action == "reopened") {
    await postInfoMessageAboutGitHubAppAndAutomationProcess(octokit, prData);
    throw new Error("Waiting for changeset file to be added manually.");
  }
  // Else, post error message indicating changeset file is missing
  else if (prData.action == "edited" || prData.action == "synchronize") {
    throw new Error("Changeset file to be added manually.");
  }
};

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
  await handleLabels(octokit, prData, "add-failed-label");

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
// Labels Helpers Functions
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

// ----------------------------------------------------------
// Other Helpers Functions
// ----------------------------------------------------------
function getChangesetFilePath(prNumber) {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
}
