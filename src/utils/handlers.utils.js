import { FAILED_CHANGESET_LABEL, SKIP_LABEL } from "../config/constants.js";
import {
  pullRequestServices,
  forkedFileServices,
  labelServices,
  commentServices,
} from "../services/index.js";
import {
  extractChangelogEntries,
  processChangelogLine,
} from "./changelog.utils.js";
import {
  getChangesetEntriesMap,
  getChangesetFilePath,
  getChangesetFileContent
} from "./changeset.utils.js";
import { formatPostComment } from "./formatting.utils.js";
import {
  GetContentError,
  CreateOrUpdateContentError,
  DeleteContentError,
  GitHubAppSuspendedOrNotInstalledError,
  UnauthorizedRequestToPRBridgeServiceError,
  ChangesetFileMustNotExistWithSkipEntryOption,
  ChangesetFileNotAddedYetError,
} from "../errors/index.js";
import { ManualChangesetCreationReminderInfo } from "../infos/index.js";
import { isSkipEntry } from "./validators.utils.js";

/**
 * Handles the labels of a PR based on the operation.
 * @param {InstanceType<typeof GitHub>} octokit - An Octokit instance.
 * @param {Object} prData - An object containing the PR data.
 * @param {string} operation - The operation to perform on the labels.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export const handlePullRequestLabels = async (octokit, prData, operation) => {
  console.error(`Updating labels on PR #${prData.prNumber}...`);
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
      console.error(`Unknown operation: ${operation}`);
  }
};

/**
 * Handles the comment to post on a PR based on the operation.
 * @param {InstanceType<typeof GitHub>} octokit - An Octokit instance.
 * @param {Object} prData - An object containing the PR data.
 * @param {string} commentInput - The comment input to post on the PR. Either an Error or Info object.
 * @param {string} operation - The operation to perform on the comment.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export const handlePullRequestComment = async (
  octokit,
  prData,
  commentInput,
  operation
) => {
  let commentType;
  switch (operation) {
    case "changeset-check-error":
      commentType = "ERROR";
      console.error(`Posting error comment on PR #${prData.prNumber}...`);
      break;
    case "github-app-info":
      commentType = "INFO";
      console.log(`Posting info comment on PR #${prData.prNumber}...`);
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

/**
 * Handles removal of changeset file in forked repo on errors related to changelog entries.
 * @param {Object} prData - An object containing PR data (i.e. headOwner, headRepo, headBranch, prNumber, etc.)
 * @param {Error} error - The error object (i.e. InvalidPrefixError, EntryTooLongError, etc.)
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export const handleDeletionChangesetFileOnChangelogEntryError = async (
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

/** Handles the "skip" entry in a changeset file.
 * @param {InstanceType<typeof GitHub>} octokit - An Octokit instance.
 * @param {Object} prData - An object containing PR data (i.e. baseOwner, baseRepo, baseBranch, prNumber, etc.)
 * @param {string} changesetCreationMode - The changeset creation mode (i.e. 'automatic' or 'manual').
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {ChangesetFileMustNotExistWithSkipEntryOption} - If the changeset file exists with the "skip" entry and the changeset creation mode is manual.
 */
export const handleSkipEntry = async (
  octokit,
  prData,
  changesetCreationMode
) => {
  // Check if changeset file exists in the commited changes
  const changesetFileExistInCommit =
    await pullRequestServices.isFileInCommitedChanges(
      octokit,
      prData.baseOwner,
      prData.baseRepo,
      prData.prNumber,
      getChangesetFilePath(prData.prNumber)
    );

  // If changeset file exists
  if (changesetFileExistInCommit) {
    // For automatic changeset creation, delete changeset file and add skip label to PR
    if (changesetCreationMode === "automatic") {
      const commitMessage = `Changeset file for PR #${prData.prNumber} deleted`;
      await forkedFileServices.deleteFileInForkedRepoByPath(
        prData.headOwner,
        prData.headRepo,
        prData.headBranch,
        getChangesetFilePath(prData.prNumber),
        commitMessage
      );
      await handlePullRequestLabels(octokit, prData, "add-skip-label");
    }
    // For manual changeset creation, add failed label to PR and throw error
    else {
      throw new ChangesetFileMustNotExistWithSkipEntryOption(prData.prNumber);
    }
  }

  // Else, if changesetFile does not exist, just add skip label to PR (for both automatic and manual changeset creation)
  else {
    await handlePullRequestLabels(octokit, prData, "add-skip-label");
  }
};

/**
 * Handles the error type to throw depending on the error sent by the Changelog PR Bridge service and the CRUD operation to perform on a changeset file in forked repo.
 * @param {Error} error - The error object.
 * @param {string} crudOperation - The CRUD operation to perform on the changeset file (i.e. 'READ', 'CREATE_OR_UPDATE', 'DELETE').
 * @param {string} path - The path to the changeset file.
 * @throws {GetContentError} - If an error occurs while reading the changeset file.
 * @throws {CreateOrUpdateContentError} - If an error occurs while creating or updating the changeset file.
 * @throws {DeleteContentError} - If an error occurs while deleting the changeset file.
 * @throws {GitHubAppSuspendedOrNotInstalledError} - If the GitHub App is suspended or not installed.
 * @throws {UnauthorizedRequestToPRBridgeServiceError} - If the request to the Changelog PR Bridge service is unauthorized.
 */
export const handleChangelogPRBridgeResponseErrors = (
  error,
  crudOperation,
  path
) => {
  switch (error.response?.status) {
    case 404:
      console.error(`File/Directory '${path}' not found.`);
      return;
    case 401:
      throw new UnauthorizedRequestToPRBridgeServiceError();
    case 403:
      throw new GitHubAppSuspendedOrNotInstalledError();

    default:
      if (crudOperation === "READ") {
        throw new GetContentError();
      } else if (crudOperation === "CREATE_OR_UPDATE") {
        throw new CreateOrUpdateContentError();
      } else if (crudOperation === "DELETE") {
        throw new DeleteContentError();
      } else {
        throw error;
      }
  }
};

export const handleChangelogEntriesParsing = async (
  octokit,
  prData,
  changesetCreationMode
) => {
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
    console.error(
      `Error during check for ${changesetCreationMode} changeset creation.`
    );
    throw error;
  }
};

export const handleAutomaticChangesetCreation = async (
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
    await handlePullRequestLabels(octokit, prData, "remove-all-labels");
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
    console.error("Error during check for automatic changeset creation.");
    throw error;
  }
};

export const handleManualChangesetCreation = async (octokit, prData) => {
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
      await handlePullRequestLabels(octokit, prData, "remove-all-labels");
    } catch (error) {
      const commentInput = error;
      await handlePullRequestComment(
        octokit,
        prData,
        commentInput,
        "changeset-check-error"
      );
      await handlePullRequestLabels(octokit, prData, "add-failed-label");
      console.error("Error during check for manual changeset creation.");
      throw error;
    }
  }
};
