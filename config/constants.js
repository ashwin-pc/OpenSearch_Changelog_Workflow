/**
 * ****************************************************
 * I) ENTRY PREFIXES
 * ****************************************************
 */

/**
 * Define the prefixes that can be used in the changelog entries.
 * @type {string[]}
 */
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
  "skip",
];

/**
 * ****************************************************
 * II) REGEX PATTERNS
 * ****************************************************
 */

/**
 * Define regex pattern for the changelog heading.
 * @type {string}
 */
export const CHANGELOG_HEADING = "## Changelog";

/**
 * Regex pattern to capture the content of the changelog section.
 * @type {RegExp}
 */
export const CHANGELOG_SECTION_REGEX = new RegExp(
  `${CHANGELOG_HEADING}\\s*([\\s\\S]*?)(?:\\n##|$)`
);
// Explanation:
// - Matches the '## Changelog' heading in markdown.
// - '\s*' matches any whitespace following 'Changelog'.
// - '([\s\S]*?)' is a non-greedy match capturing the content.
// - '(?:\n##|$)' matches a newline followed by '##' or the end of the text.

/**
 * Regex pattern for specific formatting of changelog entries.
 * @type {RegExp}
 */
export const ENTRY_FORMATTING_PATTERN_REGEX = new RegExp(
  `-\\s*([a-zA-Z0-9]+):?(.*)?`
);
// Explanation:
// - '-\\s*' matches a hyphen followed by any number of whitespace characters.
// - '([a-zA-Z0-9]+)' is the first capturing group, matching one or more alphanumeric characters, representing the keyword.
// - ':?' optionally matches a colon. The '?' makes the colon optional.
// - '(.*)?' is the second capturing group, matching any characters following the optional colon. The '?' makes this entire group optional.

/**
 * ****************************************************
 * III) OTHER CONSTANTS
 * ****************************************************
 */

/**
 * Define the maximum length of a changelog entry.
 * @type {number}
 */
export const MAX_ENTRY_LENGTH = 50;
