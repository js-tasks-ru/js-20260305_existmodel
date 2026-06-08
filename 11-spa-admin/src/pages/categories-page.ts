import { createElement } from "../utils/create-element";
import { fetchJson } from "../../../shared/utils/fetch-json";

import SortableList from "../../../09-tests-for-frontend-apps/2-sortable-list/index";

const BACKEND_URL = "https://course-js.javascript.ru";

interface Subcategory {
  id: string;
  title: string;
  count: number;
}

interface Category {
  id: string;
  title: string;
  subcategories: Subcategory[];
}

export class CategoriesPage {
  element: HTMLElement | null = null;
  categories: Category[] = [];

  public async render(): Promise<HTMLElement | null> {
    try {
      await this.loadData();
      this.element = createElement(this.getTemplate());
      this.renderCategories(this.categories);
      this.addEventListeners();

      return this.element || null;
    } catch (error) {
      console.error("network error:", error);
      return null;
    }
  }

  //?ЗАГРУЗКА ДАННЫХ ТОЖЕ ИДЕТ С БЭКЭНДА?
  //?Как вычленить только субкатегории и title

  private async loadData(): Promise<void> {
    this.categories = await fetchJson<Category[]>(
      `${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`,
    );
  }

  //   отрисовка основного html
  private getTemplate(): string {
    return `
    <div class="categories">
          <div class="content__top-panel">
            <h1 class="page-title">Категории товаров</h1>
          </div>
          <p>
            Подкатегории можно перетаскивать, меняя их порядок внутри своей
            категории.
          </p>
          <div data-elem="categoriesContainer">
          </div></div>
    `;
  }

  //5. renderCategories(categories) — для каждой категории создать accordion-item
  // Итоговая структура одного аккордеона:
  // <div class="category category_open" data-id="bytovaya-texnika">   ← весь accordion
  //   <header class="category__header">Бытовая техника</header>        ← заголовок
  //   <div class="category__body">                                     ← тело (скрывается/показывается по клику)
  //     <div class="subcategory-list">                                 ← обёртка для списка
  //       <ul class="sortable-list">                                   ← SortableList.element
  //         <li data-grab-handle data-id="tovary-dlya-kuxni">...       ← каждая подкатегория
  //       </ul>
  //     </div>
  //   </div>
  // </div>
  private renderCategories(categories: Category[]) {
    // один проход по категориям — для каждой сразу делаем всё
    // не нужно два отдельных массива и синхронизация по индексу i
    this.categories.forEach(({ id, title, subcategories }) => {
      // шаг 1: ДВА УРОВНЯ — внешний forEach по категориям, внутренний map по подкатегориям
      // создаём <li> для каждой подкатегории — это будут items для SortableList
      const items = subcategories.map(({ id, title, count }) =>
        createElement(`
          <li class="categories__sortable-list-item sortable-list__item" data-grab-handle="" data-id="${id}">
            <strong>${title}</strong>
            <span><b>${count}</b> products</span>
          </li>
        `),
      );

      // шаг 2: передаём items в SortableList → он создаёт <ul class="sortable-list"> с нашими <li> внутри
      const sortableList = new SortableList({ items });

      // шаг 3: создаём весь accordion — заголовок + тело с пустым subcategory-list
      // subcategory-list пока пустой, SortableList вставим в него на шаге 4
      const accordion = createElement(`
        <div class="category category_open" data-id="${id}">
          <header class="category__header">${title}</header>
          <div class="category__body">
            <div class="subcategory-list"></div>
          </div>
        </div>
      `);

      // шаг 4: вставляем sortableList.element внутрь subcategory-list
      // ищем .subcategory-list ВНУТРИ accordion (не в document — он ещё не в DOM)
      // ! — говорим TypeScript что element точно не undefined
      accordion
        .querySelector(".subcategory-list")
        ?.append(sortableList.element!);

      // шаг 5: добавляем готовый accordion в контейнер страницы
      this.element
        ?.querySelector('[data-elem="categoriesContainer"]')
        ?.append(accordion);
    });
  }

  //Слушать sortable-list-reorder событие от каждого SortableList → saveSubcategoryOrder()

  private addEventListeners(): void {
    this.element?.addEventListener(
      "sortable-list-reorder",
      this.saveSubcategoryOrder,
    );

    this.element?.addEventListener("click", (event) => {
      const header = (event.target as HTMLElement).closest(".category__header");
      if (!header) return;
      header.closest(".category")?.classList.toggle("category_open");
    });
  }

  // 8. saveSubcategoryOrder() — перебрать элементы списка, отправить PATCH api/rest/subcategories/:id с { weight: index } для каждого
  private async saveSubcategoryOrder(event: Event) {
    const target = event.target as HTMLElement;

    let parentCategory = target.closest(".category ");

    if (!parentCategory) return;
    //Статический Array.from()метод создает новый, поверхностно скопированный Arrayэкземпляр из итерируемого или массивоподобного объекта.

    //Ищет все элементы с атрибутом data-id внутри конкретной категории. Возвращает NodeList — похож на массив, но не массив (нет .map()).
    //Array.from(...)

    // Конвертирует NodeList → настоящий массив, чтобы можно было вызвать .map().
    //el — каждый <li> элемент

    //     Представь: пользователь перетащил подкатегорию на другое место. В DOM порядок <li> изменился. Но сервер об этом не знает.

    // Сервер хранит порядок через поле weight — чем меньше число, тем выше в списке.

    //     updates — это инструкция для сервера:

    // "Установи такой порядок:
    //   tovary-dlya-kuxni  → weight: 1  (первый)
    //   krasota-i-zdorove  → weight: 2  (второй, был третьим)
    //   tovary-dlya-doma   → weight: 3  (третий, был вторым)"
    // Мы просто читаем текущий порядок <li> в DOM (после перетаскивания) и присваиваем каждому weight = его позиция.
    const updates = Array.from(
      parentCategory.querySelectorAll<HTMLElement>("[data-id]"),
    ).map((el, i) => ({
      //el.dataset.id — читает data-id атрибут из HTML:
      id: el.dataset.id,
      weight: i + 1,
    }));

    try {
      const response = await fetch(`${BACKEND_URL}/api/rest/subcategories`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json", // ОБЯЗАТЕЛЬНО: говорим серверу, что это JSON
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("failed to fetch data");
      //   errorMessage.textContent = "";
    } catch (error) {
      console.error("network error:", error);
    }

    // отправим на сервер

    //     3. Собрать массив и отправить

    // У каждого <li> есть data-id — это id подкатегории. Позиция в списке — это новый вес.

    // Формат запроса: массив [{ id: "...", weight: 1 }, { id: "...", weight: 2 }, ...]

    // У тебя это уже есть в комментарии в коде — псевдокод правильный, только this.elem надо заменить на правильный элемент (ближайший .category из п.2).

    // Отправляется один PATCH на /api/rest/subcategories со всем массивом сразу.

    //  — собрать массив и отправить одним PATCH
    // Получить список элементов <li> из SortableList
    // Для каждого отправить PATCH api/rest/subcategories/:id с { weight: index }
    //     2. PATCH отправляется одним запросом — не по одному на каждую подкатегорию, а массивом:
    // // собирает все подкатегории в массив { id, weight }
    // Array.from(this.elem.querySelectorAll("[data-id]")).map((el, i) => ({
    //   id: el.dataset.id,
    //   weight: i + 1
    // }))
    // и отправляет всё одним PATCH на /api/rest/subcategories
  }

  public remove(): void {
    this.element?.remove();
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}
