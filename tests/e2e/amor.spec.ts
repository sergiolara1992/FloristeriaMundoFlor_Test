import { test, expect } from "@playwright/test";
import { HomePage } from "../src/pages/home.page";
import { CategoryPage } from "../src/pages/category.page";
import { ProductPage } from "../src/pages/product.page";
import { CartPage } from "../src/pages/cart.page";
import { categories, productIndexes } from "../src/fixtures/test-data";
import { parseMoneyToNumber } from "../src/utils/money";

test("E2E: Add 2 products from Love category and validate in cart", async ({
  page,
}) => {
  test.setTimeout(90_000);

  const home = new HomePage(page);
  const category = new CategoryPage(page);
  const product = new ProductPage(page);
  const cart = new CartPage(page);

  if (new Set(productIndexes.love).size !== productIndexes.love.length) {
    throw new Error("❌ Los índices de productos en 'love' están duplicados");
  }

  await home.goto();
  await home.openCategory(categories.love);
  await category.expectLoaded();
  await category.sortByPriceLowToHigh();

  const productData = await Promise.all(
    productIndexes.love.map(
      async (idx) => await category.getCardNameAndPrice(idx)
    )
  );

  const [firstProduct, secondProduct] = productData;

  await category.openProductByIndex(productIndexes.love[0]);
  await product.addToCartAndAssertNetwork();
  await product.waitUntilInCart(4000);

  await cart.open();
  expect(await cart.itemsCount()).toBe(1);
  await cart.expectContainsProduct(firstProduct.name, firstProduct.price);

  await home.openCategory(categories.love);
  await category.expectLoaded();
  await category.sortByPriceLowToHigh();

  await category.openProductByIndex(productIndexes.love[1]);
  await product.addToCartAndAssertNetwork();
  await product.waitUntilInCart(8000);

  await cart.open();
  expect(await cart.itemsCount()).toBe(2);
  await cart.expectContainsProduct(firstProduct.name, firstProduct.price);
  await cart.expectContainsProduct(secondProduct.name, secondProduct.price);

  const expectedSum = [firstProduct.price, secondProduct.price]
    .map(parseMoneyToNumber)
    .reduce((a, n) => a + n, 0);

  const subtotal = await cart.subtotalValue();

  expect(
    subtotal,
    `🧾 Cart subtotal: $${subtotal.toFixed(
      2
    )} — Expected sum: $${expectedSum.toFixed(2)}`
  ).toBeCloseTo(expectedSum, 0);
});
