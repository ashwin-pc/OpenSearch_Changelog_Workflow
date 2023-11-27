
import github from '@actions/github';
import { PullRequestDataExtractionError } from './customErrors';
/**
 * Extracts relevant data from a GitHub Pull Request.
 * @returns {Promise<Object>} An object containing the pull request data and other relevant information.
 */
async function extractPullRequestData() {
  try {
    // Read input parameters
    const token = process.env.INPUT_TOKEN;
    const changesetPath = process.env.INPUT_CHANGESET_PATH;

    // Set up Octokit with the provided token
    const octokit = github.getOctokit(token);

    // Get GitHub context data
    const context = github.context;
    const { owner, repo } = context.repo;
    const pullRequestNumber = context.payload.pull_request.number;

    console.log(
      `Extracting data for PR #${pullRequestNumber}... by ${owner} in ${repo}`
    );

    // Get the pull request details
    const { data: pullRequest } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: pullRequestNumber,
    });

    // Extract the changelog entries from the PR description
    const prDescription = pullRequest.body || "";

    // Return the extracted data
    return {
      owner,
      repo,
      pullRequestNumber,
      prDescription,
      changesetPath,
    };
  } catch (error) {
    throw new PullRequestDataExtractionError; // Rethrow the error for further handling if necessary
  }
}

module.exports = { extractPullRequestData }; // Export the function for use in other modules
