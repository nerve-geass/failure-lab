import { test, expect } from "@playwright/test";

test("plays Bad Deployment through a safe mitigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bad Deployment/i }).click();
  await page.getByRole("button", { name: /Enter incident/i }).click();
  await page.getByRole("button", { name: /^Inspect recent deployment\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await page.getByRole("button", { name: /^Disable changed feature\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await page.getByRole("button", { name: /^Advance incident timeline\b/i }).click();
  await page.getByRole("button", { name: /Commit action/i }).click();
  await expect(page.getByText("The canary is contained")).toBeVisible();
});
