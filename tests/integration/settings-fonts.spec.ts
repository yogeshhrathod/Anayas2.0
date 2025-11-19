import { test, expect } from '../helpers/electron-fixtures';

test.describe('Font Settings UI', () => {
  test('should save and apply font settings', async ({ electronPage }) => {
    // GIVEN the user is on the Settings page
    await electronPage.click('button[data-testid="nav-settings"]');
    await electronPage.waitForSelector('h1:has-text("Settings")');

    // WHEN the user updates both font settings and saves them
    await electronPage.fill('input#uiFontFamily', 'TestUIFont');
    await electronPage.fill('input#codeFontFamily', 'TestCodeFont');

    await electronPage.click('button:has-text("Save Changes")');
    await electronPage.waitForTimeout(500); // Wait for save

    // THEN the settings are persisted via IPC
    const settings = await electronPage.evaluate(async () => {
      const api = (window as any).electronAPI;
      return await api.settings.getAll();
    });
    expect(settings.uiFontFamily).toBe('TestUIFont');
    expect(settings.codeFontFamily).toBe('TestCodeFont');

    // AND UI + code fonts are applied in the renderer
    const cssVar = await electronPage.evaluate(() => {
      return document.documentElement.style.getPropertyValue('--font-ui');
    });
    expect(cssVar).toBe('TestUIFont');

    const bodyFont = await electronPage.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(bodyFont).toContain('TestUIFont');

    const monoFont = await electronPage.evaluate(() => {
      const el = document.createElement('code');
      el.className = 'font-mono';
      el.textContent = 'font-check';
      document.body.appendChild(el);
      const family = window.getComputedStyle(el).fontFamily;
      el.remove();
      return family;
    });
    expect(monoFont).toContain('TestCodeFont');

    // AND the selections persist after a reload
    await electronPage.reload();
    await electronPage.waitForSelector('button[data-testid="nav-settings"]');
    await electronPage.click('button[data-testid="nav-settings"]');
    await electronPage.waitForSelector('input#uiFontFamily');

    await expect.poll(async () => electronPage.inputValue('input#uiFontFamily')).toBe('TestUIFont');
    await expect.poll(async () => electronPage.inputValue('input#codeFontFamily')).toBe('TestCodeFont');
  });
});

