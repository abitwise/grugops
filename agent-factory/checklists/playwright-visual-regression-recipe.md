---
kind: checklist
tier: enterprise
---
# Playwright Visual-Regression Recipe

Apply this recipe whenever a ticket changes the user interface and a visual baseline must be
verified at the quality gate. The goal is a `toHaveScreenshot` test that is deterministic across
local, CI, and Docker runs — flaky screenshot tests erode trust in the gate, so every source of
non-determinism below must be removed before a baseline is trusted.

This is a reference how-to. The gate's UI/E2E step points to this file by name; it does not
restate the recipe. Accessibility (axe-core) assertions live in `accessibility-checklist.md`.

## Tooling

- `@playwright/test` `1.60.0` — the native runner provides screenshots, fixtures, and parallelism.
- `@axe-core/playwright` `4.11.3` — used for the a11y assertions (see `accessibility-checklist.md`).

Users install these in their own repository; grugops installs nothing and only recommends them:

```bash
npm install -D @playwright/test @axe-core/playwright
npx playwright install --with-deps    # browsers; --with-deps installs OS libs for Docker/CI Linux
```

## The flake-resistance set

Every item below is required for a reproducible baseline.

- **Fixed viewport.** Pin the rendering size so the layout cannot shift between runs — set it
  per test with `page.setViewportSize(...)` and globally in `playwright.config.ts` via `use.viewport`.
- **Animations disabled.** Pass `animations: 'disabled'` so finite animations fast-forward and
  infinite ones reset, removing mid-animation capture differences.
- **Caret hidden.** Pass `caret: 'hide'` so a blinking text caret never appears in the capture.
- **Mask volatile regions.** Pass `mask: [page.getByTestId('...')]` to overlay regions whose
  content changes between runs (timestamps, randomized data, live counters).
- **Pixel tolerance.** Pass a small `maxDiffPixels` (or `maxDiffPixelRatio`) to absorb sub-pixel
  anti-aliasing noise. The per-pixel `threshold` defaults to `0.2` (YIQ color distance, `0`–`1`);
  lower it only when a stricter match is genuinely required.
- **Stable locators.** Use role, label, and `data-testid` locators — never brittle CSS or XPath
  selectors that break when unrelated markup moves.
- **Per-environment baselines.** Screenshots differ across browsers, platforms, and fonts.
  Baselines are named `{name}-{projectName}-{platform}.png`. Generate them in the same
  container or OS that CI runs (the official Playwright Docker image is recommended so font
  rendering matches). Update baselines deliberately with `npx playwright test --update-snapshots`.

## Recipe

```typescript
// Source: playwright.dev/docs/api/class-pageassertions (toHaveScreenshot options)
import { test, expect } from '@playwright/test';

test('dashboard renders to baseline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 }); // FIXED viewport
  await page.goto('/dashboard');
  // role / label / data-testid locators — never brittle CSS or XPath
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page).toHaveScreenshot('dashboard.png', {
    animations: 'disabled',                       // fast-forwards finite, resets infinite animations
    caret: 'hide',                                // hides the text caret
    mask: [page.getByTestId('live-timestamp')],   // overlay volatile regions
    maxDiffPixels: 100,                           // small absolute tolerance (or maxDiffPixelRatio)
    // threshold defaults to 0.2 (YIQ color distance, 0–1); lower = stricter per-pixel
  });
});
```

```typescript
// playwright.config.ts — pin the rendering environment so baselines are reproducible
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: { viewport: { width: 1280, height: 720 } },
  // Baselines are named {name}-{projectName}-{platform}.png — generate them in the SAME
  // container/OS that CI uses (font rendering differs across OS). Regenerate deliberately with:
  //   npx playwright test --update-snapshots
});
```

## At the gate

- A code or layout change that legitimately alters the UI requires a regenerated baseline. The
  agent may fix the code; updating a visual baseline to make a red screenshot pass is a
  human-only decision — accepting a new baseline moves the goalpost and must not be automated.
- If no baseline tooling is configured for a stack, record `UNKNOWN - verify` rather than
  claiming the visual check passed.
