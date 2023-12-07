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
  EmptyEntryDescriptionError
} from "./customErrors.js";
import { GITHUB_TOKEN } from "../config/constants.js";
import { error } from "@actions/core";

/**
 * Extracts relevant data from a GitHub Pull Request.
 * @returns {Promise<Object>} A promise that resolves to an object containing details of the pull request.
 * @throws {PullRequestDataExtractionError} Throws a custom error if data extraction fails.
 */
export const extractPullRequestData = async () => {
  // Initialize Octokit client with the GitHub token
  const octokit = github.getOctokit(GITHUB_TOKEN);
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
    // Throw a custom error for issues during data extraction
    throw new PullRequestDataExtractionError();
  }
};

/**
 * Adds or removes a label from a GitHub pull request.
 * @param {string} owner - Owner of the repository.
 * @param {string} repo - Repository name.
 * @param {number} prNumber - Pull request number.
 * @param {string} label - Label to be added or removed.
 * @param {boolean} addLabel - Flag to add or remove the label.
 */
export const updatePRLabel = async (owner, repo, prNumber, label, addLabel) => {
  // Initialize Octokit client with the GitHub token
  const octokit = github.getOctokit(GITHUB_TOKEN);
  try {
    if (addLabel) {
      // Add the label to the pull request
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label],
      });
      console.log(`Label "${label}" added to PR #${prNumber}`);
    } else {
      // Get the current labels on the pull request
      const { data: currentLabels } =
        await octokit.rest.issues.listLabelsOnIssue({
          owner,
          repo,
          issue_number: prNumber,
        });

      // Check to see if the label is already on the pull request
      if (currentLabels.some((element) => element.name === label)) {
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
          `Label "${label}" not present on PR #${prNumber}. No action taken.`
        );
      }
    }
  } catch (error) {
    console.error(
      `Error updating label "${label}" for PR #${prNumber}: ${error.message}`
    );
  }
};

/**
 * Maps error constructors to their corresponding error messages. Returns null if the error type does not require a comment in the PR.
 */
const errorCommentMap = {
  [PullRequestDataExtractionError]: () => null,
  [ChangesetFileAccessError]: () => null,
  [InvalidChangelogHeadingError]: error => `Error: ${error.message}`,
  [EmptyChangelogSectionError]: error => `Error: ${error.message}`,
  [EntryTooLongError]: error => `Error: ${error.message}`,
  [InvalidPrefixError]: error => `Error: ${error.message}`,
  [CategoryWithSkipOptionError]: error => `Error: ${error.message}`,
  [ChangelogEntryMissingHyphenError]: error => `Error: ${error.message}`,
  [EmptyEntryDescriptionError]: error => `Error: ${error.message}`,
}

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
  
  // If the error type is not one that merits a PR comment (either not listed in the 
  // error comment map or explicitly mapped to null), the function will return null, 
  // indicating that no comment should be posted.
  const commentGenerator = errorCommentMap[error.constructor] || (error => null);

  const comment = commentGenerator(error);

  if (comment) {
    try {
      // Post a comment to the pull request
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment
      });
      console.log(`Comment posted to PR #${prNumber}: "${comment}"`);
    } catch(error) {
      console.error(`Error posting comment to PR #${prNumber}: ${error.message}`);
    }
  } else {
    console.log(`No comment posted to PR #${prNumber} due to error type: ${error.constructor.name}`);
  }
}

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
