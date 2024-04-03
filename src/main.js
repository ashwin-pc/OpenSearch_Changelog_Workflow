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
  console.log(await isGitHubAppNotInstalledOrSuspended(octokit));
  const changesetCreationMode = (await isGitHubAppNotInstalledOrSuspended(
    octokit
  ))
    ? "automatic"
    : "manual";
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
  } catch (error) {
    console.error(`${error.message}`);
    // throw error;
  } finally {
    console.log("Changelog parsing process complete.");
  }
};

run();
