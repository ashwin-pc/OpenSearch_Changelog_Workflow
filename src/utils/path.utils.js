import { CHANGESET_PATH } from '../config/constants.index.js';

export const getChangesetFilePath = (prNumber) => {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
}
