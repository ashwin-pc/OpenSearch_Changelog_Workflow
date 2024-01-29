import {
  GetContentError,
  CreateOrUpdateContentError,
  DeleteContentError,
  GitHubAppSuspendedOrNotInstalledError,
  UnauthorizedRequestToPullRequestBridgeServiceError,
} from "../errors/index.js";

export const handleChangelogPRBridgeResponseError = (
  error,
  owner,
  branch,
  crudOperation
) => {
  const operationVerb =
    crudOperation === "READ"
      ? "fetching"
      : crudOperation === "DELETE"
      ? "deleting"
      : "creating or updating";
  const errorMessage = error.response?.data?.error?.message || error.message;
  const statusCode = error.response?.status || error.status;

  console.log(
    `Error ${operationVerb} file from forked repo ${owner}/${branch}:`,
    errorMessage
  );
  switch (statusCode) {
    case 404:
      console.error(`File '${path}' not found.`);
      return;
    case 401:
      return new UnauthorizedRequestToPullRequestBridgeServiceError();
    case 403:
      return new GitHubAppSuspendedOrNotInstalledError();
    default:
      if (crudOperation === "READ") {
        return new GetContentError();
      } else if (crudOperation === "DELETE") {
        return new DeleteContentError();
      } else {
        return new CreateOrUpdateContentError();
      }
  }
};
