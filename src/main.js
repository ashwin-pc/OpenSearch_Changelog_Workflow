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
    // If changeset creation mode is manual, handle manual changeset creation
    if (changesetCreationMode === "automatic")
      await handleManualChangesetCreation(octokit, prData, changesetEntriesMap);
    // Else, use automated approach to create changeset file
    else {
      await handleAutomaticChangesetCreation(
        octokit,
        prData,
        changesetEntriesMap
      );
    }
  } catch (error) {
    console.error();(`Error: ${error.message}`);
  } finally {
    console.log("Check process complete.");
  }
};

run();
