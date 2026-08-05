import { expect, test } from "@playwright/test";

test("Cache Stampede excellent containment reaches its report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select Cache Stampede" }).click();
  await expect(page.getByRole("heading", { name: /one expired key becomes/i })).toBeVisible();
  await page.getByRole("button", { name: "Enter incident" }).click();
  await expect(page.getByRole("button", { name: /Warm the cache.*Requires: Inspect cache metrics or Inspect recent deployment/i })).toBeDisabled();

  for (const action of ["Inspect cache metrics", "Warm the cache", "Enable request coalescing"]) {
    await page.getByRole("button", { name: new RegExp(`^${action}\\b`, "i") }).click();
    await page.getByRole("button", { name: /Commit action/i }).click();
  }

  await expect(page.getByRole("heading", { name: /stampede was stopped/i })).toBeVisible();
  await expect(page.getByText("/100")).toBeVisible();
});
