import { test, expect, Page } from "@playwright/test";
import { HomePage } from "../src/pages/home.page";
import { CategoryPage } from "../src/pages/category.page";
import { ProductPage } from "../src/pages/product.page";
import { CartPage } from "../src/pages/cart.page";
import { categories, productIndexes } from "../src/fixtures/test-data";

test.describe.configure({ retries: 1 });

async function readHeaderCartCount(page: Page): Promise<number | null> {
  const sel = [
    "#cart .mini-cart-items",
    ".mini-cart-items",
    ".cart-contents .count",
    ".header-cart-count",
    "[data-cart-count]",
    ".site-header-cart .count",
  ].join(", ");
  const el = page.locator(sel).first();
  if (!(await el.isVisible().catch(() => false))) return null;

  const raw = (await el.innerText().catch(() => "")).trim();
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

async function waitCartUiUpdated(
  page: Page,
  cart: CartPage,
  prevCount: number | null
): Promise<boolean> {
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const current = await readHeaderCartCount(page);
    if (
      current != null &&
      (prevCount == null ? current > 0 : current > prevCount)
    )
      return true;

    const miniItems = page.locator(
      ".woocommerce-mini-cart .mini_cart_item, .mini-cart .mini_cart_item"
    );
    if ((await miniItems.count().catch(() => 0)) > 0) return true;

    if (/cart|carrito|basket|cesta|checkout/i.test(page.url())) {
      if ((await cart.itemsCount().catch(() => 0)) > 0) return true;
    }
  }
  return false;
}

test("Cumpleaños: agregar 1 producto, verificar contador/mini-cart, eliminar y validar vacío", async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);

  const home = new HomePage(page);
  const category = new CategoryPage(page);
  const product = new ProductPage(page);
  const cart = new CartPage(page);

  await home.goto();
  await home.openCategory(categories.birthday);
  await category.expectLoaded();

  const beforeCount = await readHeaderCartCount(page);
  await category.openProductByIndex(productIndexes.birthday);
  await product.addToCartAndAssertNetwork();

  const uiUpdated = await waitCartUiUpdated(page, cart, beforeCount);
  expect(
    uiUpdated,
    "El contador del carrito o el mini-cart/cart debió actualizarse"
  ).toBeTruthy();

  await cart.open();

  await testInfo.attach("cart-before", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });

  await cart.removeFirstItem();

  await testInfo.attach("cart-after", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});
