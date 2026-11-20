// Feature Flags configuration
// Controls temporary visibility of product pages while underlying schemas and pages remain intact.
// Enabled by default so products are visible on the website and in student/creator dashboards.
const env: Record<string, string | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
  (typeof process !== 'undefined' && process.env) ||
  {};

export const SHOW_PRODUCTS =
  env.VITE_SHOW_PRODUCTS !== 'false' &&
  env.NEXT_PUBLIC_SHOW_PRODUCTS !== 'false';
