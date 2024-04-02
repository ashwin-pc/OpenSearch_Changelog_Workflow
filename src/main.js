import {
  forkedFileServices,
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
  handleSkipEntry,
  handlePullRequestLabels,
  handlePullRequestComment,
  handleDeletionChangesetFileOnChangelogEntryError,
  getChangesetFilePath,
} from "./utils/index.js";

import { ManualChangesetCreationReminderInfo } from "./infos/index.js";
import { ChangesetFileNotAddedYetError } from "./errors/index.js";

// ****************************************************************************
// I) MAIN
// ****************************************************************************

const run = async () => {

  // Step 1 - Define oc
  const octokit = authServices.getOctokitClient();
  const changesetCreationMode = isGitHubAppNotInstalledOrSuspended(octokit)
    ? "manual"
    : "automatic";
  let prData, changesetEntriesMap;

  try {
    prData = extractPullRequestData();
    changesetEntriesMap = await handleChangelogEntriesParsing(
      prData,
      changesetCreationMode
    );
    // If changeset creation mode is manual, handle manual changeset creation
    if (changesetCreationMode === "automatic")
      await handleManualChangesetCreation(octokit, prData, changesetEntriesMap);
    // Else, use automated approach to create changeset file
    else {
      await handleAutomaticChangesetCreation(
        octokit,
        prData,
        changesetEntriesMap
      );
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  } finally {
    console.log("Check process complete.");
  }
};

run();

const handleChangelogEntriesParsing = async (prData, changesetCreationMode) => {
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
    return changesetEntriesMap;
  } catch (error) {
    const commentInput = error;
    await handlePullRequestComment(
      octokit,
      prData,
      commentInput,
      "changeset-check-error"
    );
    await handlePullRequestLabels(octokit, prData, "add-failed-label");
    throw new Error(
      `Error during check for ${changesetCreationMode} changeset creation.`
    );
  }
};

const handleAutomaticChangesetCreation = async (
  octokit,
  prData,
  changesetEntriesMap
) => {
  console.log(
    "GitHub App is not installed or suspended in the forked repository.\nProceding with checks for manual changeset creation."
  );
  try {
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
    throw new Error("Error during check for automatic changeset creation.");
  }
};

const handleManualChangesetCreation = async (octokit, prData) => {
  console.log(
    "GitHub App is installed and not suspended in the forked repository.\nProceding with checks in changelog PR description and automatic creation of changeset file."
  );
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
      throw new Error("Error during check for manual changeset creation.");
    }
  }
};
