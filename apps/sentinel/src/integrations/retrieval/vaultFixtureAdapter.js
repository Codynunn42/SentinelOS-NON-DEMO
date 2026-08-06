const fs = require('fs');
const path = require('path');

const FIXTURE_PATH = path.join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  'fixtures',
  'retrieval',
  'nav-tasks.logs.json'
);

function retrieveNavTasksLogs({ limit }) {
  const records = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8'));

  return records
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

module.exports = {
  FIXTURE_PATH,
  retrieveNavTasksLogs
};
