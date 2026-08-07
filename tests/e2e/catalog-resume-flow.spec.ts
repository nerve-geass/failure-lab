import { expect, test } from "@playwright/test";

test("refreshing an active exercise returns to the catalog with resume", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.reload();

  await expect(page.getByRole("button", { name: "Resume investigation" })).toBeVisible();
  await page.getByRole("button", { name: "Resume investigation" }).click();
  await expect(page.getByText("Available actions")).toBeVisible();
});

test("abandoning an active exercise immediately removes it from the catalog", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Abandon and choose another" }).click();
  await page.reload();

  await expect(page.getByRole("button", { name: "Resume investigation" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Start investigation" })).toBeVisible();
});

test("a completed exercise remains reviewable from the catalog", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start investigation" }).click();
  await page.getByRole("button", { name: "Enter incident" }).click();

  for (const action of ["Inspect recent deployment", "Inspect provider traces", "Disable automatic retries", "Enable circuit breaker"]) {
    await page.getByRole("button", { name: new RegExp(`^${action}\\b`, "i") }).click();
    await page.getByRole("button", { name: /Commit action/i }).click();
  }

  await expect(page.getByRole("heading", { name: /chain was interrupted/i })).toBeVisible();
  await page.reload();

  await expect(page.getByRole("button", { name: "Review report" })).toBeVisible();
  await page.getByRole("button", { name: "Review report" }).click();
  await expect(page.getByText("INCIDENT AUTOPSY")).toBeVisible();
});
