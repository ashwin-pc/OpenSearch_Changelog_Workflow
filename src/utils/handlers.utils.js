import {
  GetContentError,
  CreateOrUpdateContentError,
  DeleteContentError,
  GitHubAppSuspendedOrNotInstalledError,
  UnauthorizedRequestToPRBridgeServiceError

} from "../errors/index.js";

export const handleChangelogPRBridgeResponseErrors = (
  error,
  crudOperation,
  path
) => {
  switch (error.status) {
    case 404:
      console.error(`File/Directory '${path}' not found.`);
      return;
    case 401:
      throw new UnauthorizedRequestToPRBridgeServiceError();
    case 403:
      throw new GitHubAppSuspendedOrNotInstalledError();
    default:
      if (crudOperation === "READ") {
        throw new GetContentError();
      }
      else if (crudOperation === "CREATE_OR_UPDATE") {
        throw new CreateOrUpdateContentError();
      }
      else if (crudOperation === "DELETE"){
        throw new DeleteContentError();
      }
      else {
        throw error;
      }
  }
};
