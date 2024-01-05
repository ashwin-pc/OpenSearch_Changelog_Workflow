import {
  GITHUB_APP_NAME,
  GITHUB_APP_INSTALLATION_LINK,
  AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_NAME,
  AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_DOCS,
} from "../config/constants.js";

/**
 * Represents an error when the GitHub App is suspended or not installed in the repository.
 */
export class GitHubAppSuspendedOrNotInstalledError extends Error {
  /**
   * Constructs the GitHubAppSuspendedOrNotInstalledError instance.
   */
  constructor() {
    const message =
      `[${GITHUB_APP_NAME}](${GITHUB_APP_INSTALLATION_LINK}) is suspended or not installed in your forked repository. ` +
      `Please ensure the app is installed and has the necessary permissions.` +
      `\n\n` +
      `For more information, visit [${AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_NAME}](${AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_DOCS}).`;
    super(message);
    this.name = this.constructor.name;

    /**
     * Indicates whether this error should trigger a comment in the pull request.
     * @type {boolean}
     */
    this.shouldResultInPRComment = true;
  }
}
