import { CHANGESET_PATH } from '../config/constants.js';

export const getChangesetFilePath = (prNumber) => {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
}
