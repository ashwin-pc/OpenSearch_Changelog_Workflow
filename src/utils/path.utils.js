import { CHANGESET_PATH } from '../constants.index.js';

export const getChangesetFilePath = (prNumber) => {
  return `${CHANGESET_PATH}/${prNumber}.yml`;
}
