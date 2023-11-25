import fs from 'fs';
import { extractChangelogEntries } from '../utils/changelogParser.js';

try {
  const prDescriptiom = fs.readFileSync('./sample.txt', 'utf8');
  const data = extractChangelogEntries(prDescriptiom);
  console.log(data);
} catch (err) {
  console.error(err);
}
