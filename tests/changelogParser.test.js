import { CHANGELOG_SECTION_REGEX } from "../config/constants.js";
import { 
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
    test.todo('should throw InvalidChangelogHeadingError if `## Changelog` section is empty', () => {
        const emptyChangelogPRSection = `
        ## Changelog

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(emptyChangelogPRSection)).toThrow(InvalidChangelogHeadingError);
    })
})