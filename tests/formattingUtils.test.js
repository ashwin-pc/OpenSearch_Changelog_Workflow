import { MAX_ENTRY_LENGTH } from "../config";

import {
  prepareChangelogEntry,
  prepareChangelogEntriesMap,
  prepareChangesetEntriesContent,
  InvalidPrefixError,
  EmptyEntryDescriptionError,
  EntryTooLongError,
  ChangelogEntryMissingHyphenError,
} from "../utils";

describe("Formatting Utils Tests", () => {
  const prNumber = 123;
  const prLink = "https://github.com/TestUser/OpenSearch-Dashboards/pull/123";
  // This array of strings is returned by the extractChangelogEntries function in the workflow, provided the "Changelog" section of the PR description is valid.
  const changesetEntries = [
    "- feat: Adds one feature",
    "- fix: Fixes a bug",
    "- feat: Adds a second feature",
  ];

  describe("prepareChangelogEntriesMap", () => {
    test("should return an object with changeset entries categorized by their prefixes", () => {
      const expectedChangesetEntryMap = {
        feat: [
          "- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
          "- Adds a second feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        ],
        fix: [
          "- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        ],
      };

      const actualChangesetEntryMap = prepareChangelogEntriesMap(
        changesetEntries,
        prNumber,
        prLink,
        prepareChangelogEntry
      );

      expect(actualChangesetEntryMap).toEqual(expectedChangesetEntryMap);
    });
  });

  describe("prepareChangelogEntry", () => {
    test("when provided with a single invalid changeset entry, should return a tuple containing the formatted changeset entry and the identified prefix", () => {
      const expectedTupleOne = [
        "- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        "feat",
      ];
      const expectedTupleTwo = [
        "- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        "fix",
      ];

      const actualTupleOne = prepareChangelogEntry(
        changesetEntries[0],
        prNumber,
        prLink
      );
      const actualTupleTwo = prepareChangelogEntry(
        changesetEntries[1],
        prNumber,
        prLink
      );

      expect(actualTupleOne).toEqual(expectedTupleOne);
      expect(actualTupleTwo).toEqual(expectedTupleTwo);
    });

    test("with 'skip' prefix, should return an empty string and 'skip'", () => {
      const skipEntry = "- skip: This change should be skipped";
      const expectedTuple = ["", "skip"];
      const actualTuple = prepareChangelogEntry(skipEntry, prNumber, prLink);
      expect(actualTuple).toEqual(expectedTuple);
    });

    test("with invalid prefix, should throw InvalidPrefixError", () => {
      const invalidPrefix = "invalid";
      const invalidEntry = `- ${invalidPrefix}: This is an invalid prefix`;
      expect(() => {
        prepareChangelogEntry(invalidEntry, prNumber, prLink);
      }).toThrow(InvalidPrefixError);
    });

    test("with invalid prefix, should throw InvalidPrefixError with the correct message", () => {
      const invalidPrefix = "invalid";
      const invalidEntry = `- ${invalidPrefix}: This is an invalid prefix`;
      const expectedErrorMessage = `Invalid description prefix. Found "${invalidPrefix}". Expected "breaking", "deprecate", "feat", "fix", "infra", "doc", "chore", "refactor", "security", "skip", or "test".`;

      expect(() => {
        prepareChangelogEntry(invalidEntry, prNumber, prLink);
      }).toThrow(expectedErrorMessage);
    });

    test("with empty entry description, should throw EmptyEntryDescriptionError", () => {
      const emptyDescriptionEntry = "- feat:";
      expect(() => {
        prepareChangelogEntry(emptyDescriptionEntry, prNumber, prLink);
      }).toThrow(EmptyEntryDescriptionError);
    });

    test("with entry too long, should throw EntryTooLongError", () => {
      const longEntryText =
        " a very long entry with too much text that exceeds the maximum allowed length";
      const longEntry = `- feat:${longEntryText}`;
      expect(() => {
        prepareChangelogEntry(longEntry, prNumber, prLink);
      }).toThrow(EntryTooLongError);
    });

    test("with entry too long, should throw an error with the correct message", () => {
      const longEntryText =
        "a very long entry with too much text that exceeds the maximum allowed length";
      const longEntry = `- feat:${longEntryText}`;
      const characterOverage = longEntryText.length - MAX_ENTRY_LENGTH;
      const expectedErrorMessage = `Entry is ${
        longEntryText.length
      } characters long, which is ${characterOverage} ${
        characterOverage === 1 ? "character" : "characters"
      } longer than the maximum allowed length of ${MAX_ENTRY_LENGTH} characters.`;

      expect(() => {
        prepareChangelogEntry(longEntry, prNumber, prLink);
      }).toThrow(expectedErrorMessage);
    });

    test("entry missing hyphen, should throw ChangelogEntryMissingHyphenError", () => {
      const noHyphenEntry = "feat: Missing hyphen at start";
      expect(() => {
        prepareChangelogEntry(noHyphenEntry, prNumber, prLink);
      }).toThrow(ChangelogEntryMissingHyphenError);
    });
  });

  describe("prepareChangesetEntriesContent", () => {
    test("should return formatted content for the changeset file based on the entry map generated by prepareChangelogEntriesMap", () => {
      // Generate the entry map using prepareChangelogEntriesMap
      const entryMap = prepareChangelogEntriesMap(
        changesetEntries,
        prNumber,
        prLink,
        prepareChangelogEntry,
      );

      // Define the expected output
      const expectedContent =
        "feat:\n" +
        "- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))\n" +
        "- Adds a second feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))\n\n" +
        "fix:\n" +
        "- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))";

      // Call the function
      const actualContent = prepareChangesetEntriesContent(entryMap);

      // Assert the output
      expect(actualContent).toBe(expectedContent);
    });
  });
});
