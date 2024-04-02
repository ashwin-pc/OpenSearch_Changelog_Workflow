import { CHANGESET_PATH } from "../config/constants.js";
import { isValidChangelogEntry } from "./validators.utils.js";
import { capitalize } from "./formatting.utils.js";

/**
 * Validates and formats a set of changelog entries associated with a pull request (PR).
 *
 * - If the prefix is "skip", it immediately returns an object with an empty string associated with "skip".
 * - For valid entries, it capitalizes the log description, formats it with the PR number and link, and stores it in a map with the prefix as the key.
 * - In case of errors (invalid prefix, empty description, entry too long, format mismatch), the function throws custom exceptions.
 *
 * @param {string[]} changelogEntries - An array of changelog entry strings to be validated and formatted.
 * @param {string} prNumber - The number of the PR associated with these changelog entries.
 * @param {string} prLink - The URL link to the PR on GitHub.
 * @returns {Object} - An object mapping each valid prefix to its formatted changelog entry.
 *                     If the prefix is "skip", the object will map an empty string to "skip".
 * @throws {Error} - An error related to changelog entry validation.
 */
export const getChangesetEntriesMap = (
  changelogEntries,
  prNumber,
  prLink,
  changesetCreationMode
) => {
  const changesetEntryMap = {};
  if (changelogEntries.length === 0  && changesetCreationMode === "manual") {
    return changesetEntryMap;
  }
  const totalEntries = changelogEntries.length;
  for (const changelogEntry of changelogEntries) {
    let prefix, trimmedLog;
    try {
      ({ prefix, trimmedLog } = isValidChangelogEntry(
        changelogEntry,
        totalEntries,
        changesetCreationMode
      ));
    } catch (error) {
      console.error("Error validating changelog entries");
      throw error;
    }

    const formattedLog = `- ${capitalize(
      trimmedLog
    )} ([#${prNumber}](${prLink}))`;

    if (!changesetEntryMap[prefix]) {
      changesetEntryMap[prefix] = [];
    }
    changesetEntryMap[prefix].push(formattedLog);
  }
  return changesetEntryMap;
};

/**
 * Prepares the content for the changeset file.
 * @param {Object} changesetEntriesMap -  An object where keys are entry prefixes and values are arrays of associated formatted entry descriptions.
 * @returns {string} The content for the changeset file.
 */
export const getChangesetFileContent = (changesetEntriesMap) => {
  return Object.entries(changesetEntriesMap)
    .map(([prefix, log]) => {
      return `${prefix}:\n${log.join("\n")}`;
    })
    .join("\n\n");
};

export const getChangesetFilePath = (prNumber) => {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
};
