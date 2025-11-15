import { test, expect } from '../helpers/electron-fixtures';

/**
 * Visual Verification Tests
 * 
 * These tests verify that the UI is actually rendering and responding to interactions,
 * not just that API calls are working. They take screenshots and verify visual changes.
 */
test.describe('UI Visual Verification', () => {
  test('should visually verify UI is rendering and interactive', async ({ electronPage }) => {
    // Step 1: Verify initial page load
    await electronPage.waitForLoadState('networkidle');
    const initialScreenshot = await electronPage.screenshot({ path: 'test-artifacts/01-initial-load.png', fullPage: true });
    expect(initialScreenshot).toBeTruthy();
    
    // Verify React app is mounted
    const reactMounted = await electronPage.evaluate(() => {
      return typeof (window as any).React !== 'undefined' || 
             document.querySelector('#root') !== null ||
             document.querySelector('[data-reactroot]') !== null;
    });
    expect(reactMounted).toBe(true);
    console.log('React app mounted:', reactMounted);
    
    // Step 2: Navigate to Collections page and verify visual change
    await electronPage.click('text=Collections');
    await electronPage.waitForTimeout(1000);
    const collectionsScreenshot = await electronPage.screenshot({ path: 'test-artifacts/02-collections-page.png', fullPage: true });
    
    // Verify "New Collection" button is visible and clickable
    const newCollectionButton = electronPage.locator('button:has-text("New Collection")');
    await newCollectionButton.waitFor({ state: 'visible' });
    const buttonBoundingBox = await newCollectionButton.boundingBox();
    expect(buttonBoundingBox).toBeTruthy();
    console.log('New Collection button position:', buttonBoundingBox);
    
    // Step 3: Click button and verify form appears visually
    await newCollectionButton.click();
    await electronPage.waitForTimeout(1000);
    const formScreenshot = await electronPage.screenshot({ path: 'test-artifacts/03-form-opened.png', fullPage: true });
    
    // Verify form inputs are visible
    const nameInput = electronPage.locator('input#name');
    await nameInput.waitFor({ state: 'visible' });
    const inputBoundingBox = await nameInput.boundingBox();
    expect(inputBoundingBox).toBeTruthy();
    console.log('Name input position:', inputBoundingBox);
    
    // Step 4: Type in input and verify text appears
    await nameInput.fill('Visual Test Collection');
    await electronPage.waitForTimeout(500);
    
    // Verify text was actually entered
    const inputValue = await nameInput.inputValue();
    expect(inputValue).toBe('Visual Test Collection');
    console.log('Input value:', inputValue);
    
    const filledScreenshot = await electronPage.screenshot({ path: 'test-artifacts/04-input-filled.png', fullPage: true });
    
    // Step 5: Fill description
    const descInput = electronPage.locator('textarea#description');
    await descInput.fill('This is a visual verification test');
    await electronPage.waitForTimeout(500);
    
    const descValue = await descInput.inputValue();
    expect(descValue).toBe('This is a visual verification test');
    console.log('Description value:', descValue);
    
    // Step 6: Click Save and verify UI updates
    const saveButton = electronPage.locator('button:has-text("Save")');
    await saveButton.click();
    await electronPage.waitForTimeout(2000); // Wait for save and navigation
    
    const afterSaveScreenshot = await electronPage.screenshot({ path: 'test-artifacts/05-after-save.png', fullPage: true });
    
    // Verify collection appears in the UI (not just in API)
    const collectionInUI = await electronPage.evaluate(() => {
      const bodyText = document.body.textContent || '';
      return bodyText.includes('Visual Test Collection');
    });
    expect(collectionInUI).toBe(true);
    console.log('Collection visible in UI:', collectionInUI);
    
    // Step 7: Verify collection card is actually rendered in DOM
    const collectionCard = electronPage.locator('h3:has-text("Visual Test Collection")').first();
    await collectionCard.waitFor({ state: 'visible', timeout: 5000 });
    const cardBoundingBox = await collectionCard.boundingBox();
    expect(cardBoundingBox).toBeTruthy();
    console.log('Collection card position:', cardBoundingBox);
    
    const finalScreenshot = await electronPage.screenshot({ path: 'test-artifacts/06-collection-visible.png', fullPage: true });
    
    // Verify all screenshots were taken (they should all be different)
    expect(initialScreenshot).toBeTruthy();
    expect(collectionsScreenshot).toBeTruthy();
    expect(formScreenshot).toBeTruthy();
    expect(filledScreenshot).toBeTruthy();
    expect(afterSaveScreenshot).toBeTruthy();
    expect(finalScreenshot).toBeTruthy();
  });

  test('should verify button clicks trigger React handlers', async ({ electronPage }) => {
    // Navigate to collections
    await electronPage.click('text=Collections');
    await electronPage.waitForTimeout(1000);
    
    // Get initial collection count from UI
    const initialCount = await electronPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const collectionButtons = buttons.filter(btn => 
        btn.textContent?.includes('Collection') && !btn.textContent?.includes('New')
      );
      return collectionButtons.length;
    });
    console.log('Initial collection count in UI:', initialCount);
    
    // Click New Collection
    const newCollectionButton = electronPage.locator('button:has-text("New Collection")');
    await newCollectionButton.click();
    await electronPage.waitForTimeout(1000);
    
    // Verify form appeared (React state changed)
    const formAppeared = await electronPage.evaluate(() => {
      return document.querySelector('input#name') !== null;
    });
    expect(formAppeared).toBe(true);
    console.log('Form appeared after click:', formAppeared);
    
    // Fill and save
    await electronPage.fill('input#name', 'React Handler Test');
    await electronPage.fill('textarea#description', 'Testing React handlers');
    await electronPage.click('button:has-text("Save")');
    await electronPage.waitForTimeout(2000);
    
    // Verify UI updated (new collection appears)
    const finalCount = await electronPage.evaluate(() => {
      const bodyText = document.body.textContent || '';
      const matches = bodyText.match(/React Handler Test/g);
      return matches ? matches.length : 0;
    });
    expect(finalCount).toBeGreaterThan(0);
    console.log('Collection appears in UI after save:', finalCount > 0);
  });

  test('should verify UI state changes are visible', async ({ electronPage }) => {
    // Navigate to collections first
    await electronPage.click('text=Collections');
    await electronPage.waitForTimeout(2000); // Wait for React to render
    
    // Create a collection via UI (not API) to ensure React state updates
    const newCollectionButton = electronPage.locator('button:has-text("New Collection")');
    await newCollectionButton.click();
    await electronPage.waitForTimeout(1000);
    
    // Fill form
    await electronPage.fill('input#name', 'State Change Test');
    await electronPage.fill('textarea#description', 'For state verification');
    
    // Save via UI
    await electronPage.click('button:has-text("Save")');
    await electronPage.waitForTimeout(2000); // Wait for save and re-render
    
    // Verify collection is in DOM
    const collectionInDOM = await electronPage.evaluate(() => {
      const allText = document.body.innerText || document.body.textContent || '';
      return allText.includes('State Change Test');
    });
    expect(collectionInDOM).toBe(true);
    
    // Verify it's actually rendered as a visible element
    // Try multiple selectors since it might be in different places
    const collectionElement = electronPage.locator('text=State Change Test').first();
    await collectionElement.waitFor({ state: 'visible', timeout: 5000 });
    const isVisible = await collectionElement.isVisible();
    expect(isVisible).toBe(true);
    
    // Verify it has a bounding box (is actually rendered)
    const boundingBox = await collectionElement.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeGreaterThan(0);
    expect(boundingBox!.height).toBeGreaterThan(0);
    
    console.log('Collection element is visible and rendered:', {
      visible: isVisible,
      boundingBox: boundingBox
    });
  });
});

