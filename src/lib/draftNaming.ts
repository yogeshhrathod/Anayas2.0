/**
 * draftNaming - Utility to generate descriptive names for unsaved requests
 *
 * Creates human-readable names from request method and URL
 */

export function generateDraftName(_method: string, url: string): string {
  if (!url || !url.trim()) {
    return 'New Request';
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Extract path segments
    const segments = pathname.split('/').filter(s => s);

    // Build descriptive name
    let name = '';

    if (segments.length > 0) {
      // Take last two segments for better context
      name = segments.slice(-2).join(' / ');
    } else if (urlObj.hostname) {
      // Use hostname if no path
      name = urlObj.hostname.replace('www.', '');
    }

    return name || 'New Request';
  } catch (e) {
    // If URL parsing fails, just use part of URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const parts = cleanUrl.split('/').filter(s => s);

    if (parts.length > 0) {
      return parts[0];
    }

    return 'New Request';
  }
}

