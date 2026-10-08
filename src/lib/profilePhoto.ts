// Single source of truth for profile-picture upload limits, so the hint shown next to the
// uploader and the check that runs before uploading can never disagree.
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_PHOTO_MAX_LABEL = '5 MB';
export const PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const PROFILE_PHOTO_HINT = `JPG, PNG, WebP or GIF · max ${PROFILE_PHOTO_MAX_LABEL}`;
export const PROFILE_PHOTO_ACCEPT = PROFILE_PHOTO_TYPES.join(',');

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Returns a user-facing error message, or null when the file is acceptable. */
export function validateProfilePhoto(file: File): string | null {
  if (!PROFILE_PHOTO_TYPES.includes(file.type)) {
    return `"${file.name}" isn't a supported image. Please choose a JPG, PNG, WebP or GIF file.`;
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return `This photo is ${formatSize(file.size)}, which is over the ${PROFILE_PHOTO_MAX_LABEL} limit. Please choose a photo of ${PROFILE_PHOTO_MAX_LABEL} or smaller.`;
  }
  return null;
}
