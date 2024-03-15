import {
  GITHUB_APP_NAME,
  GITHUB_APP_INSTALLATION_LINK,
  AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_NAME,
  AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_DOCS,
} from "../config/constants.js";

/**
 * Represents an error when the GitHub App is suspended or not installed in the repository.
 */
export class GitHubAppSuspendedOrNotInstalledWarning{
  /**
   * Constructs the GitHubAppSuspendedOrNotInstalledError instance.
   */
  constructor(prNumber) {
    const message =
      `[${GITHUB_APP_NAME}](${GITHUB_APP_INSTALLATION_LINK}) is suspended or not installed in your forked repository. Please ensure manually adding required changeset file ${prNumber}.yml under _changelog/fragments_` +
      `\n\n` +
      `For more information, visit [${AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_NAME}](${AUTO_CHANGESET_AND_RELEASE_NOTES_TOOL_DOCS}).`;
      this.name = this.constructor.name;
      this.message = message;

    /**
     * Indicates whether this error should trigger a comment in the pull request.
     * @type {boolean}
     */
    this.shouldResultInPRComment = true;
  }
}
