import {
  PullRequestDataExtractionError,
  ChangesetFileAccessError,
  UpdatePRLabelError,
  InvalidChangelogHeadingError,
  EntryTooLongError,
  InvalidPrefixError,
  CategoryWithSkipOptionError,
  ChangelogEntryMissingHyphenError,
  EmptyEntryDescriptionError,
  EmptyChangelogSectionError,
} from "../utils";

import { MAX_ENTRY_LENGTH } from "../config/constants.js";

describe("Custom Errors Tests", () => {
  test("PullRequestDataExtractionError defaults", () => {
    const error = new PullRequestDataExtractionError();
    expect(error.message).toBe("Error extracting data from Pull Request");
    expect(error.name).toBe("PullRequestDataExtractionError");
  });

  test("ChangesetFileAccessError with custom message and statusCode", () => {
    const error = new ChangesetFileAccessError("Custom message", 404);
    expect(error.message).toBe("Custom message");
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe("ChangesetFileAccessError");
  });

  test("UpdatePRLabelError default message", () => {
    const error = new UpdatePRLabelError();
    expect(error.message).toBe(
      "There was an error updating the label of the pull request. Please ensure the PR is accessible and the label format is correct."
    );
    expect(error.name).toBe("UpdatePRLabelError");
  });

  test("InvalidChangelogHeadingError default message", () => {
    const error = new InvalidChangelogHeadingError();
    expect(error.message).toBe(
      "The '## Changelog' heading in your PR description is either missing or malformed. Please make sure that your PR description includes a '## Changelog' heading with with proper spelling, capitalization, spacing, and Markdown syntax."
    );
    expect(error.name).toBe("InvalidChangelogHeadingError");
  });

  test("EmptyChangelogSectionError default message", () => {
    const error = new EmptyChangelogSectionError();
    expect(error.message).toBe(
      "The Changelog section in your PR description is empty. Please add a valid changelog entry or entries. If you did add a changelog entry, check to make sure that it was not accidentally included inside the comment block in the Changelog section."
    );
    expect(error.name).toBe("EmptyChangelogSectionError");
  });

  test("EntryTooLongError default message", () => {
    const entryLength = MAX_ENTRY_LENGTH + 1;
    const characterOverage = entryLength - MAX_ENTRY_LENGTH;
    const error = new EntryTooLongError(entryLength);
    expect(error.message).toBe(
      `Entry is ${entryLength} characters long, which is ${characterOverage} ${
        characterOverage === 1 ? "character" : "characters"
      } longer than the maximum allowed length of ${MAX_ENTRY_LENGTH} characters. Please revise your entry to be within the maximum length.`
    );
    expect(error.name).toBe("EntryTooLongError");
  });

  test("InvalidPrefixError with foundPrefix", () => {
    const foundPrefix = "invalid";
    const error = new InvalidPrefixError(foundPrefix);
    expect(error.message).toBe(
      `Invalid description prefix. Found "${foundPrefix}". Expected "breaking", "deprecate", "feat", "fix", "infra", "doc", "chore", "refactor", "security", "skip", or "test".`
    );
    expect(error.name).toBe("InvalidPrefixError");
  });

  test("CategoryWithSkipOptionError default message", () => {
    const error = new CategoryWithSkipOptionError();
    expect(error.message).toBe(
      "If your Changelog section includes the 'skip' option, it cannot also contain other changelog entries. Please revise your Changelog section."
    );
    expect(error.name).toBe("CategoryWithSkipOptionError");
  });

  test("ChangelogEntryMissingHyphenError default message", () => {
    const error = new ChangelogEntryMissingHyphenError();
    expect(error.message).toBe(
      "Changelog entries must begin with a hyphen (-)."
    );
    expect(error.name).toBe("ChangelogEntryMissingHyphenError");
  });

  test("EmptyEntryDescriptionError with foundPrefix", () => {
    const foundPrefix = "test";
    const error = new EmptyEntryDescriptionError(foundPrefix);
    expect(error.message).toBe(
      `Description for "${foundPrefix}" entry cannot be empty.`
    );
    expect(error.name).toBe("EmptyDescriptionError");
  });
});
