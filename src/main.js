import { authServices } from "./services/index.js";

import {
  extractPullRequestData,
  isGitHubAppNotInstalledOrSuspended,
  isSkipEntry,
  handleSkipEntry,
  handleChangelogEntriesParsing,
  handleManualChangesetCreation,
  handleAutomaticChangesetCreation,
} from "./utils/index.js";

// ****************************************************************************
// I) MAIN
// ****************************************************************************

const run = async () => {
  // Step 1 - Define oc
  const octokit = authServices.getOctokitClient();
  const changesetCreationMode = (await isGitHubAppNotInstalledOrSuspended(
    octokit
  ))
    ? "manual"
    : "automatic";
  let prData, changesetEntriesMap;

  try {
    prData = extractPullRequestData();
    changesetEntriesMap = await handleChangelogEntriesParsing(
      octokit,
      prData,
      changesetCreationMode
    );
    if (isSkipEntry(changesetEntriesMap)) {
      await handleSkipEntry(octokit, prData, changesetCreationMode);
      return;
    }
    if (changesetCreationMode === "manual")
      await handleManualChangesetCreation(octokit, prData, changesetEntriesMap);
    else {
      await handleAutomaticChangesetCreation(
        octokit,
        prData,
        changesetEntriesMap
      );
    }
    console.log("Changelog parsing process complete.");
  } catch (error) {
    console.error("Error details:");
    throw error;
  }
};

run();
