import fs from 'fs';
import { extractChangelogEntries } from '../utils/changelogParser.js';
import { prepareChangesetEntryMap } from '../utils/formattingUtils.js';
import { CategoryWithSkipOptionError } from '../utils/customErrors.js';
try {
  const prDescription = fs.readFileSync('tester/sample.txt', 'utf8');
  const data = extractChangelogEntries(prDescription);
  const entryMap = prepareChangesetEntryMap(data, '1', '');
  console.log(entryMap);

  if (entryMap["skip"]) {
    if (Object.keys(entryMap).length > 1) {
      throw new CategoryWithSkipOptionError();
    } else {
      console.log("No changeset file created or updated.");
    }
  }

} catch (err) {
  console.error(err);
}
