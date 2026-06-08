import { createElement } from "../utils/create-element";
//добавляем таблицу
import SortableTable from "../../../08-async-code-fetch-api/2-sortable-table-v3/index";

// добавляем слайдер
import DoubleSlider from "../../../06-events-practice/3-double-slider/index";

import header from "../../../10-routes-browser-history-api/1-dashboard-page/bestsellers-header";

type PageComponents = {
  sortableTable: SortableTable;
  doubleSlider: DoubleSlider;
};
export class ProductsPage {
  public element: HTMLElement | null = null;

  private components: Partial<PageComponents> = {};
  private priceFrom: number;
  private priceTo: number;

  private filterName = "";
  private filterStatus = "";

  constructor() {
    this.priceFrom = 0;
    this.priceTo = 4000;
  }

  public async render(): Promise<HTMLElement | null> {
    this.element = createElement(this.getTemplate());

    // добавляем таблицу
    this.components.sortableTable = new SortableTable(header, {
      // для продуктов
      url: "api/rest/products",
    });

    // добавляем слайдер
    this.components.doubleSlider = new DoubleSlider({
      // устанавливаем начальные значения
      //    Нужно передать диапазон цен:
      min: this.priceFrom,
      max: this.priceTo,
      formatValue: (value) => `$${value}`,
    });

    this.element
      .querySelector('[data-element="doubleSlider"]')!
      .append(this.components.doubleSlider.element);

    this.element
      .querySelector('[data-element="sortableTable"]')!
      .append(this.components.sortableTable.element);

    this.addEventListeners();
    document.querySelector(".main")?.classList.remove("is-loading");
    return this.element;
  }

  //   отрисовка основного html
  private getTemplate(): string {
    return `
    <div class="products-list">
    <div class="content__top-panel">
            <h1 class="page-title">Товары</h1>
            <a href="/products/add" class="button-primary">Добавить товар</a>
          </div>
          <div class="content-box content-box_small">
            <form class="form-inline">
              <div class="form-group">
                <label class="form-label">Сортировать по:</label>
                <input
                  type="text"
                  data-elem="filterName"
                  class="form-control"
                  placeholder="Название товара"
                />
              </div>
              <div class="form-group" data-elem="sliderContainer">
                <label class="form-label">Цена:</label>
                  <div data-element="doubleSlider"></div>
              </div>
              <div class="form-group">
                <label class="form-label">Статус:</label>
                <select class="form-control" data-elem="filterStatus">
                  <option value="" selected="">Любой</option>
                  <option value="1">Активный</option>
                  <option value="0">Неактивный</option>
                </select>
              </div>
            </form>
          </div>

          <div data-element="sortableTable" class="products-list__container"></div>
          </div>`;
  }

  //   Логику фильтрации (слушать события от инпута/слайдера/селекта и обновлять таблицу)
  //   слушатели на события
  private addEventListeners(): void {
    this.components.doubleSlider?.element?.addEventListener(
      "range-select",
      this.handleRangeSelect,
    );

    // запрашиваем прямо тут

    //     1. Пользователь печатает → браузер стреляет событием "input"
    // 2. handleNameInput слышит событие
    this.element
      ?.querySelector('[data-elem="filterName"]')
      ?.addEventListener("input", this.handleNameInput);

    this.element
      ?.querySelector('[data-elem="filterStatus"]')
      ?.addEventListener("change", this.handleStatusChange);

    this.components.sortableTable?.element.addEventListener(
      "click",
      this.handleRowClick,
    );

    // 1. Клик по строке → открыть товар

    // В products-page.ts нужно добавить обработчик клика на таблицу. Каждая строка SortableTable рендерится с data-id атрибутом. При клике читаем id и навигируем:
  }

  //     addEventListeners():
  //   слайдер  → "range-select"  → handleRangeSelect   ← уже есть
  //   инпут    → "input"         → handleNameInput      ← добавить
  //   select   → "change"        → handleStatusChange   ← добавить

  private handleRangeSelect = (event: Event): void => {
    const { from, to } = (event as CustomEvent<{ from: number; to: number }>)
      .detail;

    this.priceFrom = from;
    this.priceTo = to;
    this.updateTable();
    // здесь будем обновлять таблицу
  };
  private handleNameInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    // Читает значение из инпута: event.target.value → "lamp"
    const query = target.value.toLowerCase().trim();
    // 4. Сохраняет в this.filterName = "lamp"
    this.filterName = query;
    // 5. Вызывает updateTable()
    this.updateTable();
  };

  //Сценарий: пользователь выбирает "Активный" в select
  private handleStatusChange = (event: Event): void => {
    //  читаем что выбрал пользователь в select
    // 2. handleStatusChange слышит событие
    // 3. Читает значение: event.target.value → "1"
    // 4. Сохраняет в this.filterStatus = "1"
    this.filterStatus = (event.target as HTMLSelectElement).value;
    //  5. Вызывает updateTable()
    this.updateTable();
    // Каждый фильтр хранит своё последнее значение в классе. Поэтому когда меняешь только статус —
    // имя из filterName всё равно остаётся в URL, оно не сбрасывается.
  };

  // 1. Клик по строке → открыть товар

  // Каждая строка SortableTable рендерится с data-id атрибутом. При клике читаем id и навигируем:
  private handleRowClick = (event: PointerEvent) => {
    // при нажатии на строку мы ищем у элемента id и передаем его роутеру или куда?
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-id]");
    if (!row) {
      return;
    }
    const id = row.dataset.id;

    // переходим на страницу товара
    window.navigation?.navigate(`/products/${id}`);
  };

  //   Метод updateTable() — пересоздаёт таблицу с новым URL
  private updateTable() {
    // уничтожаем старую таблицу:
    this.components.sortableTable?.destroy();
    // строим строку запроса:
    //!SortableTable загружает данные с сервера по URL. Фильтрация происходит на сервере, а не в браузере.
    this.components.sortableTable = new SortableTable(header, {
      //Ты пишешь "водо" в инпут
      //         ↓
      // handleNameInput → filterName = "водо"
      //         ↓
      // updateTable() строит URL:
      // api/rest/products?title_like=водо&price_gte=0&price_lte=4000
      //         ↓
      // SortableTable делает fetch запрос на этот URL
      //         ↓
      // Сервер получает запрос, видит title_like=водо
      // Сервер сам ищет в базе данных товары где title содержит "водо"
      // Сервер возвращает JSON только с этими товарами
      //         ↓
      // SortableTable получает отфильтрованные данные
      //         ↓
      // Рендерит таблицу с результатами

      //!       Ты:           строишь URL с параметрами → передаёшь в SortableTable
      // SortableTable: делает fetch по этому URL → рендерит результат
      // Сервер:        получает URL → фильтрует данные → возвращает JSON
      url: `api/rest/products?title_like=${this.filterName}&price_gte=${this.priceFrom}&price_lte=${this.priceTo}${this.filterStatus ? `&status=${this.filterStatus}` : ""}`,
    });

    //     Без фильтра:
    //   URL: api/v1/products
    //   Сервер вернёт: все 100 товаров

    // С фильтром:
    //   URL: api/v1/products?title_like=lamp
    //   Сервер вернёт: только товары где в названии есть "lamp"
    // вставляем новую таблицу в DOM
    this.element
      ?.querySelector('[data-element="sortableTable"]')!
      .append(this.components.sortableTable.element);
  }

  public remove(): void {
    this.element?.remove();
  }

  public destroy(): void {
    this.element
      ?.querySelector('[data-elem="filterName"]')
      ?.removeEventListener("input", this.handleNameInput);

    this.element
      ?.querySelector('[data-elem="filterStatus"]')
      ?.removeEventListener("change", this.handleStatusChange);

    this.components.doubleSlider?.element.removeEventListener(
      "range-select",
      this.handleRangeSelect,
    );
    this.components.sortableTable?.destroy();
    this.remove();
  }
}
