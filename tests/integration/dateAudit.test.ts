import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function getFiles(dir: string, ext: string[]): string[] {
  let files: string[] = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files = files.concat(getFiles(fullPath, ext));
    } else if (ext.some(e => fullPath.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

test('Integration Audit: Zero unformatted toLocaleDateString() calls in src', () => {
  const srcFiles = getFiles('src', ['.ts', '.tsx']);
  const violations: string[] = [];

  for (const file of srcFiles) {
    const content = fs.readFileSync(file, 'utf8');
    // Match toLocaleDateString() called with no parameters (which causes browser US default MM/DD/YYYY)
    const matches = content.match(/toLocaleDateString\(\s*\)/g);
    if (matches) {
      violations.push(`${file}: found ${matches.length} unparameterized toLocaleDateString() call(s)`);
    }
  }

  assert.equal(violations.length, 0, `Violations found:\n${violations.join('\n')}`);
});

test('Integration Audit: date.ts exists and exports formatDate and formatDateTime', () => {
  assert.ok(fs.existsSync('src/utils/date.ts'), 'src/utils/date.ts must exist');
  const content = fs.readFileSync('src/utils/date.ts', 'utf8');
  assert.ok(content.includes('export function formatDate'), 'must export formatDate');
  assert.ok(content.includes('export function formatDateTime'), 'must export formatDateTime');
});

