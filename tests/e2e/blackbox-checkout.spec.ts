import { expect, test } from "@playwright/test";

test("checkout Blackbox target exposes signals and consequences", async ({ page }) => {
  await page.goto("/?mode=blackbox");

  await expect(page.getByRole("heading", { name: "Checkout dependency under pressure" })).toBeVisible();
  await expect(page.getByText("Hidden causal chain")).not.toBeVisible();

  await page.getByRole("button", { name: "Probe checkout" }).click();
  await expect(page.getByText("Checkout probe completed")).toBeVisible();

  await page.getByRole("button", { name: "Reduce catalog request rate" }).click();
  await expect(page.getByText("Traffic reduction is visible to customers").first()).toBeVisible();

  await page.getByRole("button", { name: "Inspect catalog dependency" }).click();
  await page.getByRole("button", { name: "Restore catalog dependency" }).click();
  await expect(page.getByText("contained", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Back to catalog" }).click();
  await expect(page.getByText("Practice modes")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter Checkout Blackbox" })).toBeVisible();
});
