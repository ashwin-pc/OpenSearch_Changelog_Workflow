// ****************************************************
// I) ENTRY PREFIXES
// ****************************************************

// Define the prefixes that can be used in the changelog entries
export const PREFIXES = [
  "breaking",
  "deprecate",
  "feat",
  "fix",
  "infra",
  "doc",
  "chore",
  "refactor",
  "security",
  "test",
];

// ****************************************************
// II) REGXES PATTERNS
// ****************************************************

// i) Define regex pattern for changelog entries
export const CHANGELOG_HEADING = "## Changelog";
export const CHANGELOG_SECTION_REGEX = new RegExp(
  `${CHANGELOG_HEADING}\\s*([\\s\\S]*?)(?:\\n##|$)`
);
/* Regex explanation:
 /## Changelog\s*   // Matches the '## Changelog' heading in markdown. '\s*' matches any whitespace (spaces, tabs) following 'Changelog'.
 ([\s\S]*?)         // Non-greedy match for any character set. Captures the content after '## Changelog' heading.
 (?:\n##|$)/;       // Non-capturing group. Matches a newline followed by '##' (next markdown heading) or the end of the text ('$').
*/

// ii) Define regex pattern for specific formatting of changelog entries
export const ENTRY_FORMATTING_PATTERN_REGEX = new RegExp(
  `[^a-zA-Z0-9]*-?\\s*([a-zA-Z0-9]+):(.*)`
);
/* Regex allows for the following scenarios:
  1. Lines that do not begin with a hyphen (e.g., "feat: new feature")
  2. Lines that do not begin with a hyphen and include whitespace (e.g., "  feat: new feature")
  3. Lines that begin with non-alphanumeric characters besides hyphens (e.g., "#! feat: new feature")
*/

// ****************************************************
// III) OTHER CONSTANTS
// ****************************************************

// Define the maximum length of a changelog entry
export const MAX_ENTRY_LENGTH = 50;
