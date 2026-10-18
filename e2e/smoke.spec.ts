import { test, expect } from "@playwright/test";

test("setup, wishlist, rotation turn, history", async ({ page }) => {
  // first-run admin
  await page.goto("/login");
  await page.getByPlaceholder("Your name").fill("Sam");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();

  // add a second member
  await page.getByPlaceholder("Name", { exact: true }).fill("Riley");
  await page.getByRole("button", { name: "Add member" }).click();
  await expect(page.getByText("Riley")).toBeVisible();

  // wishlist
  await page.goto("/wishlist");
  await page.getByPlaceholder("Search for a movie…").fill("arrival");
  await page.getByRole("button", { name: "Search" }).click();
  await page.getByRole("button", { name: "Add" }).first().click();
  await expect(page.getByText("On Netflix")).toBeVisible();

  // Sam's turn: pick and mark watched
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Sam's pick/ })).toBeVisible();
  await page.getByRole("button", { name: "Pick" }).click();
  await page.getByRole("button", { name: "Mark watched" }).click();

  // turn passes to Riley and the movie is in history
  await expect(page.getByRole("heading", { name: /Riley's pick/ })).toBeVisible();
  await page.goto("/history");
  await expect(page.getByText("Arrival")).toBeVisible();
});
