import {
  PullRequestDataExtractionError,
  ChangesetFileAccessError,
  NoChangelogSectionFoundError,
  EntryTooLongError,
  InvalidPrefixError,
  CategoryWithSkipOptionError,
  InvalidEntryFormatError,
  EmptyEntryDescriptionError
} from '../utils'; // Update with the actual path

describe('Custom Errors', () => {
  test('PullRequestDataExtractionError defaults', () => {
    const error = new PullRequestDataExtractionError();
    expect(error.message).toBe('Error extracting data from Pull Request');
    expect(error.name).toBe('PullRequestDataExtractionError');
  });

  test('ChangesetFileAccessError with custom message and statusCode', () => {
    const error = new ChangesetFileAccessError('Custom message', 404);
    expect(error.message).toBe('Custom message');
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('ChangesetFileAccessError');
  });

  test('NoChangelogSectionFoundError default message', () => {
    const error = new NoChangelogSectionFoundError();
    expect(error.message).toBe('No changelog section found in PR description');
    expect(error.name).toBe('NoChangelogSectionFoundError');
  });

  test('EntryTooLongError default message', () => {
    const error = new EntryTooLongError();
    expect(error.message).toBe(`Entry is longer than ${MAX_ENTRY_LENGTH} characters`);
    expect(error.name).toBe('EntryTooLongError');
  });

  test('InvalidPrefixError with foundPrefix', () => {
    const foundPrefix = 'invalid';
    const error = new InvalidPrefixError(foundPrefix);
    expect(error.message).toBe(`Invalid description prefix. Found "${foundPrefix}". Expected "breaking", "deprecate", "feat", "fix", "infra", "doc", "chore", "refactor", "skip", or "test".`);
    expect(error.name).toBe('InvalidPrefixError');
  });

  test('CategoryWithSkipOptionError default message', () => {
    const error = new CategoryWithSkipOptionError();
    expect(error.message).toBe("Cannot include a category entry with 'skip' option");
    expect(error.name).toBe('CategoryWithSkipOptionError');
  });

  test('InvalidEntryFormatError default message', () => {
    const error = new InvalidEntryFormatError();
    expect(error.message).toBe("Entry needs to start with a '-'");
    expect(error.name).toBe('InvalidEntryFormatError');
  });

  test('EmptyEntryDescriptionError with foundPrefix', () => {
    const foundPrefix = 'test';
    const error = new EmptyEntryDescriptionError(foundPrefix);
    expect(error.message).toBe(`Description for "${foundPrefix}" entry cannot be empty.`);
    expect(error.name).toBe('EmptyDescriptionError');
  });
});
