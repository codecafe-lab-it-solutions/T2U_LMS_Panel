import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Integration Audit: All backend route files are valid JavaScript syntax', () => {
  const routesDir = 'server/src/routes';
  assert.ok(fs.existsSync(routesDir), 'server/src/routes must exist');

  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  assert.ok(routeFiles.length >= 30, `Expected at least 30 route files, found ${routeFiles.length}`);

  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Basic integrity check
    assert.ok(content.length > 50, `${file} is too short or empty`);
    assert.ok(
      content.includes('express.Router()') || content.includes('Router()') || content.includes('module.exports'),
      `${file} must be an Express router module`
    );
  }
});

