import { expect, test } from "@playwright/test";

test("contains Memory Leak through cache limiting", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Memory Leak/i }).click();
  await page.getByRole("button", { name: /Enter incident/i }).click();
  await page.getByRole("button", { name: /^Inspect memory metrics\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await page.getByRole("button", { name: /^Limit cache growth\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await page.getByRole("button", { name: /^Advance incident timeline\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await expect(page.getByText("The heap has headroom again.")).toBeVisible();
});
