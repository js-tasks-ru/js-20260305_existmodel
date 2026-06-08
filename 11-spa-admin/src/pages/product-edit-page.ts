import type { PageContext } from "../types";
import type { RouterNavApi } from "../router-nav-api";
import ProductForm from "../../../09-tests-for-frontend-apps/1-product-form-v2/index";
import { createElement } from "../utils/create-element";
import "../../../09-tests-for-frontend-apps/1-product-form-v2/style.css";

// ProductEditPage используется для двух маршрутов:
//   /products/add    → context.params = {}           → productId = undefined → новый товар
//   /products/:id    → context.params = { id: "abc" } → productId = "abc"   → редактирование
// мотри на конструктор как на получение посылки:

// constructor(context: PageContext<RouterNavApi>) {
//   this.productId = context.params["id"];
//   this.form = new ProductForm(this.productId);
// }
// Кто вызывает конструктор? — роутер. Вот эта строка в router-nav-api.ts:

// this.currentPage = new Component({ path, router, params: matchedParams });
// Что такое context? — это та самая посылка { path, router, params }. TypeScript требует написать тип чтобы знать что внутри.

// context.params["id"] — достаём конкретное поле из объекта params:

// URL /products/abc123  →  params = { id: "abc123" }  →  params["id"] = "abc123"
// URL /products/add     →  params = {}                →  params["id"] = undefined
// new ProductForm(this.productId) — передаём id в форму из задания 09. Она сама разберётся: undefined → форма создания, "abc123" → загрузит товар с сервера и покажет форму редактирования.

// Вся "магия" — в том что роутер уже распарсил URL до тебя и положил результат в context.params. Ты просто берёшь готовое.
export class ProductEditPage {
  // id товара из URL, или undefined если создаём новый
  private productId: string | undefined;
  // ProductForm из задания 09 — она сама загружает данные и рендерит форму
  private form: ProductForm;
  public element: HTMLElement | null = null;

  constructor(context: PageContext<RouterNavApi>) {
    // context.params.id берётся из URL: /products/abc123 → { id: "abc123" }
    // если маршрут /products/add — params пустой, id = undefined
    this.productId = context.params["id"];
    this.form = new ProductForm(this.productId);
    // Роутер сам вызывает render() и ждёт результат.
  }

  async render(): Promise<HTMLElement> {
    this.element = createElement(this.getTemplate());
    // ProductForm.render() загружает с сервера:
    //   - список категорий (для select)
    //   - данные товара по productId (если редактирование)
    // и возвращает готовый HTMLElement
    const form = await this.form.render();
    this.element.querySelector(".content-box")!.append(form!);
    document.querySelector(".main")?.classList.remove("is-loading");
    return this.element as HTMLElement;
  }

  private getTemplate(): string {
    return `<div class="product-edit">
    <div class="content__top-panel">
            <h1 class="page-title">
          <a href="/products" class="link">Товары</a> / Редактировать
        </h1>
          </div>
          <div class="content-box"></div></div>`;
  }

  destroy(): void {
    this.form.destroy?.();
  }
}

// УБИРАТЬ КНОПКУ ДОБАВИТЬ ТОВАР В СЛУЧАЕ ЕСЛИ ЭТО НЕ ДОБАВЛЯЕНИЕ
