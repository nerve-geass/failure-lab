import { expect, test } from "@playwright/test";

test("launches Blackbox from the catalog and resumes it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter Checkout Blackbox" }).click();
  await expect(page.getByRole("heading", { name: "Checkout Blackbox" })).toBeVisible();
  await page.getByRole("button", { name: "Start new Blackbox" }).click();
  await page.getByRole("button", { name: "Inspect catalog dependency" }).click();
  await page.getByRole("button", { name: "Back to catalog" }).click();
  await page.getByRole("button", { name: "Enter Checkout Blackbox" }).click();
  await expect(page.getByRole("button", { name: "Resume Blackbox" })).toBeVisible();
});

test("Blackbox exit preserves an authored investigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("button", { name: "Back to lab" }).click();
  await page.getByRole("button", { name: "Enter Checkout Blackbox" }).click();
  await page.getByRole("button", { name: "Start new Blackbox" }).click();
  await page.getByRole("button", { name: "Back to catalog" }).click();
  await expect(page.getByRole("button", { name: "Resume investigation" })).toBeVisible();
});
