---
kind: checklist
tier: enterprise
---
# Accessibility Checklist

Apply this checklist whenever a ticket changes the user interface. Note the target standard
for the project.

- semantic structure / labels
- keyboard reachable + visible focus
- color contrast meets target
- alt text for meaningful images
- forms have error + label association
- target standard (e.g. WCAG 2.2 AA) noted

## Automated checks (axe-core)

The manual checks above are necessary but not sufficient. Add an automated accessibility
assertion to the UI/E2E suite using `@axe-core/playwright` `4.12.1`, which runs the axe-core
engine inside a Playwright test (version verified against the npm registry 2026-08-11; check for
a newer one before you pin it). The `.withTags` set below maps to the WCAG 2.2 AA bar.

```typescript
// Source: playwright.dev/docs/accessibility-testing
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';   // default export

test('dashboard has no WCAG 2.2 AA accessibility violations', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']) // WCAG 2.2 AA bar
    .include('#main')          // optional: scope analysis to a region
    .analyze();
  expect(results.violations).toEqual([]);        // zero violations required to pass
});
```

- `.withTags([...])` selects the rule set; the five tags above are the WCAG 2.2 AA bar.
- `.include(...)` / `.exclude(...)` scope the analysis to (or away from) a region.
- `.analyze()` returns a results object whose `violations` array must be empty to pass.

Automated scanning catches roughly half of accessibility issues; keep running the manual
checks above alongside it. If no axe-core tooling is configured for a stack, record
`UNKNOWN - verify` rather than claiming the accessibility check passed.
