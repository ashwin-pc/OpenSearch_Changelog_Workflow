import {
    EmptyChangelogSectionError,
    InvalidChangelogHeadingError,
    extractChangelogEntries,
} from "../utils";

describe('extractChangelogEntries', () => {

    test('should throw InvalidChangelogHeadingError if `## Changelog` header is missing', () => {
        const noChangelogPRHeader = `
        - feat: Adds new feature

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(noChangelogPRHeader)).toThrow(InvalidChangelogHeadingError);
    });

    test('should throw InvalidChangelogHeadingError if `## Changelog` header is malformed', () => {
        const malformedChangelogPRHeader = `
        ## Change log
        - feat: Adds new feature

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(malformedChangelogPRHeader)).toThrow(InvalidChangelogHeadingError);
    });

    test('should throw EmptyChangelogSectionError if `## Changelog` section is missing changelog entries', () => {
        const emptyChangelogSectionFollowedByHeading = `
        ## Changelog

        ## Next Heading
        `;
        const emptyChangelogSectionFollowedByNoHeading = `
        ## Changelog
        `;
        expect(() => extractChangelogEntries(emptyChangelogSectionFollowedByHeading)).toThrow(EmptyChangelogSectionError);
        expect(() => extractChangelogEntries(emptyChangelogSectionFollowedByNoHeading)).toThrow(EmptyChangelogSectionError);
    });

    test('should convert a valid changelog section into an array of changelog entries', () => {
        const validChangelogSection = `
        ## Changelog

        - feat: Adds new feature
        - fix: Fixes bug

        ## Next Heading
        `;
        const expectedChangelogEntryArray = ['- feat: Adds new feature', '- fix: Fixes bug'];
        const actualChangelogEntryArray = extractChangelogEntries(validChangelogSection);
        expect(actualChangelogEntryArray).toEqual(expectedChangelogEntryArray);
    })

    test('should ignore text within a comment block in the changelog section', () => {
        const validChangelogSectionWithComment = `
        ## Changelog
        <!-- This is a comment
        feat: Adds new feature
        -->

        - fix: Fixes bug

        ## Next Heading
        `;
        const expectedChangelogEntryArray = ['- fix: Fixes bug'];
        const actualChangelogEntryArray = extractChangelogEntries(validChangelogSectionWithComment);
        expect(actualChangelogEntryArray).toEqual(expectedChangelogEntryArray);
    });

})
