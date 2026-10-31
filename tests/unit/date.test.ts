import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatDateTime } from '../../src/utils/date';

test('formatDate: correctly formats YYYY-MM-DD date strings without timezone shifts', () => {
  assert.equal(formatDate('2026-06-21'), '21/06/2026');
  assert.equal(formatDate('2026-01-05'), '05/01/2026');
  assert.equal(formatDate('2026-12-31'), '31/12/2026');
});

test('formatDate: correctly formats Date objects', () => {
  const d = new Date(2026, 9, 31); // October 31, 2026
  assert.equal(formatDate(d), '31/10/2026');

  const d2 = new Date(2026, 0, 1); // January 1, 2026
  assert.equal(formatDate(d2), '01/01/2026');
});

test('formatDate: correctly formats ISO 8601 strings', () => {
  assert.match(formatDate('2026-10-31T10:00:00.000Z'), /^\d{2}\/\d{2}\/2026$/);
});

test('formatDate: handles null, undefined, and empty string fallbacks', () => {
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate(undefined), '—');
  assert.equal(formatDate(''), '—');
  assert.equal(formatDate(null, 'Open'), 'Open');
  assert.equal(formatDate(undefined, 'N/A'), 'N/A');
});

test('formatDate: preserves custom string if non-date text', () => {
  assert.equal(formatDate('Recorded Session'), 'Recorded Session');
  assert.equal(formatDate('Upcoming'), 'Upcoming');
});

test('formatDateTime: formats date with time', () => {
  const res = formatDateTime('2026-10-31T14:30:00');
  assert.ok(res.includes('31/10/2026'), 'Date part must be 31/10/2026');
  assert.match(res, /31\/10\/2026, \d{2}:\d{2}\s?(am|pm|AM|PM)?/i);
});

test('formatDateTime: handles empty and fallback values', () => {
  assert.equal(formatDateTime(null), '—');
  assert.equal(formatDateTime(undefined), '—');
  assert.equal(formatDateTime(null, 'No time'), 'No time');
});

