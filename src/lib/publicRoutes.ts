// Tiny pathname router for the public marketing site. The portal (logged-in app) uses hash
// routing and is untouched; this only maps clean URLs like /courses/seo-fundamentals to the
// PublicSite's internal pages so course and bundle pages are shareable/bookmarkable.

export type PublicRoute =
  | { page: 'explore' }
  | { page: 'course'; slug: string }
  | { page: 'bundles' }
  | { page: 'bundle'; slug: string };

export const NAVIGATE_EVENT = 't2u:navigate';

// Set when a logged-out visitor clicks Enroll on a bundle page; the student portal reads it after
// sign-in and opens that bundle's payment dialog.
export const PENDING_BUNDLE_KEY = 't2u-pending-bundle';

export function parsePublicPath(pathname: string): PublicRoute | null {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'courses') return parts[1] ? { page: 'course', slug: parts[1] } : { page: 'explore' };
  if (parts[0] === 'course-bundles' || parts[0] === 'course-packages') {
    return parts[1] ? { page: 'bundle', slug: parts[1] } : { page: 'bundles' };
  }
  return null;
}

export const coursePath = (slug: string) => `/courses/${encodeURIComponent(slug)}`;
export const bundlePath = (slug: string) => `/course-bundles/${encodeURIComponent(slug)}`;

// Pushes a URL and tells PublicSite to re-read it. Lets any nested card link to a page without
// prop-drilling a navigate callback through every landing section.
export function navigatePublic(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
}
