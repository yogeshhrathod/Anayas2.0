# Bug Report: request-send-crashes-on-invalid-input

**Status**: `fixing`  
**Bug ID**: `bug-005-request-send-crashes-on-invalid-input`  
**Severity**: `high`  
**Priority**: `P0`  
**Created**: 2025-11-19  
**Last Updated**: 2025-11-19  
**Reporter**: User  
**Assignee**: Core Team  
**Related Feature**: Request Builder / Request Send

## Summary

Sending a request with an empty header or an invalid/partial URL causes the renderer to crash instead of showing a friendly error.

## Description

- Adding an empty header row and clicking Send results in a crash.  
- Entering a non-absolute URL (e.g., "google.com") and clicking Send also crashes.  
- The crash happens because the renderer expects a `ResponseData` shape but the IPC handler returns `{ success: false, error }` on failures. The renderer stores this object as a response and the Response components access `response.status`/`response.headers`, causing runtime errors.
- Additionally, invalid headers (e.g., empty key) are passed to `fetch`, which throws. While the main handler catches this, the renderer still mishandles the returned failure object.

## Reproduction Steps

1. Open Request Builder
2. Go to Headers tab and click "Add Header" (creates key `''`, value `''`)
3. Click "Send"
4. Observe the app crash in the response panel

Alternate:
1. In the URL field enter `google.com` (no scheme)
2. Click "Send"
3. Observe the app crash in the response panel

## Expected Behavior

- Requests with invalid inputs should not crash the UI
- Empty header entries should be ignored automatically
- Invalid URLs should surface a clear error toast and not render the response panel
- On success, map the handler result to a consistent `ResponseData` structure for the UI

## Actual Behavior

- Renderer crashes because Response components access properties on a non-`ResponseData` object
- Empty headers cause `fetch` to throw due to invalid header name

## Environment

- **OS**: macOS (user reported)
- **App**: Electron 28 + Vite 5 + React 18 (current repo)
- **Node**: As per project setup

## Screenshots/Logs

[Representative stack traces]

```
TypeError: invalid header name
...
Cannot read properties of undefined (reading 'status')
    at ResponseHeadersView ...
```

## Impact

- **Users Affected**: All users of Request Builder
- **Workaround Available**: No
- **Business Impact**: Prevents core functionality; critical

## Additional Context

- IPC handler correctly returns `{ success: false, error }` on failure, but renderer is not handling it

## Root Cause Analysis

- Renderer stores the raw handler result and assumes ResponseData shape
- Empty header keys are allowed in the UI state and not sanitized before sending
- Handler does not sanitize headers defensively; `fetch` rejects invalid names

## Fix Plan

- See plan.md for implementation details (renderer mapping, header sanitization both sides, and query param handling)

## Verification Steps

- IPC tests verify that empty header keys are ignored and requests succeed
- Manual: Add empty header and Send → No crash, error handled gracefully
- Manual: Invalid URL → Error toast, no crash; Response tab not activated

## Related Issues

- N/A

## Notes

- Align renderer ResponseData mapping with backend handler result (success path only)

