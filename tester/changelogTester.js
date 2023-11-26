import fs from 'fs';
import { extractChangelogEntries } from '../utils/changelogParser.js';

try {
  const prDescription = fs.readFileSync('tester/sample.txt', 'utf8');
  const data = extractChangelogEntries(prDescription);
  console.log(data);
} catch (err) {
  console.error(err);
}
