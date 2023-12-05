import {
  prepareChangesetEntryMap,
  prepareChangesetEntry,
  prepareChangesetEntriesContent,
} from "../utils";

describe("Formatting Utils Tests", () => {
  let prNumber, prLink, changesetEntries;

  beforeAll(() => {
    prNumber = 123;
    prLink = "https://github.com/TestUser/OpenSearch-Dashboards/pull/123";
    // This array of strings is returned by the extractChangelogEntries function in the workflow, provided the "Changelog" section of the PR description is valid.
    changesetEntries = [
      "- feat: Adds one feature",
      "- fix: Fixes a bug",
      "- feat: Adds a second feature",
    ];
});

  describe("prepareChangesetEntryMap", () => {
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

      const actualChangesetEntryMap = prepareChangesetEntryMap(
        changesetEntries,
        prNumber,
        prLink
      );

      expect(actualChangesetEntryMap).toEqual(expectedChangesetEntryMap);
    });
  });

  describe("prepareChangesetEntry", () => {
    test("when provided with a single valid changeset entry, should return a tuple containing the formatted changeset entry and the identified prefix", () => {

      const expectedTupleOne = [
        "- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        "feat",
      ];
      const expectedTupleTwo = [
        "- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))",
        "fix",
      ];

      const actualTupleOne = prepareChangesetEntry(
        changesetEntries[0],
        prNumber,
        prLink
      );
      const actualTupleTwo = prepareChangesetEntry(
        changesetEntries[1],
        prNumber,
        prLink
      );

      expect(actualTupleOne).toEqual(expectedTupleOne);
      expect(actualTupleTwo).toEqual(expectedTupleTwo);
    });
  });
});
