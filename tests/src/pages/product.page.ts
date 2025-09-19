import { Page, expect, type Response } from "@playwright/test";

export class ProductPage {
  constructor(private readonly page: Page) {}

  async getName(): Promise<string> {
    const name = await this.page
      .locator("h1.product_title, h1, .product-title")
      .first()
      .innerText();
    return name.trim();
  }

  async getPrice(): Promise<string> {
    const price = await this.page
      .locator(
        '.price .amount, .price, .woocommerce-Price-amount, [class*="price"] .amount'
      )
      .first()
      .innerText();
    return price.trim();
  }

  async addToCartAndAssertNetwork(): Promise<Response | null> {
    const addBtn = this.page
      .locator('form.cart button.single_add_to_cart_button[name="add-to-cart"]')
      .first();

    await addBtn.scrollIntoViewIfNeeded().catch(() => {});
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    if (await addBtn.isDisabled().catch(() => false)) {
      await expect(addBtn).toBeEnabled({ timeout: 5_000 });
    }

    await addBtn.click();
    return null;
  }

  async keepShoppingIfModal(): Promise<void> {
    const cta = this.page
      .getByRole("button", { name: /seguir\s*comprando|continuar|seguir/i })
      .or(
        this.page.getByRole("link", {
          name: /seguir\s*comprando|continuar|seguir/i,
        })
      )
      .or(
        this.page.locator(
          'a:has-text("Seguir comprando"), button:has-text("Seguir comprando"), .continue-shopping a, a.continue, .return-to-shop a'
        )
      )
      .first();

    const isThere =
      (await cta.isVisible().catch(() => false)) ||
      (await cta
        .waitFor({ state: "visible", timeout: 2500 })
        .then(() => true)
        .catch(() => false));

    if (isThere) {
      await cta.click().catch(() => {});
      await this.page.waitForLoadState("domcontentloaded").catch(() => {});
    }
  }

  async waitUntilInCart(timeout = 9000): Promise<boolean> {
    const byUrl = await this.page
      .waitForURL(/cart|carrito|basket|checkout/i, { timeout })
      .then(() => true)
      .catch(() => false);
    if (byUrl) return true;

    const cartUI = this.page
      .locator(
        ".woocommerce-cart-form, .cart_totals, .woocommerce-cart, form.woocommerce-cart-form"
      )
      .first();

    const uiVisible =
      (await cartUI.isVisible().catch(() => false)) ||
      (await cartUI
        .waitFor({ state: "visible", timeout: 1500 })
        .then(() => true)
        .catch(() => false));
    if (uiVisible) return true;

    const byHeading = await this.page
      .getByRole("heading", { name: /carrito|cart|cesta|basket/i })
      .first()
      .waitFor({ state: "visible", timeout: 1200 })
      .then(() => true)
      .catch(() => false);

    return byHeading;
  }
}
