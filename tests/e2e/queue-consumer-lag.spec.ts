import { expect, test } from "@playwright/test";

test("Queue Consumer Lag excellent containment reaches its report", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Select Queue Consumer Lag" }).click();
  await expect(page.getByRole("heading", { name: /quiet lag becomes/i })).toBeVisible();
  await page.getByRole("button", { name: "Enter incident" }).click();

  await expect(page.getByRole("button", { name: /Scale consumers.*Requires: Inspect queue metrics or Inspect consumer metrics/i })).toBeDisabled();

  for (const action of ["Inspect queue metrics", "Inspect consumer metrics", "Scale consumers", "Apply backpressure"]) {
    await page.getByRole("button", { name: new RegExp(`^${action}\\b`, "i") }).click();
    await page.getByRole("button", { name: /Commit action/i }).click();
  }

  await expect(page.getByRole("heading", { name: /backlog is recovering/i })).toBeVisible();
  await expect(page.getByText("/100")).toBeVisible();
});
