import { test, expect } from '@playwright/test';

test.describe('Real-Time Collaboration Multi-Tab Sync', () => {
  test('synchronizes peer presence and cursors between two browser tabs', async ({ context }) => {
    // Open Tab 1
    const page1 = await context.newPage();
    await page1.goto('/');
    await page1.waitForLoadState('networkidle');

    // Tab 1 should initially show 1 online
    await expect(page1.getByText(/1 online/i)).toBeVisible({ timeout: 5000 });

    // Open Tab 2 in the same browser context (shares BroadcastChannel)
    const page2 = await context.newPage();
    await page2.goto('/');
    await page2.waitForLoadState('networkidle');

    // Both tabs should now recognize each other and show 2 online
    await expect(page1.getByText(/2 online/i)).toBeVisible({ timeout: 5000 });
    await expect(page2.getByText(/2 online/i)).toBeVisible({ timeout: 5000 });

    // Move mouse in Tab 1
    await page1.mouse.move(400, 300);
    await page1.waitForTimeout(400);

    // Tab 2 should display Tab 1's peer cursor
    const peerCursorOnPage2 = page2.locator('[data-testid="peer-cursor"]');
    await expect(peerCursorOnPage2).toBeVisible({ timeout: 5000 });

    // Close Tab 2
    await page2.close();

    // Tab 1 should update back to 1 online after peer leaves
    await expect(page1.getByText(/1 online/i)).toBeVisible({ timeout: 8000 });

    await page1.close();
  });
});
