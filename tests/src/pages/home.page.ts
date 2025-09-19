import { Page, expect } from "@playwright/test";

export class HomePage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
    const header = this.page.locator("header, #header, .site-header").first();
    await expect(header).toBeVisible({ timeout: 10_000 });
  }

  async openCategory(categoryName: string): Promise<void> {
    const navLink = this.page
      .getByRole("link", { name: new RegExp(`^${categoryName}\\b`, "i") })
      .first();
    if (await navLink.isVisible().catch(() => false)) {
      await navLink.click();
      await this.page.waitForLoadState("domcontentloaded");
      return;
    }

    const menuBtn = this.page
      .getByRole("button", { name: /menú|menu|categorías|categories/i })
      .or(this.page.locator('.menu-toggle, .hamburger, [aria-label*="menu" i]'))
      .first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click().catch(() => {});
      const navLink2 = this.page
        .getByRole("link", { name: new RegExp(`^${categoryName}\\b`, "i") })
        .first();
      if (await navLink2.isVisible().catch(() => false)) {
        await navLink2.click();
        await this.page.waitForLoadState("domcontentloaded");
        return;
      }
    }

    const tile = this.page
      .getByRole("link", { name: new RegExp(categoryName, "i") })
      .first();
    if (await tile.isVisible().catch(() => false)) {
      await tile.click();
      await this.page.waitForLoadState("domcontentloaded");
      return;
    }

    await this.page.getByText(new RegExp(categoryName, "i")).first().click();
    await this.page.waitForLoadState("domcontentloaded");
  }
}
