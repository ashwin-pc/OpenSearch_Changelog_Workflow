
import { CHANGELOG_HEADING, CHANGELOG_SECTION_REGEX } from "../config/constants.js";


// **************************************************************
// I) EXPORTED FUNCTIONS
// **************************************************************
/**
 * Extracts changelog entries from a PR description.
 * @param {string} prDescription - The PR description text in markdown format.
 * @return {string[]} An array of changelog entry strings.
 */
export const extractChangelogEntries = (prDescription) => {
  // Validate input to ensure it's a non-empty string
  if (typeof prDescription !== 'string' || !prDescription.trim()) {
    throw new Error('Invalid PR description');
  }

  // Match the changelog section using the defined regex
  const changelogSection = prDescription.match(CHANGELOG_SECTION_REGEX);
  // Output -> Array of length 2:
  // changelogSection[0]: Full regex match including '## Changelog' and following content.
  // changelogSection[1]: Captured content after '## Changelog', excluding the heading itself.

  // Return an empty array if no changelog section is found
  if (!changelogSection) return [];

  // Initialize state for tracking comment blocks
  let state = { inComment: false };

  // Process each line and filter out valid changelog entries
  return changelogSection[0]
    .replace(`${CHANGELOG_HEADING}\\s*`, "")
    .split("\n")
    .map((line) => processLine(line, state))
    .filter(entry => entry !== null)
    .map(entry => entry.trim());
};

// **************************************************************
// II) INTERNAL FUNCTIONS
// **************************************************************
/**
 * Processes a line of text to determine if it's a valid changelog entry.
 * Handles comment blocks and trims lines that are part of the changelog.
 * @param {string} line - A line of text.
 * @param {Object} state - An object maintaining the state of comment parsing.
 * @return {Object} An object containing the updated state and the processed line.
 */
const processLine = (line, state) => {
  // Check for the start of a comment block
  if (line.includes("<!--")) return { ...state, inComment: true, line: null };

  // Check for the end of a comment block
  if (line.includes("-->")) return { ...state, inComment: false, line: null };

  // If the line is not in a comment and contains text, consider it as part of the changelog
  if (!state.inComment && line.trim().length > 0) return { ...state, line };

  // For lines within comments or empty lines, return null
  return { ...state, line: null };
};
