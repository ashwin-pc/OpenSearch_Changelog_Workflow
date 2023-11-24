const fs = require('fs');

try {
  const data = fs.readFileSync('./data.txt', 'utf8');
  const regexPatternChangelogSection = /## Changelog\s*([\s\S]*?)(?:\n##|$)/;
  const changelogSection = data.match(regexPatternChangelogSection);
  // console.log(changelogSection);
  console.log(changelogSection[0]);
  // console.log(changelogSection[1]);

} catch (err) {
  console.error(err);
}
