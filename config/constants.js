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
  "test",
];

// Define the regex pattern for changelog entries
export const CHANGELOG_HEADING = "## Changelog";
export const CHANGELOG_SECTION_REGEX = new RegExp(
  `${CHANGELOG_HEADING}\\s*([\\s\\S]*?)(?:\\n##|$)`
);
// Regex explanation:
// /## Changelog\s*   // Matches the '## Changelog' heading in markdown. '\s*' matches any whitespace (spaces, tabs) following 'Changelog'.
// ([\s\S]*?)         // Non-greedy match for any character set. Captures the content after '## Changelog' heading.
// (?:\n##|$)/;       // Non-capturing group. Matches a newline followed by '##' (next markdown heading) or the end of the text ('$').
