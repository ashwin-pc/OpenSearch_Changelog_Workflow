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
 * Represents an error during file access operations related to changesets in a GitHub repository.
 */
export class ChangesetFileAccessError extends Error {
  /**
   * Constructs the ChangesetFileAccessError instance.
   * @param {string} message - Custom error message.
   * @param {number} statusCode - HTTP status code associated with the error.
   */
  constructor(message, statusCode) {
    super(message);
    this.name = "ChangesetFileAccessError";
    this.statusCode = statusCode;
  }
}

/**
 * Represents an error for a missing or malformed changelog heading in a PR description.
 */
export class InvalidChangelogHeadingError extends Error {
  /**
   * Constructs the InvalidChangelogHeadingError instance.
   * @param {string} [message="The '## Changelog' heading in your PR description is either missing or malformed. Please make sure that your PR description includes a '## Changelog' heading with with proper spelling, capitalization, spacing, and Markdown syntax."] - Custom error message.
   */
  constructor(message = "The '## Changelog' heading in your PR description is either missing or malformed. Please make sure that your PR description includes a '## Changelog' heading with with proper spelling, capitalization, spacing, and Markdown syntax.") {
    super(message);
    this.name = "InvalidChangelogHeadingError";
  }
}

/**
 * Represents an error for an empty changelog section in a PR description.
 */
export class EmptyChangelogSectionError extends Error {
  /**
   * Constructs the EmptyChangelogSectionError instance.
   * @param {string} [message="The Changelog section in your PR description is empty. Please add a valid changelog entry or entries."] - Custom error message.
   */
  constructor(message = "The Changelog section in your PR description is empty. Please add a valid changelog entry or entries.") {
    super(message);
    this.name = "EmptyChangelogSectionError"
  }
}

/**
 * Represents an error when a changelog entry exceeds the maximum allowed length.
 */
export class EntryTooLongError extends Error {
  /**
   * Constructs the EntryTooLongError instance.
   * @param {string} [entryLength] - The length of the entry provided by the user.
   */
  constructor(entryLength) {
    const characterOverage = entryLength - MAX_ENTRY_LENGTH;
    const message = `Entry is ${entryLength} characters long, which is ${characterOverage} ${characterOverage === 1 ? 'character' : 'characters'} longer than the maximum allowed length of ${MAX_ENTRY_LENGTH} characters.`
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
    const message = `Invalid description prefix. Found "${foundPrefix}". Expected "breaking", "deprecate", "feat", "fix", "infra", "doc", "chore", "refactor", "security", "skip", or "test".`
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
   * @param {string} [message="Cannot include a category entry with 'skip' option"] - Custom error message.
   */
  constructor(message = "Cannot include a category entry with 'skip' option") {
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

/**
 * Represents an error when a description is empty.
 */
export class EmptyEntryDescriptionError extends Error {
  /**
   * Constructs the EmptyDescriptionError instance.
   * @param {string} [foundPrefix] - The prefix provided by the user.
   */
  constructor(foundPrefix) {
    const message = `Description for "${foundPrefix}" entry cannot be empty.`;
    super(message);
    this.name = "EmptyDescriptionError";
  }
}
