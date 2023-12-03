import { 
    prepareChangesetEntryMap, 
    prepareChangesetEntry, 
    prepareChangesetEntriesContent 
} from "../utils";

describe('prepareChangesetEntryMap', () => {
    
    test('should return an object with changeset entries categorized by their prefixes', () => {

        // This array of strings is returned by the extractChangelogEntries function in the workflow, provided the "Changelog" section of the PR description is valid.
        const changesetEntries = [ '- feat: Adds one feature', '- fix: Fixes a bug', '- feat: Adds a second feature'];
        const prNumber = 123;
        const prLink = "https://github.com/TestUser/OpenSearch-Dashboards/pull/123";

        const expectedChangesetEntryMap = {
            feat: [
                '- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))',
                '- Adds a second feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))'
              ],
            fix: [
            '- Fixes a bug ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))'
            ]
        };

        const actualChangesetEntryMap = prepareChangesetEntryMap(changesetEntries, prNumber, prLink);

        expect(actualChangesetEntryMap).toEqual(expectedChangesetEntryMap);
    });

    test()
});

describe('prepareChangesetEntry', () => {

    test('when provided with a valid changelog entry, should return a tuple containing the formatted changelog entry and the identified prefix', () => {

        const changelogEntry = "- feat: Adds one feature";
        const prNumber = 123;
        const prLink = "https://github.com/TestUser/OpenSearch-Dashboards/pull/123";

        const expectedTuple = ['- Adds one feature ([#123](https://github.com/TestUser/OpenSearch-Dashboards/pull/123))', 'feat'];

        const actualTuple = prepareChangesetEntry(changelogEntry, prNumber, prLink);

        expect(actualTuple).toEqual(expectedTuple);

    });

});