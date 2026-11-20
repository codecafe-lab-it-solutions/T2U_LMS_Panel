import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOW_PRODUCTS } from '../../src/constants/featureFlags';
import { parsePublicPath } from '../../src/lib/publicRoutes';
import { INSTRUCTOR_MANAGEMENT_TABS } from '../../src/constants/instructorGating';

test('SHOW_PRODUCTS: is enabled by default', () => {
  assert.equal(SHOW_PRODUCTS, true);
});

test('parsePublicPath: /products routes to products page when SHOW_PRODUCTS is enabled', () => {
  const route = parsePublicPath('/products');
  assert.deepEqual(route, { page: 'products' });
});

test('INSTRUCTOR_MANAGEMENT_TABS: does not lock instructor-products for creators pending approval', () => {
  assert.equal(INSTRUCTOR_MANAGEMENT_TABS.has('instructor-products' as any), false);
});
