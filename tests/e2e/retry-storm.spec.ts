import { expect, test } from "@playwright/test";

test("excellent containment path reaches an incident commander report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await expect(page.getByRole("heading", { name: /small timeout becomes/i })).toBeVisible();
  await page.getByRole("button", { name: "Enter incident" }).click();
  await expect(page.getByRole("button", { name: /Inspect provider traces.*Requires: Inspect recent deployment or Inspect queue metrics/i })).toBeDisabled();

  for (const action of ["Inspect recent deployment", "Inspect provider traces", "Disable automatic retries", "Enable circuit breaker"]) {
    await page.getByRole("button", { name: new RegExp(`^${action}\\b`, "i") }).click();
    await page.getByRole("button", { name: /Commit action/i }).click();
  }

  await expect(page.getByRole("heading", { name: /chain was interrupted/i })).toBeVisible();
  await expect(page.getByText("Incident Commander").first()).toBeVisible();
  await expect(page.getByText(/100\/100/)).toBeVisible();
});
