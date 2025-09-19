import { Page, expect, Locator } from "@playwright/test";

export class CategoryPage {
  readonly gridItems: Locator;
  readonly orderSelect: Locator;

  constructor(private readonly page: Page) {
    this.gridItems = page
      .locator(".products .product")
      .or(page.locator("ul.products > li"))
      .or(page.locator("article"))
      .filter({ has: page.locator("a, h2, h3") });

    this.orderSelect = page
      .locator("select.orderby")
      .or(page.getByRole("combobox"));
  }

  async expectLoaded(): Promise<void> {
    await expect(this.gridItems.first()).toBeVisible({ timeout: 10_000 });
  }

  async sortByPriceLowToHigh(): Promise<void> {
    const select = this.orderSelect.first();
    await expect(select).toBeVisible({ timeout: 10_000 });

    const labelPatterns = [
      /low.*high/i,
      /price.*asc/i,
      /precio.*asc/i,
      /bajo.*alto/i,
      /menor.*mayor/i,
    ];

    let selected = false;

    for (const re of labelPatterns) {
      const optByLabel = select.locator("option", { hasText: re }).first();
      if ((await optByLabel.count()) > 0) {
        const value = await optByLabel.getAttribute("value");
        if (value) {
          await select.selectOption({ value });
        } else {
          await optByLabel.click();
        }
        selected = true;
        break;
      }
    }

    if (!selected) {
      const all = await select.locator("option").all();
      for (const opt of all) {
        const v = (await opt.getAttribute("value")) ?? "";
        if (/price.*asc|asc(?!.*desc)|low|precio.*asc/i.test(v)) {
          await select.selectOption({ value: v });
          break;
        }
      }
    }

    expect
      .soft(selected, 'Could not select sort by "price: low to high".')
      .toBeTruthy();

    await this.page.waitForLoadState("networkidle").catch(() => {});
  }

  async getCardNameAndPrice(
    index: number
  ): Promise<{ name: string; price: string }> {
    const card = this.gridItems.nth(index);
    await expect(card).toBeVisible();

    const nameEl = card
      .getByRole("heading")
      .first()
      .or(card.locator("h2, h3, .woocommerce-loop-product__title").first());

    const priceEl = card
      .locator(
        '.price .amount, .price, .woocommerce-Price-amount, [class*="price"] .amount'
      )
      .first();

    const name = (await nameEl.textContent())?.trim() ?? "";
    const price = (await priceEl.textContent())?.trim() ?? "";

    return { name, price };
  }

  async openProductByIndex(index: number): Promise<void> {
    const card = this.gridItems.nth(index);
    await expect(card).toBeVisible();

    const link = card.getByRole("link").first().or(card.locator("a").first());
    await link.click();
    await this.page.waitForLoadState("domcontentloaded");
  }
}
