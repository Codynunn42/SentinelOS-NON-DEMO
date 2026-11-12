'use strict';
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

describe('Discovery Lens and C4 advisory integration', function () {
  this.timeout(15000);
  it('passes isolated C4 and bridge regressions', function () {
    const root = path.resolve(__dirname, '../../../../../..');
    const result = spawnSync(process.execPath, ['--test',
      'tests/forethoughtAdvisory/advisory.cases.cjs',
      'tests/forethoughtAdvisory/bridge.cases.cjs'], { cwd: root, encoding: 'utf8', timeout: 12000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /(?:# |ℹ )?pass 35/);
  });
});
