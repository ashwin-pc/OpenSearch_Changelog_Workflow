import github from "@actions/github";
import {
  PullRequestDataExtractionError,
  ChangesetFileAccessError,
  InvalidChangelogHeadingError,
  EmptyChangelogSectionError,
  EntryTooLongError,
  InvalidPrefixError,
  CategoryWithSkipOptionError,
  ChangelogEntryMissingHyphenError,
  EmptyEntryDescriptionError,
  UpdatePRLabelError,
} from "./customErrors.js";
import { GITHUB_TOKEN, SKIP_LABEL } from "../config/constants.js";

/**
 * Extracts relevant data from a GitHub Pull Request.
 *
 * @param {Object} octokit - An Octokit instance ready to use for GitHub Actions.
 * @returns {Promise<Object>} A promise that resolves to an object containing details of the pull request.
 * @throws {PullRequestDataExtractionError} Throws a custom error if data extraction fails.
 *
 * @example
 * const octokit = getOctokit(token);
 * const prData = await extractPullRequestData(octokit);
 */
export const extractPullRequestData = async (octokit) => {
  try {
    // Retrieve context data from the GitHub action environment
    const context = github.context;
    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request.number;

    console.log(`Extracting data for PR #${prNumber} in ${owner}/${repo}`);

    // Fetch pull request details using Octokit
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Validate response
    if (!pullRequest || typeof pullRequest !== "object") {
      throw new PullRequestDataExtractionError();
    }

    // Destructure necessary fields and validate them
    const { body, html_url } = pullRequest;
    if (body === undefined || html_url === undefined) {
      throw new PullRequestDataExtractionError();
    }

    // Return relevant PR data
    return {
      owner,
      repo,
      prNumber,
      prDescription: pullRequest.body,
      prLink: pullRequest.html_url,
      branchRef: context.payload.pull_request.head.ref,
    };
  } catch (error) {
    console.error(`Error extracting data from pull request: ${error.message}`);
    // Throw a custom error for issues during data extraction
    throw new PullRequestDataExtractionError();
  }
};

/**
 * Adds or removes a label from a GitHub pull request.
 *
 * @param {Object} octokit - An Octokit instance ready to use for GitHub Actions.
 * @param {string} owner - Owner of the repository.
 * @param {string} repo - Repository name.
 * @param {number} prNumber - Pull request number.
 * @param {string} label - Label to be added or removed.
 * @param {boolean} addLabel - Flag to add or remove the label.
 *
 * @returns {Promise<void>} A promise that resolves when the label is added or removed.
 *
 * @throws {Error} Throws an error if the label cannot be added or removed.
 *
 * @example
 * const octokit = getOctokit(token);
 *
 * // Add a label to a pull request
 * await updatePRLabel(octokit, 'owner', 'repo', 123, 'bug', true);
 *
 * // Remove a label from a pull request
 * await updatePRLabel(octokit, 'owner', 'repo', 123, 'enhancement', false);
 */
export const updatePRLabel = async (
  octokit,
  owner,
  repo,
  prNumber,
  label,
  addLabel
) => {
  try {
    // Get the current labels on the pull request
    const { data: currentLabels } = await octokit.rest.issues.listLabelsOnIssue(
      {
        owner,
        repo,
        issue_number: prNumber,
      }
    );

    // Check to see if the label is already on the pull request
    const labelExists = currentLabels.some((element) => element.name === label);

    if (addLabel && !labelExists) {
      // Add the label to the pull request
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label],
      });
      console.log(`Label "${label}" added to PR #${prNumber}`);
    } else if (!addLabel && labelExists) {
      // Remove the label from the pull request
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: prNumber,
        name: label,
      });
      console.log(`Label "${label}" removed from PR #${prNumber}`);
    } else {
      console.log(
        `Label "${label}" is already ${
          addLabel ? "present" : "absent"
        } on PR #${prNumber}. No action taken.`
      );
    }
  } catch (error) {
    console.error(
      `Error updating label "${label}" for PR #${prNumber}: ${error.message}`
    );
    throw new UpdatePRLabelError();
  }
};

/**
 * Handles a changeset entry map that contains the "skip" option.
 * @param {Object} entryMap - Map of changeset entries.
 * @param {string} owner - Owner of the repository.
 * @param {string} repo - Repository name.
 * @param {number} prNumber - Pull request number.
 * @param {Function} updateLabel - Function to add or remove a label from a PR.
 */
export const handleSkipOption = async (
  entryMap,
  owner,
  repo,
  prNumber,
  updateLabel
) => {
  if (entryMap && entryMap["skip"]) {
    // Check if "skip" is the only prefix in the changeset entries
    if (Object.keys(entryMap).length > 1) {
      throw new CategoryWithSkipOptionError();
    } else {
      console.log("No changeset file created or updated.");
      // Adds  "skip-changelog" label in PR if not present
      await updateLabel(owner, repo, prNumber, SKIP_LABEL, true);
      return;
    }
  }
  // Removes "skip-changelog" label in PR if present
  await updateLabel(owner, repo, prNumber, SKIP_LABEL, false);
};

/**
 * Posts a comment to a GitHub pull request based on the error type.
 * @param {string} owner - Owner of the repository.
 * @param {string} repo - Repository name.
 * @param {number} prNumber - Pull request number.
 * @param {Error} error - Error object that determines the comment to be posted.
 */
export const postPRComment = async (owner, repo, prNumber, error) => {
  // Initialize Octokit client with the GitHub token
  const octokit = github.getOctokit(GITHUB_TOKEN);
  // Map error constructors to their corresponding error messages.
  // Returns null if the error type does not require a comment in the PR.
  const errorCommentMap = {
    [PullRequestDataExtractionError]: () => null,
    [ChangesetFileAccessError]: () => null,
    [InvalidChangelogHeadingError]: (error) =>
      `Invalid Changelog Heading Error: ${error.message}`,
    [EmptyChangelogSectionError]: (error) =>
      `Empty Changelog Section Error: ${error.message}`,
    [EntryTooLongError]: (error) => `Entry Too Long Error: ${error.message}`,
    [InvalidPrefixError]: (error) => `Invalid Prefix Error: ${error.message}`,
    [CategoryWithSkipOptionError]: (error) =>
      `Category With Skip Option Error: ${error.message}`,
    [ChangelogEntryMissingHyphenError]: (error) =>
      `Changelog Entry Missing Hyphen Error: ${error.message}`,
    [EmptyEntryDescriptionError]: (error) =>
      `Empty Entry Description Error: ${error.message}`,
  };
  // If the error type is not one that merits a PR comment (either not listed in the
  // error comment map or explicitly mapped to null), the function will return null,
  // indicating that no comment should be posted.
  const commentGenerator =
    errorCommentMap[error.constructor] || ((error) => null);

  const comment = commentGenerator(error);

  if (comment) {
    try {
      // Post a comment to the pull request
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment,
      });
      console.log(`Comment posted to PR #${prNumber}: "${comment}"`);
    } catch (error) {
      console.error(
        `Error posting comment to PR #${prNumber}: ${error.message}`
      );
    }
  } else {
    console.log(
      `No comment posted to PR #${prNumber} due to error type: ${error.constructor.name}`
    );
  }
};

/**
 * Creates or updates a file in a GitHub repository.
 * @param {string} owner - Owner of the repository.
 * @param {string} repo - Repository name.
 * @param {string} path - File path within the repository.
 * @param {string} content - Content to be written to the file.
 * @param {string} message - Commit message.
 * @param {string} branchRef - Branch reference for the commit.
 */
export const createOrUpdateFile = async (
  owner,
  repo,
  path,
  content,
  message,
  branchRef
) => {
  // Initialize Octokit client
  const octokit = github.getOctokit(GITHUB_TOKEN);
  // File's SHA to check if file exists
  let sha;

  // Attempt to retrieve the file's SHA to check if it exists
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branchRef,
    });
    sha = response.data.sha;
  } catch (error) {
    if (error.status === 404) {
      console.log("Changeset file not found, will create a new one.");
    } else {
      throw new ChangesetFileAccessError(
        `Failed to access changeset file at ${path}: ${error.message}`,
        error.status
      );
    }
  }

  // Create or update the file content
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    sha, // If file exists, sha is used to update; otherwise, file is created
    branch: branchRef,
  });

  console.log(`File: ${path} ${sha ? "updated" : "created"} successfully.`);
};
