# Testing Guide: Performance Optimization - Lazy Loading

## Overview

This guide helps verify that lazy loading and performance tracking are working correctly.

## Pre-Testing Setup

1. **Open DevTools**
   - Open Chrome DevTools (Cmd+Option+I on Mac, Ctrl+Shift+I on Windows/Linux)
   - Go to Console tab
   - Go to Performance tab (for memory profiling)

2. **Clear Console**
   - Clear console to see fresh performance logs

## Test Cases

### Test 1: Verify Lazy Loading Works

**Steps:**
1. Start the app: `npm run electron:dev`
2. Open DevTools Console
3. Navigate to each page:
   - Click "Home" in navigation
   - Click "Collections" in navigation
   - Click "Environments" in navigation
   - Click "History" in navigation
   - Click "Settings" in navigation
   - Click "Logs" in navigation

**Expected Results:**
- ✅ Brief loading spinner appears when navigating (PageLoadingSpinner)
- ✅ Page loads smoothly
- ✅ No errors in console
- ✅ All pages work correctly

**Performance Metrics to Check:**
- Console should show: `[Performance] Feature loaded: Page-{name}`
- Load time should be <200ms
- Memory delta should be reasonable

### Test 2: Verify Performance Tracking

**Steps:**
1. Open DevTools Console
2. Navigate between pages
3. Check console logs

**Expected Console Output:**
```
[Performance] Feature loaded: Page-collections | Load time: 45.23ms | Memory delta: 12.34MB | Memory: 45.67MB → 58.01MB
```

**What to Verify:**
- ✅ Performance logs appear for each page navigation
- ✅ Load time is logged (should be <200ms)
- ✅ Memory delta is logged (before/after)
- ✅ No errors in tracking

### Test 3: Verify Memory Reduction

**Steps:**
1. Open DevTools Performance tab
2. Take a memory snapshot before starting app
3. Start the app: `npm run electron:dev`
4. Take a memory snapshot after app loads (before navigating)
5. Navigate to a page
6. Take another snapshot

**Expected Results:**
- ✅ Initial memory <50MB (before any page navigation)
- ✅ Memory increases when navigating to pages
- ✅ Memory is released when navigating away (React handles this)

**How to Check:**
- In Chrome DevTools: Performance tab → Memory → Take heap snapshot
- Compare snapshots before/after navigation

### Test 4: Verify Startup Time

**Steps:**
1. Close the app completely
2. Start the app: `npm run electron:dev`
3. Measure time from command execution to app ready

**Expected Results:**
- ✅ Startup time <1s (cold start)
- ✅ App is responsive immediately
- ✅ No long loading delays

### Test 5: Verify Loading States

**Steps:**
1. Navigate between pages quickly
2. Watch for loading spinner

**Expected Results:**
- ✅ Loading spinner appears briefly when page loads
- ✅ Spinner is accessible (check with screen reader if available)
- ✅ Smooth transition from spinner to page content

### Test 6: Verify No Functionality Broken

**Steps:**
1. Navigate to each page
2. Test core functionality on each page:
   - **Homepage**: Send a request
   - **Collections**: Create/edit a collection
   - **Environments**: Create/edit an environment
   - **History**: View history, filter
   - **Settings**: Change settings
   - **Logs**: View logs

**Expected Results:**
- ✅ All functionality works as before
- ✅ No errors in console
- ✅ No broken features

## Performance Budget Verification

### Memory Budget (PRIMARY)
- **Target**: <50MB initial (before any page navigation)
- **Per Page**: <30MB when active
- **Total Under Load**: <500MB

**How to Measure:**
```javascript
// In DevTools Console
performance.memory.usedJSHeapSize / 1024 / 1024 // MB
```

### Load Time Budget (PRIMARY)
- **Target**: <200ms per page
- **Startup**: <1s

**How to Measure:**
- Check console logs: `[Performance] Feature loaded: Page-{name} | Load time: {ms}ms`
- Should see load times <200ms

## Troubleshooting

### Issue: Pages not loading
**Symptoms**: Blank screen, errors in console
**Solution**: 
- Check console for import errors
- Verify page exports are correct
- Check network tab for failed chunk loads

### Issue: Performance metrics not showing
**Symptoms**: No console logs
**Solution**:
- Check if `trackFeatureLoad` is imported correctly
- Verify console is not filtered
- Check for JavaScript errors

### Issue: Loading spinner not showing
**Symptoms**: No spinner, direct page render
**Solution**:
- Check if Suspense is wrapping pages
- Verify PageLoadingSpinner component exists
- Check if pages load too fast (spinner might flash)

### Issue: Memory not reduced
**Symptoms**: Initial memory still high
**Solution**:
- Verify pages are actually lazy-loaded (check Network tab for chunk loads)
- Check if other components are loading upfront
- Verify code splitting is working (check build output)

## Success Criteria

All tests should pass:
- ✅ All pages lazy-loaded
- ✅ Performance tracking working
- ✅ Initial memory <50MB
- ✅ Page load time <200ms
- ✅ No functionality broken
- ✅ Loading states work correctly

## Next Steps After Testing

If all tests pass:
1. Mark Phase 3 tasks as completed
2. Update feature status to `completed`
3. Document actual performance metrics
4. Proceed to Phase 4 (Heavy Components Audit) if desired

If issues found:
1. Document issues
2. Fix issues
3. Re-test
4. Update tasks status

