import axios from "axios";
import { GITHUB_APP_BASE_URL } from "../config/constants.js";
import {
  GitHubAppSuspendedOrNotInstalledError,
  GetContentError,
  CreateOrUpdateContentError,
  DeleteContentError,
} from "../errors/index.js";

/**
 * Get a file in a given path in a forked GitHub repository.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} branch - The branch name.
 * @param {string} path - The file path.
 * @returns {Promise<object>} - An object containing the file details.
 * @throws {Error} - If an error occurs while fetching the file.
 */
const getFileFromForkedRepoByPath = async (owner, repo, branch, path) => {
  try {
    const { data } = await axios.get(`${GITHUB_APP_BASE_URL}/files`, {
      params: {
        owner: owner,
        repo: repo,
        branch: branch,
        path: path,
      },
    });

    return {
      name: data.name,
      path: data.path,
      download_url: data.download_url,
      content: data.content,
      sha: data.sha,
    };
  } catch (error) {
    if (error.status === 404) {
      console.log(`File '${path}' not found.`);
      return;
    } else {
      console.error(
        `Error fetching file from forked repo ${owner}/${branch}:`,
        error.message
      );
      throw error.status === 403 || error.status === 401
        ? new GitHubAppSuspendedOrNotInstalledError()
        : new CreateOrUpdateContentError();
    }
  }
};

/**
 * Gets all files in a given directory in a forked GitHub repository.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} branch - The branch name.
 * @param {string} directoryPath - The directory path.
 * @returns {Promise<object[]>} - An array of objects containing the file details.
 * @throws {Error} - If an error occurs while fetching the directory files.
 *
 */

const getAllFilesFromForkedRepoByPath = async (
  owner,
  repo,
  branch,
  directoryPath
) => {
  try {
    const { data } = await axios.get(`${GITHUB_APP_BASE_URL}/directory/files`, {
      params: {
        owner: owner,
        repo: repo,
        branch: branch,
        path: directoryPath,
      },
    });
    return data?.files || [];
  } catch (error) {
    console.error(
      `Error fetching directory contents from forked repo ${owner}/${branch}:`,
      error.message
    );
    throw error.status === 403 || error.status === 401
      ? new GitHubAppSuspendedOrNotInstalledError()
      : new CreateOrUpdateContentError();
  }
};

/**
 * Creates or updates a new file in a forked repository.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} branch - The branch name.
 * @param {string} path - The file path.
 * @param {string} content - The file content.
 * @returns {Promise<object>} - An object containing the created or updated file details.
 * @throws {Error} - If an error occurs while creating or updating the file.
 */
const createOrUpdateFileInForkedRepoByPath = async (
  owner,
  repo,
  branch,
  path,
  content,
  message
) => {
  try {
    const encodedContent = Buffer.from(content).toString("base64");
    await axios.post(
      `${GITHUB_APP_BASE_URL}/files`,
      { content: encodedContent, message: message },
      {
        params: {
          owner: owner,
          repo: repo,
          branch: branch,
          path: path,
        },
      }
    );
    // Log the commit message for the created or updated file in a forked repo
    console.log(message);
  } catch (error) {
    console.error(
      `Error creating or updating file in forked repo ${owner}/${branch}:`,
      error.message
    );
    throw error.status === 403 || error.status === 401
      ? new GitHubAppSuspendedOrNotInstalledError()
      : new CreateOrUpdateContentError();
  }
};

/**
 * Deletes a file from a forked GitHub repository.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} branch - The branch name.
 * @param {string} path - The file path.
 * @returns {Promise<void>} A Promise that resolves when the file is deleted.
 * @throws {Error} - If an error occurs while deleting the file.
 */
const deleteFileInForkedRepoByPath = async (
  owner,
  repo,
  branch,
  path,
  message
) => {
  try {
    await axios.delete(`${GITHUB_APP_BASE_URL}/files`, {
      data: { message: message },
      params: {
        owner: owner,
        repo: repo,
        branch: branch,
        path: path,
      },
    });
    // Log the commit message for the deleted file in forked repo
    console.log(message);
  } catch (error) {
    console.error(
      `Error deleting file in forked repo ${owner}/${branch}:`,
      error.message
    );
    throw error.status === 403 || error.status === 401
      ? new GitHubAppSuspendedOrNotInstalledError()
      : new CreateOrUpdateContentError();
  }
};

/**
 * Deletes all files in a given directory in a forked GitHub repository.
 *
 * @param {string} owner - The repository owner.
 * @param {string} repo - The repository name.
 * @param {string} branch - The branch name.
 * @param {string} directoryPath - The directory path.
 * @returns {Promise<void>} A Promise that resolves when all files are deleted.
 * @throws {Error} - If an error occurs while deleting all files.
 */
async function deleteAllFilesByPath(owner, repo, branch, directoryPath) {
  try {
    const { data } = await axios.delete(
      `${GITHUB_APP_BASE_URL}/directory/files`,
      {
        data: { message: message },
        params: {
          owner: owner,
          repo: repo,
          branch: branch,
          path: directoryPath,
        },
      }
    );
    // Log the commit message for the deleted file in forked repo
    console.log(data.commitMessage);
  } catch (error) {
    console.error("Error deleting file:", error.message);
    throw error.status === 403 || error.status === 401
      ? new GitHubAppSuspendedOrNotInstalledError()
      : new CreateOrUpdateContentError();
  }
}

export const forkedFileServices = {
  getFileFromForkedRepoByPath,
  getAllFilesFromForkedRepoByPath,
  createOrUpdateFileInForkedRepoByPath,
  deleteFileInForkedRepoByPath,
  deleteAllFilesByPath,
};
