/**
 * Represents an error when the GitHub App is suspended or not installed in the forked repository.
 */
export class GitHubAppSuspendedOrNotInstalledError extends Error {
  /**
   * Constructs the GitHubAppSuspendedOrNotInstalledError instance.
   * @param {string} [message="GitHub App is suspended or not installed in the forked repository."] - Custom error message.
   */
  constructor(
    message = "GitHub App is suspended or not installed in the forked repository."
  ) {
    super(message);
    this.name = this.constructor.name;
    /**
     * Indicates whether this error should trigger a comment in the pull request.
     * @type {boolean}
     */
    this.shouldResultInPRComment = true;
  }
}
