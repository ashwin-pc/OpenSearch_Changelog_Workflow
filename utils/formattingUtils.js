import { PREFIXES } from "../config/constants.js";

// Function for formatting changelog entry, PR number and PR prLink
// that returns a list of [formattedChangelogEntry, prefix]
export const prepareChangesetEntry = (changelogEntry, prNumber, prLink) => {
  const prefixeRegex = PREFIXES.join("|");
  const regex = new RegExp(`-\\s(${prefixeRegex}):(.*)`);
  const match = changelogEntry.match(regex);
  if (match) {
    const [, prefix, text] = match;
    const formattedChangelogEntry = `- ${text} ([#${prNumber}](${prLink}))`
    return [formattedChangelogEntry, prefix];
  }
  return [changelogEntry, "unknown"];
}
