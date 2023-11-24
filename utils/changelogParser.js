
// Function to extract changelog entries from the PR description
export const extractChangelogEntries = (prDescription) => {
  const regexPatternChangelogSection = /## Changelog\s*([\s\S]*?)(?:\n##|$)/;
  // Regex explanation:
  // /## Changelog\s*   // Matches the '## Changelog' heading in markdown. '\s*' matches any whitespace (spaces, tabs) following 'Changelog'.
  // ([\s\S]*?)         // Non-greedy match for any character set. Captures the content after '## Changelog' heading.
  // (?:\n##|$)/;       // Non-capturing group. Matches a newline followed by '##' (next markdown heading) or the end of the text ('$').

  const changelogSection = prDescription.match(regexPatternChangelogSection);
  // Output -> Array of length 2:
  // changelogSection[0]: Full regex match including '## Changelog' and following content.
  // changelogSection[1]: Captured content after '## Changelog', excluding the heading itself.

  if (changelogSection) {
    let state = { inComment: false };
    const entries = changelogSection[0]
      .replace(/## Changelog\s*/, "")
      .split("\n")
      .filter((line) => isEntryLine(line, state))
      .map((entry) => entry.trim());
    return entries;
  }
  return [];
}


// Function to check if a line is a changelog entry (Internal use only)
const isEntryLine = (line, state) => {
  // Check to exclude lines part of a comment block (i.e. lines between <!-- and -->)
  if (line.includes("<!--")) state.inComment = true;
  if (line.includes("-->")) {
      state.inComment = false;
      return false;
  }
  return !state.inComment && line.trim().startsWith("-");
}
