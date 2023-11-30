import { 
    EmptyChangelogSectionError,
    InvalidChangelogHeadingError,
    extractChangelogEntries,
} from "../utils/index.js";

describe('extractChangelogEntries', () => {
    test('should throw InvalidChangelogHeadingError if `## Changelog` header is missing', () => {
        const noChangelogPRHeader = `
        - feat: Adds new feature

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(noChangelogPRHeader)).toThrow(InvalidChangelogHeadingError);
    });
    test('should throw InvalidChangelogHeadingError if `## Changelog` header is malformed', () => {
        const misspelledChangelogPRHeader = `
        ## Change log
        - feat: Adds new feature

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(misspelledChangelogPRHeader)).toThrow(InvalidChangelogHeadingError);
    });
    test('should throw EmptyChangelogSectionError if `## Changelog` section is empty', () => {
        const emptyChangelogSectionFollowedByHeading = `
        ## Changelog

        ## Next Heading
        `;
        const emptyChangelogSectionFollowedByNoHeading = `
        ## Changelog
        `;
        expect(() => extractChangelogEntries(emptyChangelogSectionFollowedByHeading)).toThrow(EmptyChangelogSectionError);
        expect(() => extractChangelogEntries(emptyChangelogSectionFollowedByNoHeading)).toThrow(EmptyChangelogSectionError);
    })
})