import fs from 'fs';
import { extractChangelogEntries } from '../utils/changelogParser.js';
import { prepareChangesetEntryMap } from '../utils/formattingUtils.js';

try {
  const prDescription = fs.readFileSync('tester/sample.txt', 'utf8');
  const data = extractChangelogEntries(prDescription);
  const data_2 = prepareChangesetEntryMap(data, '1', '');
  console.log(data_2);
} catch (err) {
  console.error(err);
}
