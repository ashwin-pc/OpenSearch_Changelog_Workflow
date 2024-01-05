
import github from "@actions/github";
import{
  GITHUB_TOKEN,
} from '../config/constants.js';
/**
 * Creates an authenticated Octokit instance for a given GitHub App installation.
 * This function performs asynchronous operations to obtain the installation ID and
 * then returns a Promise that resolves to an authenticated Octokit instance for that installation.
 *
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The repository name.
 * @returns {Promise<Octokit>} A Promise that resolves to an authenticated Octokit instance.
 * @throws {Error} - If an error occurs while obtaining the installation ID.
 */
const getOcktokitClient = () => {
  try {
    const octokit = github.getOctokit(GITHUB_TOKEN);
    return octokit;
  } catch (error) {
    console.error('Error getting ocktokit client:', error.message);
    throw error; // Re-throw the error to propagate it to the caller.
  }
};

export const authServices = {
  getOcktokitClient,
};
