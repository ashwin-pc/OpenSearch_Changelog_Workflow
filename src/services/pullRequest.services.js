/**
 * Checks if a specific file is part of the changes in a pull request.
 *
 * @param {InstanceType<typeof GitHub>} octokit - An Octokit instance.
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} prNumber - The pull request number.
 * @param {string} path - The file path.
 * @returns {Promise<object>} - An object containing the file details.
 * @throws {Error} - If an error occurs while fetching the file.
 */
const isFileInCommitedChanges = async (
  octokit,
  owner,
  repo,
  prNumber,
  path
) => {
  try {
    // Get the list of files for the pull request
    const response = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 1
    });
    console.log(response)
    const files = response.data;

    // Check if the specified file is in the list
    const fileExists = files.some((file) => file.filename === path);
    return fileExists;
  } catch (error) {
    console.error("An error occurred:", error);
    throw error; // Rethrow the error for further handling if necessary
  }
};

export const pullRequestServices = {
  isFileInCommitedChanges,
};
