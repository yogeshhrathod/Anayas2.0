/**
 * draftNaming - Utility to generate descriptive names for unsaved requests
 *
 * Creates human-readable names from request method and URL
 */

export function generateDraftName(method: string, url: string): string {
  if (!url || !url.trim()) {
    return 'New Request';
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract path segments
    const segments = pathname.split('/').filter(s => s);

    // Build descriptive name
    let name = method.toUpperCase();

    if (segments.length > 0) {
      // Take last two segments for better context
      const lastTwo = segments.slice(-2).join(' / ');
      name += ` ${lastTwo}`;
    } else if (urlObj.hostname) {
      // Use hostname if no path
      const host = urlObj.hostname.replace('www.', '');
      name += ` ${host}`;
    }

    return name;
  } catch (_e) {
    // If URL parsing fails, just use method and part of URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const parts = cleanUrl.split('/').filter(s => s);

    if (parts.length > 0) {
      return `${method.toUpperCase()} ${parts[0]}`;
    }

    return 'New Request';
  }
}
