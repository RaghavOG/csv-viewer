import { test, expect } from '@playwright/test';

test.describe('CSVee Canvas E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the dynamic canvas to load
    await page.waitForSelector('header');
  });

  test('loads branding and title', async ({ page }) => {
    await expect(page.locator('text=CSVee')).toBeVisible();
    await expect(page.locator('text=RaghavOG')).toBeVisible();
  });

  test('toggles theme between dark and light', async ({ page }) => {
    const html = page.locator('html');
    const themeBtn = page.locator('button[title*="Mode"]');
    
    // Check initial state
    const isDarkInitially = await html.evaluate((el) => el.classList.contains('dark'));

    // Toggle
    await themeBtn.click();
    const isDarkAfter = await html.evaluate((el) => el.classList.contains('dark'));
    expect(isDarkAfter).not.toBe(isDarkInitially);
  });

  test('opens and closes Help Shortcuts modal', async ({ page }) => {
    const helpBtn = page.locator('button[title*="Shortcuts"]');
    await helpBtn.click();

    await expect(page.locator('text=Shortcuts & How to Use')).toBeVisible();
    await page.locator('text=Got it!').click();
    await expect(page.locator('text=Shortcuts & How to Use')).not.toBeVisible();
  });

  test('opens and closes Paste CSV modal', async ({ page }) => {
    const pasteBtn = page.locator('button:has-text("Paste CSV")');
    await pasteBtn.click();

    await expect(page.locator('text=Paste or Upload CSV / Tabular Data')).toBeVisible();
    await page.locator('button:has-text("Cancel")').click();
    await expect(page.locator('text=Paste or Upload CSV / Tabular Data')).not.toBeVisible();
  });

  test('zoom controls update zoom percentage', async ({ page }) => {
    const zoomText = page.locator('button[title="Reset Zoom to 100%"]');
    await expect(zoomText).toContainText('%');

    const zoomInBtn = page.locator('button[title*="Zoom In"]');
    await zoomInBtn.click();
    
    // Zoom should increase
    const newZoom = await zoomText.textContent();
    expect(newZoom).not.toBe('100%');
  });
});
