/**
 * Represents an error during the retrieval of content from a GitHub repository.
 */
export class GetContentError extends Error {
  /**
   * Constructs the GetContentError instance.
   * @param {string} [message="Error retrieving content from repository"] - Custom error message.
   */
  constructor(message = "Something went wrong. Error retrieving content from repository. Please try again.") {
    super(message);
    this.name = this.constructor.name;
    /**
     * Indicates whether this error should trigger a comment in the pull request.
     * @type {boolean}
     */
    this.shouldResultInPRComment = true;
  }
}

/**
 * Represents an error during the creation of content in a GitHub repository.
 */
export class CreateOrUpdateContentError extends Error {
  /**
   * Constructs the CreateContentError instance.
   * @param {string} [message="Error creating or updating content in repository"] - Custom error message.
   */
  constructor(message = "Something went wrong. Error creating or updating content in repository. Please try again.") {
    super(message);
    this.name = this.constructor.name;
    /**
     * Indicates whether this error should trigger a comment in the pull request.
     * @type {boolean}
     */
    this.shouldResultInPRComment = true;
  }
}

/**
 * Represents an error during the deletion of content in a GitHub repository.
 */
export class DeleteContentError extends Error {
  /**
   * Constructs the DeleteContentError instance.
   * @param {string} [message="Error deleting content in repository"] - Custom error message.
   */
  constructor(message = "Something went wrong. Error deleting content in repository. Please try again.") {
    super(message);
    this.name = this.constructor.name;
    /**
     * Indicates whether this error should trigger a comment in the pull request.
     * @type {boolean}
     */
    this.shouldResultInPRComment = true;
  }
}
