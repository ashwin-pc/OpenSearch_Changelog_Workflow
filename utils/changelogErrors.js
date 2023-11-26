import { MAX_ENTRY_LENGTH } from "../config/constants.js";

/**
 * Represents an error for an invalid PR changelog description input.
 */
export class InvalidPRChangelogDescriptionError extends Error {
  /**
   * Constructs the InvalidPRChangelogDescriptionError instance.
   * @param {string} [message="Invalid PR changelog description"] - Custom error message.
   */
  constructor(message = "Invalid PR changelog description") {
    super(message);
    this.name = "InvalidPRChangelogDescriptionError";
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
export class EntryFormatError extends Error {
  /**
   * Constructs the EntryFormatError instance.
   * @param {string} [message="Entry needs to start with a '-'"] - Custom error message.
   */
  constructor(message = "Entry needs to start with a '-'") {
    super(message);
    this.name = "EntryFormatError";
  }
}
