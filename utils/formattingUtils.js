import {
  ENTRY_FORMATTING_PATTERN_REGEX,
  PREFIXES,
  MAX_ENTRY_LENGTH,
} from "../config/constants.js";
import {
  InvalidPrefixError,
  EntryTooLongError,
  InvalidEntryFormatError,
} from "./customErrors.js";

/**
 * Prepares a formatted changelog entry using the provided changelog entry, PR number, and PR link.
 * It formats the changelog entry by adding a prefix and linking the PR number.
 *
 * @param {string} changelogEntry - The changelog entry text.
 * @param {string} prNumber - The PR number associated with the changelog entry.
 * @param {string} prLink - The URL link to the PR.
 * @returns {[string, string]} A tuple containing the formatted changelog entry and the identified prefix. If no prefix is identified, "unknown" is used.
 */
export const prepareChangesetEntry = (changelogEntry, prNumber, prLink) => {
  const match = changelogEntry.match(ENTRY_FORMATTING_PATTERN_REGEX);
  if (match) {
    const [, prefix, text] = match;
    if (prefix === "skip") return ["", "skip"];
    if (!PREFIXES.includes(prefix.toLowerCase()))
      throw new InvalidPrefixError(prefix);
    if (text.length > MAX_ENTRY_LENGTH) throw new EntryTooLongError();
    const formattedChangelogEntry = `- ${text.trim()} ([#${prNumber}](${prLink}))`;
    return [formattedChangelogEntry, prefix];
  } else {
    throw new InvalidEntryFormatError();
  }
};

/**
 * Prepares a map of changeset entries categorized by their prefixes.
 * @param {string[]} entries - Array of changelog entry strings.
 * @param {number} prNumber - The pull request number associated with the entries.
 * @param {string} prLink - The link to the pull request.
 * @returns {Object} An object where keys are prefixes and values are arrays of associated entries.
 */
export const prepareChangesetEntryMap = (entries, prNumber, prLink) => {
  return entries
    .map((entry) => prepareChangesetEntry(entry, prNumber, prLink))
    .reduce((acc, [entry, prefix]) => {
      // Initialize the array for the prefix if it doesn't exist
      if (!acc[prefix]) {
        acc[prefix] = [];
      }
      // Add the entry to the array for the prefix
      acc[prefix].push(entry);
      return acc;
    }, {});
};

/**
 * Prepares the content for the changeset file.
 * @param {Object} entryMap - An object where keys are prefixes and values are arrays of associated entries.
 * @returns {string} The content for the changeset file.
 */
export const prepareChangesetEntriesContent = (entryMap) => {
  return Object.entries(entryMap)
    .map(([prefix, entries]) => {
      return `${prefix}:\n${entries.join("\n")}`;
    })
    .join("\n\n");
};
