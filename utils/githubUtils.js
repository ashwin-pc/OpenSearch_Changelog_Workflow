import github from "@actions/github";
import { PullRequestDataExtractionError } from "./customErrors.js";
import { GITHUB_TOKEN, CHANGESET_PATH } from "../config/constants.js";
/**
 * Extracts relevant data from a GitHub Pull Request.
 * @returns {Promise<Object>} An object containing the pull request data and other relevant information.
 */
export const extractPullRequestData = async () => {
  try {
    // Set up Octokit with the provided token
    const octokit = github.getOctokit(GITHUB_TOKEN);

    // Get GitHub context data
    const context = github.context;
    const { owner, repo } = context.repo;
    const prNumber = context.payload.pull_request.number;

    console.log(
      `Extracting data for PR #${prNumber}... by ${owner} in ${repo}`
    );

    // Get the pull request details
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Extract PR description and link
    const prDescription = pullRequest.body || "";
    const prLink = pullRequest.html_url || "";
    const branchRef = context.payload.pull_request.head.ref;

    // Return the extracted data
    return {
      owner,
      repo,
      prNumber,
      prDescription,
      prLink,
      branchRef,
    };
  } catch (error) {
    throw new PullRequestDataExtractionError(); // Rethrow the error for further handling if necessary
  }
};

export const createOrUpdateFile = async (
  owner,
  repo,
  path,
  content,
  message,
  branchRef
) => {
  let sha;
  // Set up Octokit with the provided token
  const octokit = github.getOctokit(GITHUB_TOKEN);

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
      // File does not exist
      console.log("changeset for this PR not found, will create a new one.");
    } else {
      // Other errors
      console.log("other error:", error);
      throw error;
    }
  }
  await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content,
    sha, // This will be undefined if the file doesn't exist
    branchRef,
  });
  console.log(
    `File: ${CHANGESET_PATH} ${sha ? "updated" : "created"} successfully.`
  );
};
