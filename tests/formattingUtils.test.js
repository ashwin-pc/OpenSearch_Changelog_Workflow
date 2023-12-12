import { PREFIXES, MAX_ENTRY_LENGTH } from "../config";

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
  const prLink = "http://example.com/pr/123";

  describe("prepareChangelogEntry", () => {
    const descriptionText = "test description";
    test.each(PREFIXES)(
      `correctly prepare formatted changelog entry for "%s" prefix`,
      (prefix) => {
        const entry = `- ${prefix}: ${descriptionText}`;
        const [formattedEntry, returnedPrefix] = prepareChangelogEntry(
          entry,
          prNumber,
          prLink
        );

        const expectedOutput =
          prefix === "skip"
            ? ""
            : `- ${
                descriptionText.charAt(0).toUpperCase() +
                descriptionText.slice(1)
              } ([#${prNumber}](${prLink}))`;

        expect(formattedEntry).toEqual(expectedOutput);
        expect(returnedPrefix).toEqual(prefix);
        // Check capitalization of the first letter of formattedEntry
        if (prefix !== "skip") {
          expect(formattedEntry.charAt(2)).toEqual(
            descriptionText.charAt(0).toUpperCase()
          );
        }
      }
    );

    test("with invalid prefix, should throw InvalidPrefixError", () => {
      const invalidPrefix = "invalid";
      const invalidEntry = `- ${invalidPrefix}: This is an invalid prefix`;
      const expectedErrorMessage = `Invalid description prefix. Found "${invalidPrefix}". Expected "breaking", "deprecate", "feat", "fix", "infra", "doc", "chore", "refactor", "security", "skip", or "test".`;

      expect(() => {
        prepareChangelogEntry(invalidEntry, prNumber, prLink);
      }).toThrow(InvalidPrefixError);
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
      const characterOverage = longEntryText.length - MAX_ENTRY_LENGTH;
      const expectedErrorMessage = `Entry is ${
        longEntryText.length
      } characters long, which is ${characterOverage} ${
        characterOverage === 1 ? "character" : "characters"
      } longer than the maximum allowed length of ${MAX_ENTRY_LENGTH} characters.`;

      expect(() => {
        prepareChangelogEntry(longEntry, prNumber, prLink);
      }).toThrow(EntryTooLongError);
      expect(() => {
        prepareChangelogEntry(longEntry, prNumber, prLink);
      }).toThrow(expectedErrorMessage);
    });

    test("with entry missing hyphen, should throw ChangelogEntryMissingHyphenError", () => {
      const noHyphenEntry = "feat: Missing hyphen at start";
      expect(() => {
        prepareChangelogEntry(noHyphenEntry, prNumber, prLink);
      }).toThrow(ChangelogEntryMissingHyphenError);
    });
  });

  describe("prepareChangelogEntriesMap", () => {
    const mockPrepareChangelogEntry = jest.fn();

    beforeEach(() => {
      mockPrepareChangelogEntry.mockClear();
    });

    test("correctly maps entries array to their prefixes with expected output format", () => {
      const entries = [
        "- feat: Adds one feature",
        "- fix: Fixes a bug",
        "- chore: Some chore",
      ];
      mockPrepareChangelogEntry
        .mockReturnValueOnce(["Formatted feat entry", "feat"])
        .mockReturnValueOnce(["Formatted fix entry", "fix"])
        .mockReturnValueOnce(["Formatted chore entry", "chore"]);

      const result = prepareChangelogEntriesMap(
        entries,
        prNumber,
        prLink,
        mockPrepareChangelogEntry
      );
      expect(result).toEqual({
        feat: ["Formatted feat entry"],
        fix: ["Formatted fix entry"],
        chore: ["Formatted chore entry"],
      });
      expect(mockPrepareChangelogEntry).toHaveBeenCalledTimes(entries.length);
      entries.forEach((entry) => {
        expect(mockPrepareChangelogEntry).toHaveBeenCalledWith(
          entry,
          prNumber,
          prLink
        );
      });
    });

    [
      {
        testName: "invalid entry at the beginning",
        entries: [
          "invalid entry of any type",
          "- feat: Valid feature",
          "- fix: Fixes a bug",
        ],
        expectedCalls: 1,
      },
      {
        testName: "invalid entry in between",
        entries: [
          "- feat: Valid feature",
          "invalid entry of any type",
          "- fix: Fixes a bug",
        ],
        expectedCalls: 2,
      },
      {
        testName: "invalid entry at the end",
        entries: [
          "- feat: Valid feature",
          "- fix: Fixes a bug",
          "invalid entry of any type",
        ],
        expectedCalls: 3,
      },
    ].forEach(({ testName, entries, expectedCalls }) => {
      test(`throws an error when encounters an ${testName} of entries array`, () => {
        for (let index in entries) {
          if (index < expectedCalls - 1) {
            mockPrepareChangelogEntry.mockReturnValueOnce([
              `Formatted entry ${index}`,
              `prefix ${index}`,
            ]);
          } else {
            mockPrepareChangelogEntry.mockImplementationOnce(() => {
              throw new Error("Invalid entry");
            });
            break;
          }
        }

        expect(() => {
          prepareChangelogEntriesMap(
            entries,
            prNumber,
            prLink,
            mockPrepareChangelogEntry
          );
        }).toThrow("Invalid entry");

        entries.slice(0, expectedCalls).forEach((entry, index) => {
          expect(mockPrepareChangelogEntry).toHaveBeenCalledWith(
            entry,
            prNumber,
            prLink
          );
        });

        expect(mockPrepareChangelogEntry).toHaveBeenCalledTimes(expectedCalls);
      });
    });
  });

  describe("prepareChangesetEntriesContent", () => {
    test("correctly formats changeset entries content", () => {
      const changesetEntryMap = {
        feat: [
          "- Adds one feature ([#123](http://example.com/pr/123))",
          "- Adds a second feature ([#123](http://example.com/pr/123))",
        ],
        fix: [
          "- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        ],
      };
      const expectedContent =
        `feat:\n` +
        `- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))\n` +
        `- Adds a second feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))\n\n` +
        `fix:\n` +
        `- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))`;

      const result = prepareChangesetEntriesContent(changesetEntryMap);
      expect(result).toBe(expectedContent);
    });

    test("handles an empty changeset entry map", () => {
      const changesetEntryMap = {};
      const result = prepareChangesetEntriesContent(changesetEntryMap);
      expect(result).toBe("");
    });
  });
});
