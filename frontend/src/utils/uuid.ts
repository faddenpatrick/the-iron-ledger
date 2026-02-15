/**
 * Generate a UUID v4
 * Uses crypto.randomUUID() if available (HTTPS/secure context),
 * otherwise falls back to a polyfill
 */
export const generateUUID = (): string => {
  // Try native crypto.randomUUID() first (only works in secure contexts)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for non-secure contexts (HTTP)
  // RFC4122 version 4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
