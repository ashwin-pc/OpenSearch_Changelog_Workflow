import { MAX_ENTRY_LENGTH } from "../config/constants.js";


/**
 * Represents an error during the extraction of data from a GitHub Pull Request.
 */
export class PullRequestDataExtractionError extends Error {
  /**
   * Constructs the PullRequestDataExtractionError instance.
   * @param {string} [message="Error extracting data from Pull Request"] - Custom error message.
   */
  constructor(message = "Error extracting data from Pull Request") {
    super(message);
    this.name = "PullRequestDataExtractionError";
  }
}


/**
 * Represents an error for a missing changelog section in a PR description.
 */
export class NoChangelogSectionFoundError extends Error {
  /**
   * Constructs the NoChangelogSectionFoundError instance.
   * @param {string} [message="No changelog section found in PR description"] - Custom error message.
   */
  constructor(message = "No changelog section found in PR description") {
    super(message);
    this.name = "NoChangelogSectionFoundError";
  }
}

/**
 * Represents an error when a changelog entry exceeds the maximum allowed length.
 */
export class EntryTooLongError extends Error {
  /**
   * Constructs the EntryTooLongError instance.
   * @param {string} [message=`Entry is longer than ${MAX_ENTRY_LENGTH} characters`] - Custom error message.
   */
  constructor(message = `Entry is longer than ${MAX_ENTRY_LENGTH} characters`) {
    super(message);
    this.name = "EntryTooLongError";
  }
}

/**
 * Represents an error when a specified category does not exist.
 */
export class InvalidPrefixError extends Error {
  /**
   * Constructs the InvalidPrefixError instance.
   * @param {string} [foundPrefix] - The prefix provided by the user.
   */
  constructor(foundPrefix) {
    const message = `Invalid description prefix. Found "${foundPrefix}". Expected "breaking", "deprecate", "feat", "fix", "infra", "doc", "chore", "refactor", or "test".`
    super(message);
    this.name = "InvalidPrefixError";
  }
}

/**
 * Represents an error when a category is incorrectly included with a 'skip' option.
 */
export class CategoryWithSkipOptionError extends Error {
  /**
   * Constructs the CategoryWithSkipError instance.
   * @param {string} [message="Cannot include a category with 'skip' option"] - Custom error message.
   */
  constructor(message = "Cannot include a category with 'skip' option") {
    super(message);
    this.name = "CategoryWithSkipOptionError";
  }
}

/**
 * Represents an error when a changelog entry does not start with a '-' character.
 */
export class InvalidEntryFormatError extends Error {
  /**
   * Constructs the InvalidEntryFormatError instance.
   * @param {string} [message="Entry needs to start with a '-'"] - Custom error message.
   */
  constructor(message = "Entry needs to start with a '-'") {
    super(message);
    this.name = "InvalidEntryFormatError";
  }
}
