import test from 'node:test';
import assert from 'node:assert/strict';
import { api, getMediaUrl, getStoredToken } from '../../src/services/api';

test('API Client: all primary service modules exist', () => {
  assert.ok(api.auth, 'auth service module exists');
  assert.ok(api.users, 'users service module exists');
  assert.ok(api.courses, 'courses service module exists');
  assert.ok(api.courseBundles, 'courseBundles service module exists');
  assert.ok(api.batches, 'batches service module exists');
  assert.ok(api.liveClasses, 'liveClasses service module exists');
  assert.ok(api.quizzes, 'quizzes service module exists');
  assert.ok(api.assignments, 'assignments service module exists');
  assert.ok(api.mlm, 'mlm service module exists');
  assert.ok(api.kyc, 'kyc service module exists');
  assert.ok(api.invoices, 'invoices service module exists');
  assert.ok(api.withdrawals, 'withdrawals service module exists');
  assert.ok(api.reports, 'reports service module exists');
  assert.ok(api.cms, 'cms service module exists');
  assert.ok(api.employees, 'employees service module exists');
  assert.ok(api.employeePayroll, 'employeePayroll service module exists');
  assert.ok(api.employeeRoles, 'employeeRoles service module exists');
});

test('API Client: getMediaUrl correctly formats paths and preserves external URLs', () => {
  assert.equal(getMediaUrl(null), '');
  assert.equal(getMediaUrl(undefined), '');
  assert.equal(getMediaUrl(''), '');
  assert.equal(getMediaUrl('https://example.com/photo.jpg'), 'https://example.com/photo.jpg');
  assert.equal(getMediaUrl('http://example.com/photo.jpg'), 'http://example.com/photo.jpg');

  const localRelative = getMediaUrl('uploads/avatar.jpg');
  assert.ok(localRelative.includes('/api/upload/avatar.jpg'), 'Legacy uploads should be remapped to /api/upload');
});
