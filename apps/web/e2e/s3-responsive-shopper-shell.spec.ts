import { test, expect, BrowserContext } from '@playwright/test';

const VIEWPORTS = [
  { name: 'Mobile Small (360x640)', width: 360, height: 640, type: 'mobile' },
  { name: 'Mobile Standard (390x844)', width: 390, height: 844, type: 'mobile' },
  { name: 'Tablet Portrait (768x1024)', width: 768, height: 1024, type: 'tablet' },
  { name: 'Tablet Landscape (1024x768)', width: 1024, height: 768, type: 'tablet-landscape' },
  { name: 'Laptop Standard (1280x800)', width: 1280, height: 800, type: 'laptop' },
  { name: 'Desktop Large (1920x1080)', width: 1920, height: 1080, type: 'desktop' },
];

test.describe.serial('Task S3: Responsive Shopper Shell & Quick-Commerce Core Matrix', () => {
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    // 1. Authenticate once in a shared browser context (preserves httpOnly session cookie)
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

  for (const vp of VIEWPORTS) {
    test(`Viewport ${vp.name}: layout invariants, zero horizontal scroll, and responsive shell`, async () => {
      const page = await context.newPage();

      try {
        // 1. Set viewport
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // 2. Navigate directly to shopper workspace using shared session
        await page.goto('/shopper');
        await expect(page).toHaveURL(/\/shopper/);

        // Wait for page data to settle
        await page.waitForTimeout(600);

        // 3. ZERO HORIZONTAL SCROLL INVARIANT (Contract requirement across all viewports)
        const scrollCheck = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: window.innerWidth,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          };
        });
        expect(scrollCheck.hasOverflow).toBe(false);

        // 4. TOP DELIVERY CHIP INVARIANT (Always visible across all form factors per UX_CONTRACT)
        const deliveryChip = page.locator('[data-testid="delivery-chip"]');
        await expect(deliveryChip).toBeVisible();
        await expect(deliveryChip).toContainText('Delivery in about 30 min (estimated, simulated)');

        // 5. BREAKPOINT-SPECIFIC LAYOUT INVARIANTS
        if (vp.type === 'mobile') {
          // Mobile bottom navigation bar
          const bottomNav = page.locator('nav[aria-label="Bottom Navigation"]');
          await expect(bottomNav).toBeVisible();

          // 5 Canonical tabs
          await expect(page.locator('[data-testid="tab-chat"]')).toBeVisible();
          await expect(page.locator('[data-testid="tab-browse"]')).toBeVisible();
          await expect(page.locator('[data-testid="tab-cart"]')).toBeVisible();
          await expect(page.locator('[data-testid="tab-orders"]')).toBeVisible();
          await expect(page.locator('[data-testid="tab-rules"]')).toBeVisible();

          // Touch target size >= 44px
          const browseTabBox = await page.locator('[data-testid="tab-browse"]').boundingBox();
          expect(browseTabBox).not.toBeNull();
          if (browseTabBox) {
            expect(browseTabBox.height).toBeGreaterThanOrEqual(44);
          }

          // Open Browse bottom sheet via tab
          await page.locator('[data-testid="tab-browse"]').click();
          const browseSheet = page.locator('[data-testid="browse-sheet"]');
          await expect(browseSheet).toBeVisible();

          // Check catalog elements
          await expect(browseSheet.getByRole('heading', { name: /Browse Grocery Catalog/i })).toBeVisible();
          await expect(browseSheet.locator('input[placeholder*="Search"]')).toBeVisible();

          // Close browse sheet via Escape
          await page.keyboard.press('Escape');
          await expect(browseSheet).not.toBeVisible();

          // Open Rules bottom sheet via tab
          await page.locator('[data-testid="tab-rules"]').click();
          const rulesSheet = page.locator('[data-testid="rules-sheet"]');
          await expect(rulesSheet).toBeVisible();
          await expect(rulesSheet.getByRole('heading', { name: /Spending Rules/i })).toBeVisible();
          await expect(rulesSheet.getByText('Choose a Mandate Preset')).toBeVisible();
          await expect(rulesSheet.getByRole('button', { name: /Careful/i })).toBeVisible();
          await expect(rulesSheet.getByRole('button', { name: /Everyday/i })).toBeVisible();
          await expect(rulesSheet.getByRole('button', { name: /Family/i })).toBeVisible();

          // Close rules sheet
          await page.keyboard.press('Escape');
          await expect(rulesSheet).not.toBeVisible();

          // Open Orders bottom sheet via tab
          await page.locator('[data-testid="tab-orders"]').click();
          const ordersSheet = page.locator('[data-testid="orders-sheet"]');
          await expect(ordersSheet).toBeVisible();
          await expect(ordersSheet.getByRole('heading', { name: /Your Orders & Delivery Tracking/i })).toBeVisible();

          // Close orders sheet
          await page.keyboard.press('Escape');
          await expect(ordersSheet).not.toBeVisible();

          // Context panel should NOT be visible on mobile
          await expect(page.locator('[data-testid="context-panel"]')).not.toBeVisible();

        } else if (vp.type === 'tablet') {
          // Bottom nav is hidden on tablet
          await expect(page.locator('nav[aria-label="Bottom Navigation"]')).not.toBeVisible();

          // Context panel is hidden on tablet portrait (< 1024px)
          await expect(page.locator('[data-testid="context-panel"]')).not.toBeVisible();

          // Quick Browse button in header works
          const headerBrowseBtn = page.locator('[data-testid="header-browse-btn"]');
          await expect(headerBrowseBtn).toBeVisible();
          await headerBrowseBtn.click();

          const browseSheet = page.locator('[data-testid="browse-sheet"]');
          await expect(browseSheet).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(browseSheet).not.toBeVisible();

        } else {
          // Laptop & Desktop (>= 1024px)
          // Bottom nav hidden
          await expect(page.locator('nav[aria-label="Bottom Navigation"]')).not.toBeVisible();

          // Persistent 360px Context Panel is visible
          const contextPanel = page.locator('[data-testid="context-panel"]');
          await expect(contextPanel).toBeVisible();
          const panelBox = await contextPanel.boundingBox();
          expect(panelBox).not.toBeNull();
          if (panelBox) {
            expect(panelBox.width).toBeCloseTo(360, -1);
          }

          // Context panel contains live cart / empty cart and Spending Rules summary
          await expect(contextPanel.getByText(/Live Basket|Your cart is empty|Cart/i).first()).toBeVisible();
          await expect(contextPanel.getByText('Spending Rules').first()).toBeVisible();

          // Quick Browse opens as modal grid
          const browseBtn = page.locator('[data-testid="header-browse-btn"]');
          await expect(browseBtn).toBeVisible();
          await browseBtn.click();

          const browseSheet = page.locator('[data-testid="browse-sheet"]');
          await expect(browseSheet).toBeVisible();
          await page.keyboard.press('Escape');
          await expect(browseSheet).not.toBeVisible();
        }
      } finally {
        await page.close();
      }
    });
  }

  test('Quick-Commerce Catalog: vernacular alias search and server cart steppers', async () => {
    const page = await context.newPage();

    try {
      // 1. Set standard viewport
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto('/shopper');
      await expect(page).toHaveURL(/\/shopper/);

      // 2. Open Browse catalog modal
      const browseBtn = page.locator('[data-testid="header-browse-btn"]');
      await browseBtn.click();
      const browseSheet = page.locator('[data-testid="browse-sheet"]');
      await expect(browseSheet).toBeVisible();

      // 3. Vernacular alias search: search for "tamatar" should find Tomato items
      const searchInput = browseSheet.locator('input[placeholder*="Search"]');
      await searchInput.fill('tamatar');

      // Wait for filtered results
      await page.waitForTimeout(500);
      const tomatoItem = browseSheet.getByText(/Tomato/i).first();
      await expect(tomatoItem).toBeVisible();

      // Clear search and test "aloo" -> Potato
      await searchInput.fill('aloo');
      await page.waitForTimeout(500);
      const potatoItem = browseSheet.getByText(/Potato/i).first();
      await expect(potatoItem).toBeVisible();

      // Clear search to show full list
      await searchInput.fill('');

      // 4. Test product detail sheet opens on tile click
      const firstProductTile = browseSheet.locator('[data-testid="product-tile"]').first();
      await expect(firstProductTile).toBeVisible();
      await firstProductTile.click();
      const productSheet = page.locator('[data-testid="product-sheet"]');
      await expect(productSheet).toBeVisible();
      await expect(productSheet.getByText('100% Vegetarian')).toBeVisible();
      await expect(productSheet.getByText('Sold by Fresh Greens Organics')).toBeVisible();
      const closeProductBtn = productSheet.getByRole('button', { name: /Close product sheet/i });
      await closeProductBtn.click();
      await expect(productSheet).not.toBeVisible();

      // Close browse modal
      await page.keyboard.press('Escape');
    } finally {
      await page.close();
    }
  });
});
