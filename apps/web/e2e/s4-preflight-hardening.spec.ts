import { test, expect, BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as path from 'path';
import * as fs from 'fs';

const VIEWPORTS = [
  { slug: '360x640', name: 'Mobile Small (360x640)', width: 360, height: 640, type: 'mobile' },
  { slug: '390x844', name: 'Mobile Standard (390x844)', width: 390, height: 844, type: 'mobile' },
  { slug: '768x1024', name: 'Tablet Portrait (768x1024)', width: 768, height: 1024, type: 'tablet' },
  { slug: '1024x768', name: 'Tablet Landscape (1024x768)', width: 1024, height: 768, type: 'tablet-landscape' },
  { slug: '1280x800', name: 'Laptop Standard (1280x800)', width: 1280, height: 800, type: 'laptop' },
  { slug: '1920x1080', name: 'Desktop Large (1920x1080)', width: 1920, height: 1080, type: 'desktop' },
];

test.describe.serial('Task S4 Preflight Hardening Suite (S3.1)', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // 1. Authenticate once in a shared browser context
    context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/login');
    await expect(page).toHaveTitle(/CartPilot/i);

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await emailInput.fill('customer@cartpilot.com');
    await passwordInput.fill('Customer1234!');

    const submitBtn = page.getByRole('button', { name: /Sign In to Workspace/i });
    await submitBtn.click();
    await expect(page).toHaveURL(/\/shopper/);

    await page.close();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  // ── Preflight 1a: Touch Targets (>= 44x44 px) on Mobile Viewports ──────────
  for (const mobileVp of VIEWPORTS.filter((v) => v.type === 'mobile')) {
    test(`Preflight 1a [Touch Targets]: Viewport ${mobileVp.name} interactive controls measure >= 44x44px`, async () => {
      const page = await context.newPage();
      try {
        await page.setViewportSize({ width: mobileVp.width, height: mobileVp.height });
        await page.goto('/shopper');
        await expect(page).toHaveURL(/\/shopper/);
        await page.waitForTimeout(500);

        // 1. Mobile bottom tab navigation buttons (5 tabs)
        const tabs = ['tab-chat', 'tab-browse', 'tab-cart', 'tab-orders', 'tab-rules'];
        for (const tabKey of tabs) {
          const tabBtn = page.locator(`[data-testid="${tabKey}"]`);
          await expect(tabBtn).toBeVisible();
          const box = await tabBtn.boundingBox();
          expect(box, `Tab button ${tabKey} bounding box must exist`).not.toBeNull();
          if (box) {
            expect(box.width, `Tab ${tabKey} width`).toBeGreaterThanOrEqual(44);
            expect(box.height, `Tab ${tabKey} height`).toBeGreaterThanOrEqual(44);
          }
        }

        // 2. Header action buttons: Browse, Cart, Menu
        const headerBrowse = page.locator('[data-testid="header-browse-btn"]');
        await expect(headerBrowse).toBeVisible();
        const browseBox = await headerBrowse.boundingBox();
        expect(browseBox).not.toBeNull();
        if (browseBox) {
          expect(browseBox.width, 'Header browse button width').toBeGreaterThanOrEqual(44);
          expect(browseBox.height, 'Header browse button height').toBeGreaterThanOrEqual(44);
        }

        const headerCart = page.locator('button[aria-label*="items"]').first();
        await expect(headerCart).toBeVisible();
        const cartBox = await headerCart.boundingBox();
        expect(cartBox).not.toBeNull();
        if (cartBox) {
          expect(cartBox.width, 'Header cart button width').toBeGreaterThanOrEqual(44);
          expect(cartBox.height, 'Header cart button height').toBeGreaterThanOrEqual(44);
        }

        const menuBtn = page.locator('button[aria-label="Open conversation sidebar"]');
        await expect(menuBtn).toBeVisible();
        const menuBox = await menuBtn.boundingBox();
        expect(menuBox).not.toBeNull();
        if (menuBox) {
          expect(menuBox.width, 'Sidebar menu button width').toBeGreaterThanOrEqual(44);
          expect(menuBox.height, 'Sidebar menu button height').toBeGreaterThanOrEqual(44);
        }

        // 3. Composer send button
        await page.locator('textarea[aria-label*="CartPilot"]').fill('Fresh vegetables');
        const sendBtn = page.locator('button[aria-label="Send message"]');
        await expect(sendBtn).toBeVisible();
        const sendBox = await sendBtn.boundingBox();
        expect(sendBox).not.toBeNull();
        if (sendBox) {
          expect(sendBox.width, 'Composer send button width').toBeGreaterThanOrEqual(44);
          expect(sendBox.height, 'Composer send button height').toBeGreaterThanOrEqual(44);
        }
        await page.locator('textarea[aria-label*="CartPilot"]').fill('');

        // 4. In Browse Sheet: Category chips and close button
        await headerBrowse.click();
        const browseSheet = page.locator('[data-testid="browse-sheet"]');
        await expect(browseSheet).toBeVisible();

        const browseCloseBtn = browseSheet.locator('button[aria-label="Close browse sheet"]');
        await expect(browseCloseBtn).toBeVisible();
        const closeBox = await browseCloseBtn.boundingBox();
        expect(closeBox).not.toBeNull();
        if (closeBox) {
          expect(closeBox.width, 'Browse close button width').toBeGreaterThanOrEqual(44);
          expect(closeBox.height, 'Browse close button height').toBeGreaterThanOrEqual(44);
        }

        const allChip = browseSheet.getByRole('button', { name: /^All/i });
        await expect(allChip).toBeVisible();
        const chipBox = await allChip.boundingBox();
        expect(chipBox).not.toBeNull();
        if (chipBox) {
          expect(chipBox.height, 'Category chip height').toBeGreaterThanOrEqual(44);
        }

        // Product tile Add button
        const addBtn = browseSheet.locator('button:has-text("Add")').first();
        if (await addBtn.isVisible()) {
          const addBox = await addBtn.boundingBox();
          expect(addBox).not.toBeNull();
          if (addBox) {
            expect(addBox.height, 'Product tile Add button height').toBeGreaterThanOrEqual(44);
          }
        }

        // 5. In Product Sheet: Close and Action buttons
        const firstProductTile = browseSheet.locator('[data-testid="product-tile"]').first();
        await firstProductTile.click();
        const productSheet = page.locator('[data-testid="product-sheet"]');
        await expect(productSheet).toBeVisible();

        const productClose = productSheet.locator('button[aria-label="Close product sheet"]');
        await expect(productClose).toBeVisible();
        const prodCloseBox = await productClose.boundingBox();
        expect(prodCloseBox).not.toBeNull();
        if (prodCloseBox) {
          expect(prodCloseBox.width, 'Product sheet close button width').toBeGreaterThanOrEqual(44);
          expect(prodCloseBox.height, 'Product sheet close button height').toBeGreaterThanOrEqual(44);
        }

        const addToCartBtn = productSheet.locator('button:has-text("Add to Cart"), button[aria-label="Increase quantity"]').first();
        await expect(addToCartBtn).toBeVisible();
        const addToCartBox = await addToCartBtn.boundingBox();
        expect(addToCartBox).not.toBeNull();
        if (addToCartBox) {
          expect(addToCartBox.height, 'Add to cart action button height').toBeGreaterThanOrEqual(44);
        }

        const askAiBtn = productSheet.locator('button:has-text("Ask AI in Chat")');
        await expect(askAiBtn).toBeVisible();
        const askAiBox = await askAiBtn.boundingBox();
        expect(askAiBox).not.toBeNull();
        if (askAiBox) {
          expect(askAiBox.height, 'Ask AI in Chat button height').toBeGreaterThanOrEqual(44);
        }

        // Close Product sheet and Browse sheet
        await productClose.click();
        await expect(productSheet).not.toBeVisible();
        await browseCloseBtn.click();
        await expect(browseSheet).not.toBeVisible();

        // 6. In Rules Sheet: Close and Save Limits buttons
        await page.locator('[data-testid="tab-rules"]').click();
        const rulesSheet = page.locator('[data-testid="rules-sheet"]');
        await expect(rulesSheet).toBeVisible();

        const rulesClose = rulesSheet.locator('button[aria-label="Close rules sheet"]');
        await expect(rulesClose).toBeVisible();
        const rulesCloseBox = await rulesClose.boundingBox();
        expect(rulesCloseBox).not.toBeNull();
        if (rulesCloseBox) {
          expect(rulesCloseBox.width, 'Rules sheet close button width').toBeGreaterThanOrEqual(44);
          expect(rulesCloseBox.height, 'Rules sheet close button height').toBeGreaterThanOrEqual(44);
        }

        const saveLimitsBtn = rulesSheet.locator('button:has-text("Save Limits")');
        await expect(saveLimitsBtn).toBeVisible();
        const saveBox = await saveLimitsBtn.boundingBox();
        expect(saveBox).not.toBeNull();
        if (saveBox) {
          expect(saveBox.height, 'Save Limits button height').toBeGreaterThanOrEqual(44);
        }

        await rulesClose.click();
        await expect(rulesSheet).not.toBeVisible();
      } finally {
        await page.close();
      }
    });
  }

  // ── Preflight 1b: Accessibility (axe-core) Checks across Sheets ─────────────
  test('Preflight 1b [Accessibility]: 0 serious or critical violations across workspace and sheets', async () => {
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/shopper');
      await expect(page).toHaveURL(/\/shopper/);
      await page.waitForTimeout(600);

      // 1. Scan Main Shopper Workspace
      const workspaceScan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const workspaceViolations = workspaceScan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(workspaceViolations, 'Shopper workspace should have 0 serious/critical axe violations').toEqual([]);

      // 2. Scan Browse Sheet
      const browseBtn = page.locator('[data-testid="header-browse-btn"]');
      await browseBtn.click();
      const browseSheet = page.locator('[data-testid="browse-sheet"]');
      await expect(browseSheet).toBeVisible();

      const browseScan = await new AxeBuilder({ page })
        .include('[data-testid="browse-sheet"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const browseViolations = browseScan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(browseViolations, 'Browse sheet should have 0 serious/critical axe violations').toEqual([]);

      // 3. Scan Product Sheet
      const firstProduct = browseSheet.locator('[data-testid="product-tile"]').first();
      await firstProduct.click();
      const productSheet = page.locator('[data-testid="product-sheet"]');
      await expect(productSheet).toBeVisible();

      const productScan = await new AxeBuilder({ page })
        .include('[data-testid="product-sheet"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const productViolations = productScan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(productViolations, 'Product sheet should have 0 serious/critical axe violations').toEqual([]);

      // Close Product Sheet and Browse Sheet
      await productSheet.locator('button[aria-label="Close product sheet"]').click();
      await expect(productSheet).not.toBeVisible();
      await browseSheet.locator('button[aria-label="Close browse sheet"]').click();
      await expect(browseSheet).not.toBeVisible();

      // 4. Scan Spending Rules Sheet (opened via context panel)
      const editRulesBtn = page.locator('button:has-text("Edit Rules")');
      await editRulesBtn.click();
      const rulesSheet = page.locator('[data-testid="rules-sheet"]');
      await expect(rulesSheet).toBeVisible();

      const rulesScan = await new AxeBuilder({ page })
        .include('[data-testid="rules-sheet"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const rulesViolations = rulesScan.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(rulesViolations, 'Rules sheet should have 0 serious/critical axe violations').toEqual([]);

      await rulesSheet.locator('button[aria-label="Close rules sheet"]').click();
      await expect(rulesSheet).not.toBeVisible();
    } finally {
      await page.close();
    }
  });

  // ── Preflight 1c: Visual Matrix Screenshot Artifacts (6 Viewports) ─────────
  const visualMatrixDir = path.resolve(process.cwd(), 'test-results', 'visual-matrix');
  if (!fs.existsSync(visualMatrixDir)) {
    fs.mkdirSync(visualMatrixDir, { recursive: true });
  }

  for (const vp of VIEWPORTS) {
    test(`Preflight 1c [Visual Matrix]: Capture full-page screenshot for ${vp.name}`, async () => {
      const page = await context.newPage();
      try {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/shopper');
        await expect(page).toHaveURL(/\/shopper/);
        await page.waitForTimeout(500);

        const screenshotPath = path.join(visualMatrixDir, `viewport-${vp.slug}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        expect(fs.existsSync(screenshotPath), `Screenshot for ${vp.slug} must exist on disk`).toBe(true);
      } finally {
        await page.close();
      }
    });
  }

  // ── Preflight 1e & 1f: Server Free-Delivery Threshold & Integrity Receipt Copy ─
  test('Preflight 1e & 1f: Server-configured free delivery threshold & integrity receipt copy', async () => {
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/shopper');
      await expect(page).toHaveURL(/\/shopper/);

      // Open Browse Sheet
      const browseBtn = page.locator('[data-testid="header-browse-btn"]');
      await browseBtn.click();
      const browseSheet = page.locator('[data-testid="browse-sheet"]');
      await expect(browseSheet).toBeVisible();

      // Verify Free Delivery threshold shows ₹500 from server config
      const tracker = browseSheet.getByText(/Add ₹500 more for FREE delivery/i);
      await expect(tracker).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(browseSheet).not.toBeVisible();

      // Verify Orders Sheet opens and does not use "cryptographic proof"
      const ordersBtn = page.locator('aside button:has-text("Orders")');
      await ordersBtn.click();
      const ordersSheet = page.locator('[data-testid="orders-sheet"]');
      await expect(ordersSheet).toBeVisible();

      // Verify old term "cryptographic proof" is nowhere in the page DOM
      const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
      expect(bodyText).not.toContain('cryptographic proof');

      await page.keyboard.press('Escape');
      await expect(ordersSheet).not.toBeVisible();
    } finally {
      await page.close();
    }
  });
});
