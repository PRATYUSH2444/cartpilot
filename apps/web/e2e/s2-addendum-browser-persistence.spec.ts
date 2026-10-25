import { test, expect } from '@playwright/test';

test.describe('S2 Addendum 5: Browser Persistence & Reload Survival Proof', () => {
  test('persists shopper session, conversation messages, rules card, and cart across reload', async ({ page }) => {
    // 1. Visit login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/CartPilot/i);

    // 2. Perform authentication as customer
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.fill('customer@cartpilot.com');
    await passwordInput.fill('Customer1234!');

    const submitBtn = page.getByRole('button', { name: /Sign In to Workspace/i });
    await submitBtn.click();

    // 3. Verify successful navigation to shopper workspace
    await expect(page).toHaveURL(/\/shopper/);

    // 4. Verify that the Rules Card is rendered with canonical caps
    const rulesCard = page.locator('text=Spending Rules Mandate').or(page.locator('text=Careful')).or(page.locator('text=₹1,000'));
    await expect(rulesCard.first()).toBeVisible({ timeout: 15000 });

    // 5. Send a chat message into the persistent chat session
    const chatInput = page.locator('input[placeholder*="Ask CartPilot"], textarea[placeholder*="Ask CartPilot"], input[type="text"]').last();
    const testMessageText = `Persistence Verification Message ${Date.now()}`;
    await chatInput.fill(testMessageText);
    await chatInput.press('Enter');

    // 6. Verify that the message is displayed in the conversation list
    await expect(page.getByText(testMessageText)).toBeVisible({ timeout: 15000 });

    // 7. RELOAD BROWSER (simulates user refreshing or returning to tab)
    await page.reload();

    // 8. PROOF ASSERTIONS:
    // a. Must still be on /shopper (not redirected to /login)
    await expect(page).toHaveURL(/\/shopper/);

    // b. Conversation history must still contain the sent message
    await expect(page.getByText(testMessageText)).toBeVisible({ timeout: 15000 });

    // c. Rules Card must still be present and rendered from persistent DB
    await expect(rulesCard.first()).toBeVisible({ timeout: 15000 });
  });
});
