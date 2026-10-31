import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfilePhoto, PROFILE_PHOTO_ACCEPT, PROFILE_PHOTO_MAX_BYTES } from '../../src/lib/profilePhoto';

test('validateProfilePhoto: accepts valid jpeg image', () => {
  const file = {
    name: 'avatar.jpg',
    size: 500 * 1024, // 500 KB
    type: 'image/jpeg',
  } as File;

  const err = validateProfilePhoto(file);
  assert.equal(err, null);
});

test('validateProfilePhoto: accepts valid png image', () => {
  const file = {
    name: 'avatar.png',
    size: 1 * 1024 * 1024, // 1 MB
    type: 'image/png',
  } as File;

  const err = validateProfilePhoto(file);
  assert.equal(err, null);
});

test('validateProfilePhoto: rejects oversized image (> 2MB)', () => {
  const file = {
    name: 'huge.jpg',
    size: PROFILE_PHOTO_MAX_BYTES + 1024,
    type: 'image/jpeg',
  } as File;

  const err = validateProfilePhoto(file);
  assert.ok(err?.includes('too large') || err?.includes('MB'));
});

test('validateProfilePhoto: rejects unsupported file format', () => {
  const file = {
    name: 'doc.pdf',
    size: 100 * 1024,
    type: 'application/pdf',
  } as File;

  const err = validateProfilePhoto(file);
  assert.ok(err?.includes('JPG, PNG, WebP'));
});

