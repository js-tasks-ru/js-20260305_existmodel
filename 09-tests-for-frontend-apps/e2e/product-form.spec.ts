import { test, expect } from "@playwright/test";

test.describe("ProductForm", () => {
  test.beforeEach(async ({ page }) => {
    //networkidle означает "подожди пока сеть успокоится" — то есть пока API ответит и форма заполнится.
    await page.goto("/", { waitUntil: "networkidle" });
  });

  //   Проверяет что в браузере открылась страница с правильным <title>.
  //    Это то что написано в index.html:
  // <title>ProductForm</title>
  // Если страница не загрузилась или загрузилась не та — тест упадёт.
  test("страница открывается", async ({ page }) => {
    await expect(page).toHaveTitle("ProductForm");
  });

  //   Проверяет что в DOM появился элемент с классом .product-form.
  //   Это важно потому что форма рендерится асинхронно — данные загружаются с
  //   сервера, и только потом компонент добавляет себя в страницу.
  //    Playwright автоматически ждёт пока элемент появится (до 30 секунд).
  test("форма отображается на странице", async ({ page }) => {
    const form = page.locator(".product-form");
    await expect(form).toBeVisible();
  });

  test("поле названия заполнено", async ({ page }) => {
    const title = page.locator("#title");
    await expect(title).not.toHaveValue("");
  });

  test("кнопка сохранить отображается", async ({ page }) => {
    const button = page.locator('button[type="submit"]');
    await expect(button).toBeVisible();
  });

  test("список фото не пустой", async ({ page }) => {
    const images = page.locator(".sortable-list li");
    await expect(images).not.toHaveCount(0);
  });

  test("цена больше нуля", async ({ page }) => {
    const price = page.locator("#price");
    const value = await price.inputValue();
    expect(Number(value)).toBeGreaterThan(0);
  });
});
