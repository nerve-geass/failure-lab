import { expect, test } from "@playwright/test";

test("Connection Pool Exhaustion excellent containment reaches its report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select Connection Pool Exhaustion" }).click();
  await expect(page.getByRole("heading", { name: /healthy workers, no connections/i })).toBeVisible();
  await page.getByRole("button", { name: "Enter incident" }).click();

  await expect(page.getByRole("button", { name: /Enable leak detection.*Requires: Inspect pool metrics or Inspect recent deployment/i })).toBeDisabled();

  for (const action of ["Inspect pool metrics", "Enable leak detection", "Cap request concurrency"]) {
    await page.getByRole("button", { name: new RegExp(`^${action}\\b`, "i") }).click();
    await page.getByRole("button", { name: /Commit action/i }).click();
  }

  await expect(page.getByRole("heading", { name: /pool has headroom again/i })).toBeVisible();
  await expect(page.getByText("/100")).toBeVisible();
});
