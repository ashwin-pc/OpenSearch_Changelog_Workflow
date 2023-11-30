import { CHANGELOG_SECTION_REGEX } from "../config/constants.js";
import { 
    NoChangelogSectionFoundError,
    extractChangelogEntries,
} from "../utils/index.js";

describe('extractChangelogEntries', () => {
    test('should throw NoChangelogSectionFoundError if `## Changelog` header is missing', () => {
        const noChangelogPRHeader = `
        - feat: Adds new feature

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(noChangelogPRHeader)).toThrow(NoChangelogSectionFoundError);
    });
    test('should throw NoChangelogSectionFoundError if `## Changelog` header is misspelled', () => {
        const misspelledChangelogPRHeader = `
        ## Change log
        - feat: Adds new feature

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(misspelledChangelogPRHeader)).toThrow(NoChangelogSectionFoundError);
    });
    test.todo('should throw NoChangelogSectionFoundError if `## Changelog` section is empty', () => {
        const emptyChangelogPRSection = `
        ## Changelog

        ## Next Heading
        `;
        expect(() => extractChangelogEntries(emptyChangelogPRSection)).toThrow(NoChangelogSectionFoundError);
    })
})