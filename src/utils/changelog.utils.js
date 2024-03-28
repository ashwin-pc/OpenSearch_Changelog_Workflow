import { CHANGELOG_SECTION_REGEX } from "../config/constants.js";
import {
  EmptyChangelogSectionError,
  InvalidChangelogHeadingError,
} from "../errors/index.js";

/**
 * Processes a line from a changelog section, handling comment blocks and trimming non-comment lines.
 * Lines inside comments or empty are ignored (set to null).
 *
 * @param {string} line - A line from the changelog section.
 * @param {Object} state - The current parsing state, including whether inside a comment block.
 * @returns {Object} An object with the updated parsing state and the processed line (null for ignored lines, trimmed otherwise).
 */
export const processChangelogLine = (line, state) => {
  // Check for the start of a comment block
  if (line.includes("<!--"))
    return {
      state: { ...state, inComment: true },
      line: null,
    };

  // Check for the end of a comment block
  if (line.includes("-->"))
    return {
      state: { ...state, inComment: false },
      line: null,
    };

  const trimmedLine = line.trim();
  // If the line is not in a comment, contains log, and does not begin with "#" (which would indicate a section heading), consider it as part of the changelog
  if (
    !state.inComment &&
    trimmedLine.length > 0 &&
    !trimmedLine.startsWith("#")
  )
    return { state, line: trimmedLine };

  // For lines within comments or empty lines, return null
  return { state, line: null };
};

/**
 * Extracts changelog entries from a PR description.
 * @param {string} prDescription - The PR description log in markdown format.
 * @param {Function} processChangelogLine - A function that processes a line from the changelog section, handling comment blocks and trimming non-comment lines.
 * @return {string[]} An array of changelog entry strings.
 */
export const extractChangelogEntries = (
  prDescription,
  processChangelogLine,
  changesetCreationMode
) => {
  try {
    // Extract the changelog section from the PR description
    const changelogSection = extractChangelogSection(prDescription);

    // Process each line and filter out valid changelog entries
    const changelogEntries = processChangelogEntries(
      changelogSection,
      processChangelogLine,
      changesetCreationMode
    );

    for (const eachEntry of changelogEntries) {
      console.log(`${eachEntry}`);
    }
    return changelogEntries;
  } catch (error) {
    console.error("Error: " + error.message);
    throw error;
  }
};

/**
 * Extracts the changelog section from a PR description and validates it.
 *
 * @param {string} prDescription - The PR description.
 * @returns {string} - The extracted changelog section.
 * @throws {InvalidChangelogHeadingError} - If the PR description is missing or the changelog section is invalid.
 */
const extractChangelogSection = (prDescription) => {
  if (!prDescription)
    throw new InvalidChangelogHeadingError("PR description is missing");

  // Match the changelog section using the defined regex
  // Output -> Array of length 2:
  // changelogSection[0]: Full regex match including '## Changelog' and following content.
  // changelogSection[1]: Captured content after '## Changelog', excluding the heading itself.
  const changelogSection = prDescription.match(CHANGELOG_SECTION_REGEX);

  if (!changelogSection)
    throw new InvalidChangelogHeadingError(
      "Invalid or missing changelog section"
    );
  return changelogSection;
};

/**
 * Processes the changelog entries from the extracted changelog section.
 *
 * @param {string[]} changelogSection - The extracted changelog section.
 * @param {Function} processChangelogLine - Function to process each line of the changelog section.
 * @param {string} changesetCreationMode - The mode of changeset creation ("automatic" or "manual").
 * @returns {string[]} - An array of processed changelog entry strings.
 * @throws {EmptyChangelogSectionError} - If no changelog entries are found in "automatic" mode.
 */
function processChangelogEntries(
  changelogSection,
  processChangelogLine,
  changesetCreationMode
) {
  const initialAcc = { entries: [], state: { inComment: false } };
  const changelogEntries = changelogSection[0]
    .split("\n")
    .reduce((acc, line) => {
      const { entries, state } = acc;
      const processed = processChangelogLine(line, state);
      if (processed.line) entries.push(processed.line.trim());
      return { entries, state: processed.state };
    }, initialAcc).entries;

  if (changelogEntries.length === 0 && changesetCreationMode === "automatic") {
    throw new EmptyChangelogSectionError();
  }

  console.log(
    `Found ${changelogEntries.length} changelog ${
      changelogEntries.length === 1 ? "entry" : "entries"
    }:`
  );
  changelogEntries.forEach((entry) => console.log(entry));

  return changelogEntries;
}
