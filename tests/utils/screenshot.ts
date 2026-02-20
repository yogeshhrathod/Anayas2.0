import { Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Take screenshot and save to artifacts directory
 */
export async function takeScreenshot(
  page: Page,
  testArtifactsDir: string,
  name: string
): Promise<string> {
  const screenshotPath = path.join(
    testArtifactsDir,
    'screenshots',
    `${name}.png`
  );

  // Ensure directory exists
  const screenshotsDir = path.dirname(screenshotPath);
  fs.mkdirSync(screenshotsDir, { recursive: true });

  await page.screenshot({ path: screenshotPath, fullPage: true });

  return screenshotPath;
}

/**
 * Take screenshot at key points during test
 */
export async function captureScreenshotSequence(
  page: Page,
  testArtifactsDir: string,
  step: string,
  sequence: number
): Promise<string> {
  const name = `${String(sequence).padStart(2, '0')}-${step.replace(/\s+/g, '-').toLowerCase()}`;
  return takeScreenshot(page, testArtifactsDir, name);
}
