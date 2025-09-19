import { Page, expect, Locator } from "@playwright/test";
import { parseMoneyToNumber } from "../utils/money";

export class CartPage {
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.rows = page.locator(
      "tr.cart_item, tr.woocommerce-cart-form__cart-item"
    );
  }

  async isOnCart(): Promise<boolean> {
    const urlMatch = /cart|carrito|basket|cesta|checkout/i.test(
      this.page.url()
    );
    if (urlMatch) return true;

    const bodyHasCart =
      (await this.page
        .locator("body.woocommerce-cart, body.woocommerce-page")
        .count()
        .catch(() => 0)) > 0;
    return bodyHasCart;
  }

  async open(): Promise<void> {
    if (await this.isOnCart()) {
      await this.assertLoaded();
      return;
    }

    await this.page
      .goto("/cart/", { waitUntil: "domcontentloaded" })
      .catch(async () => {
        const cartLink = this.page
          .getByRole("link", { name: /cart|carrito|cesta|basket/i })
          .or(
            this.page.locator(
              'a[href*="cart"], a[href*="carrito"], a[href*="basket"]'
            )
          )
          .first();
        if (await cartLink.isVisible().catch(() => false)) {
          await cartLink.click();
        }
      });

    await this.assertLoaded();
  }

  async assertLoaded(): Promise<void> {
    const cartRoot = this.page.locator(
      [
        "form.woocommerce-cart-form",
        ".woocommerce-cart-form",
        "table.shop_table.cart",
        "table.woocommerce-cart-form__contents",
        ".cart_totals",
        ".cart-empty.woocommerce-info",
      ].join(", ")
    );
    await expect(cartRoot.first()).toBeVisible({ timeout: 10_000 });
  }

  async itemsCount(): Promise<number> {
    return await this.rows.count();
  }

  async expectContainsProduct(
    nameText: string,
    priceText: string
  ): Promise<void> {
    const count = await this.rows.count();
    let found = false;

    const expectedPrice = parseMoneyToNumber(priceText);

    for (let i = 0; i < count; i++) {
      const row = this.rows.nth(i);
      const name =
        (
          await row
            .locator("td.product-name a, td.product-name")
            .first()
            .textContent()
        )?.trim() ?? "";
      const price =
        (
          await row
            .locator("td.product-price .amount, td.product-price")
            .first()
            .textContent()
        )?.trim() ?? "";

      const actualPrice = parseMoneyToNumber(price);

      if (
        name.toLowerCase().includes(nameText.toLowerCase()) &&
        actualPrice === expectedPrice
      ) {
        found = true;
        break;
      }
    }

    expect(
      found,
      `Precio de Producto "${nameText}" ($${expectedPrice})validado en el carrito`
    ).toBeTruthy();
  }

  async subtotalValue(): Promise<number> {
    const subtotalEl = this.page
      .locator(".cart-subtotal .amount, .cart-subtotal")
      .first();
    const txt = (
      (await subtotalEl.textContent().catch(() => null)) ?? ""
    ).trim();
    let subtotal = parseMoneyToNumber(txt);

    if (!subtotal || Number.isNaN(subtotal)) {
      const amounts = this.page.locator(
        "td.product-subtotal .amount, td.product-subtotal bdi"
      );
      const n = await amounts.count().catch(() => 0);
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const t = await amounts
          .nth(i)
          .innerText()
          .catch(() => "");
        sum += parseMoneyToNumber(t);
      }
      subtotal = sum;
    }

    return subtotal || 0;
  }

  async removeFirstItem(): Promise<void> {
    await this.assertLoaded();

    const firstRow = this.rows.first();
    await firstRow.waitFor({ state: "visible", timeout: 10_000 });

    const beforeCount = await this.rows.count();

    const removeAnchor = firstRow.locator("td.product-remove > a.remove");
    await expect(removeAnchor).toBeVisible({ timeout: 8_000 });
    await removeAnchor.scrollIntoViewIfNeeded().catch(() => {});

    await Promise.all([
      removeAnchor.click(),
      Promise.race([
        this.page
          .waitForURL(/remove_item/i, { timeout: 8_000 })
          .catch(() => null),
        this.page
          .waitForLoadState("domcontentloaded", { timeout: 8_000 })
          .catch(() => null),
        this.page
          .waitForResponse(
            (r) =>
              /(remove_item|wc-ajax=remove|admin-ajax\.php)/i.test(r.url()),
            { timeout: 8_000 }
          )
          .catch(() => null),
      ]),
    ]);

    await firstRow
      .waitFor({ state: "detached", timeout: 10_000 })
      .catch(async () => {
        await this.page
          .waitForFunction(
            ([rowSel, prev]) => {
              const rows = document.querySelectorAll(rowSel as string).length;
              return (
                rows < (prev as number) ||
                !!document.querySelector(".cart-empty") ||
                !!document.querySelector(".return-to-shop")
              );
            },
            ["tr.cart_item, tr.woocommerce-cart-form__cart-item", beforeCount],
            { timeout: 8_000 }
          )
          .catch(() => {});
      });
  }

  async isEmptyStateVisible(): Promise<boolean> {
    const empty = this.page
      .locator(
        [
          ".cart-empty",
          ".woocommerce .return-to-shop",
          'p:has-text("Your cart is currently empty")',
          'p:has-text("Tu carrito está vacío")',
          '.woocommerce-info:has-text("carrito")',
        ].join(",")
      )
      .first();

    return (
      (await empty.isVisible().catch(() => false)) ||
      (await empty
        .waitFor({ state: "visible", timeout: 1500 })
        .then(() => true)
        .catch(() => false))
    );
  }

  async expectEmpty(): Promise<void> {
    const emptyUI = await this.isEmptyStateVisible();
    const items = await this.itemsCount();
    const subtotal = await this.subtotalValue().catch(() => 0);

    expect(
      emptyUI || items === 0 || subtotal === 0,
      `Cart does not appear empty (emptyUI=${emptyUI}, items=${items}, subtotal=${subtotal})`
    ).toBeTruthy();
  }

  private headerCounter() {
    return this.page
      .locator(
        [
          "#cart .mini-cart-items",
          ".mini-cart-items",
          ".cart-contents .count",
          ".header-cart-count",
          "[data-cart-count]",
          ".site-header-cart .count",
        ].join(", ")
      )
      .first();
  }

  async getHeaderCount(): Promise<number | null> {
    const el = this.headerCounter();
    if (!(await el.isVisible().catch(() => false))) return null;
    const raw = (await el.innerText().catch(() => "")).trim();
    const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  }

  async waitHeaderCountIncreases(
    prev: number | null,
    timeout = 6000
  ): Promise<boolean> {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const now = await this.getHeaderCount();
      if (now != null && (prev == null ? now > 0 : now > prev)) return true;
    }
    return false;
  }
}
