import { createElement } from "../utils/create-element";
import RangePicker from "../../../07-forms-fetch-api/2-range-picker/index";
import SortableTable from "../../../08-async-code-fetch-api/2-sortable-table-v3/index";

// Да, именно. template — это функция-рендерер для ячейки. SortableTable вызывает её для каждой строки и вставляет результат в HTML.

// Без template — SortableTable просто вставляет сырое значение из данных.

// С template — ты сам решаешь как отобразить: добавить $, отформатировать дату, подставить иконку и т.д.
const ordersHeader = [
  { id: "id", title: "ID", sortable: true },
  { id: "user", title: "Клиент", sortable: true },
  {
    id: "createdAt",
    title: "Дата",
    sortable: true,
    template: (value: unknown) => {
      return `<div class="sortable-table__cell">${new Date(value as string).toLocaleString("ru", { dateStyle: "medium" })}</div>`;
    },
  },
  {
    id: "totalCost",
    title: "Стоимость",
    sortable: true,
    template: (value: unknown) =>
      `<div class="sortable-table__cell">$${value}</div>`,
  },
  { id: "delivery", title: "Статус", sortable: true },
];

const BACKEND_URL = "https://course-js.javascript.ru/";

type PageComponents = {
  sortableTable: SortableTable;
  rangePicker: RangePicker;
};

export class SalesPage {
  element: HTMLElement | null = null;

  private components: Partial<PageComponents> = {};
  private from: Date;
  private to: Date;

  constructor() {
    const now = new Date(); // сегодня
    this.to = now;
    this.from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  }

  public async render(): Promise<HTMLElement | null> {
    this.element = createElement(this.getTemplate());

    // добавляем таблицу
    this.components.sortableTable = new SortableTable(ordersHeader, {
      // для продуктов
      //       URL при начальной загрузке (строка 32) — нет дат.
      // Таблица загружает ВСЕ заказы без фильтра. Нужно передать from и to сразу:
      url: `api/rest/orders?createdAt_gte=${this.from.toISOString()}&createdAt_lte=${this.to.toISOString()}`,
      sorted: { id: "createdAt", order: "desc" },
    });

    this.components.rangePicker = new RangePicker({
      from: this.from,
      to: this.to,
    });

    this.element
      .querySelector('[data-element="rangePicker"]')!
      .append(this.components.rangePicker.element);

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
    <div class="sales full-height flex-column">
          <div class="content__top-panel">
            <h1 class="page-title">Продажи</h1>
            <div class="rangepicker" data-element="rangePicker"></div>
          </div>
          <div data-elem="ordersContainer" class="full-height flex-column">
            <div data-element="sortableTable"></div>
          </div>
        </div>`;
  }

  private addEventListeners(): void {
    this.components.rangePicker?.element?.addEventListener(
      "date-select",
      this.handleDateSelect,
    );
  }

  private handleDateSelect = (event: Event) => {
    const { from, to } = (event as CustomEvent<{ from: Date; to: Date }>)
      .detail;

    this.components.sortableTable?.destroy();
    this.components.sortableTable = new SortableTable(ordersHeader, {
      url: `api/rest/orders?createdAt_gte=${from.toISOString()}&createdAt_lte=${to.toISOString()}`,
      sorted: { id: "createdAt", order: "desc" },
    });
    if (this.element) {
      this.element
        .querySelector('[data-element="sortableTable"]')!
        .append(this.components.sortableTable.element);
    }
  };

  public remove(): void {
    this.element?.remove();
  }

  public destroy(): void {
    this.components.rangePicker?.element?.removeEventListener(
      "date-select",
      this.handleDateSelect,
    );
    this.remove();

    this.components.rangePicker?.destroy();
    this.components.sortableTable?.destroy();
  }
}
