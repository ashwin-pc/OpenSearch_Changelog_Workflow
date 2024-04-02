import { pullRequestServices, forkedFileServices } from "../services/index.js";
import { handlePullRequestLabels } from "./label.utils.js";
import { getChangesetFilePath } from "./changeset.utils.js";

import {
  GetContentError,
  CreateOrUpdateContentError,
  DeleteContentError,
  GitHubAppSuspendedOrNotInstalledError,
  UnauthorizedRequestToPRBridgeServiceError,
} from "../errors/index.js";

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
      await handlePullRequestLabels(octokit, prData, "add-failed-label");
      throw new ChangesetFileMustNotExistWithSkipEntryOption(prData.prNumber);
    }
  }

  // Else, if changesetFile does not exist, just add skip label to PR (for both automatic and manual changeset creation)
  else {
    await handlePullRequestLabels(octokit, prData, "add-skip-label");
  }
};
