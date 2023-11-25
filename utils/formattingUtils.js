import { PREFIXES } from "../config/constants.js";

// Function for formatting changelog entry, PR number and PR prLink
// that returns a list of [formattedChangelogEntry, prefix]
export const prepareChangesetEntry = (changelogEntry, prNumber, prLink) => {
  const prefixRegex = PREFIXES.join("|");
  
  /* Updated regex allows for the following scenarios: 
  1. Lines that do not begin with a hyphen (e.g., "feat: new feature")
  2. Lines that do not begin with a hyphen and include whitespace (e.g., "  feat: new feature")
  3. Lines that begin with non-alphanumeric characters besides hyphens (e.g., "#! feat: new feature")
  */
  const regex = new RegExp(`[^a-zA-Z0-9]*-?\\s*(${prefixRegex}):(.*)`);
  const match = changelogEntry.match(regex);
  if (match) {
    const [, prefix, text] = match;
    const formattedChangelogEntry = `- ${text} ([#${prNumber}](${prLink}))`
    return [formattedChangelogEntry, prefix];
  }
  return [changelogEntry, "unknown"];
}
