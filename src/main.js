import {
  authServices,
} from "./services/index.js";

import {
  extractPullRequestData,
  isGitHubAppNotInstalledOrSuspended,
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
  const changesetCreationMode = isGitHubAppNotInstalledOrSuspended(octokit)
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
    throw error;
  } finally {
    console.log("Changelog parsing process complete.");
  }
};

run();
