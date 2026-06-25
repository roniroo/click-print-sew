import { test, expect } from "@playwright/test";

/**
 * Full-stack smoke test: sign up (username only) → create a pattern → draw with
 * the rectangle and 45°-locked line tools → save → open the print dialog → and
 * confirm the work persists across a reload. Also asserts no console errors.
 */
test("sign up, draw, print, and persist", async ({ page }) => {
  const user = "e2e_" + Math.random().toString(36).slice(2, 8);
  const pass = "supersecret123";

  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));

  await page.setViewportSize({ width: 1400, height: 900 });

  // ---- sign up ----
  await page.goto("/signup");
  await page.fill("#username", user);
  await page.fill("#password", pass);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");

  // ---- create + open a pattern ----
  await page.goto("/patterns/new");
  await page.waitForURL("**/edit");
  await page.waitForSelector("svg");

  const canvas = page.locator("div.touch-none").first();
  const box = (await canvas.boundingBox())!;

  // ---- rectangle ----
  await page.click('button[aria-label="Rectangle"]');
  await page.mouse.move(box.x + 320, box.y + 220);
  await page.mouse.down();
  await page.mouse.move(box.x + 540, box.y + 400, { steps: 10 });
  await page.mouse.up();
  await expect(page.locator('rect[stroke="#2563eb"]').first()).toBeVisible();

  // ---- 45°-locked line (drag mostly horizontal with Shift) ----
  await page.click('button[aria-label="Line"]');
  await page.mouse.move(box.x + 320, box.y + 480);
  await page.keyboard.down("Shift");
  await page.mouse.down();
  await page.mouse.move(box.x + 560, box.y + 500, { steps: 8 });
  await page.mouse.up();
  await page.keyboard.up("Shift");
  // A perfectly horizontal line has a zero-height box (Playwright treats that as
  // "hidden"), so assert it's attached and confirm the 45° lock kept y1 === y2.
  const lineLoc = page.locator('line[stroke="#2563eb"]').first();
  await expect(lineLoc).toBeAttached();
  const [y1, y2] = await Promise.all([
    lineLoc.getAttribute("y1"),
    lineLoc.getAttribute("y2"),
  ]);
  expect(Number(y1)).toBeCloseTo(Number(y2), 5);

  // ---- explicit save ----
  await page.keyboard.press("Control+s");
  await expect(page.locator("header").first()).toContainText("Saved", { timeout: 8000 });

  // ---- print dialog with tiling preview ----
  await page.click('button:has-text("Print")');
  await expect(page.getByText("Print pattern")).toBeVisible();
  await expect(page.getByText(/\d+ page/)).toBeVisible();
  await page.keyboard.press("Escape");

  // ---- persists across reload ----
  await page.reload();
  await page.waitForSelector("svg");
  await expect(
    page.locator('rect[stroke="#1f2937"], line[stroke="#1f2937"]').first(),
  ).toBeVisible({ timeout: 10_000 });

  expect(errors, errors.join("\n")).toEqual([]);
});
