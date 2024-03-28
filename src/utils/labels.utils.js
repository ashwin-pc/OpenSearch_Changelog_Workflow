import { FAILED_CHANGESET_LABEL, SKIP_LABEL } from "../config/constants.js";
import { labelServices } from "../services/index.js";
/**
 * Handles the labels of a PR based on the operation.
 * @param {Object} octokit - The authenticated Octokit instance.
 * @param {Object} prData - An object containing the PR data.
 * @param {string} operation - The operation to perform on the labels.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
export const handlePullRequestLabels = async (octokit, prData, operation) => {
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
