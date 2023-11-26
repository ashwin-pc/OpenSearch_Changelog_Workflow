import { ENTRY_FORMATTING_PATTERN_REGEX, PREFIXES } from "../config/constants.js";
import { InvalidPrefixError } from "./changelogErrors.js";

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
    if (!PREFIXES.includes(prefix.toLowerCase())) throw new InvalidPrefixError(prefix);
    const formattedChangelogEntry = `- ${text.trim()} ([#${prNumber}](${prLink}))`;
    return [formattedChangelogEntry, prefix];
  }
  return [changelogEntry, "unknown"];
}