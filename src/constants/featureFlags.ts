// Feature Flags configuration
// Controls temporary visibility of product pages while underlying schemas and pages remain intact.
export const SHOW_PRODUCTS =
  import.meta.env.VITE_SHOW_PRODUCTS === 'true' ||
  import.meta.env.NEXT_PUBLIC_SHOW_PRODUCTS === 'true';
