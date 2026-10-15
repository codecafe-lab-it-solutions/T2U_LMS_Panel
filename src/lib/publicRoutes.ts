// Pathname router for the public marketing site.
// Maps clean URLs like /courses/seo-fundamentals, /about, /terms to PublicSite internal pages.

export type PublicRoute =
  | { page: 'home' }
  | { page: 'explore' }
  | { page: 'course'; slug: string }
  | { page: 'bundles' }
  | { page: 'bundle'; slug: string }
  | { page: 'about' }
  | { page: 'products' }
  | { page: 'terms' }
  | { page: 'privacy' }
  | { page: 'refund' }
  | { page: 'partner' }
  | { page: 'instructors-hub' }
  | { page: 'success-stories' }
  | { page: 'login' }
  | { page: '404' };

export const NAVIGATE_EVENT = 't2u:navigate';

// Set when a logged-out visitor clicks Enroll on a bundle page; the student portal reads it after
// sign-in and opens that bundle's payment dialog.
export const PENDING_BUNDLE_KEY = 't2u-pending-bundle';

import { SHOW_PRODUCTS } from '../constants/featureFlags';

export function parsePublicPath(pathname: string): PublicRoute {
  const cleanPath = pathname.replace(/\/+$/, '');
  if (!cleanPath || cleanPath === '') return { page: 'home' };

  const parts = cleanPath.split('/').filter(Boolean).map(decodeURIComponent);
  if (parts.length === 0) return { page: 'home' };

  const root = parts[0].toLowerCase();

  if (root === 'login') return { page: 'login' };
  if (root === 'about') return { page: 'about' };
  if (root === 'products') return SHOW_PRODUCTS ? { page: 'products' } : { page: 'explore' };
  if (root === 'terms') return { page: 'terms' };
  if (root === 'privacy') return { page: 'privacy' };
  if (root === 'refund') return { page: 'refund' };
  if (root === 'partner') return { page: 'partner' };
  if (root === 'instructors-hub') return { page: 'instructors-hub' };
  if (root === 'success-stories') return { page: 'success-stories' };

  if (root === 'courses') {
    return parts[1] ? { page: 'course', slug: parts[1] } : { page: 'explore' };
  }
  if (root === 'course-bundles' || root === 'course-packages') {
    return parts[1] ? { page: 'bundle', slug: parts[1] } : { page: 'bundles' };
  }

  // Any unmatched route returns 404
  return { page: '404' };
}

export const coursePath = (slug: string) => `/courses/${encodeURIComponent(slug)}`;
export const bundlePath = (slug: string) => `/course-bundles/${encodeURIComponent(slug)}`;

// Pushes a URL and tells PublicSite to re-read it.
export function navigatePublic(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}
