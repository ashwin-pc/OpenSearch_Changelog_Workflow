import github from "@actions/github";
import {
  PullRequestDataExtractionError,
  ChangesetFileAccessError,
} from "./customErrors.js";
import { GITHUB_TOKEN } from "../config/constants.js";

/**
 * Extracts relevant data from a GitHub Pull Request.
 * @returns {Promise<Object>} A promise that resolves to an object containing details of the pull request.
 * @throws {PullRequestDataExtractionError} Throws a custom error if data extraction fails.
 */
export const extractPullRequestData = async () => {
  try {
    // Initialize Octokit client with the GitHub token
    const octokit = github.getOctokit(GITHUB_TOKEN);

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
      prDescription: pullRequest.body || "",
      prLink: pullRequest.html_url || "",
      branchRef: context.payload.pull_request.head.ref,
    };
  } catch (error) {
    // Throw a custom error for issues during data extraction
    throw new PullRequestDataExtractionError();
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
    branchRef,
  });

  console.log(`File: ${path} ${sha ? "updated" : "created"} successfully.`);
};
